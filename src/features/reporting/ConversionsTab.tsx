'use client';

import { TrophyOutlined } from '@ant-design/icons';
import { Alert, Col, DatePicker, Progress, Row, Skeleton, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { reportingService } from '@/services';
import type { ProgressionConversion } from '@/types';

const { Text } = Typography;

function couleurJauge(pourcent: number): string {
  if (pourcent >= 100) return '#0F6E52';
  if (pourcent >= 50) return '#1565C0';
  return '#E65100';
}

export function ConversionsTab() {
  const [periode, setPeriode] = useState<Dayjs>(dayjs());
  const [progression, setProgression] = useState<ProgressionConversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportingService
      .getProgressionConversions(periode.year(), periode.month() + 1)
      .then(setProgression)
      .catch(() => setProgression([]))
      .finally(() => setLoading(false));
  }, [periode]);

  const objectif = progression[0]?.objectif ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Conversions T1 → ST réalisées par chaque délégué, comparées à l&apos;objectif du mois fixé dans Paramètres.
        </Text>
        <DatePicker
          picker="month"
          value={periode}
          onChange={(v) => v && setPeriode(v)}
          allowClear={false}
          format="MMMM YYYY"
        />
      </div>

      {!loading && objectif === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Aucun objectif de conversion n'est fixé pour ce mois."
          description="Un administrateur peut en définir un dans Paramètres → Objectifs de conversion."
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : progression.length === 0 ? (
        <Text type="secondary">Aucun délégué à afficher.</Text>
      ) : (
        <Row gutter={[16, 16]}>
          {progression.map((p) => {
            const pourcent = objectif > 0 ? Math.round((p.nbConversions / objectif) * 100) : 0;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={p.delegueId}>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #E7F3F0',
                    padding: '20px 16px',
                    textAlign: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Progress
                    type="dashboard"
                    percent={Math.min(100, pourcent)}
                    strokeColor={couleurJauge(pourcent)}
                    format={() => (
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#123832' }}>
                        {p.nbConversions}
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#8FB0A8' }}>/{objectif || '—'}</span>
                      </span>
                    )}
                  />
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <TrophyOutlined style={{ color: '#8FB0A8', fontSize: 12 }} />
                    <Text strong style={{ fontSize: 13, color: '#123832' }}>
                      {p.nomDelegue}
                    </Text>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
