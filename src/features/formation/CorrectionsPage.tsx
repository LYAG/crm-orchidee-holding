'use client';

import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, App, Button, Checkbox, Drawer, Empty, Space, Table, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { formationService } from '@/services';
import type { ResultatTentative, TentativeResume } from '@/types/formation';
import { ScoreSeuil, StatutTentativeTag } from './components';
import { formatDateHeure, messageErreur } from './constants';
import { useRequete } from './useRequete';
import type { NoteSaisie } from './ResultatTentativeView';
import { ResultatTentativeView } from './ResultatTentativeView';

const { Text } = Typography;

/** Copies à corriger (questions à correction manuelle) et résultats différés à publier. */
export function CorrectionsPage() {
  const { message } = App.useApp();
  const [ouverte, setOuverte] = useState<ResultatTentative | null>(null);
  const [notes, setNotes] = useState<Record<string, NoteSaisie>>({});
  const [publier, setPublier] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const { donnees, chargement, erreur, recharger: charger } = useRequete<TentativeResume[]>(
    'corrections',
    () => formationService.getCorrections(),
    'Impossible de charger les corrections.',
  );
  const liste = donnees ?? [];

  async function ouvrir(t: TentativeResume) {
    try {
      setOuverte(await formationService.getTentative(t.id));
      setNotes({});
      setPublier(false);
    } catch (err) {
      message.error(messageErreur(err, 'Copie indisponible.'));
    }
  }

  const aCorriger = liste.filter((t) => t.statut === 'EN_ATTENTE_CORRECTION');
  const aPublier = liste.filter((t) => t.statut !== 'EN_ATTENTE_CORRECTION');
  const questionsACorriger = ouverte?.questions.filter((q) => q.correctionManuelle && !q.corrigee) ?? [];
  const complet = questionsACorriger.every((q) => notes[q.id]?.points != null);

  async function valider() {
    if (!ouverte) return;
    setEnvoi(true);
    try {
      const r =
        ouverte.statut === 'EN_ATTENTE_CORRECTION'
          ? await formationService.corriger(
              ouverte.id,
              questionsACorriger.map((q) => ({ questionId: q.id, points: notes[q.id]!.points!, commentaire: notes[q.id]?.commentaire })),
              publier,
            )
          : await formationService.publierResultat(ouverte.id);
      message.success(r.statut === 'EN_ATTENTE_CORRECTION' ? 'Correction enregistrée.' : `Résultat : ${r.score}/100 — ${r.reussie ? 'réussi' : 'seuil non atteint'}.`);
      setOuverte(null);
      charger();
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  const colonnes = [
    { title: 'Délégué', dataIndex: 'delegueNom', render: (n: string) => <Text strong>{n}</Text> },
    { title: 'Évaluation', dataIndex: 'evaluationTitre', render: (e: string, t: TentativeResume) => <span>{e}{t.formationTitre && <Text type="secondary"> — {t.formationTitre}</Text>}</span> },
    { title: 'Tentative', dataIndex: 'numero', render: (n: number) => `n° ${n}` },
    { title: 'Soumise le', dataIndex: 'dateSoumission', render: formatDateHeure },
    { title: 'Score', dataIndex: 'score', render: (s: number | null, t: TentativeResume) => <ScoreSeuil score={s} seuil={t.seuil} /> },
    { title: 'Statut', dataIndex: 'statut', render: (s: TentativeResume['statut']) => <StatutTentativeTag statut={s} /> },
    { title: '', key: 'a', render: (_: unknown, t: TentativeResume) => <Button size="small" icon={<EyeOutlined />} onClick={() => ouvrir(t)}>{t.statut === 'EN_ATTENTE_CORRECTION' ? 'Corriger' : 'Vérifier et publier'}</Button> },
  ];

  return (
    <PageContainer title="Corrections et résultats" subTitle="Les résultats restent en attente tant qu’une correction manuelle manque">
      {erreur && <Alert type="error" showIcon message={erreur} style={{ marginBottom: 16 }} />}
      <div style={{ background: '#fff', borderRadius: 12, padding: '4px 16px 16px', border: '1px solid var(--oh-line)' }}>
        <Tabs
          items={[
            {
              key: 'corriger',
              label: `À corriger (${aCorriger.length})`,
              children: <Table rowKey="id" loading={chargement} dataSource={aCorriger} columns={colonnes} scroll={{ x: 820 }} pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: <Empty description="Aucune copie à corriger" /> }} />,
            },
            {
              key: 'publier',
              label: `Résultats à publier (${aPublier.length})`,
              children: <Table rowKey="id" loading={chargement} dataSource={aPublier} columns={colonnes} scroll={{ x: 820 }} pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: <Empty description="Aucun résultat différé en attente" /> }} />,
            },
          ]}
        />
      </div>
      <Drawer
        open={ouverte !== null}
        onClose={() => setOuverte(null)}
        size={760}
        destroyOnHidden
        title={ouverte ? `${ouverte.titre} — ${ouverte.delegueNom}, tentative ${ouverte.numero}` : ''}
        extra={
          ouverte && (
            <Space>
              {ouverte.statut === 'EN_ATTENTE_CORRECTION' && <Checkbox checked={publier} onChange={(e) => setPublier(e.target.checked)}>Publier le résultat</Checkbox>}
              <Button type="primary" icon={<CheckOutlined />} loading={envoi} disabled={ouverte.statut === 'EN_ATTENTE_CORRECTION' && !complet} onClick={valider}>
                {ouverte.statut === 'EN_ATTENTE_CORRECTION' ? 'Valider la correction' : 'Publier le résultat'}
              </Button>
            </Space>
          )
        }
      >
        {ouverte && <ResultatTentativeView resultat={ouverte} notes={notes} onNote={ouverte.statut === 'EN_ATTENTE_CORRECTION' ? (id, n) => setNotes((x) => ({ ...x, [id]: n })) : undefined} />}
      </Drawer>
    </PageContainer>
  );
}
