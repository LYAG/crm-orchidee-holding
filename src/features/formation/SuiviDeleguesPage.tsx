'use client';

import { BellOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Empty, Input, Modal, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formationService } from '@/services';
import type { Affectation, FiltresFormation, RelanceFormation, SuiviDelegue, SuiviDelegueDetail, TentativeResume } from '@/types/formation';
import { FiltresFormationBar, Progression, ScoreSeuil, StatutAffectationTag, StatutTentativeTag } from './components';
import { MOTIFS_RELANCE, formatDate, formatDateHeure, formatScore, messageErreur } from './constants';
import { useRequete } from './useRequete';

const { Text } = Typography;

export function SuiviDeleguesPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [filtres, setFiltres] = useState<FiltresFormation>({});
  const [detail, setDetail] = useState<SuiviDelegueDetail | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [relanceOuverte, setRelanceOuverte] = useState(false);
  const [texte, setTexte] = useState('');
  const { donnees, chargement, erreur } = useRequete<[SuiviDelegue[], RelanceFormation[]]>(
    JSON.stringify(filtres),
    () => Promise.all([formationService.getSuiviDelegues(filtres), formationService.getRelances(filtres)]),
    'Impossible de charger le suivi.',
  );
  const suivi = donnees?.[0] ?? [];
  const relances = donnees?.[1] ?? [];

  async function ouvrir(delegueId: string) {
    try {
      setDetail(await formationService.getSuiviDelegue(delegueId));
    } catch (err) {
      message.error(messageErreur(err, 'Détail indisponible.'));
    }
  }

  async function relancer() {
    try {
      const n = await formationService.relancer(selection, texte || undefined);
      message.success(`${n} relance(s) envoyée(s).`);
      setRelanceOuverte(false);
      setSelection([]);
      setTexte('');
    } catch (err) {
      message.error(messageErreur(err, 'Relance impossible.'));
    }
  }

  return (
    <PageContainer title="Suivi des délégués" subTitle="Progression, résultats et difficultés de votre périmètre">
      <FiltresFormationBar valeur={filtres} onChange={setFiltres} />
      {erreur && <Alert type="error" showIcon message={erreur} style={{ marginBottom: 16 }} />}
      <div style={{ background: '#fff', borderRadius: 12, padding: '4px 16px 16px', border: '1px solid var(--oh-line)' }}>
        <Tabs
          items={[
            {
              key: 'delegues',
              label: `Délégués (${suivi.length})`,
              children: (
                <Table<SuiviDelegue>
                  rowKey="delegueId"
                  loading={chargement}
                  dataSource={suivi}
                  scroll={{ x: 1100 }}
                  pagination={{ pageSize: 15, hideOnSinglePage: true }}
                  locale={{ emptyText: <Empty description="Aucun délégué dans ce périmètre" /> }}
                  onRow={(s) => ({ onClick: () => ouvrir(s.delegueId), style: { cursor: 'pointer' } })}
                  columns={[
                    { title: 'Délégué', dataIndex: 'delegueNom', fixed: 'left', render: (n, s) => <Space orientation="vertical" size={0}><Text strong>{n}</Text><Text type="secondary" style={{ fontSize: 12 }}>{[s.managerNom && `Équipe ${s.managerNom}`, s.regions.join(', ')].filter(Boolean).join(' · ')}</Text></Space> },
                    { title: 'Affectées', dataIndex: 'affectees', align: 'right' },
                    { title: 'Commencées', dataIndex: 'commencees', align: 'right' },
                    { title: 'Terminées', dataIndex: 'terminees', align: 'right' },
                    { title: 'Réussies', dataIndex: 'reussies', align: 'right', render: (n) => <Text style={{ color: n ? '#1E7A4C' : undefined }}>{n}</Text> },
                    { title: 'Échouées', dataIndex: 'echouees', align: 'right', render: (n) => (n ? <Text type="danger">{n}</Text> : 0) },
                    { title: 'Progression', dataIndex: 'progressionMoyenne', render: (p) => <Progression valeur={p} /> },
                    { title: 'Score moyen', dataIndex: 'scoreMoyen', align: 'right', render: (s) => formatScore(s) },
                    { title: 'Tentatives', dataIndex: 'nbTentatives', align: 'right' },
                    { title: 'À corriger', dataIndex: 'correctionsEnAttente', align: 'right', render: (n) => (n ? <Tag color="gold" style={{ borderRadius: 6 }}>{n}</Tag> : 0) },
                    { title: 'Retards', dataIndex: 'enRetard', align: 'right', render: (n) => (n ? <Tag color="red" style={{ borderRadius: 6 }}>{n}</Tag> : 0) },
                    { title: 'Dernière activité', dataIndex: 'derniereActivite', render: formatDateHeure },
                  ]}
                />
              ),
            },
            {
              key: 'relances',
              label: `À relancer (${relances.length})`,
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Button type="primary" icon={<BellOutlined />} disabled={selection.length === 0} onClick={() => setRelanceOuverte(true)}>
                      Relancer ({selection.length})
                    </Button>
                    <Text type="secondary">Retards, échéances proches, échecs et délégués inactifs.</Text>
                  </Space>
                  <Table<RelanceFormation>
                    rowKey="affectationId"
                    loading={chargement}
                    dataSource={relances}
                    scroll={{ x: 820 }}
                    pagination={{ pageSize: 15, hideOnSinglePage: true }}
                    rowSelection={{ selectedRowKeys: selection, onChange: (k) => setSelection(k as string[]) }}
                    locale={{ emptyText: <Empty description="Personne à relancer" /> }}
                    columns={[
                      { title: 'Délégué', dataIndex: 'delegueNom', render: (n) => <Text strong>{n}</Text> },
                      { title: 'Contenu', dataIndex: 'titre' },
                      { title: 'Motif', dataIndex: 'motif', render: (m: RelanceFormation['motif']) => <Tag color={MOTIFS_RELANCE[m].color} style={{ borderRadius: 6 }}>{MOTIFS_RELANCE[m].label}</Tag> },
                      { title: 'Date limite', dataIndex: 'dateLimite', render: formatDate },
                      { title: 'Progression', dataIndex: 'progression', render: (p, r) => <Progression valeur={p} statut={r.statut} /> },
                      { title: 'Dernière activité', dataIndex: 'derniereActivite', render: formatDateHeure },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </div>

      <Modal open={relanceOuverte} title={`Relancer ${selection.length} affectation(s)`} okText="Envoyer" cancelText="Annuler" onOk={relancer} onCancel={() => setRelanceOuverte(false)} destroyOnHidden>
        <Text type="secondary">Le délégué reçoit une notification dans son espace Formation.</Text>
        <Input.TextArea style={{ marginTop: 12 }} rows={3} maxLength={1000} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Message (facultatif) — par défaut : rappel de la date limite." />
      </Modal>

      <Drawer open={detail !== null} onClose={() => setDetail(null)} size={860} destroyOnHidden title={detail?.synthese.delegueNom}>
        {detail && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions size="small" column={{ xs: 2, md: 4 }} bordered>
              <Descriptions.Item label="Affectées">{detail.synthese.affectees}</Descriptions.Item>
              <Descriptions.Item label="Réussies">{detail.synthese.reussies}</Descriptions.Item>
              <Descriptions.Item label="Échouées">{detail.synthese.echouees}</Descriptions.Item>
              <Descriptions.Item label="Score moyen">{formatScore(detail.synthese.scoreMoyen)}</Descriptions.Item>
            </Descriptions>
            <Text strong>Formations et exercices</Text>
            <Table<Affectation>
              size="small"
              rowKey="id"
              dataSource={detail.affectations}
              pagination={false}
              scroll={{ x: 640 }}
              onRow={(a) => ({ onClick: () => router.push(`/formation/affectations/${a.id}`), style: { cursor: 'pointer' } })}
              columns={[
                { title: 'Contenu', dataIndex: 'titre', render: (t, a) => <span>{t} <Text type="secondary">v{a.version}</Text></span> },
                { title: 'Statut', dataIndex: 'statut', render: (s, a) => <StatutAffectationTag statut={s} enRetard={a.enRetard} /> },
                { title: 'Progression', dataIndex: 'progression', render: (p, a) => <Progression valeur={p} statut={a.statut} /> },
                { title: 'Score', dataIndex: 'score', render: (s, a) => <ScoreSeuil score={s} seuil={a.seuilReussite} /> },
                { title: 'Date limite', dataIndex: 'dateLimite', render: formatDate },
              ]}
            />
            <Text strong>Historique des tentatives</Text>
            <Table<TentativeResume>
              size="small"
              rowKey="id"
              dataSource={detail.tentatives}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              scroll={{ x: 600 }}
              locale={{ emptyText: <Empty description="Aucune tentative" /> }}
              columns={[
                { title: 'Évaluation', dataIndex: 'evaluationTitre', render: (e, t) => <span>{e}{t.formationTitre && <Text type="secondary"> — {t.formationTitre}</Text>}</span> },
                { title: 'N°', dataIndex: 'numero' },
                { title: 'Date', dataIndex: 'dateDebut', render: formatDateHeure },
                { title: 'Score', dataIndex: 'score', render: (s, t) => <ScoreSeuil score={s} seuil={t.seuil} /> },
                { title: 'Statut', dataIndex: 'statut', render: (s) => <StatutTentativeTag statut={s} /> },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
}
