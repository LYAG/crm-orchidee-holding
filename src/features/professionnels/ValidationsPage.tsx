'use client';

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Space, Tag } from 'antd';
import { useRef, useState } from 'react';
import { professionnelService, utilisateurService } from '@/services';
import type { DemandeValidation, Utilisateur } from '@/types';
import { StatutDemandeValidation, TypeDemandeValidation } from '@/types';

const TYPE_LABELS: Record<TypeDemandeValidation, string> = {
  [TypeDemandeValidation.DOUBLON_PROFESSIONNEL]: 'Doublon professionnel',
  [TypeDemandeValidation.NOUVEAU_CENTRE]: 'Nouveau centre',
  [TypeDemandeValidation.NOUVELLE_SPECIALITE]: 'Nouvelle spécialité',
  [TypeDemandeValidation.NOUVEAU_GESTE]: 'Nouveau geste',
};

export function ValidationsPage() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);

  async function traiter(demande: DemandeValidation, statut: StatutDemandeValidation) {
    await professionnelService.traiterDemandeValidation(demande.id, statut);
    message.success(statut === StatutDemandeValidation.APPROUVEE ? 'Demande approuvée.' : 'Demande rejetée.');
    actionRef.current?.reload();
  }

  const columns: ProColumns<DemandeValidation>[] = [
    {
      title: 'Type',
      dataIndex: 'type',
      valueEnum: Object.fromEntries(Object.values(TypeDemandeValidation).map((t) => [t, { text: TYPE_LABELS[t] }])),
      render: (_, d) => <Tag color="blue">{TYPE_LABELS[d.type]}</Tag>,
    },
    { title: 'Détail', dataIndex: 'libelle', search: false },
    {
      title: 'Délégué',
      dataIndex: 'delegueId',
      search: false,
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
    <PageContainer title="File de validation" subTitle="Doublons et nouveaux référentiels issus des imports">
      <ProTable<DemandeValidation>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const [demandes, tousDelegues] = await Promise.all([
            professionnelService.getDemandesValidation(StatutDemandeValidation.EN_ATTENTE),
            utilisateurService.getAll(),
          ]);
          setDelegues(tousDelegues);
          return { data: demandes, success: true, total: demandes.length };
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
