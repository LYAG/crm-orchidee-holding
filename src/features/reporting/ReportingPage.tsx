'use client';

import {
  CalendarOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  DatePicker,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useZoneFilter } from '@/components/ZoneFilterContext';
import { UserRole } from '@/lib/constants';
import {
  professionnelService,
  rdvService,
  reportingService,
  utilisateurService,
  zoneService,
} from '@/services';
import { RdvStatut, StatutProfessionnel } from '@/types';
import type { Centre, ProfessionnelSante, RendezVous, Utilisateur, Zone } from '@/types';
import { SuiviProfessionnelsTab } from './SuiviProfessionnelsTab';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface ProfessionnelRow {
  professionnel: ProfessionnelSante;
  rdvCount: number;
  rdvRealises: number;
  qualifieCount: number;
}

const STATUT_CONFIG: Record<StatutProfessionnel, { color: string; bg: string; label: string }> = {
  [StatutProfessionnel.PNA]: { color: '#E65100', bg: '#FFF3E0', label: 'Non affecté' },
  [StatutProfessionnel.ST]: { color: '#2E7D32', bg: '#E8F5E9', label: 'ST' },
  [StatutProfessionnel.T1]: { color: '#1565C0', bg: '#E3F2FD', label: 'T1' },
  [StatutProfessionnel.T2]: { color: '#6A1B9A', bg: '#F3E5F5', label: 'T2' },
  [StatutProfessionnel.T3]: { color: '#9E9E9E', bg: '#F5F5F5', label: 'T3' },
  [StatutProfessionnel.PERDU]: { color: '#C62828', bg: '#FFEBEE', label: 'Perdu' },
};

/* ── Mini KPI ────────────────────────────────────────────────────────────── */

