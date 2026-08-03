'use client';

import { DeleteOutlined, EditOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Empty, Space, Tag, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, zoneService } from '@/services';
import type { Centre, ProfessionnelSante, Specialite, Zone } from '@/types';
import { TypeCentre } from '@/types';

const TYPE_LABELS: Record<TypeCentre, string> = {
  [TypeCentre.HOPITAL]: 'Hôpital',
  [TypeCentre.CSU]: 'CSU',
  [TypeCentre.FSU]: 'FSU',
  [TypeCentre.INFIRMERIE]: 'Infirmerie',
  [TypeCentre.CM]: 'Centre médical',
  [TypeCentre.CHR]: 'CHR',
  [TypeCentre.AUTRE]: 'Autre',
};

interface CentreFormValues {
  nom: string;
  zoneId: string;
  type?: TypeCentre;
  adresse?: string;
  actif: boolean;
}

export function CentresPage() {
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [zones, setZones] = useState<Zone[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [professionnels, setProfessionnels] = useState<ProfessionnelSante[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Centre | null>(null);

  useEffect(() => {
    zoneService.getAll().then(setZones).catch(() => {});
    professionnelService.getSpecialites().then(setSpecialites).catch(() => {});
    professionnelService.getProfessionnels().then(setProfessionnels).catch(() => {});
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN;
  const zoneOptions = Object.fromEntries(zones.map((z) => [z.id, { text: z.nom }]));

  function reloadProfessionnels() {
    professionnelService.getProfessionnels().then(setProfessionnels).catch(() => {});
  }

  async function handleFinish(values: CentreFormValues): Promise<boolean> {
    try {
      if (!editing) {
        const proches = await professionnelService.rechercherCentresProches(values.nom, values.zoneId);
        if (proches.length > 0) {
          const confirmed = await new Promise<boolean>((resolve) => {
            modal.confirm({
              title: 'Centre similaire détecté',
              content: `Un centre nommé « ${proches[0].nom} » existe déjà dans cette zone. Créer quand même « ${values.nom} » ?`,
              okText: 'Créer quand même',
              cancelText: 'Annuler',
              onOk: () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          if (!confirmed) return false;
        }
      }

      if (editing) {
        await professionnelService.updateCentre(editing.id, values);
        message.success('Centre mis à jour.');
      } else {
        await professionnelService.createCentre(values);
        message.success('Centre créé.');
      }
      actionRef.current?.reload();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
      return false;
    }
  }

  function confirmDelete(centre: Centre) {
    modal.confirm({
      title: 'Supprimer ce centre ?',
      content: `Le centre "${centre.nom}" sera définitivement supprimé.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await professionnelService.deleteCentre(centre.id);
        message.success('Centre supprimé.');
        actionRef.current?.reload();
        reloadProfessionnels();
      },
    });
  }

  const columns: ProColumns<Centre>[] = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      render: (_, c) => (
        <Space size={8}>
          <EnvironmentOutlined style={{ color: '#0F6E52' }} />
          <strong style={{ color: '#123832' }}>{c.nom}</strong>
        </Space>
      ),
    },
    {
      title: 'Zone',
      dataIndex: 'zoneId',
      valueEnum: zoneOptions,
      render: (_, c) => zones.find((z) => z.id === c.zoneId)?.nom ?? c.zoneId,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      valueEnum: Object.fromEntries(Object.values(TypeCentre).map((t) => [t, { text: TYPE_LABELS[t] }])),
      render: (_, c) => (c.type ? <Tag style={{ borderRadius: 6 }}>{TYPE_LABELS[c.type]}</Tag> : '—'),
    },
    {
      title: 'Adresse',
      dataIndex: 'adresse',
      search: false,
      render: (_, c) => c.adresse ?? <span style={{ color: '#C7DAD5' }}>—</span>,
    },
    {
      title: 'Actif',
      dataIndex: 'actif',
      search: false,
      render: (_, c) => (
        <Tag color={c.actif ? 'success' : 'default'} style={{ borderRadius: 6 }}>
          {c.actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      hideInTable: !isAdmin,
      render: (_, centre) => [
        <Tooltip key="edit" title="Modifier">
          <EditOutlined
            style={{ color: '#0F6E52' }}
            onClick={() => {
              setEditing(centre);
              setModalOpen(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="del" title="Supprimer">
          <DeleteOutlined style={{ color: '#C0392B' }} onClick={() => confirmDelete(centre)} />
        </Tooltip>,
      ],
    },
  ];

  return (
    <PageContainer title="Centres de santé" subTitle="Référentiel dynamique">
      <ProTable<Centre>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          let data = await professionnelService.getCentres();
          if (params.zoneId) data = data.filter((c) => c.zoneId === params.zoneId);
          if (params.type) data = data.filter((c) => c.type === params.type);
          if (params.nom) {
            const q = String(params.nom).toLowerCase();
            data = data.filter((c) => c.nom.toLowerCase().includes(q));
          }
          return { data, success: true, total: data.length };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (centre) => {
            const rattaches = professionnels.filter((p) => p.centreId === centre.id);
            if (rattaches.length === 0) {
              return <Empty description="Aucun professionnel rattaché" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
            }
            const parSpecialite = new Map<string, ProfessionnelSante[]>();
            rattaches.forEach((p) => {
              const ids = p.specialiteIds.length > 0 ? p.specialiteIds : ['_sans_specialite'];
              ids.forEach((sid) => {
                if (!parSpecialite.has(sid)) parSpecialite.set(sid, []);
                parSpecialite.get(sid)!.push(p);
              });
            });
            return (
              <Space direction="vertical" size={10} style={{ width: '100%', padding: '4px 0' }}>
                {[...parSpecialite.entries()].map(([sid, pros]) => {
                  const libelle = specialites.find((s) => s.id === sid)?.libelle ?? 'Sans spécialité';
                  return (
                    <div key={sid}>
                      <Tag color="green" style={{ borderRadius: 6, marginBottom: 6 }}>
                        {libelle}
                      </Tag>
                      <div style={{ marginLeft: 4 }}>
                        {pros.map((p) => (
                          <div key={p.id} style={{ fontSize: 13, color: '#123832', padding: '2px 0' }}>
                            {p.titre ? `${p.titre} ` : ''}
                            {p.nom} {p.prenom ?? ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Space>
            );
          },
        }}
        toolBarRender={() =>
          isAdmin
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  Nouveau centre
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<CentreFormValues>
        title={editing ? 'Modifier le centre' : 'Nouveau centre'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                nom: editing.nom,
                zoneId: editing.zoneId,
                type: editing.type,
                adresse: editing.adresse,
                actif: editing.actif,
              }
            : { actif: true }
        }
        onFinish={handleFinish}
        modalProps={{ destroyOnClose: true }}
        submitter={{ searchConfig: { submitText: editing ? 'Enregistrer' : 'Créer' } }}
      >
        <ProFormText name="nom" label="Nom du centre" rules={[{ required: true, message: 'Obligatoire.' }]} />
        <ProFormSelect
          name="zoneId"
          label="Zone"
          rules={[{ required: true, message: 'Obligatoire.' }]}
          options={zones.map((z) => ({ value: z.id, label: z.nom }))}
        />
        <ProFormSelect
          name="type"
          label="Type"
          options={Object.values(TypeCentre).map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
        />
        <ProFormText name="adresse" label="Adresse" />
        <ProFormSwitch name="actif" label="Actif" />
      </ModalForm>
    </PageContainer>
  );
}
