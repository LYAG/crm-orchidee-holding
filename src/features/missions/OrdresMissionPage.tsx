'use client';

import { EyeOutlined, FileSearchOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { App, Button, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useZoneFilter } from '@/components/ZoneFilterContext';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { formatFcfa } from '@/lib/format';
import { ordreMissionService, utilisateurService, zoneService } from '@/services';
import { StatutOrdreMission } from '@/types';
import type { FiltresOrdreMission, KpiOrdresMission as Kpi, OrdreMission, Utilisateur, Zone } from '@/types';
import { STATUT_MISSION_CONFIG, STATUTS_MISSION_ORDONNES } from './constants';
import { KpiOrdresMission } from './KpiOrdresMission';

const { Text } = Typography;

type FiltresKpi = Omit<FiltresOrdreMission, 'statut'>;

export function OrdresMissionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const { zoneFiltreId } = useZoneFilter();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const formRef = useRef<ProFormInstance | undefined>(undefined);

  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const derniersFiltresKpi = useRef<string | null>(null);

  const isManager = user?.role === UserRole.MANAGER;

  // GET /utilisateurs est réservé à l'ADMIN : un MANAGER passe par /managers/{id}/delegues.
  useEffect(() => {
    if (!user) return;
    const fn = isManager
      ? utilisateurService.getDeleguesByManager(user.id)
      : utilisateurService.getByRole(UserRole.DELEGUE);
    fn.then(setDelegues).catch(() => {});
    zoneService.getAll().then(setZones).catch(() => {});
  }, [user, isManager]);

  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z]));

  /** Les KPI ignorent le filtre statut (ils ventilent justement par statut) — rechargés seulement si le reste change. */
  function chargerKpis(filtres: FiltresKpi) {
    const cle = JSON.stringify(filtres);
    if (cle === derniersFiltresKpi.current) return;
    derniersFiltresKpi.current = cle;
    setKpiLoading(true);
    ordreMissionService
      .getKpis(filtres)
      .then(setKpi)
      .catch((err) => message.error(err instanceof Error ? err.message : 'Impossible de charger les indicateurs.'))
      .finally(() => setKpiLoading(false));
  }

  function afficherAValider() {
    formRef.current?.setFieldsValue({ statut: StatutOrdreMission.SOUMIS });
    formRef.current?.submit();
  }

  const columns: ProColumns<OrdreMission>[] = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      search: false,
      render: (_, m) => <Text strong>{m.reference}</Text>,
    },
    {
      title: 'Délégué',
      dataIndex: 'delegueId',
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        optionFilterProp: 'label',
        options: delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` })),
      },
      render: (_, m) => m.nomDelegue,
    },
    {
      title: 'Objet',
      dataIndex: 'objet',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'typeMissionLibelle',
      search: false,
      render: (_, m) => <Tag style={{ borderRadius: 6 }}>{m.typeMissionLibelle}</Tag>,
    },
    {
      title: 'Zone(s)',
      dataIndex: 'zoneId',
      valueType: 'select',
      fieldProps: { options: zones.map((z) => ({ value: z.id, label: z.nom })) },
      render: (_, m) => m.zoneIds.map((id) => zoneMap[id]?.nom ?? id).join(', ') || '—',
    },
    {
      title: 'Période',
      dataIndex: 'periode',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value: [string, string]) => ({ dateDebut: value[0], dateFin: value[1] }),
      },
    },
    {
      title: 'Dates',
      dataIndex: 'dateDebut',
      search: false,
      render: (_, m) =>
        `${dayjs(m.dateDebut).format('DD/MM/YYYY')} → ${dayjs(m.dateFin).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Budget estimé',
      dataIndex: 'budgetTotal',
      search: false,
      align: 'right',
      render: (_, m) => formatFcfa(m.budgetTotal),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        STATUTS_MISSION_ORDONNES.map((s) => [s, { text: STATUT_MISSION_CONFIG[s].label }]),
      ),
      render: (_, m) => (
        <Tag color={STATUT_MISSION_CONFIG[m.statut].color} style={{ borderRadius: 6 }}>
          {STATUT_MISSION_CONFIG[m.statut].label}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, m) => [
        <Button
          key="voir"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/ordres-mission/${m.id}`);
          }}
        >
          {m.statut === StatutOrdreMission.SOUMIS ? 'Traiter' : 'Voir'}
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer
      title="Ordres de mission"
      subTitle={
        isManager ? 'Missions soumises par les délégués de votre équipe' : 'Toutes les missions des délégués'
      }
    >
      <KpiOrdresMission kpi={kpi} loading={kpiLoading} />

      <ProTable<OrdreMission>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        // Le filtre de zone global du header s'applique tant que le formulaire n'en précise pas un autre.
        params={{ zoneFiltreId }}
        request={async (params) => {
          const filtres: FiltresOrdreMission = {
            delegueId: params.delegueId as string | undefined,
            zoneId: (params.zoneId as string | undefined) ?? zoneFiltreId,
            statut: params.statut as StatutOrdreMission | undefined,
            dateDebut: params.dateDebut as string | undefined,
            dateFin: params.dateFin as string | undefined,
          };
          const { statut: _statut, ...filtresKpi } = filtres;
          chargerKpis(filtresKpi);
          try {
            const page = (params.current ?? 1) - 1;
            const resultat = await ordreMissionService.getPagine(filtres, page, params.pageSize ?? 10);
            return { data: resultat.contenu, success: true, total: resultat.total };
          } catch (err) {
            message.error(err instanceof Error ? err.message : 'Impossible de charger les ordres de mission.');
            return { data: [], success: false, total: 0 };
          }
        }}
        onRow={(m) => ({ onClick: () => router.push(`/ordres-mission/${m.id}`), style: { cursor: 'pointer' } })}
        search={{ labelWidth: 'auto' }}
        pagination={{ defaultPageSize: 10 }}
        toolBarRender={() => [
          <Button key="a-valider" icon={<FileSearchOutlined />} onClick={afficherAValider}>
            À valider
            {kpi ? ` (${kpi.parStatut[StatutOrdreMission.SOUMIS] ?? 0})` : ''}
          </Button>,
        ]}
      />
    </PageContainer>
  );
}
