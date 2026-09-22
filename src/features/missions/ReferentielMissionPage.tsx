'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Tag, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import { ordreMissionService } from '@/services';
import type {
  CreateReferentielMissionDto,
  UpdateReferentielMissionDto,
} from '@/services/api/OrdreMissionService';
import type { ReferentielMission } from '@/types';

interface ReferentielApi {
  lister(): Promise<ReferentielMission[]>;
  creer(data: CreateReferentielMissionDto): Promise<ReferentielMission>;
  modifier(id: string, data: UpdateReferentielMissionDto): Promise<ReferentielMission>;
  supprimer(id: string): Promise<void>;
}

const REFERENTIELS = {
  typesMission: {
    titre: 'Types de mission',
    singulier: 'type de mission',
    nouveau: 'Nouveau type',
    exemple: 'Ex. Visite terrain, Salon professionnel, Formation…',
    api: {
      lister: () => ordreMissionService.getTypesMission(),
      creer: (d) => ordreMissionService.createTypeMission(d),
      modifier: (id, d) => ordreMissionService.updateTypeMission(id, d),
      supprimer: (id) => ordreMissionService.deleteTypeMission(id),
    } satisfies ReferentielApi,
  },
  moyensTransport: {
    titre: 'Moyens de transport',
    singulier: 'moyen de transport',
    nouveau: 'Nouveau moyen',
    exemple: 'Ex. Véhicule de service, Transport en commun, Avion…',
    api: {
      lister: () => ordreMissionService.getMoyensTransport(),
      creer: (d) => ordreMissionService.createMoyenTransport(d),
      modifier: (id, d) => ordreMissionService.updateMoyenTransport(id, d),
      supprimer: (id) => ordreMissionService.deleteMoyenTransport(id),
    } satisfies ReferentielApi,
  },
};

interface FormValues {
  code: string;
  libelle: string;
  actif: boolean;
}

interface Props {
  referentiel: keyof typeof REFERENTIELS;
}

/**
 * Référentiels dynamiques des ordres de mission (ADMIN). La suppression d'une valeur déjà
 * utilisée par une mission est refusée côté serveur : on invite alors à la désactiver.
 */
export function ReferentielMissionPage({ referentiel }: Props) {
  const cfg = REFERENTIELS[referentiel];
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReferentielMission | null>(null);

  async function handleFinish(values: FormValues): Promise<boolean> {
    try {
      if (editing) {
        await cfg.api.modifier(editing.id, values);
        message.success('Valeur mise à jour.');
      } else {
        await cfg.api.creer(values);
        message.success('Valeur créée.');
      }
      actionRef.current?.reload();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
      return false;
    }
  }

  function confirmDelete(item: ReferentielMission) {
    modal.confirm({
      title: `Supprimer ce ${cfg.singulier} ?`,
      content: `"${item.libelle}" sera définitivement supprimé. S'il est déjà utilisé par des missions, désactivez-le plutôt.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await cfg.api.supprimer(item.id);
          message.success('Valeur supprimée.');
          actionRef.current?.reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Suppression impossible.');
        }
      },
    });
  }

  const columns: ProColumns<ReferentielMission>[] = [
    {
      title: 'Code',
      dataIndex: 'code',
      render: (_, r) => (
        <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
          {r.code}
        </Tag>
      ),
    },
    { title: 'Libellé', dataIndex: 'libelle' },
    {
      title: 'Actif',
      dataIndex: 'actif',
      search: false,
      render: (_, r) => (
        <Tag color={r.actif ? 'success' : 'default'} style={{ borderRadius: 6 }}>
          {r.actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, item) => [
        <Tooltip key="edit" title="Modifier">
          <EditOutlined
            style={{ color: '#0F6E52' }}
            onClick={() => {
              setEditing(item);
              setModalOpen(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="del" title="Supprimer">
          <DeleteOutlined style={{ color: '#C0392B' }} onClick={() => confirmDelete(item)} />
        </Tooltip>,
      ],
    },
  ];

  return (
    <PageContainer
      title={cfg.titre}
      subTitle="Référentiel dynamique des ordres de mission"
      tags={
        <Tag
          icon={<SafetyCertificateOutlined />}
          style={{ background: '#F3E5F5', color: '#6A1B9A', border: 'none', borderRadius: 6 }}
        >
          Administration
        </Tag>
      }
    >
      <ProTable<ReferentielMission>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          let data = await cfg.api.lister();
          if (params.code) {
            const q = String(params.code).toLowerCase();
            data = data.filter((r) => r.code.toLowerCase().includes(q));
          }
          if (params.libelle) {
            const q = String(params.libelle).toLowerCase();
            data = data.filter((r) => r.libelle.toLowerCase().includes(q));
          }
          return { data, success: true, total: data.length };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ defaultPageSize: 10 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            {cfg.nouveau}
          </Button>,
        ]}
      />

      <ModalForm<FormValues>
        title={editing ? `Modifier le ${cfg.singulier}` : `Nouveau ${cfg.singulier}`}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        initialValues={
          editing
            ? { code: editing.code, libelle: editing.libelle, actif: editing.actif }
            : { actif: true }
        }
        onFinish={handleFinish}
        modalProps={{ destroyOnHidden: true }}
        submitter={{ searchConfig: { submitText: editing ? 'Enregistrer' : 'Créer' } }}
      >
        <ProFormText
          name="code"
          label="Code"
          rules={[{ required: true, message: 'Obligatoire.' }]}
        />
        <ProFormText
          name="libelle"
          label="Libellé"
          placeholder={cfg.exemple}
          rules={[{ required: true, message: 'Obligatoire.' }]}
        />
        <ProFormSwitch
          name="actif"
          label="Actif"
          tooltip="Un libellé inactif n'est plus proposé à la création côté mobile."
        />
      </ModalForm>
    </PageContainer>
  );
}
