'use client';

import {
  AlertOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  RiseOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Button, Col, Empty, Row, Space, Table, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { SimpleBarChart } from '@/features/reporting/SimpleBarChart';
import { formationService } from '@/services';
import type { FiltresFormation, StatFormation, TableauBordFormation, TentativeResume } from '@/types/formation';
import { FiltresFormationBar, ScoreSeuil, StatutTentativeTag } from './components';
import { STATUTS_AFFECTATION, formatDateHeure, formatScore } from './constants';
import { useRequete } from './useRequete';

const { Text } = Typography;

const COULEURS_STATUT: Record<string, string> = {
  NON_COMMENCEE: '#9AA9A4',
  EN_COURS: '#1F5FA8',
  EN_ATTENTE_CORRECTION: '#B7791F',
  REUSSIE: '#1E7A4C',
  ECHOUEE: '#B42F29',
};

export function TableauBordFormationPage() {
  const router = useRouter();
  const [filtres, setFiltres] = useState<FiltresFormation>({});
  const { donnees: d, chargement, erreur } = useRequete<TableauBordFormation>(
    JSON.stringify(filtres),
    () => formationService.getTableauDeBord(filtres),
    'Impossible de charger le tableau de bord.',
  );
  const pct = (v: number) => `${v.toLocaleString('fr-FR')}`;

  return (
    <PageContainer
      title="Formation — tableau de bord"
      subTitle="Participation, réussite et difficultés de votre périmètre"
      extra={[
        <Button key="cat" icon={<BookOutlined />} onClick={() => router.push('/formation/catalogue')}>
          Formations et exercices
        </Button>,
        <Button key="aff" type="primary" icon={<TeamOutlined />} onClick={() => router.push('/formation/affectations')}>
          Affecter
        </Button>,
      ]}
    >
      <FiltresFormationBar valeur={filtres} onChange={setFiltres} />
      {erreur && <Alert type="error" showIcon message={erreur} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<BookOutlined />} label="Formations publiées" value={d?.formationsPubliees ?? 0} accent="#0F6E52" bg="#E8F2EE" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<TeamOutlined />} label="Affectations actives" value={d?.affectations ?? 0} accent="#1F5FA8" bg="#E6EEF8" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<CheckCircleOutlined />} label="Taux de complétion" value={d?.tauxCompletion ?? 0} suffix="%" formatter={pct} accent="#1E7A4C" bg="#E5F3EA" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<TrophyOutlined />} label="Taux de réussite" value={d?.tauxReussite ?? 0} suffix="%" formatter={pct} accent="#6B3FA0" bg="#F0EAF7" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<RiseOutlined />} label="Score moyen" value={d?.scoreMoyen ?? 0} suffix="/100" formatter={(v) => (d?.scoreMoyen == null ? '—' : v.toLocaleString('fr-FR'))} accent="#0277BD" bg="#E3F1F9" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<ClockCircleOutlined />} label="Affectations en retard" value={d?.affectationsEnRetard ?? 0} accent="#B42F29" bg="#FBEAEA" alert />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<AlertOutlined />} label="Délégués en échec" value={d?.deleguesEnEchec ?? 0} accent="#A84A00" bg="#FCF1E3" alert />
        </Col>
        <Col xs={12} md={6}>
          <StatCard loading={chargement} icon={<EditOutlined />} label="Corrections en attente" value={d?.correctionsEnAttente ?? 0} accent="#B7791F" bg="#FDF5E2" alert />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <ProCard title="Avancement des délégués" style={{ height: '100%' }}>
            <SimpleBarChart
              barHeight={120}
              emptyText="Aucune affectation sur la période"
              data={(['NON_COMMENCEE', 'EN_COURS', 'EN_ATTENTE_CORRECTION', 'REUSSIE', 'ECHOUEE'] as const).map((s) => ({
                label: STATUTS_AFFECTATION[s].label,
                value: d?.repartitionStatuts[s] ?? 0,
                color: COULEURS_STATUT[s],
              }))}
            />
            <Space wrap size={[16, 4]} style={{ marginTop: 12 }}>
              <Text type="secondary">Formations : {d?.formationsCreees ?? 0} créées · {d?.formationsBrouillon ?? 0} brouillons · {d?.formationsArchivees ?? 0} archivées</Text>
              <Text type="secondary">Délégués : {d?.deleguesAffectes ?? 0} affectés · {d?.deleguesAyantCommence ?? 0} ont commencé · {d?.deleguesAyantTermine ?? 0} ont terminé</Text>
            </Space>
          </ProCard>
        </Col>
        <Col xs={24} lg={14}>
          <ProCard title="Par formation et exercice" style={{ height: '100%' }}>
            <Table<StatFormation>
              size="small"
              rowKey={(s) => s.formationId ?? s.evaluationId ?? s.titre}
              loading={chargement}
              dataSource={d?.parFormation ?? []}
              pagination={{ pageSize: 5, hideOnSinglePage: true }}
              scroll={{ x: 560 }}
              locale={{ emptyText: <Empty description="Aucune affectation" /> }}
              columns={[
                { title: 'Contenu', dataIndex: 'titre', render: (t, s) => <Text strong>{t} <Text type="secondary">v{s.version}</Text></Text> },
                { title: 'Affectés', dataIndex: 'affectes', align: 'right' },
                { title: 'Complétion', dataIndex: 'tauxCompletion', align: 'right', render: (v) => `${v} %` },
                { title: 'Réussite', dataIndex: 'tauxReussite', align: 'right', render: (v) => `${v} %` },
                { title: 'Score moyen', dataIndex: 'scoreMoyen', align: 'right', render: (v) => formatScore(v) },
                { title: 'Retards', dataIndex: 'enRetard', align: 'right', render: (v) => (v ? <Text type="danger">{v}</Text> : 0) },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24}>
          <ProCard title="Dernières tentatives" extra={<Button type="link" onClick={() => router.push('/formation/suivi')}>Suivi des délégués</Button>}>
            <Table<TentativeResume>
              size="small"
              rowKey="id"
              loading={chargement}
              dataSource={d?.dernieresTentatives ?? []}
              pagination={false}
              scroll={{ x: 640 }}
              locale={{ emptyText: <Empty description="Aucune tentative soumise" /> }}
              onRow={(t) => ({ onClick: () => router.push(`/formation/affectations/${t.affectationId}`), style: { cursor: 'pointer' } })}
              columns={[
                { title: 'Délégué', dataIndex: 'delegueNom' },
                { title: 'Évaluation', dataIndex: 'evaluationTitre', render: (t, r) => <span>{t}{r.formationTitre && <Text type="secondary"> — {r.formationTitre}</Text>}</span> },
                { title: 'Tentative', dataIndex: 'numero', align: 'center', render: (n) => `n° ${n}` },
                { title: 'Soumise le', dataIndex: 'dateSoumission', render: formatDateHeure },
                { title: 'Score', dataIndex: 'score', render: (s, r) => <ScoreSeuil score={s} seuil={r.seuil} /> },
                { title: 'Statut', dataIndex: 'statut', render: (s) => <StatutTentativeTag statut={s} /> },
              ]}
            />
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
