'use client';

import { ClockCircleOutlined, FileDoneOutlined, WalletOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Col, Row, Skeleton, Tag, Typography } from 'antd';
import { formatFcfa } from '@/lib/format';
import type { KpiOrdresMission as Kpi } from '@/types';
import { formatDelai, STATUT_MISSION_CONFIG, STATUTS_MISSION_ORDONNES } from './constants';

const { Text } = Typography;

function Indicateur({
  icon,
  label,
  valeur,
  accent,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  valeur: string;
  accent: string;
  bg: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: bg,
          color: accent,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#123832', lineHeight: 1.1 }}>
          {valeur}
        </div>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {label}
        </Text>
      </div>
    </div>
  );
}

interface Props {
  kpi: Kpi | null;
  loading: boolean;
}

export function KpiOrdresMission({ kpi, loading }: Props) {
  if (loading && !kpi) {
    return (
      <ProCard style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </ProCard>
    );
  }
  if (!kpi) return null;

  return (
    <ProCard style={{ marginBottom: 16 }} loading={loading}>
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} md={8}>
          <Indicateur
            icon={<FileDoneOutlined />}
            label="Missions sur la période"
            valeur={String(kpi.total)}
            accent="#0F6E52"
            bg="#E7F3F0"
          />
        </Col>
        <Col xs={24} md={8}>
          <Indicateur
            icon={<WalletOutlined />}
            label="Budget prévisionnel cumulé (missions validées)"
            valeur={formatFcfa(kpi.budgetPrevisionnelCumule)}
            accent="#E65100"
            bg="#FFF3E0"
          />
        </Col>
        <Col xs={24} md={8}>
          <Indicateur
            icon={<ClockCircleOutlined />}
            label="Délai moyen de validation"
            valeur={formatDelai(kpi.delaiMoyenValidationHeures)}
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
        <Col span={24}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STATUTS_MISSION_ORDONNES.map((s) => (
              <Tag
                key={s}
                color={STATUT_MISSION_CONFIG[s].color}
                style={{ borderRadius: 6, padding: '2px 10px' }}
              >
                {STATUT_MISSION_CONFIG[s].label} : <strong>{kpi.parStatut[s] ?? 0}</strong>
              </Tag>
            ))}
          </div>
        </Col>
      </Row>
    </ProCard>
  );
}