function MiniKpi({
  loading,
  icon,
  label,
  value,
  suffix,
  accent,
  bg,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  accent: string;
  bg: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #E7F3F0',
        padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#123832', lineHeight: 1 }}>
              {value}
              {suffix && (
                <span style={{ fontSize: 14, fontWeight: 500, color: '#5C8079', marginLeft: 3 }}>
                  {suffix}
                </span>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
              {label}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function ReportingPage() {
  const { user } = useAuth();
  const { zoneFiltreId } = useZoneFilter();
  const { message } = App.useApp();

  const [zones, setZones] = useState<Zone[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [filterZoneId, setFilterZoneId] = useState<string | undefined>();
  // Le select local de la page prime sur la zone globale du header.
  const zoneEffectiveId = filterZoneId ?? zoneFiltreId;
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [rows, setRows] = useState<ProfessionnelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [summaryStats, setSummaryStats] = useState({
    totalProfessionnels: 0,
    totalRdv: 0,
    rdvRealises: 0,
  });

  if (!user) return null;

  const currentUser = user;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    zoneService.getAll().then(setZones).catch(() => {});
    professionnelService.getCentres().then(setCentres).catch(() => {});
    const fn =
      currentUser.role === UserRole.MANAGER
        ? utilisateurService.getDeleguesByManager(currentUser.id)
        : utilisateurService.getByRole(UserRole.DELEGUE);
    fn.then(setDelegues).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneEffectiveId, filterDelegueId, dateRange]);

  async function load() {
    setLoading(true);
    try {
      const allProfessionnels = await professionnelService.getProfessionnels({
        zoneId: zoneEffectiveId,
        delegueId: filterDelegueId,
      });

      const filtered =
        currentUser.role === UserRole.MANAGER
          ? allProfessionnels.filter(
              (p) => p.delegueId && delegues.some((d) => d.id === p.delegueId),
            )
          : allProfessionnels;

      const allRdv = await rdvService.getAll({
        delegueId:
          filterDelegueId ??
          (currentUser.role === UserRole.DELEGUE ? currentUser.id : undefined),
        dateDebut: dateRange?.[0].format('YYYY-MM-DD'),
        dateFin: dateRange?.[1].format('YYYY-MM-DD'),
      });

      const professionnelRows: ProfessionnelRow[] = filtered.map((p) => {
        const pRdv = allRdv.filter((r) => r.professionnelId === p.id);
        const realises = pRdv.filter((r) => r.statut === RdvStatut.REALISE);
        const qualifies = realises.filter((r) => r.qualifie);
        return {
          professionnel: p,
          rdvCount: pRdv.length,
          rdvRealises: realises.length,
          qualifieCount: qualifies.length,
        };
      });

      setRows(professionnelRows);
      setSummaryStats({
        totalProfessionnels: filtered.length,
        totalRdv: allRdv.length,
        rdvRealises: allRdv.filter((r) => r.statut === RdvStatut.REALISE).length,
      });
    } catch {
      message.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await reportingService.exporterCsv({
        zoneId: zoneEffectiveId,
        delegueId: filterDelegueId,
        periode: dateRange
          ? { debut: dateRange[0].format('YYYY-MM-DD'), fin: dateRange[1].format('YYYY-MM-DD') }
          : undefined,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_orchidee_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Export CSV téléchargé.');
    } catch {
      message.error("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  }

  const tauxQual =
    summaryStats.rdvRealises > 0
      ? Math.round(
          (rows.reduce((s, r) => s + r.qualifieCount, 0) / summaryStats.rdvRealises) * 100,
        )
      : 0;

  const columns = [
    {
      title: 'Professionnel de santé',
      key: 'nom',
      render: (_: unknown, row: ProfessionnelRow) => (
        <div>
          <Text strong style={{ color: '#123832' }}>
            {row.professionnel.titre ? `${row.professionnel.titre} ` : ''}
            {row.professionnel.nom} {row.professionnel.prenom ?? ''}
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {centres.find((c) => c.id === row.professionnel.centreId)?.nom ?? row.professionnel.centreId}
          </Text>
        </div>
      ),
    },
    {
      title: 'Zone',
      key: 'zone',
      render: (_: unknown, row: ProfessionnelRow) => {
        const centre = centres.find((c) => c.id === row.professionnel.centreId);
        return zones.find((z) => z.id === centre?.zoneId)?.nom ?? '—';
      },
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_: unknown, row: ProfessionnelRow) => {
        const cfg = STATUT_CONFIG[row.professionnel.statut];
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: cfg.bg,
              color: cfg.color,
              borderRadius: 5,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {cfg.label}
          </div>
        );
      },
    },
    {
      title: 'RDV total',
      dataIndex: 'rdvCount',
      key: 'rdvCount',
      sorter: (a: ProfessionnelRow, b: ProfessionnelRow) => a.rdvCount - b.rdvCount,
    },
    {
      title: 'RDV réalisés',
      dataIndex: 'rdvRealises',
      key: 'rdvRealises',
      sorter: (a: ProfessionnelRow, b: ProfessionnelRow) => a.rdvRealises - b.rdvRealises,
    },
    {
      title: 'Qualifiés',
      dataIndex: 'qualifieCount',
      key: 'qualifieCount',
      render: (v: number, row: ProfessionnelRow) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: v > 0 ? '#E8F5E9' : '#F5F5F5',
            color: v > 0 ? '#2E7D32' : '#9E9E9E',
            borderRadius: 5,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {v > 0 && <CheckCircleOutlined style={{ fontSize: 10 }} />}
          {v} / {row.rdvRealises}
        </div>
      ),
    },
  ];

  const professionnelsTab = (
    <>
      {/* ── Filtres ── */}
      <ProCard
        bordered
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: '14px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#E8F5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F6E52',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <FilterOutlined />
          </div>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#1F4E45', marginRight: 4 }}>
            Filtres :
          </Text>
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ borderRadius: 8 }}
          />
          {isAdmin && (
            <Select
              placeholder="Toutes les zones"
              allowClear
              style={{ width: 160, borderRadius: 8 }}
              value={filterZoneId}
              onChange={setFilterZoneId}
              options={zones.map((z) => ({ value: z.id, label: z.nom }))}
            />
          )}
          <Select
            placeholder="Tous les délégués"
            allowClear
            style={{ width: 180 }}
            value={filterDelegueId}
            onChange={setFilterDelegueId}
            options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
          />
        </div>
      </ProCard>

      {/* ── KPI summary ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi
            loading={loading}
            icon={<UserOutlined />}
            label="Professionnels filtrés"
            value={summaryStats.totalProfessionnels}
            accent="#0F6E52"
            bg="#E8F5E9"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi
            loading={loading}
            icon={<CalendarOutlined />}
            label="Total RDV"
            value={summaryStats.totalRdv}
            accent="#1565C0"
            bg="#E3F2FD"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi
            loading={loading}
            icon={<TeamOutlined />}
            label="RDV réalisés"
            value={summaryStats.rdvRealises}
            accent="#E65100"
            bg="#FFF3E0"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi
            loading={loading}
            icon={<CheckCircleOutlined />}
            label="Taux qualification"
            value={tauxQual}
            suffix="%"
            accent="#6A1B9A"
            bg="#F3E5F5"
          />
        </Col>
      </Row>

      {/* ── Table ── */}
      <ProCard bordered style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table<ProfessionnelRow>
          dataSource={rows}
          columns={columns}
          rowKey={(r) => r.professionnel.id}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
        />
      </ProCard>
    </>
  );

  return (
    <PageContainer
      title="Reporting équipe"
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Exporter en CSV
        </Button>
      }
    >
      <Tabs
        defaultActiveKey="prospects"
        items={[
          { key: 'professionnels', label: 'Professionnels', children: professionnelsTab },
          { key: 'suivi', label: 'Suivi Professionnels', children: <SuiviProfessionnelsTab /> },
        ]}
      />
    </PageContainer>
  );
}
