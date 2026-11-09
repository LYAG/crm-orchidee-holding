'use client';

import {
  CloudDownloadOutlined,
  EditOutlined,
  PaperClipOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, App, Badge, Button, Grid, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { MessageEmailResume } from '@/types/messagerie';
import { formatDateListe, messageErreur, nomCourt } from './format';
import { MessageDrawer } from './MessageDrawer';
import { NouveauMessageModal, type ModeRedaction } from './NouveauMessageModal';

const { Text } = Typography;
const TAILLE_PAGE = 20;

interface Props {
  /** MES_ENVOIS : envois groupés de l'utilisateur connecté (manager ou admin). */
  source: 'RECU' | 'ENVOYE' | 'MES_ENVOIS';
  onNonLusChange?: () => void;
  /** Modes proposés à la rédaction : adresses libres (admin) et/ou groupe d'utilisateurs. */
  modesRedaction: ModeRedaction[];
}

/** Liste paginée des messages reçus (relevés en IMAP) ou envoyés par le CRM. */
export function BoiteMessages({ source, onNonLusChange, modesRedaction }: Props) {
  const { message } = App.useApp();
  const recus = source === 'RECU';
  const mesEnvois = source === 'MES_ENVOIS';
  const compact = Grid.useBreakpoint().md === false;
  const [page, setPage] = useState(0);
  const [recherche, setRecherche] = useState('');
  const [lignes, setLignes] = useState<MessageEmailResume[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [releve, setReleve] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [redaction, setRedaction] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    (mesEnvois
      ? messagerieService.getMesEnvois(page, TAILLE_PAGE)
      : messagerieService.getMessages(source, page, TAILLE_PAGE, recherche || undefined)
    )
      .then((p) => {
        setLignes(p.contenu);
        setTotal(p.total);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Messages indisponibles.')))
      .finally(() => setChargement(false));
  }, [source, mesEnvois, page, recherche]);

  useEffect(() => {
    queueMicrotask(charger);
  }, [charger]);

  async function relever() {
    setReleve(true);
    try {
      const r = await messagerieService.relever();
      message.success(
        r.nouveaux === 0 ? 'Aucun nouveau message.' : `${r.nouveaux} nouveau(x) message(s).`,
      );
      setPage(0);
      charger();
      onNonLusChange?.();
    } catch (err) {
      message.error(messageErreur(err, 'Relève impossible.'));
    } finally {
      setReleve(false);
    }
  }

  function apresLecture(id: string, lu: boolean) {
    setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, lu } : l)));
    onNonLusChange?.();
  }

  // Téléphone : une seule colonne (correspondant + date, objet, aperçu) plutôt qu'un tableau à défiler.
  const colonneCompacte: ColumnsType<MessageEmailResume> = [
    {
      key: 'message',
      render: (_, m) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {recus && (
              <Badge
                status={m.lu ? 'default' : 'processing'}
                color={m.lu ? undefined : 'var(--oh-brand)'}
              />
            )}
            <Text strong={recus && !m.lu} ellipsis style={{ flex: 1, minWidth: 0 }}>
              {nomCourt(recus ? m.expediteur : m.destinataires)}
            </Text>
            {m.piecesJointes && <PaperClipOutlined style={{ color: 'var(--oh-ink-3)' }} />}
            <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
              {formatDateListe(m.dateMessage)}
            </Text>
          </div>
          <Text strong={recus && !m.lu} ellipsis style={{ display: 'block' }}>
            {m.statut === 'ECHEC' && <Tag color="error">Échec</Tag>}
            {m.sujet || '(sans objet)'}
          </Text>
          {m.apercu && (
            <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
              {m.apercu}
            </Text>
          )}
        </div>
      ),
    },
  ];

  const colonnes: ColumnsType<MessageEmailResume> = [
    {
      title: recus ? 'De' : 'À',
      key: 'correspondant',
      width: 220,
      ellipsis: true,
      render: (_, m) => (
        <Space size={8}>
          {recus && (
            <Badge
              status={m.lu ? 'default' : 'processing'}
              color={m.lu ? undefined : 'var(--oh-brand)'}
            />
          )}
          <Text strong={recus && !m.lu} ellipsis style={{ maxWidth: 190 }}>
            {nomCourt(recus ? m.expediteur : m.destinataires)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Objet',
      key: 'sujet',
      render: (_, m) => (
        <div style={{ minWidth: 0 }}>
          <Space size={6} style={{ maxWidth: '100%' }}>
            {m.statut === 'ECHEC' && <Tag color="error">Échec</Tag>}
            <Text strong={recus && !m.lu} ellipsis>
              {m.sujet || '(sans objet)'}
            </Text>
          </Space>
          {m.apercu && (
            <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
              {m.apercu}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: <PaperClipOutlined />,
      key: 'pj',
      width: 44,
      align: 'center',
      responsive: ['md'],
      render: (_, m) =>
        m.piecesJointes ? <PaperClipOutlined style={{ color: 'var(--oh-ink-3)' }} /> : null,
    },
    {
      title: 'Date',
      dataIndex: 'dateMessage',
      width: 110,
      align: 'right',
      render: (d: string | null, m) => <Text strong={recus && !m.lu}>{formatDateListe(d)}</Text>,
    },
  ];

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        {mesEnvois ? (
          <Text type="secondary">
            Vos envois groupés. Les réponses des destinataires arrivent dans votre propre boîte
            mail.
          </Text>
        ) : (
          <Input.Search
            allowClear
            placeholder={
              recus ? 'Rechercher (objet, expéditeur)' : 'Rechercher (objet, destinataire)'
            }
            onSearch={(v) => {
              setPage(0);
              setRecherche(v.trim());
            }}
            style={{ width: 300, maxWidth: '100%' }}
          />
        )}
        <Space wrap>
          {recus && (
            <Button icon={<CloudDownloadOutlined />} loading={releve} onClick={relever}>
              Relever maintenant
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={charger} loading={chargement && !releve}>
            Actualiser
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setRedaction(true)}>
            {modesRedaction.includes('adresses') ? 'Nouveau message' : 'Nouvel envoi groupé'}
          </Button>
        </Space>
      </Space>

      {erreur && <Alert type="error" showIcon title={erreur} />}

      <Table<MessageEmailResume>
        rowKey="id"
        size="middle"
        columns={compact ? colonneCompacte : colonnes}
        showHeader={!compact}
        dataSource={lignes}
        loading={chargement}
        tableLayout="fixed"
        scroll={compact ? undefined : { x: 560 }}
        onRow={(m) => ({ onClick: () => setOuvert(m.id), style: { cursor: 'pointer' } })}
        pagination={{
          current: page + 1,
          pageSize: TAILLE_PAGE,
          total,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: (p) => setPage(p - 1),
        }}
        locale={{
          emptyText: recus
            ? 'Aucun message reçu. Activez la réception dans la configuration puis cliquez sur « Relever maintenant ».'
            : mesEnvois
              ? 'Aucun envoi groupé pour le moment.'
              : 'Aucun message envoyé.',
        }}
      />

      <MessageDrawer
        id={ouvert}
        onClose={() => setOuvert(null)}
        onLu={apresLecture}
        charger={mesEnvois ? (id) => messagerieService.getMonEnvoi(id) : undefined}
      />
      <NouveauMessageModal
        modes={modesRedaction}
        open={redaction}
        onClose={() => setRedaction(false)}
        onEnvoye={() => {
          setRedaction(false);
          if (!recus) {
            setPage(0);
            charger();
          }
        }}
      />
    </Space>
  );
}
