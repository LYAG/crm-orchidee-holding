'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { JournalMessagerie, TypeJournalMessagerie } from '@/types/messagerie';
import { formatDateHeure, messageErreur } from './format';

const { Text } = Typography;

const LIBELLES: Record<TypeJournalMessagerie, string> = {
  CONFIG: 'Configuration',
  TEST_SMTP: 'Test envoi',
  TEST_IMAP: 'Test réception',
  ENVOI: 'Envoi',
  RELEVE: 'Relève',
};

/** 100 dernières opérations de messagerie (envois, relèves, tests) avec leur issue. */
export function JournalMessagerieTable() {
  const [lignes, setLignes] = useState<JournalMessagerie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    setChargement(true);
    messagerieService
      .getJournal()
      .then((j) => {
        setLignes(j);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Journal indisponible.')))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    queueMicrotask(charger);
  }, [charger]);

  const colonnes: ColumnsType<JournalMessagerie> = [
    {
      title: 'Date',
      dataIndex: 'dateEvenement',
      width: 160,
      render: (d: string) => formatDateHeure(d),
    },
    {
      title: 'Opération',
      dataIndex: 'type',
      width: 140,
      render: (t: TypeJournalMessagerie) => <Tag>{LIBELLES[t]}</Tag>,
    },
    {
      title: 'Résultat',
      dataIndex: 'succes',
      width: 110,
      render: (s: boolean) =>
        s ? <Tag color="success">Réussi</Tag> : <Tag color="error">Échec</Tag>,
    },
    {
      title: 'Détail',
      dataIndex: 'message',
      render: (m: string | null) => <Text style={{ fontSize: 13 }}>{m ?? '—'}</Text>,
    },
  ];

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Text type="secondary">
          Envois, relèves, tests de connexion et modifications de configuration.
        </Text>
        <Button icon={<ReloadOutlined />} onClick={charger} loading={chargement}>
          Actualiser
        </Button>
      </Space>
      {erreur && <Alert type="error" showIcon title={erreur} />}
      <Table<JournalMessagerie>
        rowKey="id"
        size="small"
        columns={colonnes}
        dataSource={lignes}
        loading={chargement}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: 640 }}
        locale={{ emptyText: 'Aucune opération pour le moment.' }}
      />
    </Space>
  );
}
