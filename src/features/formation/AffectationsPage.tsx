'use client';

import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Col, Empty, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { formationService } from '@/services';
import type { Affectation, FiltresFormation, StatutAffectation } from '@/types/formation';
import { AffectationWizard } from './AffectationWizard';
import { FiltresFormationBar, Progression, ScoreSeuil, StatutAffectationTag } from './components';
import { PRIORITES, STATUTS_AFFECTATION, formatDate, options } from './constants';
import { useRequete } from './useRequete';

const { Text } = Typography;

export function AffectationsPage() {
  const router = useRouter();
  const peutAffecter = usePermission('FORMATION_AFFECTATION');
  const [filtres, setFiltres] = useState<FiltresFormation>({});
  const [statut, setStatut] = useState<StatutAffectation | undefined>();
  const [wizard, setWizard] = useState(false);
  const { donnees, chargement, erreur, recharger: charger } = useRequete<Affectation[]>(
    JSON.stringify({ filtres, statut }),
    () => formationService.getAffectations({ ...filtres, statut }),
    'Impossible de charger les affectations.',
  );
  const affectations = donnees ?? [];

  return (
    <PageContainer
      title="Affectations"
      subTitle="Qui doit suivre quoi, pour quand"
      extra={
        peutAffecter
          ? [
              <Button key="new" type="primary" icon={<PlusOutlined />} onClick={() => setWizard(true)}>
                Nouvelle affectation
              </Button>,
            ]
          : []
      }
    >
      <FiltresFormationBar valeur={filtres} onChange={setFiltres} />
      {erreur && <Alert type="error" showIcon message={erreur} style={{ marginBottom: 16 }} />}
      <Row style={{ marginBottom: 12 }}>
        <Col xs={24} md={8} lg={6}>
          <Select allowClear style={{ width: '100%' }} placeholder="Tous les statuts" value={statut} onChange={setStatut} options={options(STATUTS_AFFECTATION)} />
        </Col>
      </Row>
      <Table<Affectation>
        rowKey="id"
        loading={chargement}
        dataSource={affectations}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
        style={{ background: '#fff', borderRadius: 12 }}
        locale={{ emptyText: <Empty description="Aucune affectation">{peutAffecter && <Button type="primary" onClick={() => setWizard(true)}>Affecter une formation</Button>}</Empty> }}
        onRow={(a) => ({ onClick: () => router.push(`/formation/affectations/${a.id}`), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Délégué', dataIndex: 'delegueNom', render: (n) => <Text strong>{n}</Text> },
          {
            title: 'Contenu',
            dataIndex: 'titre',
            render: (t, a) => (
              <Space orientation="vertical" size={0}>
                <span>{t} <Text type="secondary">v{a.version}</Text></span>
                <Text type="secondary" style={{ fontSize: 12 }}>{a.nature === 'FORMATION' ? 'Formation' : 'Exercice'} · {a.cibleLibelle}</Text>
              </Space>
            ),
          },
          { title: 'Statut', dataIndex: 'statut', render: (s, a) => <StatutAffectationTag statut={s} enRetard={a.enRetard} /> },
          { title: 'Progression', dataIndex: 'progression', render: (p, a) => <Progression valeur={p} statut={a.statut} /> },
          { title: 'Score', dataIndex: 'score', render: (s, a) => <ScoreSeuil score={s} seuil={a.seuilReussite} /> },
          { title: 'Tentatives', dataIndex: 'nbTentatives', align: 'right', render: (n, a) => <span>{n}{a.correctionsEnAttente > 0 && <Tag color="gold" style={{ marginInlineStart: 6, borderRadius: 6 }}>{a.correctionsEnAttente} à corriger</Tag>}</span> },
          { title: 'Date limite', dataIndex: 'dateLimite', render: (d, a) => <Text type={a.enRetard ? 'danger' : undefined}>{formatDate(d)}</Text> },
          { title: 'Priorité', dataIndex: 'priorite', render: (p: Affectation['priorite']) => <Tag color={PRIORITES[p].color} style={{ borderRadius: 6 }}>{PRIORITES[p].label}</Tag> },
          { title: 'Obligatoire', dataIndex: 'obligatoire', render: (o) => (o ? 'Oui' : 'Non') },
        ]}
      />
      {wizard && <AffectationWizard open onClose={() => setWizard(false)} onDone={() => { setWizard(false); charger(); }} />}
    </PageContainer>
  );
}
