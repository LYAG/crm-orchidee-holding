'use client';

import { DeleteOutlined, EditOutlined, GiftOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { App, Button, Col, Row, Statistic, Tag, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatFcfa } from '@/lib/format';
import { UserRole } from '@/lib/constants';
import type { StatistiquesGestes } from '@/services/api/ProfessionnelService';
import { professionnelService } from '@/services';
import type { GesteMarketing } from '@/types';
import { CategorieGeste } from '@/types';

const CATEGORIE_LABELS: Record<CategorieGeste, string> = {
  [CategorieGeste.REPAS]: 'Repas',
  [CategorieGeste.CADEAU]: 'Cadeau',
  [CategorieGeste.FINANCIER]: 'Financier',
  [CategorieGeste.ECHANTILLON]: 'Échantillon',
  [CategorieGeste.AUTRE]: 'Autre',
};

interface GesteFormValues {
  libelle: string;
  categorie?: CategorieGeste;
  coutIndicatifFcfa?: number;
  actif: boolean;
}

export function GestesMarketingPage() {
  const { user } = useAuth();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [stats, setStats] = useState<StatistiquesGestes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GesteMarketing | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    professionnelService.getStatistiquesGestes().then(setStats).catch(() => {});
  }, []);

  async function handleFinish(values: GesteFormValues): Promise<boolean> {
    try {
      if (editing) {
        await professionnelService.updateGesteMarketing(editing.id, values);
        message.success('Geste mis à jour.');
      } else {
        await professionnelService.createGesteMarketing(values);
        message.success('Geste créé.');
      }
      actionRef.current?.reload();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
      return false;
    }
  }

  function confirmDelete(geste: GesteMarketing) {
    modal.confirm({
      title: 'Supprimer ce geste ?',
      content: `"${geste.libelle}" sera définitivement supprimé du référentiel.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await professionnelService.deleteGesteMarketing(geste.id);
        message.success('Geste supprimé.');
        actionRef.current?.reload();
      },
    });
  }

  const columns: ProColumns<GesteMarketing>[] = [
    {
      title: 'Geste',
      dataIndex: 'libelle',
      render: (_, g) => (
        <span style={{ fontWeight: 600, color: '#123832' }}>
          <GiftOutlined style={{ marginRight: 8, color: '#0F6E52' }} />
          {g.libelle}
        </span>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'categorie',
      valueEnum: Object.fromEntries(Object.values(CategorieGeste).map((c) => [c, { text: CATEGORIE_LABELS[c] }])),
      render: (_, g) => (g.categorie ? <Tag style={{ borderRadius: 6 }}>{CATEGORIE_LABELS[g.categorie]}</Tag> : '—'),
    },
    {
      title: 'Coût indicatif',
      dataIndex: 'coutIndicatifFcfa',
      search: false,
      render: (_, g) => (g.coutIndicatifFcfa != null ? formatFcfa(g.coutIndicatifFcfa) : '—'),
    },
    {
      title: 'Actif',
      dataIndex: 'actif',
      search: false,
      render: (_, g) => (
        <Tag color={g.actif ? 'success' : 'default'} style={{ borderRadius: 6 }}>
          {g.actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      valueType: 'option',
      hideInTable: !isAdmin,
      render: (_, geste) => [
        <Tooltip key="edit" title="Modifier">
          <EditOutlined
            style={{ color: '#0F6E52' }}
            onClick={() => {
              setEditing(geste);
              setModalOpen(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="del" title="Supprimer">
          <DeleteOutlined style={{ color: '#C0392B' }} onClick={() => confirmDelete(geste)} />
        </Tooltip>,
      ],
    },
  ];

  return (
    <PageContainer title="Gestes marketing" subTitle="Référentiel dynamique">
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: '#F7FAF9', border: '1px solid #E7F3F0' }}>
            <Statistic title="Gestes réalisés ce mois" value={stats?.nbGestesCeMois ?? 0} />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: '#F7FAF9', border: '1px solid #E7F3F0' }}>
            <Statistic title="Coût total ce mois" value={formatFcfa(stats?.coutTotalFcfaCeMois ?? 0)} />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ padding: '16px 20px', borderRadius: 10, background: '#F7FAF9', border: '1px solid #E7F3F0' }}>
            <div style={{ fontSize: 13, color: '#8FB0A8', marginBottom: 8 }}>Top 5 gestes utilisés</div>
            {stats && stats.topGestes.length > 0 ? (
              stats.topGestes.map((g) => (
                <div key={g.gesteMarketingId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                  <span>{g.libelle}</span>
                  <strong>{g.nbFois}×</strong>
                </div>
              ))
            ) : (
              <span style={{ color: '#C7DAD5', fontSize: 13 }}>Aucune donnée</span>
            )}
          </div>
        </Col>
      </Row>

      <ProTable<GesteMarketing>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          let data = await professionnelService.getGestesMarketing();
          if (params.categorie) data = data.filter((g) => g.categorie === params.categorie);
          if (params.libelle) {
            const q = String(params.libelle).toLowerCase();
            data = data.filter((g) => g.libelle.toLowerCase().includes(q));
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
                  Nouveau geste
                </Button>,
              ]
            : []
        }
      />

      <ModalForm<GesteFormValues>
        title={editing ? 'Modifier le geste' : 'Nouveau geste marketing'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        initialValues={
          editing
            ? {
                libelle: editing.libelle,
                categorie: editing.categorie,
                coutIndicatifFcfa: editing.coutIndicatifFcfa,
                actif: editing.actif,
              }
            : { actif: true }
        }
        onFinish={handleFinish}
        modalProps={{ destroyOnClose: true }}
        submitter={{ searchConfig: { submitText: editing ? 'Enregistrer' : 'Créer' } }}
      >
        <ProFormText name="libelle" label="Libellé" rules={[{ required: true, message: 'Obligatoire.' }]} />
        <ProFormSelect
          name="categorie"
          label="Catégorie"
          options={Object.values(CategorieGeste).map((c) => ({ value: c, label: CATEGORIE_LABELS[c] }))}
        />
        <ProFormDigit
          name="coutIndicatifFcfa"
          label="Coût indicatif (FCFA)"
          min={0}
          fieldProps={{ formatter: (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }}
        />
        <ProFormSwitch name="actif" label="Actif" />
      </ModalForm>
    </PageContainer>
  );
}
