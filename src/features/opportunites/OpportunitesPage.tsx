'use client';

import { AppstoreOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Progress, Radio, Select, Tag } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { opportuniteService, professionnelService, utilisateurService } from '@/services';
import { OpportuniteEtape } from '@/types';
import type { Opportunite, ProfessionnelSante, Utilisateur } from '@/types';
import { ETAPE_MAP, ETAPES_CONFIG } from './constants';
import { NouvelleOpportuniteDrawer } from './NouvelleOpportuniteDrawer';
import { OpportuniteDetailDrawer } from './OpportuniteDetailDrawer';
import { OpportuniteKanban } from './OpportuniteKanban';

type ViewMode = 'table' | 'kanban';

export function OpportunitesPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const tableRef = useRef<ActionType | undefined>(undefined);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [allOpps, setAllOpps] = useState<Opportunite[]>([]);
  const [professionnelMap, setProfessionnelMap] = useState<Record<string, ProfessionnelSante>>({});
  const [utilisateurMap, setUtilisateurMap] = useState<Record<string, Utilisateur>>({});
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();
  const [filterEtape, setFilterEtape] = useState<OpportuniteEtape | undefined>();
  const [selectedOpp, setSelectedOpp] = useState<Opportunite | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newOppOpen, setNewOppOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculés avant les hooks (avec chaînage optionnel) pour que ceux-ci restent appelés
  // inconditionnellement — le garde-fou `if (!user) return null;` vient après tous les hooks.
  const role = user?.role as UserRole | undefined;
  const isDelegue = role === UserRole.DELEGUE;
  const effectiveDelegueId = isDelegue ? user?.id : filterDelegueId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filtres = {
        etape: filterEtape,
        delegueId: effectiveDelegueId,
      };
      const opps = await opportuniteService.getAll(filtres);
      setAllOpps(opps);

      // Build professionnel map
      const pIds = [...new Set(opps.map((o) => o.professionnelId))];
      const pList = await Promise.all(pIds.map((id) => professionnelService.getProfessionnelById(id).catch(() => null)));
      const pm: Record<string, ProfessionnelSante> = {};
      pList.forEach((p) => { if (p) pm[p.id] = p; });
      setProfessionnelMap(pm);
    } catch {
      message.error('Erreur lors du chargement des opportunités.');
    } finally {
      setLoading(false);
    }
  }, [effectiveDelegueId, filterEtape, message]);

  // La vue Kanban a besoin de l'ensemble des opportunités filtrées ; la vue Tableau
  // se charge elle-même via son propre `request` paginé (loadTableData ci-dessous).
  useEffect(() => {
    if (viewMode !== 'kanban') return;
    queueMicrotask(() => {
      load();
    });
  }, [viewMode, load]);

  // Load delegues + utilisateur map for MANAGER/ADMIN
  useEffect(() => {
    if (!user || isDelegue) return;
    const fn =
      role === UserRole.MANAGER
        ? utilisateurService.getDeleguesByManager(user.id)
        : utilisateurService.getByRole(UserRole.DELEGUE);
    fn.then((d) => {
      setDelegues(d);
      const um: Record<string, Utilisateur> = {};
      d.forEach((u) => { um[u.id] = u; });
      setUtilisateurMap(um);
    }).catch(() => {});
  }, [role, user, isDelegue]);

  if (!user) return null;

  async function handleEtapeChange(oppId: string, etape: OpportuniteEtape) {
    try {
      let updated: Opportunite;
      if (etape === OpportuniteEtape.GAGNEE) {
        updated = await opportuniteService.marquerGagnee(oppId);
        message.success('Opportunité gagnée.');
      } else if (etape === OpportuniteEtape.PERDUE) {
        // Can't easily prompt for motif here; open detail instead
        setSelectedOpp(allOpps.find((o) => o.id === oppId) ?? null);
        setDetailOpen(true);
        return;
      } else {
        updated = await opportuniteService.changerEtape(oppId, etape);
        message.success(`Étape mise à jour : ${ETAPE_MAP[etape].label}.`);
      }
      setAllOpps((prev) => prev.map((o) => (o.id === oppId ? updated : o)));
      if (selectedOpp?.id === oppId) setSelectedOpp(updated);
      tableRef.current?.reload();
    } catch {
      message.error('Erreur lors du changement d\'étape.');
    }
  }

  function handleUpdate(updated: Opportunite) {
    setAllOpps((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOpp(updated);
    tableRef.current?.reload();
  }

  async function loadTableData(params: Record<string, unknown> & { current?: number; pageSize?: number }) {
    const page = (params.current ?? 1) - 1;
    const pageSize = params.pageSize ?? 20;
    const resultat = await opportuniteService.getAllPagine(
      { etape: filterEtape, delegueId: effectiveDelegueId },
      page,
      pageSize,
    );

    const idsManquants = [...new Set(resultat.contenu.map((o) => o.professionnelId))].filter(
      (id) => !professionnelMap[id],
    );
    if (idsManquants.length > 0) {
      const pList = await Promise.all(
        idsManquants.map((id) => professionnelService.getProfessionnelById(id).catch(() => null)),
      );
      setProfessionnelMap((prev) => {
        const next = { ...prev };
        pList.forEach((p) => { if (p) next[p.id] = p; });
        return next;
      });
    }

    return { data: resultat.contenu, success: true, total: resultat.total };
  }

  const columns: ProColumns<Opportunite>[] = [
    {
      title: 'Titre',
      dataIndex: 'titre',
      ellipsis: true,
      render: (_, opp) => (
        <a onClick={() => { setSelectedOpp(opp); setDetailOpen(true); }}>
          {opp.titre}
        </a>
      ),
    },
    {
      title: 'Professionnel de santé',
      key: 'professionnel',
      render: (_, opp) => {
        const p = professionnelMap[opp.professionnelId];
        return p ? `${p.titre ? p.titre + ' ' : ''}${p.nom} ${p.prenom ?? ''}` : '—';
      },
    },
    {
      title: 'Montant',
      dataIndex: 'montantEstime',
      sorter: (a, b) => a.montantEstime - b.montantEstime,
      render: (_dom, opp) => `${opp.montantEstime.toLocaleString('fr-FR')} €`,
    },
    {
      title: 'Probabilité',
      dataIndex: 'probabilite',
      render: (_dom, opp) => (
        <Progress percent={opp.probabilite} size="small" style={{ marginBottom: 0, width: 100 }} />
      ),
    },
    {
      title: 'Étape',
      dataIndex: 'etape',
      render: (_dom, opp) => (
        <Tag color={ETAPE_MAP[opp.etape].tagColor}>{ETAPE_MAP[opp.etape].label}</Tag>
      ),
    },
    {
      title: 'Délégué',
      key: 'delegue',
      hideInTable: isDelegue,
      render: (_dom, opp) => {
        const u = utilisateurMap[opp.delegueId];
        return u ? `${u.prenom} ${u.nom}` : opp.delegueId;
      },
    },
    {
      title: 'Dernière MAJ',
      dataIndex: 'dateDerniereMaj',
      sorter: (a, b) => a.dateDerniereMaj.localeCompare(b.dateDerniereMaj),
      render: (_dom, opp) => new Date(opp.dateDerniereMaj).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, opp) => (
        <Button
          size="small"
          type="link"
          onClick={() => { setSelectedOpp(opp); setDetailOpen(true); }}
        >
          Détail
        </Button>
      ),
    },
  ];

  const toolbarExtras = [
    !isDelegue && delegues.length > 0 && (
      <Select
        key="delegue-filter"
        placeholder="Tous les délégués"
        allowClear
        style={{ width: 180 }}
        value={filterDelegueId}
        onChange={setFilterDelegueId}
        options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
      />
    ),
    <Select
      key="etape-filter"
      placeholder="Toutes les étapes"
      allowClear
      style={{ width: 160 }}
      value={filterEtape}
      onChange={setFilterEtape}
      options={ETAPES_CONFIG.map((e) => ({ value: e.key, label: e.label }))}
    />,
    <Radio.Group
      key="view-toggle"
      value={viewMode}
      onChange={(e) => setViewMode(e.target.value)}
      buttonStyle="solid"
      size="small"
    >
      <Radio.Button value="kanban"><AppstoreOutlined /> Kanban</Radio.Button>
      <Radio.Button value="table"><TableOutlined /> Tableau</Radio.Button>
    </Radio.Group>,
    <Button
      key="new"
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => setNewOppOpen(true)}
    >
      Nouvelle opportunité
    </Button>,
  ].filter(Boolean);

  return (
    <PageContainer title="Opportunités">
      {/* Filters toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {toolbarExtras}
      </div>

      {viewMode === 'kanban' ? (
        loading && allOpps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8FB0A8' }}>Chargement…</div>
        ) : (
          <OpportuniteKanban
            opportunites={allOpps}
            professionnelMap={professionnelMap}
            utilisateurMap={utilisateurMap}
            onSelect={(opp) => { setSelectedOpp(opp); setDetailOpen(true); }}
            onEtapeChange={handleEtapeChange}
          />
        )
      ) : (
        <ProTable<Opportunite>
          actionRef={tableRef}
          request={loadTableData}
          params={{ filterEtape, effectiveDelegueId }}
          columns={columns}
          rowKey="id"
          search={false}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true }}
        />
      )}

      <OpportuniteDetailDrawer
        open={detailOpen}
        opportunite={selectedOpp}
        professionnelMap={professionnelMap}
        utilisateurMap={utilisateurMap}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleUpdate}
      />

      <NouvelleOpportuniteDrawer
        open={newOppOpen}
        onOpenChange={setNewOppOpen}
        onSuccess={(created) => {
          setAllOpps((prev) => [created, ...prev]);
          setNewOppOpen(false);
          tableRef.current?.reload();
        }}
      />
    </PageContainer>
  );
}
