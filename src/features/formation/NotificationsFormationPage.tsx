'use client';

import { PageContainer } from '@ant-design/pro-components';
import { App, Badge, Button, Empty, List, Space, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { formationService } from '@/services';
import type { NotificationFormation } from '@/types/formation';
import { NOTIFICATIONS, formatDateHeure, messageErreur } from './constants';

const { Paragraph } = Typography;

/** Notifications Formation de l'utilisateur (tous rôles), indépendantes du canal de diffusion. */
export function NotificationsFormationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [liste, setListe] = useState<NotificationFormation[] | null>(null);
  const delegue = user?.role === UserRole.DELEGUE;

  useEffect(() => {
    formationService
      .getNotifications()
      .then(setListe)
      .catch((err) => {
        message.error(messageErreur(err, 'Notifications indisponibles.'));
        setListe([]);
      });
  }, [message]);

  function ouvrir(n: NotificationFormation) {
    if (!n.lue) {
      formationService.marquerNotificationLue(n.id).catch(() => {});
      setListe((l) => l?.map((x) => (x.id === n.id ? { ...x, lue: true } : x)) ?? null);
    }
    if (delegue) {
      if (n.tentativeId && (n.type === 'RESULTAT_DISPONIBLE' || n.type === 'ECHEC' || n.type === 'CORRECTION_TERMINEE')) router.push(`/formation/mon-espace/resultats/${n.tentativeId}`);
      else if (n.affectationId) router.push(`/formation/mon-espace/${n.affectationId}`);
    } else if (n.type === 'EVALUATION_TERMINEE') {
      router.push(n.affectationId ? `/formation/affectations/${n.affectationId}` : '/formation/corrections');
    } else if (n.affectationId) {
      router.push(`/formation/affectations/${n.affectationId}`);
    }
  }

  const nonLues = liste?.filter((n) => !n.lue).length ?? 0;

  return (
    <PageContainer
      title="Notifications Formation"
      extra={
        nonLues > 0
          ? [
              <Button key="lu" onClick={() => { formationService.marquerToutesLues().catch(() => {}); setListe((l) => l?.map((n) => ({ ...n, lue: true })) ?? null); }}>
                Tout marquer comme lu
              </Button>,
            ]
          : []
      }
    >
      <List
        loading={liste === null}
        style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--oh-line)' }}
        dataSource={liste ?? []}
        locale={{ emptyText: <Empty description="Aucune notification" /> }}
        renderItem={(n) => (
          <List.Item style={{ cursor: 'pointer', paddingInline: 16, opacity: n.lue ? 0.7 : 1 }} onClick={() => ouvrir(n)}>
            <List.Item.Meta
              title={<Space size={6}>{!n.lue && <Badge status="processing" />}<span>{n.titre}</span></Space>}
              description={
                <span>
                  <Tag style={{ borderRadius: 6 }}>{NOTIFICATIONS[n.type]}</Tag>
                  {formatDateHeure(n.dateCreation)}
                  {n.message && <Paragraph type="secondary" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.message}</Paragraph>}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </PageContainer>
  );
}
