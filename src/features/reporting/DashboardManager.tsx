'use client';

import {
  ArrowRightOutlined,
  RiseOutlined,
  TeamOutlined,
  TrophyOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Avatar, Button, Col, Progress, Row, Skeleton, Tag, Tooltip, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { reportingService } from '@/services';
import { StatCard as KpiCard } from '@/components/ui/StatCard';
import type { KpiManager, Utilisateur } from '@/types';
import { SimpleBarChart } from './SimpleBarChart';

const { Text } = Typography;

const BAR_COLORS = [
  '#0F6E52', '#1F5FA8', '#A84A00', '#6B3FA0', '#1E7A4C',
  '#B42F29', '#0277BD', '#4E342E',
];

interface Props {
  user: Utilisateur;
}

/* ── Ligne délégué ───────────────────────────────────────────────────────── */

function DelegueRow({
  d,
  rank,
  color,
}: {
  d: { delegueId: string; nom: string; nbRdv: number; tauxTransformation: number; montantPipeline: number };
  rank: number;
  color: string;
}) {
  const taux = Math.round(d.tauxTransformation * 100);
  const isLow = taux < 20;
  const initials = d.nom
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${isLow ? '#F4D9B8' : '#E3EAE7'}`,
        background: isLow ? '#FFFBF7' : '#F6F8F7',
        marginBottom: 8,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: rank <= 3 ? color : '#EEF3F1',
          color: rank <= 3 ? '#fff' : '#4E6A63',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {rank === 1 ? <TrophyOutlined style={{ fontSize: 11 }} /> : rank}
      </div>

      {/* Avatar */}
      <Avatar
        size={32}
        style={{ background: `${color}20`, color, fontWeight: 700, fontSize: 11, flexShrink: 0 }}
      >
        {initials}
      </Avatar>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, color: '#123832', display: 'block', lineHeight: 1.2 }}>
          {d.nom}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {d.nbRdv} RDV
        </Text>
      </div>

      {/* Taux */}
      <div style={{ width: 90 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 11, color: isLow ? '#A84A00' : '#0F6E52', fontWeight: 600 }}>
            {taux}%
          </Text>
          {isLow && (
            <Tooltip title="Performance basse (< 20%)">
              <WarningOutlined style={{ color: '#A84A00', fontSize: 11 }} />
            </Tooltip>
          )}
        </div>
        <Progress
          percent={taux}
          size="small"
          showInfo={false}
          strokeColor={isLow ? '#A84A00' : '#0F6E52'}
          trailColor={isLow ? '#F4D9B8' : '#E8F2EE'}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Pipeline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: '#E8F2EE',
          color: '#1E7A4C',
          borderRadius: 5,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {d.montantPipeline.toLocaleString('fr-FR')} €
      </div>

      <Link href="/reporting">
        <ArrowRightOutlined style={{ color: '#627A74', fontSize: 11 }} />
      </Link>
    </div>
  );
}

/* ── Dashboard Manager ───────────────────────────────────────────────────── */

export function DashboardManager({ user }: Props) {
  const [kpi, setKpi] = useState<KpiManager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportingService
      .getKpiManager(user.id)
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const pipelineChartData =
    kpi?.delegues.map((d, i) => ({
      label: d.nom.split(' ')[0],
      value: d.montantPipeline,
      color: BAR_COLORS[i % BAR_COLORS.length],
    })) ?? [];

  const sortedDelegues = [...(kpi?.delegues ?? [])].sort(
    (a, b) => b.tauxTransformation - a.tauxTransformation,
  );

  return (
    <PageContainer
      title="Tableau de bord"
      subTitle={`Bienvenue, ${user.prenom} ${user.nom}`}
      tags={
        <Tag
          style={{
            background: '#EAF1FA',
            color: '#1F5FA8',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          {USER_ROLE_LABELS[user.role as UserRole]}
        </Tag>
      }
      extra={
        <Link href="/reporting">
          <Button type="primary" ghost icon={<RiseOutlined />}>
            Rapport détaillé
          </Button>
        </Link>
      }
    >
      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <KpiCard
            loading={loading}
            icon={<TeamOutlined />}
            label="RDV total — équipe"
            value={kpi?.delegues.reduce((s, d) => s + d.nbRdv, 0) ?? 0}
            accent="#0F6E52"
            bg="#E8F2EE"
          />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard
            loading={loading}
            icon={<WalletOutlined />}
            label="Pipeline global"
            value={kpi?.pipelineGlobal ?? 0}
            suffix="€"
            formatter={(v) => v.toLocaleString('fr-FR')}
            accent="#A84A00"
            bg="#FCF1E3"
          />
        </Col>
        <Col xs={24} sm={8}>
          <KpiCard
            loading={loading}
            icon={<RiseOutlined />}
            label="Taux de transformation"
            value={kpi ? Math.round(kpi.tauxTransformationGlobal * 100) : 0}
            suffix="%"
            accent="#1F5FA8"
            bg="#EAF1FA"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* ── Classement délégués ── */}
        <Col xs={24} lg={14}>
          <ProCard
            bordered
            style={{ borderRadius: 12, overflow: 'hidden' }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                background: '#123832',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrophyOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
              <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                Classement de l&apos;équipe
              </Text>
            </div>

            <div style={{ padding: '12px 12px 4px' }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : sortedDelegues.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <Text type="secondary">Aucun délégué dans votre équipe</Text>
                </div>
              ) : (
                sortedDelegues.map((d, i) => (
                  <DelegueRow
                    key={d.delegueId}
                    d={d}
                    rank={i + 1}
                    color={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                ))
              )}
            </div>
          </ProCard>
        </Col>

        {/* ── Pipeline chart ── */}
        <Col xs={24} lg={10}>
          <ProCard
            title={
              <Text strong style={{ color: '#123832' }}>
                Pipeline par délégué
              </Text>
            }
            bordered
            style={{ borderRadius: 12 }}
          >
            <SimpleBarChart
              data={pipelineChartData}
              barHeight={120}
              unit="€"
              emptyText="Aucune donnée de pipeline"
            />
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
