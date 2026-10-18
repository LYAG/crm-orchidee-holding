'use client';

import { ArrowLeftOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, App, Button, Drawer, Result, Space, Spin, Typography } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { EvaluationParcours, LeconParcours, Parcours } from '@/types/formation';
import { TYPES_LECON, messageErreur, telecharger } from './constants';
import { ParcoursView } from './ParcoursView';

const { Paragraph, Text } = Typography;

/** Lecteur de leçon : texte, lien, ou support téléversé (PDF / image / vidéo affichés en ligne). */
function LeconViewer({ affectationId, lecon }: { affectationId: string; lecon: LeconParcours }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!lecon.aFichier) return;
    let objet: string | null = null;
    formationService
      .getFichierLeconApprenant(affectationId, lecon.id)
      .then((b) => {
        objet = URL.createObjectURL(b);
        setUrl(objet);
      })
      .catch((err) => setErreur(messageErreur(err, 'Support indisponible.')));
    return () => {
      if (objet) URL.revokeObjectURL(objet);
    };
  }, [affectationId, lecon]);

  const type = lecon.fichierType ?? '';
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Text type="secondary">{TYPES_LECON[lecon.type]}</Text>
      {lecon.contenu && <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7 }}>{lecon.contenu}</Paragraph>}
      {lecon.url && (
        <a href={lecon.url} target="_blank" rel="noreferrer">
          Ouvrir le lien : {lecon.url}
        </a>
      )}
      {erreur && <Alert type="error" message={erreur} />}
      {/* Aperçu d’'un Blob local : next/image ne s’'applique pas aux URL blob:. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && type.startsWith('image/') && <img src={url} alt={lecon.titre} style={{ maxWidth: '100%', borderRadius: 8 }} />}
      {url && type.startsWith('video/') && <video src={url} controls style={{ width: '100%', borderRadius: 8 }} />}
      {url && type === 'application/pdf' && <iframe src={url} title={lecon.titre} style={{ width: '100%', height: '70vh', border: '1px solid var(--oh-line)', borderRadius: 8 }} />}
      {url && !type.startsWith('image/') && !type.startsWith('video/') && type !== 'application/pdf' && (
        <Button icon={<DownloadOutlined />} onClick={() => fetch(url).then((r) => r.blob()).then((b) => telecharger(b, lecon.fichierNom ?? 'support'))}>
          Télécharger {lecon.fichierNom}
        </Button>
      )}
    </Space>
  );
}

export function ParcoursApprenantPage() {
  const { affectationId } = useParams<{ affectationId: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lecon, setLecon] = useState<LeconParcours | null>(null);
  const [demarrage, setDemarrage] = useState<string | null>(null);

  const charger = useCallback(() => {
    formationService
      .getParcours(affectationId)
      .then((p) => {
        setParcours(p);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Formation introuvable.')));
  }, [affectationId]);
  useEffect(charger, [charger]);

  async function ouvrirLecon(l: LeconParcours) {
    setLecon(l);
    if (!l.consultee) {
      try {
        setParcours(await formationService.consulterLecon(affectationId, l.id));
      } catch (err) {
        message.error(messageErreur(err, 'Leçon indisponible.'));
        setLecon(null);
      }
    }
  }

  async function demarrer(e: EvaluationParcours) {
    setDemarrage(e.id);
    try {
      const t = await formationService.demarrerTentative(affectationId, e.id);
      router.push(`/formation/mon-espace/tentatives/${t.id}`);
    } catch (err) {
      message.error(messageErreur(err, 'Impossible de démarrer.'));
      charger();
    } finally {
      setDemarrage(null);
    }
  }

  if (erreur) return <Result status="404" title="Formation indisponible" subTitle={erreur} extra={<Button onClick={() => router.push('/formation/mon-espace')}>Mon espace</Button>} />;
  if (!parcours) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <PageContainer
      title={
        <span>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/formation/mon-espace')} aria-label="Retour" /> {parcours.affectation.titre}
        </span>
      }
      subTitle={parcours.progressionSequentielle ? 'Les modules se débloquent dans l’ordre' : undefined}
    >
      <ParcoursView parcours={parcours} onOuvrirLecon={ouvrirLecon} onDemarrer={demarrer} chargementEvaluation={demarrage} />
      <Drawer
        open={lecon !== null}
        onClose={() => setLecon(null)}
        size={760}
        title={lecon?.titre}
        destroyOnHidden
        extra={<Button icon={<CheckOutlined />} type="primary" onClick={() => setLecon(null)}>J’ai terminé la lecture</Button>}
      >
        {lecon && <LeconViewer affectationId={affectationId} lecon={lecon} />}
      </Drawer>
    </PageContainer>
  );
}
