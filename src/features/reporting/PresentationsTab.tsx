'use client';

import { CheckCircleOutlined, ClockCircleOutlined, PrinterOutlined, WarningOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Col, DatePicker, Progress, Row, Select, Skeleton, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { construireLigneFiltres, construireTableauHtml, imprimerRapport } from '@/lib/impression';
import { supportService, utilisateurService } from '@/services';
import { UserRole } from '@/lib/constants';
import type {
  MetriquePresentationLigne,
  SlideMoyenne,
  SupportCommercial,
  SyntheseDeleguePresentation,
  SyntheseSupportPresentation,
  TendanceConformitePresentation,
  Utilisateur,
} from '@/types';
import { SimpleBarChart } from './SimpleBarChart';

const { Text } = Typography;
const { RangePicker } = DatePicker;

function formatDuree(totalSecondes: number): string {
  const minutes = Math.floor(totalSecondes / 60);
  const secondes = Math.round(totalSecondes % 60);
  return `${minutes}:${String(secondes).padStart(2, '0')}`;
}

function tagConformite(conforme: boolean) {
  return conforme ? (
    <Tag color="success" icon={<CheckCircleOutlined />}>
      Conforme
    </Tag>
  ) : (
    <Tag color="error" icon={<WarningOutlined />}>
      Insuffisante
    </Tag>
  );
}

function couleurTaux(taux: number): string {
  if (taux >= 0.8) return '#0F6E52';
  if (taux >= 0.5) return '#E65100';
  return '#C62828';
}

function slidesEnBarData(slides: MetriquePresentationLigne['slides']) {
  return slides
    .slice()
    .sort((a, b) => a.slideIndex - b.slideIndex)
    .map((s) => ({ label: `S${s.slideIndex + 1}`, value: s.tempsPasse }));
}

export function PresentationsTab() {
  const { user } = useAuth();
  if (!user) return null;
  const isDelegue = user.role === UserRole.DELEGUE;

  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [supports, setSupports] = useState<SupportCommercial[]>([]);
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();
  const [filterSupportId, setFilterSupportId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [journal, setJournal] = useState<MetriquePresentationLigne[]>([]);
  const [syntheseDelegues, setSyntheseDelegues] = useState<SyntheseDeleguePresentation[]>([]);
  const [syntheseSupports, setSyntheseSupports] = useState<SyntheseSupportPresentation[]>([]);
  const [tendance, setTendance] = useState<TendanceConformitePresentation[]>([]);
  const [slidesParSupport, setSlidesParSupport] = useState<Record<string, SlideMoyenne[]>>({});
  const [loading, setLoading] = useState(false);

  const delegueIdEffectif = isDelegue ? user.id : filterDelegueId;

  useEffect(() => {
    supportService.getAll().then(setSupports).catch(() => {});
    if (!isDelegue) {
      const fn =
        user.role === UserRole.MANAGER
          ? utilisateurService.getDeleguesByManager(user.id)
          : utilisateurService.getByRole(UserRole.DELEGUE);
      fn.then(setDelegues).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegueIdEffectif, filterSupportId, dateRange]);

  async function load() {
    setLoading(true);
    const filtreBase = {
      delegueId: delegueIdEffectif,
      supportId: filterSupportId,
      dateDebut: dateRange?.[0].format('YYYY-MM-DD'),
      dateFin: dateRange?.[1].format('YYYY-MM-DD'),
    };
    try {
      const [journalData, syntheseSupportsData, tendanceData] = await Promise.all([
        supportService.listerMetriques(filtreBase),
        supportService.getSyntheseParSupport({ delegueId: filtreBase.delegueId, dateDebut: filtreBase.dateDebut, dateFin: filtreBase.dateFin }),
        supportService.getTendanceConformite(delegueIdEffectif),
      ]);
      setJournal(journalData);
      setSyntheseSupports(syntheseSupportsData);
      setTendance(tendanceData);

      if (!isDelegue) {
        const syntheseDeleguesData = await supportService.getSyntheseParDelegue({
          supportId: filtreBase.supportId,
          dateDebut: filtreBase.dateDebut,
          dateFin: filtreBase.dateFin,
        });
        setSyntheseDelegues(syntheseDeleguesData);
      }
    } catch {
      setJournal([]);
    } finally {
      setLoading(false);
    }
  }

  async function chargerSlidesSupport(supportId: string) {
    if (slidesParSupport[supportId]) return;
    try {
      const slides = await supportService.getSlidesMoyens(supportId);
      setSlidesParSupport((prev) => ({ ...prev, [supportId]: slides }));
    } catch {
      setSlidesParSupport((prev) => ({ ...prev, [supportId]: [] }));
    }
  }

  const kpis = useMemo(() => {
    const nb = journal.length;
    const nbConformes = journal.filter((j) => j.conforme).length;
    const dureeMoyenne = nb > 0 ? journal.reduce((s, j) => s + j.dureeTotal, 0) / nb : 0;
    const deleguesInactifs = syntheseDelegues.filter((d) => d.nbPresentations === 0).length;
    return {
      nb,
      taux: nb === 0 ? 0 : nbConformes / nb,
      dureeMoyenne,
      deleguesInactifs,
    };
  }, [journal, syntheseDelegues]);

  function handleImprimer() {
    const resumeFiltres = construireLigneFiltres([
      { label: 'Délégué', valeur: delegues.find((d) => d.id === delegueIdEffectif) ? `${delegues.find((d) => d.id === delegueIdEffectif)!.prenom} ${delegues.find((d) => d.id === delegueIdEffectif)!.nom}` : undefined },
      { label: 'Support', valeur: supports.find((s) => s.id === filterSupportId)?.titre },
      {
        label: 'Période',
        valeur: dateRange ? `${dateRange[0].format('DD/MM/YYYY')} — ${dateRange[1].format('DD/MM/YYYY')}` : undefined,
      },
    ]);
    const entetes = ['Date', 'Délégué', 'Professionnel', 'Support', 'Durée', 'Minimum', 'Statut'];
    const lignes = journal.map((j) => [
      dayjs(j.datePresentation).format('DD/MM/YYYY HH:mm'),
      j.nomDelegue,
      j.nomProfessionnel,
      j.titreSupport,
      formatDuree(j.dureeTotal),
      formatDuree(j.dureeMinimaleAttendue),
      j.conforme ? 'Conforme' : 'Insuffisante',
    ]);
    const corps = `
      <h1 style="font-size:18px; margin:0;">Suivi des présentations</h1>
      <p style="color:#6B8A82; font-size:13px; margin:4px 0 0;">
        ${resumeFiltres} · Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}
      </p>
      <p style="font-size:13px; margin:16px 0 8px;">
        <strong>${kpis.nb}</strong> présentation(s) · <strong>${Math.round(kpis.taux * 100)} %</strong> conformes ·
        durée moyenne <strong>${formatDuree(kpis.dureeMoyenne)}</strong>
      </p>
      ${construireTableauHtml(entetes, lignes)}
    `;
    imprimerRapport('Suivi des présentations', corps);
  }

  const colonnesDelegues = [
    { title: 'Délégué', dataIndex: 'nomDelegue', key: 'nomDelegue', sorter: (a: SyntheseDeleguePresentation, b: SyntheseDeleguePresentation) => a.nomDelegue.localeCompare(b.nomDelegue) },
    { title: 'Présentations', dataIndex: 'nbPresentations', key: 'nbPresentations', sorter: (a: SyntheseDeleguePresentation, b: SyntheseDeleguePresentation) => a.nbPresentations - b.nbPresentations },
    {
      title: 'Conformes / Non conformes',
      key: 'conformite',
      render: (_: unknown, r: SyntheseDeleguePresentation) => (
        <Text>
          <Text style={{ color: '#0F6E52', fontWeight: 700 }}>{r.nbConformes}</Text> / <Text style={{ color: '#C62828', fontWeight: 700 }}>{r.nbNonConformes}</Text>
        </Text>
      ),
    },
    {
      title: 'Taux de conformité',
      key: 'taux',
      sorter: (a: SyntheseDeleguePresentation, b: SyntheseDeleguePresentation) => a.tauxConformite - b.tauxConformite,
      render: (_: unknown, r: SyntheseDeleguePresentation) =>
        r.nbPresentations === 0 ? (
          <Text type="secondary">Aucune présentation</Text>
        ) : (
          <Progress percent={Math.round(r.tauxConformite * 100)} size="small" strokeColor={couleurTaux(r.tauxConformite)} style={{ maxWidth: 140 }} />
        ),
    },
    {
      title: 'Durée moyenne',
      key: 'dureeMoyenne',
      sorter: (a: SyntheseDeleguePresentation, b: SyntheseDeleguePresentation) => a.dureeMoyenneSecondes - b.dureeMoyenneSecondes,
      render: (_: unknown, r: SyntheseDeleguePresentation) => (r.nbPresentations === 0 ? '—' : formatDuree(r.dureeMoyenneSecondes)),
    },
  ];

  const colonnesSupports = [
    { title: 'Support', dataIndex: 'titreSupport', key: 'titreSupport' },
    { title: 'Présentations', dataIndex: 'nbPresentations', key: 'nbPresentations', sorter: (a: SyntheseSupportPresentation, b: SyntheseSupportPresentation) => a.nbPresentations - b.nbPresentations },
    {
      title: 'Taux de conformité',
      key: 'taux',
      sorter: (a: SyntheseSupportPresentation, b: SyntheseSupportPresentation) => a.tauxConformite - b.tauxConformite,
      render: (_: unknown, r: SyntheseSupportPresentation) => (
        <Progress percent={Math.round(r.tauxConformite * 100)} size="small" strokeColor={couleurTaux(r.tauxConformite)} style={{ maxWidth: 140 }} />
      ),
    },
    {
      title: 'Durée moyenne',
      dataIndex: 'dureeMoyenneSecondes',
      key: 'dureeMoyenne',
      render: (v: number) => formatDuree(v),
    },
  ];

  const colonnesJournal = [
    {
      title: 'Date',
      dataIndex: 'datePresentation',
      key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
      sorter: (a: MetriquePresentationLigne, b: MetriquePresentationLigne) => a.datePresentation.localeCompare(b.datePresentation),
      defaultSortOrder: 'descend' as const,
    },
    { title: 'Délégué', dataIndex: 'nomDelegue', key: 'nomDelegue' },
    { title: 'Professionnel', dataIndex: 'nomProfessionnel', key: 'nomProfessionnel' },
    { title: 'Support', dataIndex: 'titreSupport', key: 'titreSupport' },
    {
      title: 'Durée / minimum',
      key: 'duree',
      render: (_: unknown, r: MetriquePresentationLigne) => (
        <Text>
          {formatDuree(r.dureeTotal)} <Text type="secondary">/ {formatDuree(r.dureeMinimaleAttendue)}</Text>
        </Text>
      ),
    },
    { title: 'Statut', key: 'statut', render: (_: unknown, r: MetriquePresentationLigne) => tagConformite(r.conforme) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Temps passé par chaque délégué sur chaque support présenté, comparé au minimum attendu (nombre de slides × temps moyen par slide, paramétré dans Paramètres → Présentation).
        </Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <PrinterButton onClick={handleImprimer} disabled={journal.length === 0} />
          {!isDelegue && (
            <Select
              placeholder="Tous les délégués"
              allowClear
              style={{ width: 180 }}
              value={filterDelegueId}
              onChange={setFilterDelegueId}
              options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
            />
          )}
          <Select
            placeholder="Tous les supports"
            allowClear
            style={{ width: 200 }}
            value={filterSupportId}
            onChange={setFilterSupportId}
            options={supports.map((s) => ({ value: s.id, label: s.titre }))}
          />
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Date début', 'Date fin']}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
          />
        </div>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<ClockCircleOutlined />} label="Présentations" value={kpis.nb} accent="#1565C0" bg="#E3F2FD" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<CheckCircleOutlined />} label="Taux de conformité" value={Math.round(kpis.taux * 100)} suffix="%" accent={couleurTaux(kpis.taux)} bg="#E8F5E9" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<ClockCircleOutlined />} label="Durée moyenne" value={formatDuree(kpis.dureeMoyenne)} accent="#6A1B9A" bg="#F3E5F5" />
        </Col>
        {!isDelegue && (
          <Col xs={24} sm={12} md={6}>
            <MiniKpi loading={loading} icon={<WarningOutlined />} label="Délégués sans présentation" value={kpis.deleguesInactifs} accent="#E65100" bg="#FFF3E0" />
          </Col>
        )}
      </Row>

      <ProCard title="Tendance de conformité (12 dernières semaines)" bordered style={{ borderRadius: 12, marginBottom: 16 }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <SimpleBarChart
            data={tendance.map((t) => ({ label: t.semaine.replace(/^\d{4}-W/, 'S'), value: Math.round(t.tauxConformite * 100) }))}
            unit="%"
            emptyText="Aucune présentation sur cette période."
          />
        )}
      </ProCard>

      {!isDelegue && (
        <ProCard title="Conformité par délégué" bordered style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
          <Table<SyntheseDeleguePresentation>
            dataSource={syntheseDelegues}
            columns={colonnesDelegues}
            rowKey="delegueId"
            loading={loading}
            pagination={false}
            size="middle"
          />
        </ProCard>
      )}

      <ProCard
        title="Conformité par support"
        bordered
        style={{ borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table<SyntheseSupportPresentation>
          dataSource={syntheseSupports}
          columns={colonnesSupports}
          rowKey="supportId"
          loading={loading}
          pagination={false}
          size="middle"
          expandable={{
            onExpand: (expanded, r) => expanded && chargerSlidesSupport(r.supportId),
            expandedRowRender: (r) => {
              const slides = slidesParSupport[r.supportId];
              if (!slides) return <Skeleton active paragraph={{ rows: 1 }} />;
              return (
                <div style={{ padding: '8px 16px' }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Temps moyen passé sur chaque slide, toutes présentations de ce support confondues — repère les slides systématiquement survolées.
                  </Text>
                  <SimpleBarChart
                    data={slides.map((s) => ({ label: `S${s.slideIndex + 1}`, value: Math.round(s.dureeMoyenneSecondes) }))}
                    unit="s"
                    barHeight={70}
                  />
                </div>
              );
            },
          }}
        />
      </ProCard>

      <ProCard title="Journal des présentations" bordered style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table<MetriquePresentationLigne>
          dataSource={journal}
          columns={colonnesJournal}
          rowKey="id"
          loading={loading}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          size="middle"
          expandable={{
            expandedRowRender: (r) => (
              <div style={{ padding: '8px 16px' }}>
                <SimpleBarChart data={slidesEnBarData(r.slides)} unit="s" barHeight={70} />
              </div>
            ),
            rowExpandable: (r) => r.slides.length > 0,
          }}
        />
      </ProCard>
    </div>
  );
}

function PrinterButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        padding: '4px 15px',
        background: disabled ? '#f5f5f5' : '#fff',
        color: disabled ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.88)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
      }}
    >
      <PrinterOutlined /> Imprimer / PDF
    </button>
  );
}

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
                <span style={{ fontSize: 14, fontWeight: 500, color: '#5C8079', marginLeft: 3 }}>{suffix}</span>
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
