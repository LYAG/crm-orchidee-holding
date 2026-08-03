'use client';

import { PhoneOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Avatar, Button, Space, Tag, Tooltip } from 'antd';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, utilisateurService, zoneService } from '@/services';
import type { Centre, GesteRealise, ProfessionnelSante, Specialite, Utilisateur, Zone } from '@/types';
import { JourSemaine } from '@/types';
import { ProfessionnelDrawer } from './ProfessionnelDrawer';
import { ProfessionnelFormModal } from './ProfessionnelFormModal';
import { JOUR_LABELS, formatJoursConsultation, formatPotentielCas } from './utils';

export function ProfessionnelsPage() {
  const { user } = useAuth();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [centres, setCentres] = useState<Centre[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [dernierGesteMap, setDernierGesteMap] = useState<Record<string, GesteRealise>>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ProfessionnelSante | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    professionnelService.getCentres().then(setCentres).catch(() => {});
    zoneService.getAll().then(setZones).catch(() => {});
    professionnelService.getSpecialites().then(setSpecialites).catch(() => {});
    utilisateurService.getByRole(UserRole.DELEGUE).then(setDelegues).catch(() => {});
    professionnelService.getGestesRealises().then((gestes) => {
      const map: Record<string, GesteRealise> = {};
      gestes.forEach((g) => {
        if (!map[g.professionnelId] || g.date > map[g.professionnelId].date) {
          map[g.professionnelId] = g;
        }
      });
      setDernierGesteMap(map);
    });
  }, []);

  if (!user) return null;
  const currentUser = user;
  const role = currentUser.role as UserRole;

  function centreEtZone(centreId: string) {
    const centre = centres.find((c) => c.id === centreId);
    const zone = centre ? zones.find((z) => z.id === centre.zoneId) : undefined;
    return { centre, zone };
  }

  function openDetail(pro: ProfessionnelSante) {
    setSelected(pro);
    setDrawerOpen(true);
  }

  const columns: ProColumns<ProfessionnelSante>[] = [
    {
      title: 'Professionnel',
      dataIndex: 'nom',
      render: (_, p) => {
        const initiales = `${p.nom[0]}${p.prenom ? p.prenom[0] : ''}`.toUpperCase();
        return (
          <Space size={10} style={{ cursor: 'pointer' }} onClick={() => openDetail(p)}>
            <Avatar size={34} style={{ background: '#E8F5E9', color: '#2E6B5B', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {initiales}
            </Avatar>
            <Space direction="vertical" size={0}>
              <strong style={{ color: '#123832' }}>
                {p.titre ? `${p.titre} ` : ''}
                {p.nom} {p.prenom ?? ''}
              </strong>
              <span style={{ color: '#8FB0A8', fontSize: 12 }}>
                {p.telephones[0] && (
                  <>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    <a href={`tel:${p.telephones[0]}`} onClick={(e) => e.stopPropagation()}>
                      {p.telephones[0]}
                    </a>
                  </>
                )}
              </span>
            </Space>
          </Space>
        );
      },
      search: false,
    },
    {
      title: 'Centre',
      dataIndex: 'centreId',
      valueEnum: Object.fromEntries(centres.map((c) => [c.id, { text: c.nom }])),
      render: (_, p) => {
        const { centre, zone } = centreEtZone(p.centreId);
        return (
          <Space direction="vertical" size={0}>
            <span>{centre?.nom ?? p.centreId}</span>
            <span style={{ color: '#8FB0A8', fontSize: 11 }}>{zone?.nom}</span>
          </Space>
        );
      },
    },
    {
      title: 'Spécialités',
      dataIndex: 'specialiteIds',
      valueEnum: Object.fromEntries(specialites.map((s) => [s.id, { text: s.libelle }])),
      render: (_, p) => (
        <Space size={4} wrap>
          {p.specialiteIds.map((sid) => (
            <Tag key={sid} color="green" style={{ borderRadius: 6 }}>
              {specialites.find((s) => s.id === sid)?.code ?? sid}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Jours de consultation',
      dataIndex: 'jourConsultation',
      valueEnum: Object.fromEntries(Object.values(JourSemaine).map((j) => [j, { text: JOUR_LABELS[j] }])),
      render: (_, p) => <span style={{ fontSize: 12 }}>{formatJoursConsultation(p.joursConsultation)}</span>,
    },
    {
      title: 'Potentiel',
      dataIndex: 'potentiel',
      search: false,
      render: (_, p) => <span style={{ fontSize: 12 }}>{formatPotentielCas(p.potentielCas)}</span>,
    },
    {
      title: 'Dernier geste',
      dataIndex: 'dernierGeste',
      search: false,
      render: (_, p) => {
        const g = dernierGesteMap[p.id];
        return g ? <span style={{ fontSize: 12, color: '#123832' }}>{g.date}</span> : <span style={{ color: '#C7DAD5' }}>—</span>;
      },
    },
  ];

  if (role !== UserRole.DELEGUE) {
    columns.splice(1, 0, {
      title: 'Délégué',
      dataIndex: 'delegueId',
      valueEnum: Object.fromEntries(delegues.map((d) => [d.id, { text: `${d.prenom} ${d.nom}` }])),
      render: (_, p) => {
        const d = delegues.find((u) => u.id === p.delegueId);
        return d ? `${d.prenom} ${d.nom}` : '—';
      },
      hideInSearch: role !== UserRole.MANAGER && role !== UserRole.ADMIN,
    });
  }

  async function loadData(params: Record<string, unknown>) {
    let data = await professionnelService.getProfessionnels({
      centreId: params.centreId as string | undefined,
      specialiteId: params.specialiteIds as string | undefined,
      jourConsultation: params.jourConsultation as JourSemaine | undefined,
      delegueId: params.delegueId as string | undefined,
    });

    if (role === UserRole.DELEGUE) {
      data = data.filter((p) => p.delegueId === currentUser.id);
    } else if (role === UserRole.MANAGER) {
      const myDelegueIds = currentUser.delegueIds ?? [];
      data = data.filter((p) => myDelegueIds.includes(p.delegueId));
    }

    return { data, success: true, total: data.length };
  }

  return (
    <PageContainer title="Professionnels de santé" subTitle="Médecins, sages-femmes, infirmiers suivis">
      <ProTable<ProfessionnelSante>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={loadData}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        toolBarRender={() => [
          <Tooltip key="tip" title="Créer une fiche professionnel de santé">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Nouveau professionnel
            </Button>
          </Tooltip>,
          role === UserRole.DELEGUE && (
            <Link key="import" href="/professionnels/import">
              <Button icon={<UploadOutlined />}>Importer Excel</Button>
            </Link>
          ),
        ].filter(Boolean)}
      />

      <ProfessionnelDrawer
        open={drawerOpen}
        professionnel={selected}
        onClose={() => setDrawerOpen(false)}
        onChanged={() => actionRef.current?.reload()}
      />

      <ProfessionnelFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDelegueId={role === UserRole.DELEGUE ? user.id : undefined}
        onSuccess={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
}
