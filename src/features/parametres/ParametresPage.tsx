'use client';

import { ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { ProForm, ProFormDigit } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { App, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { supportService } from '@/services';
import type { ParametresApp } from '@/types';

const { Text } = Typography;

export function ParametresPage() {
  const { message } = App.useApp();
  const [initialValues, setInitialValues] = useState<ParametresApp | null>(null);

  useEffect(() => {
    supportService.getParametres().then(setInitialValues).catch(() => {});
  }, []);

  if (!initialValues) return null;

  const dureeTotale = Math.round(initialValues.tempsMoyenParSlide);
  const dureeTotalMin = Math.floor(dureeTotale / 60);
  const dureeTotalSec = dureeTotale % 60;
  const dureeFmt =
    dureeTotalSec === 0 ? `${dureeTotalMin} min` : `${dureeTotalMin} min ${dureeTotalSec} s`;

  return (
    <PageContainer
      title="Paramètres"
      tags={
        <Tag
          icon={<SettingOutlined />}
          style={{
            background: '#F3E5F5',
            color: '#6A1B9A',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Administration
        </Tag>
      }
    >
      <div
        style={{
          maxWidth: 560,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E7F3F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
            }}
          >
            <ClockCircleOutlined />
          </div>
          <div>
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1.2 }}>
              Présentation commerciale
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Durée minimale attendue par présentation
            </Text>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: '#F3F9F7',
              border: '1px solid #E7F3F0',
              marginBottom: 20,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              La durée minimale est calculée comme :{' '}
              <strong>nombre de slides × temps moyen par slide</strong>.
              <br />
              Valeur actuelle :{' '}
              <strong style={{ color: '#0F6E52' }}>{dureeFmt} par slide</strong>
            </Text>
          </div>

          <ProForm<ParametresApp>
            initialValues={initialValues}
            onFinish={async (values) => {
              try {
                await supportService.updateParametres(values);
                message.success('Paramètres mis à jour avec succès.');
                return true;
              } catch {
                message.error('Erreur lors de la sauvegarde.');
                return false;
              }
            }}
            submitter={{
              searchConfig: { submitText: 'Enregistrer', resetText: 'Réinitialiser' },
            }}
          >
            <ProFormDigit
              name="tempsMoyenParSlide"
              label="Temps moyen par slide (secondes)"
              min={5}
              max={600}
              fieldProps={{ step: 5 }}
              rules={[{ required: true, message: 'Ce champ est obligatoire.' }]}
              extra={`De 5 s (présentation rapide) à 600 s (très détaillée).`}
            />
          </ProForm>
        </div>
      </div>
    </PageContainer>
  );
}
