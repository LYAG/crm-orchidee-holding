'use client';

import { DollarOutlined, HeartOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { App, Col, Row, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatFcfa } from '@/lib/format';
import { UserRole } from '@/lib/constants';
import { professionnelService, rdvService, utilisateurService, zoneService } from '@/services';
import type {
  Centre,
  GesteMarketing,
  GesteRealise,
  ProfessionnelSante,
  RendezVous,
  Specialite,
  Utilisateur,
  Zone,
} from '@/types';
import { RdvStatut, UniteCas } from '@/types';
import { formatPotentielCas } from '../professionnels/utils';

const { Text } = Typography;

function casParSemaine(pc: ProfessionnelSante['potentielCas']): number {
  if (!pc) return 0;
  const base = pc.max != null ? (pc.min + pc.max) / 2 : pc.min;
  const multiplicateur = pc.unite === UniteCas.JOUR ? 7 : pc.unite === UniteCas.SEMAINE ? 1 : 1 / 4.345;
  return base * multiplicateur;
}

interface MiniKpiProps {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  accent: string;
  bg: string;
}

function MiniKpi({ loading, icon, label, value, suffix, accent, bg }: MiniKpiProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E7F3F0', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: accent, flexShrink: 0 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#123832', lineHeight: 1 }}>
              {value}
              {suffix && <span style={{ fontSize: 14, fontWeight: 500, color: '#5C8079', marginLeft: 3 }}>{suffix}</span>}
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>{label}</Text>
          </div>
        </div>
      )}
    </div>
  );
}

