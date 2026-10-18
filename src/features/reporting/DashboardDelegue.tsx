'use client';

import {
  ArrowRightOutlined,
  CalendarOutlined,
  PhoneOutlined,
  RiseOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Col, Empty, Progress, Row, Skeleton, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { qualificationService, rdvService, reportingService } from '@/services';
import { QualificationTransformation } from '@/types';
import type { KpiDelegue, ProgressionConversion, QualificationRDV, RendezVous, Utilisateur } from '@/types';
import { StatCard as KpiCard } from '@/components/ui/StatCard';
import { NotesMensuellesTab } from '@/features/notation/NotesMensuellesTab';
import { SimpleBarChart } from './SimpleBarChart';

const { Text } = Typography;

interface Props {
  user: Utilisateur;
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
  const [conversion, setConversion] = useState<ProgressionConversion | null>(null);

  useEffect(() => {
    reportingService
      .getKpiDelegue(user.id)
      .then(setKpi)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    const maintenant = dayjs();
    reportingService
      .getProgressionConversions(maintenant.year(), maintenant.month() + 1)
      .then((liste) => setConversion(liste.find((p) => p.delegueId === user.id) ?? null))
      .catch(() => {});
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
            background: '#E8F2EE',
            color: '#2E6B5B',
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
            accent="#0F6E52"
            bg="#E8F2EE"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<RiseOutlined />}
            label="Taux de transformation"
            value={kpi ? Math.round(kpi.tauxTransformation * 100) : 0}
            suffix="%"
            accent="#1F5FA8"
            bg="#EAF1FA"
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
            accent="#A84A00"
            bg="#FCF1E3"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            loading={loading}
            icon={<PhoneOutlined />}
            label="Relances à venir"
            value={kpi?.relancesAVenir ?? 0}
            accent="#6B3FA0"
            bg="#F1ECF8"
          />
        </Col>
      </Row>

      {conversion && conversion.objectif > 0 && (
        <ProCard bordered style={{ borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Progress
              type="circle"
              size={64}
              percent={Math.min(100, Math.round((conversion.nbConversions / conversion.objectif) * 100))}
              strokeColor={conversion.nbConversions >= conversion.objectif ? '#0F6E52' : '#1F5FA8'}
              format={() => (
                <span style={{ fontSize: 15, fontWeight: 700, color: '#123832' }}>
                  {conversion.nbConversions}/{conversion.objectif}
                </span>
              )}
            />
            <div>
              <Text strong style={{ display: 'block', color: '#123832' }}>
                Objectif de conversion T1 → ST ce mois-ci
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {conversion.nbConversions >= conversion.objectif
                  ? 'Objectif atteint — bravo !'
                  : `Encore ${conversion.objectif - conversion.nbConversions} conversion(s) pour atteindre l'objectif.`}
              </Text>
            </div>
          </div>
        </ProCard>
      )}

      <Row gutter={[16, 16]}>
        {/* ── Activité chart ── */}
        <Col xs={24} md={14}>
          <ProCard
            title={
              <Text strong style={{ color: '#123832' }}>
                Activité commerciale — 4 dernières semaines
              </Text>
            }
            bordered
            style={{ borderRadius: 12 }}
          >
            <SimpleBarChart
              data={chartData}
              defaultColor="#0F6E52"
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
                background: '#123832',
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
                    <Text style={{ fontSize: 12, color: '#627A74' }}>
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
                          border: '1px solid #E3EAE7',
                          background: '#F6F8F7',
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
                            background: '#F1ECF8',
                            color: '#6B3FA0',
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
                            style={{ fontSize: 13, color: '#123832', display: 'block', lineHeight: 1.3 }}
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
                          <ArrowRightOutlined style={{ color: '#627A74', fontSize: 11 }} />
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

      {/* ── Notes mensuelles attribuées par le manager (lecture seule) ── */}
      <ProCard
        bordered
        title={<Text strong style={{ color: '#123832' }}>Mes notes mensuelles</Text>}
        style={{ borderRadius: 12, marginTop: 16 }}
      >
        <NotesMensuellesTab delegueId={user.id} />
      </ProCard>
    </PageContainer>
  );
}
