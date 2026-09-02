'use client';

import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, App, Button, Input, Modal, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { purgeService } from '@/services';
import type { PurgeableTable } from '@/services/api/PurgeService';

const { Text, Paragraph } = Typography;

const CONFIRMATION_ATTENDUE = 'PURGER';

/** Tables liées à l'authentification / aux droits — purger celles-ci peut déconnecter des comptes ou casser les permissions. */
const TABLES_SENSIBLES = new Set([
  'utilisateur',
  'utilisateur_zone',
  'role_definition',
  'permission_module',
  'permission_module_access',
  'permission_module_label',
]);

export function PurgeDatabasePage() {
  const { message } = App.useApp();

  const [tables, setTables] = useState<PurgeableTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [purging, setPurging] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    purgeService
      .getTablesPurgeables()
      .then(setTables)
      .catch((err) => message.error(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, [load]);

  const tablesSelectionnees = useMemo(() => tables.filter((t) => selectedKeys.includes(t.nom)), [tables, selectedKeys]);
  const totalLignesSelectionnees = useMemo(
    () => tablesSelectionnees.reduce((somme, t) => somme + t.nombreLignes, 0),
    [tablesSelectionnees],
  );

  function ouvrirConfirmation() {
    if (selectedKeys.length === 0) return;
    setConfirmText('');
    setModalOpen(true);
  }

  async function handlePurger() {
    setPurging(true);
    try {
      const resultat = await purgeService.purger(selectedKeys, confirmText);
      const total = resultat.resultats.reduce((s, r) => s + r.lignesSupprimees, 0);
      message.success(`${total} ligne(s) supprimée(s) dans ${resultat.resultats.length} table(s).`);
      setModalOpen(false);
      setConfirmText('');
      setSelectedKeys([]);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la purge.');
    } finally {
      setPurging(false);
    }
  }

  const columns: ColumnsType<PurgeableTable> = [
    {
      title: 'Table',
      dataIndex: 'nom',
      render: (_, t) => (
        <Space size={6}>
          <Text code>{t.nom}</Text>
          {TABLES_SENSIBLES.has(t.nom) && (
            <Tooltip title="Table liée à l'authentification ou aux droits — la purger peut déconnecter des comptes ou casser les permissions.">
              <Tag color="orange" icon={<WarningOutlined />}>
                sensible
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Nombre de lignes',
      dataIndex: 'nombreLignes',
      align: 'right',
      width: 180,
      sorter: (a, b) => a.nombreLignes - b.nombreLignes,
      render: (n: number) => n.toLocaleString('fr-FR'),
    },
  ];

  return (
    <PageContainer
      title="Purge de la base de données"
      subTitle="Supprime définitivement les données des tables sélectionnées"
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Actualiser
        </Button>,
      ]}>
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Alert
          type="error"
          showIcon
          message="Zone dangereuse"
          description="La suppression est immédiate et définitive. Les tables sont purgées dans l'ordre des dépendances ; si une table hors sélection référence encore des lignes d'une table sélectionnée, l'opération entière est annulée et un message explique quelle table ajouter à la sélection."
        />

        <Space>
          <Button onClick={() => setSelectedKeys(tables.map((t) => t.nom))} disabled={tables.length === 0}>
            Tout sélectionner
          </Button>
          <Button onClick={() => setSelectedKeys([])} disabled={selectedKeys.length === 0}>
            Tout désélectionner
          </Button>
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            disabled={selectedKeys.length === 0}
            onClick={ouvrirConfirmation}>
            Purger {selectedKeys.length > 0 ? `${selectedKeys.length} table(s) sélectionnée(s)` : 'les tables sélectionnées'}
          </Button>
        </Space>

        <Table<PurgeableTable>
          rowKey="nom"
          loading={loading}
          columns={columns}
          dataSource={tables}
          size="small"
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys as string[]),
          }}
        />
      </Space>

      <Modal
        open={modalOpen}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#cf1322' }} />
            <span>Confirmer la purge</span>
          </Space>
        }
        onCancel={() => setModalOpen(false)}
        confirmLoading={purging}
        okText="Purger définitivement"
        okType="danger"
        okButtonProps={{ disabled: confirmText !== CONFIRMATION_ATTENDUE }}
        cancelText="Annuler"
        onOk={handlePurger}
        destroyOnHidden>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            type="error"
            showIcon
            message="Action irréversible"
            description={`Vous êtes sur le point de supprimer définitivement ${totalLignesSelectionnees.toLocaleString('fr-FR')} ligne(s) dans ${tablesSelectionnees.length} table(s) :`}
          />
          <Space size={[4, 4]} wrap>
            {tablesSelectionnees.map((t) => (
              <Tag key={t.nom}>
                {t.nom} ({t.nombreLignes.toLocaleString('fr-FR')})
              </Tag>
            ))}
          </Space>
          <Paragraph>
            Tapez <Text strong code>{CONFIRMATION_ATTENDUE}</Text> ci-dessous pour confirmer.
          </Paragraph>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRMATION_ATTENDUE}
            onPressEnter={() => {
              if (confirmText === CONFIRMATION_ATTENDUE) handlePurger();
            }}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
}
