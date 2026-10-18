'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, App, Button, Col, Form, InputNumber, Row, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { ParametresFormation } from '@/types/formation';
import { messageErreur } from './constants';

/** Paramètres généraux du module Formation (administrateur). */
export function ParametresFormationPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ParametresFormation>();
  const [charge, setCharge] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    formationService
      .getParametres()
      .then((p) => {
        form.setFieldsValue(p);
        setCharge(true);
      })
      .catch((err) => message.error(messageErreur(err, 'Paramètres indisponibles.')));
  }, [form, message]);

  async function enregistrer() {
    const v = await form.validateFields();
    setEnvoi(true);
    try {
      form.setFieldsValue(await formationService.updateParametres(v));
      message.success('Paramètres enregistrés.');
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <PageContainer title="Paramètres Formation" subTitle="Valeurs par défaut et limites applicables aux managers">
      {!charge ? (
        <Spin />
      ) : (
        <ProCard bordered style={{ maxWidth: 820 }}>
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Les managers ne peuvent pas fixer un seuil inférieur au minimum ni dépasser le plafond de tentatives. Les contenus déjà publiés conservent leurs règles." />
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="seuilDefaut" label="Seuil de réussite par défaut (/100)" rules={[{ required: true }]} extra="Proposé à la création et appliqué aux exercices sans seuil.">
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="seuilMinManager"
                  label="Seuil minimum fixé par un manager (/100)"
                  dependencies={['seuilDefaut']}
                  rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                      validator: (_, v) => (v == null || v <= getFieldValue('seuilDefaut') ? Promise.resolve() : Promise.reject(new Error('Doit être inférieur ou égal au seuil par défaut.'))),
                    }),
                  ]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="tentativesMaxPlafond" label="Plafond de tentatives" rules={[{ required: true }]}>
                  <InputNumber min={1} max={50} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="joursAlerteEcheance" label="Alerte d’échéance (jours avant)" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="joursInactiviteRelance" label="Inactivité avant relance (jours)" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" loading={envoi} onClick={enregistrer}>
              Enregistrer
            </Button>
          </Form>
        </ProCard>
      )}
    </PageContainer>
  );
}
