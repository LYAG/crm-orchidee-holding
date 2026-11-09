'use client';

import { ProfileOutlined, SettingOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import { useState } from 'react';
import { ConfigurationMessagerie } from './ConfigurationMessagerie';
import { JournalMessagerieTable } from './JournalMessagerieTable';

/** Paramètres > Mail : compte e-mail du CRM (SMTP/IMAP) et journal des opérations. */
export function ParametresMailPage() {
  const [onglet, setOnglet] = useState('configuration');

  return (
    <PageContainer title="Mail" subTitle="Compte e-mail du CRM : envoi (SMTP) et réception (IMAP)">
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
