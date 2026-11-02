'use client';

import { InboxOutlined, ProfileOutlined, SendOutlined, SettingOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Badge, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import { BoiteMessages } from './BoiteMessages';
import { ConfigurationMessagerie } from './ConfigurationMessagerie';
import { JournalMessagerieTable } from './JournalMessagerieTable';

/** Paramètres > Messagerie : compte e-mail du CRM (SMTP/IMAP), boîte de réception, envoyés, journal. */
export function MessageriePage() {
  const [onglet, setOnglet] = useState('configuration');
  const [nonLus, setNonLus] = useState(0);

  const rafraichirNonLus = useCallback(() => {
    messagerieService
      .getNonLus()
      .then(setNonLus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    queueMicrotask(rafraichirNonLus);
  }, [rafraichirNonLus]);

  return (
    <PageContainer
      title="Messagerie"
      subTitle="Compte e-mail du CRM : envoi (SMTP) et réception (IMAP)"
    >
      <Tabs
        activeKey={onglet}
        onChange={setOnglet}
        destroyOnHidden
        items={[
          {
            key: 'configuration',
            icon: <SettingOutlined />,
            label: 'Configuration',
            children: <ConfigurationMessagerie />,
          },
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
            children: <BoiteMessages direction="RECU" onNonLusChange={rafraichirNonLus} />,
          },
          {
            key: 'envoyes',
            icon: <SendOutlined />,
            label: 'Envoyés',
            children: <BoiteMessages direction="ENVOYE" onNonLusChange={rafraichirNonLus} />,
          },
          {
            key: 'journal',
            icon: <ProfileOutlined />,
            label: 'Journal',
            children: <JournalMessagerieTable />,
          },
        ]}
      />
    </PageContainer>
  );
}
