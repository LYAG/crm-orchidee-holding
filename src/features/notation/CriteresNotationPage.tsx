'use client';

import { CalculatorOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Alert, App, Button, Switch, Tag, Tooltip, Typography } from 'antd';
import { useRef, useState } from 'react';
import { notationService } from '@/services';
import type { CritereNotation } from '@/types';

const { Text } = Typography;

interface CritereFormValues {
  libelle: string;
  description?: string;
  poids: number;
  ordre?: number;
  actif: boolean;
}

const LIBELLE_TYPE: Record<CritereNotation['type'], string> = {
  MANUEL: 'Saisie manager',
  OBJECTIF_RDV: 'Auto · objectif de visites',
  OBJECTIF_CONVERSION: 'Auto · conversion T1 → ST',
};

/** Paramétrage (admin) des critères communs de la notation mensuelle /20 des délégués. */
export function CriteresNotationPage() {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CritereNotation | null>(null);

  async function enregistrer(values: CritereFormValues): Promise<boolean> {
    try {
      const data = {
        libelle: values.libelle,
        description: values.description?.trim() || null,
        poids: values.poids,
        ordre: values.ordre,
        actif: values.actif,
        type: editing?.type ?? ('MANUEL' as const),
      };
      if (editing) {
        await notationService.updateCritere(editing.id, data);
        message.success('Critère mis à jour.');
      } else {
        await notationService.createCritere(data);
        message.success('Critère créé.');
      }
      actionRef.current?.reload();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
      return false;
    }
  }

  async function basculerActif(critere: CritereNotation, actif: boolean) {
    try {
      await notationService.updateCritere(critere.id, { ...critere, actif });
      actionRef.current?.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  function confirmerSuppression(critere: CritereNotation) {
    modal.confirm({
      title: 'Supprimer ce critère ?',
      content: `« ${critere.libelle} » ne sera plus proposé dans les évaluations.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await notationService.deleteCritere(critere.id);
          message.success('Critère supprimé.');
          actionRef.current?.reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Suppression impossible.');
        }
      },
    });
  }

  const columns: ProColumns<CritereNotation>[] = [
    { title: 'Ordre', dataIndex: 'ordre', width: 72, align: 'center' },
    {
      title: 'Critère',
      dataIndex: 'libelle',
      render: (_, c) => (
        <div>
          <Text strong>{c.libelle}</Text>
          {c.description && (
            <Text type="secondary" style={{ display: 'block', fontSize: 12.5 }}>
              {c.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 220,
      render: (_, c) =>
        c.type === 'MANUEL' ? (
          <Tag icon={<EditOutlined />}>{LIBELLE_TYPE[c.type]}</Tag>
        ) : (
          <Tag icon={<CalculatorOutlined />} color="blue">
            {LIBELLE_TYPE[c.type]}
          </Tag>
        ),
    },
    { title: 'Coefficient', dataIndex: 'poids', width: 110, align: 'center' },
    {
      title: 'Actif',
      dataIndex: 'actif',
      width: 90,
      render: (_, c) => (
        <Switch size="small" checked={c.actif} aria-label={`Activer ${c.libelle}`} onChange={(v) => basculerActif(c, v)} />
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 100,
      render: (_, c) => [
        <Tooltip key="edit" title="Modifier">
          <Button
            type="text"
            size="small"
            aria-label={`Modifier ${c.libelle}`}
            icon={<EditOutlined style={{ color: '#0F6E52' }} />}
            onClick={() => {
              setEditing(c);
              setModalOpen(true);
            }}
          />
        </Tooltip>,
        c.type === 'MANUEL' ? (
          <Tooltip key="del" title="Supprimer">
            <Button
              type="text"
              size="small"
              danger
              aria-label={`Supprimer ${c.libelle}`}
              icon={<DeleteOutlined />}
              onClick={() => confirmerSuppression(c)}
            />
          </Tooltip>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer
      title="Critères de notation"
      subTitle="Note mensuelle /20 des délégués"
      tags={
        <Tag icon={<SafetyCertificateOutlined />} style={{ background: '#F1ECF8', color: '#6B3FA0', border: 'none', borderRadius: 6 }}>
          Administration
        </Tag>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Chaque critère actif est noté sur 20 ; la note du mois est leur moyenne pondérée par les coefficients."
        description="Les deux critères automatiques valent le taux d'atteinte de l'objectif du mois × 20 (plafonné à 20) et sont ignorés quand aucun objectif n'est fixé. Les autres critères sont saisis par le manager. Un critère déjà utilisé se désactive au lieu d'être supprimé."
      />
      <ProTable<CritereNotation>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={false}
        request={async () => {
          const data = await notationService.getCriteres();
          return { data, success: true, total: data.length };
        }}
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
            Nouveau critère
          </Button>,
        ]}
      />

      <ModalForm<CritereFormValues>
        title={editing ? 'Modifier le critère' : 'Nouveau critère manuel'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        initialValues={
          editing
            ? { libelle: editing.libelle, description: editing.description ?? undefined, poids: editing.poids, ordre: editing.ordre, actif: editing.actif }
            : { poids: 1, actif: true }
        }
        onFinish={enregistrer}
        modalProps={{ destroyOnHidden: true }}
        submitter={{ searchConfig: { submitText: editing ? 'Enregistrer' : 'Créer' } }}
      >
        <ProFormText name="libelle" label="Libellé" rules={[{ required: true, message: 'Obligatoire.' }, { max: 120 }]} />
        <ProFormTextArea name="description" label="Description" fieldProps={{ maxLength: 500, autoSize: { minRows: 2, maxRows: 5 } }} />
        <ProFormDigit
          name="poids"
          label="Coefficient"
          min={1}
          max={10}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: 'Obligatoire.' }]}
          extra="Poids du critère dans la moyenne du mois (1 à 10)."
        />
        <ProFormDigit name="ordre" label="Ordre d'affichage" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSwitch name="actif" label="Actif" />
      </ModalForm>
    </PageContainer>
  );
}
