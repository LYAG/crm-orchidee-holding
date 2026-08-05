'use client';

import {
  AlertOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  MergeCellsOutlined,
  RiseOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
  WarningOutlined,
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
          {kpi.doublonsEnAttente > 0 && (
            <Alert
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              style={{ borderRadius: 10 }}
              title={
                <Space>
                  <span>
                    <strong>{kpi.doublonsEnAttente}</strong> doublon
                    {kpi.doublonsEnAttente > 1 ? 's' : ''} en attente de validation
                  </span>
                  <Link href="/doublons">
                    <Button size="small" type="link" style={{ fontWeight: 600, padding: 0 }}>
                      Traiter →
                    </Button>
                  </Link>
                </Space>
              }
            />
          )}
          {kpi.professionnelsNonAttribuesSup30j > 0 && (
            <Alert
              type="info"
              icon={<AlertOutlined />}
              showIcon
              style={{ borderRadius: 10 }}
              title={
                <Space>
                  <span>
                    <strong>{kpi.professionnelsNonAttribuesSup30j}</strong> prospect
                    {kpi.professionnelsNonAttribuesSup30j > 1 ? 's' : ''} PNA non attribué
                    {kpi.professionnelsNonAttribuesSup30j > 1 ? 's' : ''} depuis plus de 30 jours
                  </span>
                  <Link href="/prospects">
                    <Button size="small" type="link" style={{ fontWeight: 600, padding: 0 }}>
                      Voir →
                    </Button>
                  </Link>
                </Space>
              }
            />
          )}
          {kpi.doublonsEnAttente === 0 && kpi.professionnelsNonAttribuesSup30j === 0 && (
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
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<MergeCellsOutlined />}
            label="Doublons en attente"
            value={kpi?.doublonsEnAttente ?? 0}
            accent="#E65100"
            bg="#FFF3E0"
            alert
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<UserOutlined />}
            label="Prospects PNA > 30 jours"
            value={kpi?.professionnelsNonAttribuesSup30j ?? 0}
            accent="#6A1B9A"
            bg="#F3E5F5"
            alert
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<WalletOutlined />}
            label="Pipeline total (toutes zones)"
            value={kpi?.pipelineTotal ?? 0}
            suffix="€"
            formatter={(v) => v.toLocaleString('fr-FR')}
            accent="#0F6E52"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
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

      {/* ── Raccourcis ── */}
      <div style={{ marginBottom: 8 }}>
        <Title level={5} style={{ color: '#1F4E45', margin: '0 0 14px' }}>
          Accès rapide
        </Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <QuickLinkCard
            href="/doublons"
            icon={<MergeCellsOutlined />}
            title="Gestion des doublons"
            description="Valider, fusionner ou ignorer les doublons détectés lors des imports."
            accent="#E65100"
            bg="#FFF3E0"
            badge={kpi?.doublonsEnAttente}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <QuickLinkCard
            href="/utilisateurs"
            icon={<TeamOutlined />}
            title="Utilisateurs & Zones"
            description="Gérer les comptes collaborateurs et la couverture géographique."
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <QuickLinkCard
            href="/reporting"
            icon={<BarChartOutlined />}
            title="Reporting détaillé"
            description="Analyser les performances par zone, délégué et période."
            accent="#0F6E52"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
