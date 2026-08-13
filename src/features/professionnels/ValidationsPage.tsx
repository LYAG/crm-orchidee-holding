'use client';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Space, Tag } from 'antd';
import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, utilisateurService } from '@/services';
import type { DemandeValidation, Utilisateur } from '@/types';
import { StatutDemandeValidation, TypeDemandeValidation } from '@/types';

const TYPE_LABELS: Record<TypeDemandeValidation, string> = {
  [TypeDemandeValidation.DOUBLON_PROFESSIONNEL]: 'Doublon professionnel',
  [TypeDemandeValidation.NOUVEAU_CENTRE]: 'Nouveau centre',
  [TypeDemandeValidation.NOUVELLE_SPECIALITE]: 'Nouvelle spécialité',
  [TypeDemandeValidation.NOUVEAU_GESTE]: 'Nouveau geste',
  [TypeDemandeValidation.CHANGEMENT_CLASSIFICATION]: 'Changement de classification',
};

export function ValidationsPage() {
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [demandesAffichees, setDemandesAffichees] = useState<DemandeValidation[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const isDelegue = user?.role === UserRole.DELEGUE;
  const typesVisibles = isDelegue ? [TypeDemandeValidation.CHANGEMENT_CLASSIFICATION] : Object.values(TypeDemandeValidation);

  async function traiter(demande: DemandeValidation, statut: StatutDemandeValidation) {
    await professionnelService.traiterDemandeValidation(demande.id, statut);
    message.success(statut === StatutDemandeValidation.APPROUVEE ? 'Demande approuvée.' : 'Demande rejetée.');
    actionRef.current?.reload();
  }

  function confirmerTraitementGroupe(statut: StatutDemandeValidation) {
    const cible = demandesAffichees.filter((d) => selectedRowKeys.includes(d.id));
    if (cible.length === 0) return;
    const verbe = statut === StatutDemandeValidation.APPROUVEE ? 'Approuver' : 'Rejeter';
    modal.confirm({
      title: `${verbe} ${cible.length} demande${cible.length > 1 ? 's' : ''} ?`,
      content: 'Cette action est appliquée en une seule fois à toutes les lignes sélectionnées.',
      okText: verbe,
      okButtonProps: { danger: statut === StatutDemandeValidation.REJETEE },
      cancelText: 'Annuler',
      onOk: async () => {
        setBulkLoading(true);
        try {
          let ok = 0;
          let echecs = 0;
          for (const demande of cible) {
            try {
              await professionnelService.traiterDemandeValidation(demande.id, statut);
              ok++;
            } catch {
              echecs++;
            }
          }
          if (echecs === 0) {
            message.success(`${ok} demande${ok > 1 ? 's' : ''} ${statut === StatutDemandeValidation.APPROUVEE ? 'approuvée' : 'rejetée'}${ok > 1 ? 's' : ''}.`);
          } else {
            message.warning(`${ok} traitée(s), ${echecs} en échec.`);
          }
          setSelectedRowKeys([]);
          actionRef.current?.reload();
        } finally {
          setBulkLoading(false);
        }
      },
    });
  }

  const columns: ProColumns<DemandeValidation>[] = [
    {
      title: 'Type',
      dataIndex: 'type',
      valueEnum: Object.fromEntries(typesVisibles.map((t) => [t, { text: TYPE_LABELS[t] }])),
      render: (_, d) => <Tag color="blue">{TYPE_LABELS[d.type]}</Tag>,
    },
    { title: 'Détail', dataIndex: 'libelle', search: false },
    {
      title: 'Délégué',
      dataIndex: 'delegueId',
      search: false,
      hideInTable: isDelegue,
      render: (_, d) => {
        const u = delegues.find((x) => x.id === d.delegueId);
        return u ? `${u.prenom} ${u.nom}` : d.delegueId;
      },
    },
    { title: 'Date', dataIndex: 'dateCreation', search: false },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, demande) => [
        <Button
          key="approve"
          type="link"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => traiter(demande, StatutDemandeValidation.APPROUVEE)}
        >
          Approuver
        </Button>,
        <Button
          key="reject"
          type="link"
          danger
          size="small"
          icon={<CloseOutlined />}
          onClick={() => traiter(demande, StatutDemandeValidation.REJETEE)}
        >
          Rejeter
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer
      title="File de validation"
      subTitle={isDelegue ? 'Vos demandes de changement de classification' : 'Doublons et nouveaux référentiels issus des imports'}
    >
      <ProTable<DemandeValidation>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
          selections: [
            {
              key: 'all-filtered',
              text: 'Tout sélectionner (résultats filtrés)',
              onSelect: () => setSelectedRowKeys(demandesAffichees.map((d) => d.id)),
            },
            { key: 'clear', text: 'Tout désélectionner', onSelect: () => setSelectedRowKeys([]) },
          ],
        }}
        tableAlertRender={({ selectedRowKeys: keys }) => (
          <span>{keys.length} demande{keys.length > 1 ? 's' : ''} sélectionnée{keys.length > 1 ? 's' : ''}</span>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              loading={bulkLoading}
              onClick={() => confirmerTraitementGroupe(StatutDemandeValidation.APPROUVEE)}
            >
              Approuver la sélection
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              loading={bulkLoading}
              onClick={() => confirmerTraitementGroupe(StatutDemandeValidation.REJETEE)}
            >
              Rejeter la sélection
            </Button>
          </Space>
        )}
        request={async (params) => {
          const [demandes, tousDelegues] = await Promise.all([
            professionnelService.getDemandesValidation(StatutDemandeValidation.EN_ATTENTE),
            utilisateurService.getAll(),
          ]);
          setDelegues(tousDelegues);
          const type = params.type as TypeDemandeValidation | undefined;
          let filtrees = demandes.filter((d) => typesVisibles.includes(d.type));
          if (isDelegue && user) filtrees = filtrees.filter((d) => d.delegueId === user.id);
          if (type) filtrees = filtrees.filter((d) => d.type === type);
          setDemandesAffichees(filtrees);
          return { data: filtrees, success: true, total: filtrees.length };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        toolBarRender={() => [
          <Space key="legend">
            <Tag>En attente uniquement</Tag>
          </Space>,
        ]}
      />
    </PageContainer>
  );
}
