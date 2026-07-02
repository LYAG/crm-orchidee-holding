'use client';

import {
  ArrowRightOutlined,
  CalendarOutlined,
  PhoneOutlined,
  RiseOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { qualificationService, rdvService, reportingService } from '@/services';
import { QualificationTransformation } from '@/types';
import type { KpiDelegue, QualificationRDV, RendezVous, Utilisateur } from '@/types';
import { SimpleBarChart } from './SimpleBarChart';

const { Text } = Typography;

interface Props {
  user: Utilisateur;
}

/* ── Carte KPI ───────────────────────────────────────────────────────────── */

function KpiCard({
  loading,
  icon,
  label,
  value,
  suffix,
  formatter,
  accent,
  bg,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  formatter?: (v: number) => string;
  accent: string;
  bg: string;
}) {
  const displayed = formatter ? formatter(value) : String(value);
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #EEF4EE',
        padding: '20px 24px',
        height: '100%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
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
              marginBottom: 16,
            }}
          >
            {icon}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#1C3A1C',
              lineHeight: 1,
              letterSpacing: '-1px',
            }}
          >
            {displayed}
            {suffix && (
              <span style={{ fontSize: 16, fontWeight: 500, color: '#6B8C6B', marginLeft: 4 }}>
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

/* ── Dashboard Délégué ───────────────────────────────────────────────────── */

const CANAL_LABELS: Record<string, string> = {
  TELEPHONE: 'Téléphone',
  EMAIL: 'Email',
  VISITE: 'Visite',
};

export function DashboardDelegue({ user }: Props) {
  const [kpi, setKpi] = useState<KpiDelegue | null>(null);
  const [relances, setRelances] = useState<{ rdv: RendezVous; qual: QualificationRDV }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportingService
      .getKpiDelegue(user.id)
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    rdvService.getByDelegue(user.id).then(async (rdvList) => {
      const qualPromises = rdvList.map((r) =>
        qualificationService.getByRdv(r.id).then((q) => ({ rdv: r, qual: q })),
      );
      const results = await Promise.all(qualPromises);
      const today = new Date();
      const upcoming = results
        .filter(
          ({ qual }) =>
            qual?.transformation === QualificationTransformation.RELANCE_NECESSAIRE &&
            qual.dateRelance &&
            new Date(qual.dateRelance) >= today,
        )
        .map(({ rdv, qual }) => ({ rdv, qual: qual! }))
        .sort((a, b) => (a.qual.dateRelance ?? '').localeCompare(b.qual.dateRelance ?? ''))
        .slice(0, 5);
      setRelances(upcoming);
    });
  }, [user.id]);

  const chartData =
    kpi?.activiteParSemaine.map((s) => ({
      label: new Date(s.semaine).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      value: s.nbRdv,
    })) ?? [];

  return (
    <PageContainer
      title="Tableau de bord"
      subTitle={`Bienvenue, ${user.prenom} ${user.nom}`}
      tags={
        <Tag
          style={{
            background: '#E8F5E9',
            color: '#4A7A4A',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          {USER_ROLE_LABELS[user.role as UserRole]}
        </Tag>
      }
    >
      {/* ── KPI Cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<CalendarOutlined />}
            label="RDV cette semaine"
            value={kpi?.rdvSemaine ?? 0}
            accent="#5B8C5A"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<RiseOutlined />}
            label="Taux de transformation"
            value={kpi ? Math.round(kpi.tauxTransformation * 100) : 0}
            suffix="%"
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<WalletOutlined />}
            label="Pipeline en cours"
            value={kpi?.montantPipelineEnCours ?? 0}
            suffix="€"
            formatter={(v) => v.toLocaleString('fr-FR')}
            accent="#E65100"
            bg="#FFF3E0"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<PhoneOutlined />}
            label="Relances à venir"
            value={kpi?.relancesAVenir ?? 0}
            accent="#6A1B9A"
            bg="#F3E5F5"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* ── Activité chart ── */}
        <Col xs={24} md={14}>
          <ProCard
            title={
              <Text strong style={{ color: '#1C3A1C' }}>
                Activité commerciale — 4 dernières semaines
              </Text>
            }
            bordered
            style={{ borderRadius: 12 }}
          >
            <SimpleBarChart
              data={chartData}
              defaultColor="#5B8C5A"
              barHeight={120}
              emptyText="Aucun RDV sur la période"
            />
          </ProCard>
        </Col>

        {/* ── Relances ── */}
        <Col xs={24} md={10}>
          <ProCard
            bordered
            style={{ borderRadius: 12, overflow: 'hidden' }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Header gradient */}
            <div
              style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, #1C3A1C 0%, #2D5A2D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
                <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                  Mes relances à venir
                </Text>
              </div>
              <Link href="/rdv">
                <Button
                  type="text"
                  size="small"
                  style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                >
                  Calendrier →
                </Button>
              </Link>
            </div>

            {/* Items */}
            <div style={{ padding: 12 }}>
              {relances.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text style={{ fontSize: 12, color: '#9DB89D' }}>
                      Aucune relance planifiée
                    </Text>
                  }
                  style={{ margin: '16px 0' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {relances.map(({ rdv, qual }) => {
                    const canal = qual.canalRelance ? CANAL_LABELS[qual.canalRelance] : null;
                    const dateRelance = qual.dateRelance
                      ? new Date(qual.dateRelance).toLocaleDateString('fr-FR', { dateStyle: 'long' })
                      : '';
                    return (
                      <div
                        key={rdv.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #EEF4EE',
                          background: '#FAFCFA',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#F3E5F5',
                            color: '#6A1B9A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          <PhoneOutlined />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            style={{ fontSize: 13, color: '#1C3A1C', display: 'block', lineHeight: 1.3 }}
                          >
                            {dateRelance}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {canal ?? ''}
                            {canal ? ' · ' : ''}
                            RDV du{' '}
                            {new Date(rdv.dateHeure).toLocaleDateString('fr-FR', {
                              dateStyle: 'short',
                            })}
                          </Text>
                        </div>
                        <Link href={`/qualification/${rdv.id}`}>
                          <ArrowRightOutlined style={{ color: '#C8D8C8', fontSize: 11 }} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
