'use client';

import { InboxOutlined, SendOutlined, TeamOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Badge, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { messagerieService } from '@/services';
import { BoiteMessages } from './BoiteMessages';
import type { ModeRedaction } from './NouveauMessageModal';
import { signalerNonLusModifies } from './nonLus';

const MODES_ADMIN: ModeRedaction[] = ['adresses', 'groupe'];
const MODES_MANAGER: ModeRedaction[] = ['groupe'];

/**
 * Messagerie (icône de l'en-tête). Admin : boîte du CRM (reçus, envoyés) et envois groupés aux
 * managers/délégués. Manager : envois groupés à ses délégués et historique de ses envois.
 */
export function MessageriePage() {
  const { user } = useAuth();
  const admin = user?.role === UserRole.ADMIN;
  const [onglet, setOnglet] = useState<string | undefined>(undefined);
  const [nonLus, setNonLus] = useState(0);

  const rafraichirNonLus = useCallback(() => {
    messagerieService
      .getNonLus()
      .then((n) => {
        setNonLus(n);
        signalerNonLusModifies();
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (admin) queueMicrotask(rafraichirNonLus);
  }, [admin, rafraichirNonLus]);

  if (!user) return null;

  const onglets = admin
    ? [
        {
          key: 'recus',
          icon: <InboxOutlined />,
          label: (
            <>
              Réception{' '}
              {nonLus > 0 && (
                <Badge
                  count={nonLus}
                  size="small"
                  color="var(--oh-brand)"
                  style={{ marginInlineStart: 4 }}
                />
              )}
            </>
          ),
          children: (
            <BoiteMessages
              source="RECU"
              onNonLusChange={rafraichirNonLus}
              modesRedaction={MODES_ADMIN}
            />
          ),
        },
        {
          key: 'envoyes',
          icon: <SendOutlined />,
          label: 'Envoyés',
          children: <BoiteMessages source="ENVOYE" modesRedaction={MODES_ADMIN} />,
        },
      ]
    : [
        {
          key: 'mes-envois',
          icon: <TeamOutlined />,
          label: 'Envois à mes délégués',
          children: <BoiteMessages source="MES_ENVOIS" modesRedaction={MODES_MANAGER} />,
        },
      ];

  return (
    <PageContainer
      title="Messagerie"
      subTitle={
        admin
          ? 'Boîte de réception, messages envoyés et envois groupés'
          : 'E-mails groupés à vos délégués — les réponses arrivent dans votre boîte mail'
      }
    >
      <Tabs
        activeKey={onglet ?? onglets[0].key}
        onChange={setOnglet}
        destroyOnHidden
        items={onglets}
      />
    </PageContainer>
  );
}
