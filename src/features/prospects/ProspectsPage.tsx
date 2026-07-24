'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Avatar, Button, Modal, Space, Tag, Tooltip, message } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { prospectService, utilisateurService, zoneService } from '@/services';
import type { Prospect, Utilisateur, Zone } from '@/types';
import { ProspectStatut } from '@/types';
import { AttributionModal } from './AttributionModal';
import { ImportModal } from './ImportModal';
import { ProspectDrawerForm } from './ProspectDrawerForm';

const STATUT_CONFIG: Record<ProspectStatut, { color: string; bg: string; label: string }> = {
  [ProspectStatut.PNA]: { color: '#E65100', bg: '#FFF3E0', label: 'Non affecté' },
  [ProspectStatut.AFFECTE]: { color: '#1565C0', bg: '#E3F2FD', label: 'Affecté' },
  [ProspectStatut.CLIENT]: { color: '#2E7D32', bg: '#E8F5E9', label: 'Client' },
};

const STATUT_LABELS: Record<ProspectStatut, string> = {
  [ProspectStatut.PNA]: 'Non affecté',
  [ProspectStatut.AFFECTE]: 'Affecté',
  [ProspectStatut.CLIENT]: 'Client',
};

export function ProspectsPage() {
  const { user } = useAuth();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [zones, setZones] = useState<Zone[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [attributionTarget, setAttributionTarget] = useState<Prospect | null>(null);

  useEffect(() => {
    zoneService.getAll().then(setZones).catch(() => {});
    utilisateurService.getByRole(UserRole.DELEGUE).then(setDelegues).catch(() => {});
  }, []);

  if (!user) return null;

  const role = user.role as UserRole;

  const zoneOptions = Object.fromEntries(zones.map((z) => [z.id, { text: z.nom }]));
  const delegueOptions = Object.fromEntries(
    delegues.map((d) => [d.id, { text: `${d.prenom} ${d.nom}` }]),
  );

  const columns: ProColumns<Prospect>[] = [
    {
      title: 'Prospect',
      dataIndex: 'nom',
      render: (_, p) => {
        const initials = `${p.nom[0]}${p.prenom ? p.prenom[0] : ''}`.toUpperCase();
        return (
          <Space size={10}>
            <Avatar
              size={34}
              style={{ background: '#E8F5E9', color: '#4A7A4A', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
            >
              {initials}
            </Avatar>
            <Space direction="vertical" size={0}>
              <strong style={{ color: '#1C3A1C' }}>{p.nom} {p.prenom}</strong>
              <span style={{ color: '#9DB89D', fontSize: 12 }}>{p.entreprise}</span>
            </Space>
          </Space>
        );
      },
      search: false,
    },
    {
      title: 'Zone',
      dataIndex: 'zoneId',
      valueEnum: zoneOptions,
      render: (_, p) => zones.find((z) => z.id === p.zoneId)?.nom ?? p.zoneId,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      valueEnum: Object.fromEntries(
        Object.values(ProspectStatut).map((s) => [s, { text: STATUT_LABELS[s] }]),
      ),
      render: (_, p) => {
        const cfg = STATUT_CONFIG[p.statut];
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: cfg.bg,
              color: cfg.color,
              borderRadius: 5,
              padding: '3px 9px',
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
      title: 'Délégué',
      dataIndex: 'delegueId',
      valueEnum: delegueOptions,
      render: (_, p) => {
        if (!p.delegueId) return <span style={{ color: '#C8D8C8' }}>—</span>;
        const d = delegues.find((u) => u.id === p.delegueId);
        if (!d) return <span style={{ color: '#C8D8C8' }}>—</span>;
        return (
          <Space size={6}>
            <Avatar
              size={24}
              style={{ background: '#E8F5E9', color: '#4A7A4A', fontWeight: 700, fontSize: 10 }}
            >
              {`${d.prenom[0]}${d.nom[0]}`.toUpperCase()}
            </Avatar>
            <span style={{ fontSize: 13, color: '#1C3A1C' }}>{d.prenom} {d.nom}</span>
          </Space>
        );
      },
      hideInSearch: role === UserRole.DELEGUE,
    },
    {
      title: 'Créé le',
      dataIndex: 'dateCreation',
      valueType: 'date',
      search: false,
      sorter: (a, b) => a.dateCreation.localeCompare(b.dateCreation),
    },
    {
      title: 'Dernier contact',
      dataIndex: 'dernierContact',
      valueType: 'date',
      search: false,
      render: (_, p) =>
        p.dernierContact ? p.dernierContact : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, prospect) => {
        const canEdit = !prospect.aEuRdv;
        const editTooltip = prospect.aEuRdv
          ? 'Ce prospect a déjà eu un RDV et ne peut pas être modifié.'
          : '';
        const isPna = prospect.statut === ProspectStatut.PNA;
        const inMyZone = user.zoneIds?.some((z) => z === prospect.zoneId);
        const canAutoAttribuer = role === UserRole.DELEGUE && isPna && inMyZone;

        return [
          // Auto-attribution (délégué sur PNA de sa zone)
          canAutoAttribuer && (
            <Tooltip key="auto" title="M'attribuer ce prospect">
              <Button
                type="link"
                size="small"
                icon={<UserAddOutlined />}
                onClick={async () => {
                  await prospectService.sAutoAttribuer(prospect.id, user.id);
                  message.success('Prospect attribué à vous-même.');
                  actionRef.current?.reload();
                }}
              />
            </Tooltip>
          ),
          // Attribution manuelle (manager/admin)
          (role === UserRole.MANAGER || role === UserRole.ADMIN) && isPna && (
            <Tooltip key="attrib" title="Attribuer à un délégué">
              <Button
                type="link"
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => {
                  setAttributionTarget(prospect);
                  setAttributionOpen(true);
                }}
              />
            </Tooltip>
          ),
          // Édition
          (role === UserRole.DELEGUE || role === UserRole.MANAGER || role === UserRole.ADMIN) && (
            <Tooltip key="edit" title={role === UserRole.DELEGUE ? editTooltip : 'Modifier'}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                disabled={role === UserRole.DELEGUE && !canEdit}
                onClick={() => {
                  setEditingProspect(prospect);
                  setFormOpen(true);
                }}
              />
            </Tooltip>
          ),
          // Suppression
          (role === UserRole.DELEGUE || role === UserRole.MANAGER || role === UserRole.ADMIN) && (
            <Tooltip key="del" title={role === UserRole.DELEGUE ? (editTooltip || 'Supprimer') : 'Supprimer'}>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={role === UserRole.DELEGUE && !canEdit}
                onClick={() => {
                  Modal.confirm({
                    title: 'Supprimer ce prospect ?',
                    content: `${prospect.nom} ${prospect.prenom ?? ''} — ${prospect.entreprise}`,
                    okText: 'Supprimer',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await prospectService.delete(prospect.id);
                      message.success('Prospect supprimé.');
                      actionRef.current?.reload();
                    },
                  });
                }}
              />
            </Tooltip>
          ),
        ].filter(Boolean);
      },
    },
  ];

  const currentUser = user;

  async function loadData(params: Record<string, unknown>) {
    const filtres = {
      recherche: params.keyword as string | undefined,
      zoneId: params.zoneId as string | undefined,
      statut: params.statut as ProspectStatut | undefined,
      delegueId: params.delegueId as string | undefined,
    };

    let data = await prospectService.getAll(filtres);

    if (role === UserRole.DELEGUE) {
      const myZoneIds = currentUser.zoneIds ?? [];
      data = data.filter(
        (p) =>
          p.delegueId === currentUser.id ||
          (p.statut === ProspectStatut.PNA && myZoneIds.includes(p.zoneId)),
      );
    } else if (role === UserRole.MANAGER) {
      const myDelegueIds = currentUser.delegueIds ?? [];
      data = data.filter(
        (p) => !p.delegueId || myDelegueIds.includes(p.delegueId),
      );
    }

    return { data, success: true, total: data.length };
  }

  return (
    <PageContainer title="Prospects">
      <ProTable<Prospect>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={loadData}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        pagination={{ pageSize: 10 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProspect(null);
              setFormOpen(true);
            }}
          >
            Nouveau prospect
          </Button>,
          (role === UserRole.DELEGUE || role === UserRole.ADMIN) && (
            <Button
              key="import"
              icon={<UploadOutlined />}
              onClick={() => setImportOpen(true)}
            >
              Importer Excel
            </Button>
          ),
        ].filter(Boolean)}
      />

      <ProspectDrawerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        prospect={editingProspect}
        defaultZoneId={user.zoneIds?.[0]}
        onSuccess={() => actionRef.current?.reload()}
      />

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => actionRef.current?.reload()}
      />

      <AttributionModal
        open={attributionOpen}
        onOpenChange={setAttributionOpen}
        prospect={attributionTarget}
        managerId={role === UserRole.MANAGER ? user.id : undefined}
        onSuccess={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
}
