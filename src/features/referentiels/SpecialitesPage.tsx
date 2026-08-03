'use client';

import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { ModalForm, PageContainer, ProFormSwitch, ProFormText, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Tag, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService } from '@/services';
import type { Specialite } from '@/types';

interface SpecialiteFormValues {
  code: string;
  libelle: string;
  actif: boolean;
}

export function SpecialitesPage() {
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Specialite | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    professionnelService.getSpecialites().then(async (specialites) => {
      const entries = await Promise.all(
        specialites.map(async (s) => [s.id, await professionnelService.countProfessionnelsActifsParSpecialite(s.id)] as const),
      );
      setCounts(Object.fromEntries(entries));
    });
  }, []);

  async function handleFinish(values: SpecialiteFormValues): Promise<boolean> {
    try {
      if (editing) {
        await professionnelService.updateSpecialite(editing.id, values);
        message.success('Spécialité mise à jour.');
      } else {
        await professionnelService.createSpecialite(values);
        message.success('Spécialité créée.');
      }
      actionRef.current?.reload();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
      return false;
    }
  }

  function confirmDelete(specialite: Specialite) {
    const nb = counts[specialite.id] ?? 0;
    if (nb > 0) {
      message.error(
        `Impossible de supprimer : ${nb} professionnel(s) actif(s) rattaché(s) à cette spécialité.`,
      );
      return;
    }
    modal.confirm({
      title: 'Supprimer cette spécialité ?',
      content: `"${specialite.libelle}" (${specialite.code}) sera définitivement supprimée.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await professionnelService.deleteSpecialite(specialite.id);
        message.success('Spécialité supprimée.');
        actionRef.current?.reload();
      },
    });
  }

  const columns: ProColumns<Specialite>[] = [
    {
      title: 'Code',
      dataIndex: 'code',
      render: (_, s) => (
        <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
          {s.code}
        </Tag>
      ),
    },
    { title: 'Libellé', dataIndex: 'libelle' },
    {
      title: 'Professionnels actifs',
      dataIndex: 'nb',
      search: false,
      render: (_, s) => counts[s.id] ?? 0,
    },
    {
      title: 'Actif',
      dataIndex: 'actif',
      search: false,
      render: (_, s) => (
        <Tag color={s.actif ? 'success' : 'default'} style={{ borderRadius: 6 }}>
          {s.actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      hideInTable: !isAdmin,
      render: (_, specialite) => [
        <Tooltip key="edit" title="Modifier">
          <EditOutlined
            style={{ color: '#0F6E52' }}
            onClick={() => {
              setEditing(specialite);
              setModalOpen(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="del" title="Supprimer">
          <DeleteOutlined style={{ color: '#C0392B' }} onClick={() => confirmDelete(specialite)} />
        </Tooltip>,
      ],
    },
  ];

  return (
    <PageContainer
      title="Spécialités"
      subTitle="Référentiel dynamique"
      tags={
        <Tag icon={<SafetyCertificateOutlined />} style={{ background: '#F3E5F5', color: '#6A1B9A', border: 'none', borderRadius: 6 }}>
          Administration
        </Tag>
      }
    >
      <ProTable<Specialite>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          let data = await professionnelService.getSpecialites();
          if (params.code) {
            const q = String(params.code).toLowerCase();
            data = data.filter((s) => s.code.toLowerCase().includes(q));
          }
          if (params.libelle) {
            const q = String(params.libelle).toLowerCase();
            data = data.filter((s) => s.libelle.toLowerCase().includes(q));
          }
          return { data, success: true, total: data.length };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
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
                  Nouvelle spécialité
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<SpecialiteFormValues>
        title={editing ? 'Modifier la spécialité' : 'Nouvelle spécialité'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        initialValues={editing ? { code: editing.code, libelle: editing.libelle, actif: editing.actif } : { actif: true }}
        onFinish={handleFinish}
        modalProps={{ destroyOnClose: true }}
        submitter={{ searchConfig: { submitText: editing ? 'Enregistrer' : 'Créer' } }}
      >
        <ProFormText name="code" label="Code" rules={[{ required: true, message: 'Obligatoire.' }]} />
        <ProFormText name="libelle" label="Libellé" rules={[{ required: true, message: 'Obligatoire.' }]} />
        <ProFormSwitch name="actif" label="Actif" />
      </ModalForm>
    </PageContainer>
  );
}