export function SuiviProfessionnelsTab() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [zones, setZones] = useState<Zone[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [professionnels, setProfessionnels] = useState<ProfessionnelSante[]>([]);
  const [gestesRealises, setGestesRealises] = useState<GesteRealise[]>([]);
  const [gestesMarketing, setGestesMarketing] = useState<GesteMarketing[]>([]);
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterZoneId, setFilterZoneId] = useState<string | undefined>();
  const [filterCentreId, setFilterCentreId] = useState<string | undefined>();
  const [filterSpecialiteId, setFilterSpecialiteId] = useState<string | undefined>();
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();

  if (!user) return null;
  const currentUser = user;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isManager = currentUser.role === UserRole.MANAGER;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      zoneService.getAll(),
      professionnelService.getCentres(),
      professionnelService.getSpecialites(),
      isManager
        ? utilisateurService.getDeleguesByManager(currentUser.id)
        : utilisateurService.getByRole(UserRole.DELEGUE),
      professionnelService.getProfessionnels(),
      professionnelService.getGestesRealises(),
      professionnelService.getGestesMarketing(),
      rdvService.getAll(),
    ])
      .then(([z, c, s, d, p, gr, gm, r]) => {
        setZones(z);
        setCentres(c);
        setSpecialites(s);
        setDelegues(d);
        setProfessionnels(p);
        setGestesRealises(gr);
        setGestesMarketing(gm);
        setRdvs(r);
      })
      .catch(() => message.error('Erreur lors du chargement des données.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const professionnelsScope = useMemo(() => {
    let result = professionnels;
    if (currentUser.role === UserRole.DELEGUE) {
      result = result.filter((p) => p.delegueId === currentUser.id);
    } else if (isManager) {
      const mesDelegues = new Set(delegues.map((d) => d.id));
      result = result.filter((p) => mesDelegues.has(p.delegueId));
    }
    if (filterDelegueId) result = result.filter((p) => p.delegueId === filterDelegueId);
    if (filterSpecialiteId) result = result.filter((p) => p.specialiteIds.includes(filterSpecialiteId));
    if (filterCentreId) result = result.filter((p) => p.centreId === filterCentreId);
    if (filterZoneId) {
      const centreIds = new Set(centres.filter((c) => c.zoneId === filterZoneId).map((c) => c.id));
      result = result.filter((p) => centreIds.has(p.centreId));
    }
    return result;
  }, [professionnels, currentUser, isManager, delegues, filterDelegueId, filterSpecialiteId, filterCentreId, filterZoneId, centres]);

  const il30j = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const dernierContactParPro = useMemo(() => {
    const map = new Map<string, string>();
    gestesRealises.forEach((g) => {
      if (!map.has(g.professionnelId) || g.date > map.get(g.professionnelId)!) map.set(g.professionnelId, g.date);
    });
    rdvs.forEach((r) => {
      if (!r.professionnelId) return;
      const date = r.dateHeure.slice(0, 10);
      if (!map.has(r.professionnelId) || date > map.get(r.professionnelId)!) map.set(r.professionnelId, date);
    });
    return map;
  }, [gestesRealises, rdvs]);

  const visitesRecentes = useMemo(
    () => new Set(professionnelsScope.filter((p) => (dernierContactParPro.get(p.id) ?? '') >= il30j).map((p) => p.id)),
    [professionnelsScope, dernierContactParPro, il30j],
  );

  const tauxCouverture = professionnelsScope.length > 0 ? Math.round((visitesRecentes.size / professionnelsScope.length) * 100) : 0;

  const couvertureParZone = useMemo(() => {
    const parZone = new Map<string, { total: number; visites: number }>();
    professionnelsScope.forEach((p) => {
      const centre = centres.find((c) => c.id === p.centreId);
      const zone = centre ? zones.find((z) => z.id === centre.zoneId) : undefined;
      const cle = zone?.nom ?? 'Zone inconnue';
      if (!parZone.has(cle)) parZone.set(cle, { total: 0, visites: 0 });
      const entry = parZone.get(cle)!;
      entry.total++;
      if (visitesRecentes.has(p.id)) entry.visites++;
    });
    return [...parZone.entries()].map(([zone, v]) => ({ zone, ...v, pct: v.total > 0 ? Math.round((v.visites / v.total) * 100) : 0 }));
  }, [professionnelsScope, centres, zones, visitesRecentes]);

  const potentielParCentre = useMemo(() => {
    const parCentre = new Map<string, { centre: Centre; zoneNom: string; potentiel: number; visites: number; total: number }>();
    professionnelsScope.forEach((p) => {
      const centre = centres.find((c) => c.id === p.centreId);
      if (!centre) return;
      const zoneNom = zones.find((z) => z.id === centre.zoneId)?.nom ?? '';
      if (!parCentre.has(centre.id)) parCentre.set(centre.id, { centre, zoneNom, potentiel: 0, visites: 0, total: 0 });
      const entry = parCentre.get(centre.id)!;
      entry.potentiel += casParSemaine(p.potentielCas);
      entry.total++;
      if (visitesRecentes.has(p.id)) entry.visites++;
    });
    return [...parCentre.values()].sort((a, b) => b.potentiel - a.potentiel);
  }, [professionnelsScope, centres, zones, visitesRecentes]);

  const maxPotentiel = Math.max(...potentielParCentre.map((c) => c.potentiel), 1);

  const gestesScope = useMemo(() => {
    const idsScope = new Set(professionnelsScope.map((p) => p.id));
    return gestesRealises.filter((g) => idsScope.has(g.professionnelId));
  }, [gestesRealises, professionnelsScope]);

  const coutTotalFcfa = gestesScope.reduce((s, g) => s + (g.coutFcfa ?? 0), 0);
  const coutMoyenParProfessionnel = professionnelsScope.length > 0 ? Math.round(coutTotalFcfa / professionnelsScope.length) : 0;

  const topGestes = useMemo(() => {
    const compte = new Map<string, { nb: number; cout: number }>();
    gestesScope.forEach((g) => {
      if (!compte.has(g.gesteMarketingId)) compte.set(g.gesteMarketingId, { nb: 0, cout: 0 });
      const e = compte.get(g.gesteMarketingId)!;
      e.nb++;
      e.cout += g.coutFcfa ?? 0;
    });
    return [...compte.entries()]
      .map(([id, v]) => ({ libelle: gestesMarketing.find((g) => g.id === id)?.libelle ?? id, ...v }))
      .sort((a, b) => b.nb - a.nb)
      .slice(0, 5);
  }, [gestesScope, gestesMarketing]);

  const ratioParProfessionnel = useMemo(() => {
    return professionnelsScope
      .map((p) => {
        const coutPro = gestesRealises.filter((g) => g.professionnelId === p.id).reduce((s, g) => s + (g.coutFcfa ?? 0), 0);
        const rdvRealises = rdvs.filter((r) => r.professionnelId === p.id && r.statut === RdvStatut.REALISE).length;
        const centre = centres.find((c) => c.id === p.centreId);
        return {
          professionnel: p,
          centreNom: centre?.nom ?? '—',
          coutPro,
          rdvRealises,
          ratio: rdvRealises > 0 ? Math.round(coutPro / rdvRealises) : coutPro > 0 ? coutPro : 0,
        };
      })
      .filter((r) => r.coutPro > 0 || r.rdvRealises > 0)
      .sort((a, b) => b.coutPro - a.coutPro);
  }, [professionnelsScope, gestesRealises, rdvs, centres]);

  return (
    <div>
      {/* Filtres croisés */}
      <ProCard bordered style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '14px 20px' }}>
        <Space wrap>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#1F4E45' }}>Filtres :</Text>
          {isAdmin && (
            <Select placeholder="Zone" allowClear style={{ width: 150 }} value={filterZoneId} onChange={setFilterZoneId} options={zones.map((z) => ({ value: z.id, label: z.nom }))} />
          )}
          <Select placeholder="Centre" allowClear style={{ width: 170 }} value={filterCentreId} onChange={setFilterCentreId} options={centres.map((c) => ({ value: c.id, label: c.nom }))} />
          <Select placeholder="Spécialité" allowClear style={{ width: 170 }} value={filterSpecialiteId} onChange={setFilterSpecialiteId} options={specialites.map((s) => ({ value: s.id, label: s.libelle }))} />
          {currentUser.role !== UserRole.DELEGUE && (
            <Select placeholder="Délégué" allowClear style={{ width: 170 }} value={filterDelegueId} onChange={setFilterDelegueId} options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))} />
          )}
        </Space>
      </ProCard>

      {/* KPI globaux */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<HeartOutlined />} label="Couverture (30 derniers jours)" value={tauxCouverture} suffix="%" accent="#0F6E52" bg="#E8F5E9" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<TeamOutlined />} label="Professionnels suivis" value={professionnelsScope.length} accent="#1565C0" bg="#E3F2FD" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<DollarOutlined />} label="Investissement gestes" value={formatFcfa(coutTotalFcfa)} accent="#E65100" bg="#FFF3E0" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <MiniKpi loading={loading} icon={<RiseOutlined />} label="Coût moyen / professionnel" value={formatFcfa(coutMoyenParProfessionnel)} accent="#6A1B9A" bg="#F3E5F5" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Couverture par zone */}
        <Col xs={24} lg={12}>
          <ProCard title="Couverture par zone" bordered style={{ borderRadius: 12, height: '100%' }}>
            <Table
              size="small"
              loading={loading}
              pagination={false}
              dataSource={couvertureParZone}
              rowKey="zone"
              columns={[
                { title: 'Zone', dataIndex: 'zone' },
                { title: 'Visités / Total', render: (_, r) => `${r.visites} / ${r.total}` },
                {
                  title: 'Couverture',
                  render: (_, r) => (
                    <Tag color={r.pct >= 70 ? 'green' : r.pct >= 40 ? 'orange' : 'red'} style={{ borderRadius: 6 }}>
                      {r.pct}%
                    </Tag>
                  ),
                },
              ]}
            />
          </ProCard>
        </Col>

        {/* Top gestes */}
        <Col xs={24} lg={12}>
          <ProCard title="Top 5 des gestes utilisés" bordered style={{ borderRadius: 12, height: '100%' }}>
            <Table
              size="small"
              loading={loading}
              pagination={false}
              dataSource={topGestes}
              rowKey="libelle"
              columns={[
                { title: 'Geste', dataIndex: 'libelle' },
                { title: 'Nombre', dataIndex: 'nb' },
                { title: 'Coût cumulé', render: (_, r) => formatFcfa(r.cout) },
              ]}
            />
          </ProCard>
        </Col>

        {/* Potentiel par centre (carte de chaleur simplifiée) */}
        <Col xs={24}>
          <ProCard title="Potentiel par centre — centres à fort potentiel peu visités en évidence" bordered style={{ borderRadius: 12 }}>
            <Table
              size="small"
              loading={loading}
              pagination={{ pageSize: 8 }}
              dataSource={potentielParCentre}
              rowKey={(r) => r.centre.id}
              columns={[
                { title: 'Centre', render: (_, r) => r.centre.nom },
                { title: 'Zone', dataIndex: 'zoneNom' },
                {
                  title: 'Potentiel (cas/semaine)',
                  render: (_, r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 100, height: 8, borderRadius: 4, background: '#EEF5F3', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (r.potentiel / maxPotentiel) * 100)}%`, height: '100%', background: '#0F6E52' }} />
                      </div>
                      <Text>{Math.round(r.potentiel)}</Text>
                    </div>
                  ),
                },
                { title: 'Visités / Total', render: (_, r) => `${r.visites} / ${r.total}` },
                {
                  title: 'Alerte',
                  render: (_, r) =>
                    r.potentiel > maxPotentiel * 0.4 && r.visites === 0 ? (
                      <Tag color="red" style={{ borderRadius: 6 }}>
                        Fort potentiel non visité
                      </Tag>
                    ) : (
                      '—'
                    ),
                },
              ]}
            />
          </ProCard>
        </Col>

        {/* Ratio investissement / activité */}
        <Col xs={24}>
          <ProCard title="Investissement vs activité par professionnel" bordered style={{ borderRadius: 12 }}>
            <Table
              size="small"
              loading={loading}
              pagination={{ pageSize: 8 }}
              dataSource={ratioParProfessionnel}
              rowKey={(r) => r.professionnel.id}
              columns={[
                {
                  title: 'Professionnel',
                  render: (_, r) => (
                    <span>
                      {r.professionnel.titre ? `${r.professionnel.titre} ` : ''}
                      {r.professionnel.nom} {r.professionnel.prenom ?? ''}
                    </span>
                  ),
                },
                { title: 'Centre', dataIndex: 'centreNom' },
                { title: 'Coût gestes', render: (_, r) => formatFcfa(r.coutPro) },
                { title: 'RDV réalisés', dataIndex: 'rdvRealises' },
                {
                  title: 'Coût / RDV réalisé',
                  render: (_, r) => (r.rdvRealises > 0 ? formatFcfa(Math.round(r.coutPro / r.rdvRealises)) : <Text type="secondary">—</Text>),
                },
                {
                  title: 'Potentiel',
                  render: (_, r) => (r.professionnel.potentielCas ? formatPotentielCas(r.professionnel.potentielCas) : '—'),
                },
              ]}
            />
          </ProCard>
        </Col>
      </Row>
    </div>
  );
}
