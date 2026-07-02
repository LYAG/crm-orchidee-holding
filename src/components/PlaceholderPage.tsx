'use client';

import { ProCard } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { Typography } from 'antd';

const { Text } = Typography;

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <PageContainer title={title}>
      <ProCard bordered>
        <Text type="secondary">Module à implémenter.</Text>
      </ProCard>
    </PageContainer>
  );
}
