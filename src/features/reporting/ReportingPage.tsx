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
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import {
  prospectService,
  rdvService,
  reportingService,
  utilisateurService,
  zoneService,
} from '@/services';
import { ProspectStatut, RdvStatut } from '@/types';
import type { Prospect, RendezVous, Utilisateur, Zone } from '@/types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface ProspectRow {
  prospect: Prospect;
  rdvCount: number;
  rdvRealises: number;
  qualifieCount: number;
}

const STATUT_CONFIG: Record<ProspectStatut, { color: string; bg: string; label: string }> = {
  [ProspectStatut.PNA]: { color: '#E65100', bg: '#FFF3E0', label: 'Non affecté' },
  [ProspectStatut.AFFECTE]: { color: '#1565C0', bg: '#E3F2FD', label: 'Affecté' },
  [ProspectStatut.CLIENT]: { color: '#2E7D32', bg: '#E8F5E9', label: 'Client' },
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
  const { message } = App.useApp();

  const [zones, setZones] = useState<Zone[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [filterZoneId, setFilterZoneId] = useState<string | undefined>();
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [rows, setRows] = useState<ProspectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [summaryStats, setSummaryStats] = useState({
    totalProspects: 0,
    totalRdv: 0,
    rdvRealises: 0,
  });

  if (!user) return null;

  const currentUser = user;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    zoneService.getAll().then(setZones).catch(() => {});
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
  }, [filterZoneId, filterDelegueId, dateRange]);

  async function load() {
    setLoading(true);
    try {
      const allProspects = await prospectService.getAll({
        zoneId: filterZoneId,
        delegueId: filterDelegueId,
      });

      const filtered =
        currentUser.role === UserRole.MANAGER
          ? allProspects.filter(
              (p) => p.delegueId && delegues.some((d) => d.id === p.delegueId),
            )
          : allProspects;

      const allRdv = await rdvService.getAll({
        delegueId:
          filterDelegueId ??
          (currentUser.role === UserRole.DELEGUE ? currentUser.id : undefined),
        dateDebut: dateRange?.[0].format('YYYY-MM-DD'),
        dateFin: dateRange?.[1].format('YYYY-MM-DD'),
      });

      const prospectRows: ProspectRow[] = filtered.map((p) => {
        const pRdv = allRdv.filter((r) => r.prospectId === p.id);
        const realises = pRdv.filter((r) => r.statut === RdvStatut.REALISE);
        const qualifies = realises.filter((r) => r.qualifie);
        return {
          prospect: p,
          rdvCount: pRdv.length,
          rdvRealises: realises.length,
          qualifieCount: qualifies.length,
        };
      });

      setRows(prospectRows);
      setSummaryStats({
        totalProspects: filtered.length,
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
        zoneId: filterZoneId,
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
      title: 'Prospect',
      key: 'nom',
      render: (_: unknown, row: ProspectRow) => (
        <div>
          <Text strong style={{ color: '#123832' }}>
            {row.prospect.nom} {row.prospect.prenom ?? ''}
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {row.prospect.entreprise}
          </Text>
        </div>
      ),
    },
    {
      title: 'Zone',
      dataIndex: ['prospect', 'zoneId'],
      key: 'zone',
      render: (zoneId: string) => zones.find((z) => z.id === zoneId)?.nom ?? zoneId,
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_: unknown, row: ProspectRow) => {
        const cfg = STATUT_CONFIG[row.prospect.statut];
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
      sorter: (a: ProspectRow, b: ProspectRow) => a.rdvCount - b.rdvCount,
    },
    {
      title: 'RDV réalisés',
      dataIndex: 'rdvRealises',
      key: 'rdvRealises',
      sorter: (a: ProspectRow, b: ProspectRow) => a.rdvRealises - b.rdvRealises,
    },
    {
      title: 'Qualifiés',
      dataIndex: 'qualifieCount',
      key: 'qualifieCount',
      render: (v: number, row: ProspectRow) => (
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
            label="Prospects filtrés"
            value={summaryStats.totalProspects}
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
        <Table<ProspectRow>
          dataSource={rows}
          columns={columns}
          rowKey={(r) => r.prospect.id}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
        />
      </ProCard>
    </PageContainer>
  );
}
