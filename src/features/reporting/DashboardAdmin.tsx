'use client';

import {
  AlertOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  SettingOutlined,
  SwapOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Button, Col, Row, Skeleton, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { reportingService } from '@/services';
import type { KpiAdmin, Utilisateur } from '@/types';

const { Text, Title } = Typography;

interface Props {
  user: Utilisateur;
}

/* ── Carte KPI ────────────────────────────────────────────────────────────── */

function KpiCard({
  loading,
  icon,
  label,
  value,
  suffix,
  formatter,
  accent,
  bg,
  alert,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  formatter?: (v: number) => string;
  accent: string;
  bg: string;
  alert?: boolean;
}) {
  const displayed = formatter ? formatter(value) : String(value);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: `1px solid ${alert && value > 0 ? accent + '40' : '#E7F3F0'}`,
        padding: '20px 24px',
        height: '100%',
        boxShadow: alert && value > 0
          ? `0 0 0 3px ${accent}14, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: accent,
              }}
            >
              {icon}
            </div>
            {alert && value > 0 && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: accent,
                  marginTop: 4,
                  boxShadow: `0 0 0 3px ${accent}30`,
                }}
              />
            )}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#123832', lineHeight: 1, letterSpacing: '-1px' }}>
            {displayed}
            {suffix && (
              <span style={{ fontSize: 16, fontWeight: 500, color: '#5C8079', marginLeft: 4 }}>
                {suffix}
              </span>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 6, display: 'block' }}>
            {label}
          </Text>
        </>
      )}
    </div>
  );
}

/* ── Carte Raccourci ──────────────────────────────────────────────────────── */

function QuickLinkCard({
  href,
  icon,
  title,
  description,
  accent,
  bg,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  bg: string;
  badge?: number;
}) {
  return (
    <Link href={href} style={{ display: 'block', height: '100%' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E7F3F0',
          padding: '20px 22px',
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.10)`;
          el.style.borderColor = `${accent}50`;
          el.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
          el.style.borderColor = '#E7F3F0';
          el.style.transform = 'translateY(0)';
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accent} 0%, ${accent}80 100%)`,
            borderRadius: '12px 12px 0 0',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: accent,
            }}
          >
            {icon}
          </div>
          {badge !== undefined && badge > 0 && (
            <div
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                background: accent,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {badge}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 14, color: '#123832', display: 'block', marginBottom: 4 }}>
            {title}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {description}
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: accent, fontSize: 12, fontWeight: 600, gap: 4 }}>
          <span>Accéder</span>
          <ArrowRightOutlined style={{ fontSize: 10 }} />
        </div>
      </div>
    </Link>
  );
}

/* ── Dashboard Admin ──────────────────────────────────────────────────────── */

export function DashboardAdmin({ user }: Props) {
  const [kpi, setKpi] = useState<KpiAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportingService
      .getKpiAdmin()
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer
      title="Tableau de bord"
      subTitle={`Bienvenue, ${user.prenom} ${user.nom}`}
      tags={
        <Tag
          style={{
            background: '#F3E5F5',
            color: '#6A1B9A',
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
          <Button type="primary" icon={<BarChartOutlined />}>
            Rapport détaillé
          </Button>
        </Link>
      }
    >

      {/* ── Alertes ── */}
      {kpi && (
        <Space orientation="vertical" style={{ width: '100%', marginBottom: 20 }} size={8}>
          {kpi.professionnelsNonAttribuesSup30j > 0 && (
            <Alert
              type="info"
              icon={<AlertOutlined />}
              showIcon
              style={{ borderRadius: 10 }}
              title={
                <Space>
                  <span>
                    <strong>{kpi.professionnelsNonAttribuesSup30j}</strong> professionnel
                    {kpi.professionnelsNonAttribuesSup30j > 1 ? 's' : ''} PNA non attribué
                    {kpi.professionnelsNonAttribuesSup30j > 1 ? 's' : ''} depuis plus de 30 jours
                  </span>
                  <Link href="/professionnels">
                    <Button size="small" type="link" style={{ fontWeight: 600, padding: 0 }}>
                      Voir →
                    </Button>
                  </Link>
                </Space>
              }
            />
          )}
          {kpi.professionnelsNonAttribuesSup30j === 0 && (
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              style={{ borderRadius: 10 }}
              title="Aucune action urgente — tous les indicateurs sont au vert."
            />
          )}
        </Space>
      )}

      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard
            loading={loading}
            icon={<UserOutlined />}
            label="Professionnels PNA > 30 jours"
            value={kpi?.professionnelsNonAttribuesSup30j ?? 0}
            accent="#6A1B9A"
            bg="#F3E5F5"
            alert
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard
            loading={loading}
            icon={<CalendarOutlined />}
            label={`RDV réalisés : ${kpi?.rdvRealises ?? 0} / ${kpi?.rdvTotal ?? 0}`}
            value={kpi && kpi.rdvTotal > 0 ? Math.round((kpi.rdvRealises / kpi.rdvTotal) * 100) : 0}
            suffix="%"
            accent="#0F6E52"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <KpiCard
            loading={loading}
            icon={<RiseOutlined />}
            label="Taux de transformation global"
            value={kpi ? Math.round(kpi.tauxTransformationGlobal * 100) : 0}
            suffix="%"
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
      </Row>

      {/* ── Conversions & Top délégués ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={9}>
          <ProCard
            title="Conversions de classification"
            bordered
            headerBordered
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: 20 }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#1565C0', lineHeight: 1 }}>
                    {kpi?.conversionsT3VersT2 ?? 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                    T3 → T2
                  </Text>
                </div>
                <SwapOutlined style={{ fontSize: 18, color: '#8FB0A8' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#E65100', lineHeight: 1 }}>
                    {kpi?.conversionsT2VersT3 ?? 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                    T2 → T3
                  </Text>
                </div>
              </div>
            )}
          </ProCard>
        </Col>
        <Col xs={24} lg={15}>
          <ProCard
            title={
              <Space size={6}>
                <TrophyOutlined style={{ color: '#E65100' }} />
                <span>Top 5 délégués</span>
              </Space>
            }
            bordered
            headerBordered
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: 20 }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : kpi && kpi.topDelegues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {kpi.topDelegues.map((d, i) => (
                  <div key={d.delegueId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: i === 0 ? '#FEF3C7' : '#F0F4F2',
                        color: i === 0 ? '#B45309' : '#5C8079',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <Text strong style={{ fontSize: 13, color: '#123832', flex: 1 }}>
                      {d.nom}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {d.nbRdv} RDV
                    </Text>
                    <Tag
                      style={{
                        background: '#E8F5E9',
                        color: '#0F6E52',
                        border: 'none',
                        fontWeight: 600,
                        borderRadius: 6,
                        minWidth: 48,
                        textAlign: 'center',
                      }}
                    >
                      {Math.round(d.tauxTransformation * 100)}%
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Aucune activité de délégué à classer pour le moment.
              </Text>
            )}
          </ProCard>
        </Col>
      </Row>

      {/* ── Raccourcis ── */}
      <div style={{ marginBottom: 8 }}>
        <Title level={5} style={{ color: '#1F4E45', margin: '0 0 14px' }}>
          Accès rapide
        </Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <QuickLinkCard
            href="/utilisateurs"
            icon={<TeamOutlined />}
            title="Utilisateurs & Zones"
            description="Gérer les comptes collaborateurs et la couverture géographique."
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickLinkCard
            href="/reporting"
            icon={<BarChartOutlined />}
            title="Reporting détaillé"
            description="Analyser les performances par zone, délégué et période."
            accent="#0F6E52"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickLinkCard
            href="/parametres"
            icon={<SettingOutlined />}
            title="Paramètres"
            description="Configurer les seuils de conformité des présentations commerciales."
            accent="#6A1B9A"
            bg="#F3E5F5"
          />
        </Col>
      </Row>
    </PageContainer>
  );
}
