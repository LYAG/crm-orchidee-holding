'use client';

import { InboxOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Badge, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import { BoiteMessages } from './BoiteMessages';
import { signalerNonLusModifies } from './nonLus';

/** Messagerie (icône de l'en-tête) : messages reçus et envoyés avec le compte e-mail du CRM. */
export function MessageriePage() {
  const [onglet, setOnglet] = useState('recus');
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
    queueMicrotask(rafraichirNonLus);
  }, [rafraichirNonLus]);

  return (
    <PageContainer title="Messagerie" subTitle="Boîte de réception et messages envoyés">
      <Tabs
        activeKey={onglet}
        onChange={setOnglet}
        destroyOnHidden
        items={[
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
        ]}
      />
    </PageContainer>
  );
}
