'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Drawer, Result, Spin } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { EvaluationParcours, LeconParcours, Parcours } from '@/types/formation';
import { messageErreur } from './constants';
import { LecteurLecon } from './LecteurLecon';
import { ParcoursView } from './ParcoursView';

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

  /** Ouvre la leçon : le serveur démarre le temps minimal de consultation. */
  async function ouvrirLecon(l: LeconParcours) {
    if (l.consultee) {
      setLecon(l);
      return;
    }
    try {
      const p = await formationService.ouvrirLecon(affectationId, l.id);
      setParcours(p);
      setLecon(p.modules.flatMap((m) => m.lecons).find((x) => x.id === l.id) ?? l);
    } catch (err) {
      message.error(messageErreur(err, 'Leçon indisponible.'));
    }
  }

  async function validerLecon() {
    if (!lecon) return;
    const p = await formationService.consulterLecon(affectationId, lecon.id);
    setParcours(p);
    setLecon(null);
    message.success('Leçon consultée.');
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
      <Drawer open={lecon !== null} onClose={() => setLecon(null)} size={860} title={lecon?.titre} destroyOnHidden>
        {lecon && <LecteurLecon key={lecon.id} affectationId={affectationId} lecon={lecon} onValider={validerLecon} onFermer={() => setLecon(null)} />}
      </Drawer>
    </PageContainer>
  );
}
