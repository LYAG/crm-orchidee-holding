'use client';

import { DownloadOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, App, Button, Col, Empty, Progress, Row, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { SimpleBarChart } from '@/features/reporting/SimpleBarChart';
import { usePermission } from '@/hooks/usePermission';
import { formationService } from '@/services';
import type { FiltresFormation, ReportingFormation, RetardFormation, StatFormation, StatModule, StatQuestion } from '@/types/formation';
import { FiltresFormationBar, Progression, StatutAffectationTag } from './components';
import { TYPES_QUESTION, formatDate, formatScore, messageErreur, telecharger } from './constants';
import { useRequete } from './useRequete';

const { Text } = Typography;

const pct = (v: number) => `${v.toLocaleString('fr-FR')} %`;

export function StatistiquesFormationPage() {
  const { message } = App.useApp();
  const peutExporter = usePermission('FORMATION_EXPORT');
  const [filtres, setFiltres] = useState<FiltresFormation>({});
  const [export_, setExport] = useState(false);
  const { donnees, chargement, erreur } = useRequete<ReportingFormation>(
    JSON.stringify(filtres),
    () => formationService.getReporting(filtres),
    'Impossible de charger les statistiques.',
  );

  async function exporter() {
    setExport(true);
    try {
      telecharger(await formationService.exporterReporting(filtres), `resultats-formation-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      message.error(messageErreur(err, 'Export impossible.'));
    } finally {
      setExport(false);
    }
  }

  const d = donnees;

  return (
    <PageContainer
      title="Statistiques de formation"
      subTitle="Calculées à partir des résultats enregistrés, dans votre périmètre"
      extra={peutExporter ? [<Button key="exp" icon={<DownloadOutlined />} loading={export_} onClick={exporter}>Exporter (CSV)</Button>] : []}
    >
      <FiltresFormationBar valeur={filtres} onChange={setFiltres} />
      {erreur && <Alert type="error" showIcon message={erreur} style={{ marginBottom: 16 }} />}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <ProCard title="Par formation et exercice" bordered>
            <Table<StatFormation>
              size="small"
              rowKey={(s) => s.formationId ?? s.evaluationId ?? s.titre}
              loading={chargement}
              dataSource={d?.parFormation ?? []}
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              locale={{ emptyText: <Empty description="Aucune affectation sur la période" /> }}
              columns={[
                { title: 'Contenu', dataIndex: 'titre', render: (t, s) => <span><Text strong>{t}</Text> <Text type="secondary">v{s.version} · {s.nature === 'FORMATION' ? 'formation' : 'exercice'}</Text></span> },
                { title: 'Affectés', dataIndex: 'affectes', align: 'right' },
                { title: 'Participation', dataIndex: 'tauxParticipation', render: (v) => <Progress percent={v} size="small" strokeColor="#1F5FA8" format={() => pct(v)} /> },
                { title: 'Complétion', dataIndex: 'tauxCompletion', render: (v) => <Progress percent={v} size="small" strokeColor="#0F6E52" format={() => pct(v)} /> },
                { title: 'Réussite', dataIndex: 'tauxReussite', render: (v) => <Progress percent={v} size="small" strokeColor="#1E7A4C" format={() => pct(v)} /> },
                { title: 'Score moyen', dataIndex: 'scoreMoyen', align: 'right', render: formatScore },
                { title: 'Tentatives avant réussite', dataIndex: 'tentativesMoyennesAvantReussite', align: 'right', render: (v) => (v == null ? '—' : v.toLocaleString('fr-FR')) },
                { title: 'Retards', dataIndex: 'enRetard', align: 'right', render: (v) => (v ? <Tag color="red" style={{ borderRadius: 6 }}>{v}</Tag> : 0) },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="Réussite par module (quiz)" bordered style={{ height: '100%' }}>
            <SimpleBarChart
              barHeight={110}
              unit="%"
              emptyText="Aucun quiz de module passé"
              data={(d?.parModule ?? []).filter((m) => m.tentatives > 0).slice(0, 8).map((m) => ({ label: m.moduleTitre.length > 14 ? `${m.moduleTitre.slice(0, 13)}…` : m.moduleTitre, value: m.tauxReussite }))}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="Modules les plus difficiles" bordered style={{ height: '100%' }}>
            <Table<StatModule>
              size="small"
              rowKey="moduleId"
              loading={chargement}
              dataSource={d?.modulesLesPlusDifficiles ?? []}
              pagination={false}
              scroll={{ x: 480 }}
              locale={{ emptyText: <Empty description="Pas encore de données" /> }}
              columns={[
                { title: 'Module', dataIndex: 'moduleTitre', render: (t, m) => <span>{t}<div><Text type="secondary" style={{ fontSize: 12 }}>{m.formationTitre}</Text></div></span> },
                { title: 'Réussite', dataIndex: 'tauxReussite', align: 'right', render: pct },
                { title: 'Échecs', dataIndex: 'echecs', align: 'right' },
                { title: 'Score moyen', dataIndex: 'scoreMoyen', align: 'right', render: formatScore },
                { title: 'Bloqués', dataIndex: 'deleguesBloques', align: 'right' },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="Questions les plus échouées" bordered style={{ height: '100%' }}>
            <Table<StatQuestion>
              size="small"
              rowKey="questionId"
              loading={chargement}
              dataSource={d?.questionsLesPlusEchouees ?? []}
              pagination={false}
              scroll={{ x: 480 }}
              locale={{ emptyText: <Empty description="Aucune erreur enregistrée" /> }}
              columns={[
                { title: 'Question', dataIndex: 'enonce', ellipsis: true, render: (t, q) => <span>{t}<div><Text type="secondary" style={{ fontSize: 12 }}>{q.evaluationTitre} · {TYPES_QUESTION[q.type].label}</Text></div></span> },
                { title: 'Échecs', dataIndex: 'echecs', align: 'right', render: (e, q) => `${e}/${q.reponses}` },
                { title: 'Taux d’échec', dataIndex: 'tauxEchec', align: 'right', render: (v) => <Text type="danger">{pct(v)}</Text> },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24} lg={12}>
          <ProCard title="Formations obligatoires non terminées" bordered style={{ height: '100%' }}>
            <Table<RetardFormation>
              size="small"
              rowKey="affectationId"
              loading={chargement}
              dataSource={d?.obligatoiresNonTerminees ?? []}
              pagination={{ pageSize: 6, hideOnSinglePage: true }}
              scroll={{ x: 520 }}
              locale={{ emptyText: <Empty description="Toutes les formations obligatoires sont réussies" /> }}
              columns={[
                { title: 'Délégué', dataIndex: 'delegueNom' },
                { title: 'Contenu', dataIndex: 'titre' },
                { title: 'Statut', dataIndex: 'statut', render: (s, r) => <StatutAffectationTag statut={s} enRetard={r.enRetard} /> },
                { title: 'Progression', dataIndex: 'progression', render: (p, r) => <Progression valeur={p} statut={r.statut} /> },
                { title: 'Limite', dataIndex: 'dateLimite', render: formatDate },
              ]}
            />
          </ProCard>
        </Col>
        <Col xs={24}>
          <ProCard title="Formations échues (date limite dépassée sans réussite)" bordered>
            <Table<StatFormation>
              size="small"
              rowKey={(s) => s.formationId ?? s.evaluationId ?? s.titre}
              loading={chargement}
              dataSource={d?.formationsEchues ?? []}
              pagination={false}
              scroll={{ x: 520 }}
              locale={{ emptyText: <Empty description="Aucune formation échue" /> }}
              columns={[
                { title: 'Contenu', dataIndex: 'titre' },
                { title: 'Affectés', dataIndex: 'affectes', align: 'right' },
                { title: 'En retard', dataIndex: 'enRetard', align: 'right', render: (v) => <Text type="danger">{v}</Text> },
                { title: 'Réussite', dataIndex: 'tauxReussite', align: 'right', render: pct },
              ]}
            />
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
