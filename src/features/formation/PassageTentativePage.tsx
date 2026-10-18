'use client';

import { ClockCircleOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, App, Button, Card, Checkbox, Input, Radio, Result, Space, Spin, Tag, Typography } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formationService } from '@/services';
import type { ReponseQuestion, TentativePassage } from '@/types/formation';
import { messageErreur } from './constants';

const { Text, Paragraph } = Typography;

function tempsRestant(expiration: string | null): number | null {
  if (!expiration) return null;
  return Math.max(0, Math.floor((new Date(expiration).getTime() - Date.now()) / 1000));
}

/** Passage d'une évaluation : réponses enregistrables (reprise possible), soumission confirmée. */
export function PassageTentativePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [tentative, setTentative] = useState<TentativePassage | null>(null);
  const [reponses, setReponses] = useState<Record<string, ReponseQuestion>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState<'save' | 'submit' | null>(null);
  const [reste, setReste] = useState<number | null>(null);
  const soumise = useRef(false);

  useEffect(() => {
    formationService
      .getPassage(id)
      .then((t) => {
        setTentative(t);
        setReponses(Object.fromEntries(t.reponses.map((r) => [r.questionId, r])));
        setReste(tempsRestant(t.dateExpiration));
      })
      .catch((err) => setErreur(messageErreur(err, 'Tentative indisponible.')));
  }, [id]);

  const liste = useMemo(() => (tentative ? tentative.questions.map((q) => reponses[q.id] ?? { questionId: q.id, propositionIds: [], texte: null }) : []), [tentative, reponses]);

  async function soumettre(auto = false) {
    if (!tentative || soumise.current) return;
    soumise.current = true;
    setEnvoi('submit');
    try {
      const r = await formationService.soumettre(tentative.id, liste);
      if (auto) message.info('Temps écoulé : vos réponses ont été soumises.');
      router.push(`/formation/mon-espace/resultats/${r.id}`);
    } catch (err) {
      soumise.current = false;
      message.error(messageErreur(err, 'Soumission impossible.'));
    } finally {
      setEnvoi(null);
    }
  }

  // Compte à rebours ; soumission automatique à zéro.
  useEffect(() => {
    if (!tentative?.dateExpiration) return;
    const t = setInterval(() => {
      const r = tempsRestant(tentative.dateExpiration);
      setReste(r);
      if (r === 0) {
        clearInterval(t);
        soumettre(true);
      }
    }, 1000);
    return () => clearInterval(t);
    // soumettre lit l'état courant via les refs/états à chaque appel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentative]);

  async function enregistrer() {
    if (!tentative) return;
    setEnvoi('save');
    try {
      await formationService.enregistrerReponses(tentative.id, liste);
      message.success('Réponses enregistrées : vous pourrez reprendre plus tard.');
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(null);
    }
  }

  if (erreur) return <Result status="info" title="Tentative indisponible" subTitle={erreur} extra={<Button onClick={() => router.push('/formation/mon-espace')}>Mon espace</Button>} />;
  if (!tentative) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;

  const maj = (questionId: string, p: Partial<ReponseQuestion>) =>
    setReponses((r) => ({ ...r, [questionId]: { ...(r[questionId] ?? { questionId, propositionIds: [], texte: null }), ...p } }));
  const repondues = liste.filter((r) => r.propositionIds.length > 0 || (r.texte ?? '').trim()).length;
  const manquantes = tentative.questions.filter((q) => q.obligatoire && !liste.find((r) => r.questionId === q.id && (r.propositionIds.length > 0 || (r.texte ?? '').trim())));

  return (
    <PageContainer
      title={tentative.titre}
      subTitle={`Tentative n° ${tentative.numero} · ${tentative.pointsMax} points · seuil ${tentative.seuil}/100`}
      extra={
        reste != null && (
          <Tag icon={<ClockCircleOutlined />} color={reste < 60 ? 'red' : 'blue'} style={{ fontSize: 15, padding: '4px 10px', borderRadius: 8 }}>
            {Math.floor(reste / 60)}:{String(reste % 60).padStart(2, '0')}
          </Tag>
        )
      }
    >
      {tentative.consignes && <Alert type="info" showIcon message={tentative.consignes} style={{ marginBottom: 16 }} />}
      <Space orientation="vertical" size={16} style={{ width: '100%', maxWidth: 860 }}>
        {tentative.questions.map((q) => {
          const r = reponses[q.id];
          return (
            <Card key={q.id} style={{ borderRadius: 12 }}>
              <Paragraph style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 15 }}>
                  {q.ordre}. {q.enonce}
                </Text>{' '}
                <Text type="secondary">
                  ({q.points} pt{q.points > 1 ? 's' : ''}){q.obligatoire ? ' *' : ''}
                </Text>
              </Paragraph>
              {(q.type === 'QCM_UNIQUE' || q.type === 'VRAI_FAUX') && (
                <Radio.Group value={r?.propositionIds[0]} onChange={(e) => maj(q.id, { propositionIds: [e.target.value] })}>
                  <Space orientation="vertical">
                    {q.propositions.map((p) => (
                      <Radio key={p.id} value={p.id} style={{ padding: '4px 0' }}>
                        {p.libelle}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              )}
              {q.type === 'QCM_MULTIPLE' && (
                <>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Plusieurs réponses possibles</Text>
                  <Checkbox.Group value={r?.propositionIds ?? []} onChange={(v) => maj(q.id, { propositionIds: v as string[] })}>
                    <Space orientation="vertical">
                      {q.propositions.map((p) => (
                        <Checkbox key={p.id} value={p.id} style={{ padding: '4px 0' }}>
                          {p.libelle}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </>
              )}
              {q.type === 'REPONSE_COURTE' && <Input style={{ maxWidth: 480 }} value={r?.texte ?? ''} maxLength={4000} onChange={(e) => maj(q.id, { texte: e.target.value })} placeholder="Votre réponse" />}
              {q.type === 'MANUELLE' && <Input.TextArea rows={5} value={r?.texte ?? ''} maxLength={4000} onChange={(e) => maj(q.id, { texte: e.target.value })} placeholder="Votre réponse (corrigée par votre manager)" />}
            </Card>
          );
        })}
        <Card style={{ borderRadius: 12, position: 'sticky', bottom: 12 }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>
              {repondues}/{tentative.questions.length} question(s) répondue(s)
              {manquantes.length > 0 && <Text type="warning"> — obligatoires restantes : {manquantes.map((q) => q.ordre).join(', ')}</Text>}
            </Text>
            <Space>
              <Button icon={<SaveOutlined />} loading={envoi === 'save'} onClick={enregistrer}>
                Enregistrer et reprendre plus tard
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={envoi === 'submit'}
                disabled={manquantes.length > 0}
                onClick={() =>
                  modal.confirm({
                    title: 'Soumettre vos réponses ?',
                    content: 'Vous ne pourrez plus les modifier. Les questions à correction manuelle seront notées par votre manager.',
                    okText: 'Soumettre',
                    cancelText: 'Continuer',
                    onOk: () => soumettre(),
                  })
                }
              >
                Soumettre
              </Button>
            </Space>
          </Space>
        </Card>
      </Space>
    </PageContainer>
  );
}
