'use client';

import { App, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatFcfa } from '@/lib/format';
import { professionnelService } from '@/services';
import type { GesteMarketing } from '@/types';

interface Props {
  open: boolean;
  professionnelId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  gesteMarketingId: string;
  date: dayjs.Dayjs;
  coutFcfa?: number;
  commentaire?: string;
}

export function EnregistrerGesteModal({ open, professionnelId, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [gestes, setGestes] = useState<GesteMarketing[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      professionnelService.getGestesMarketing().then((g) => setGestes(g.filter((x) => x.actif)));
      form.resetFields();
      form.setFieldsValue({ date: dayjs() });
    }
  }, [open, form]);

  function handleGesteChange(gesteMarketingId: string) {
    const geste = gestes.find((g) => g.id === gesteMarketingId);
    if (geste?.coutIndicatifFcfa != null) {
      form.setFieldsValue({ coutFcfa: geste.coutIndicatifFcfa });
    }
  }

  async function handleOk() {
    if (!user) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await professionnelService.enregistrerGeste({
        professionnelId,
        delegueId: user.id,
        gesteMarketingId: values.gesteMarketingId,
        date: values.date.format('YYYY-MM-DD'),
        coutFcfa: values.coutFcfa,
        commentaire: values.commentaire,
      });
      message.success('Geste enregistré.');
      onSaved();
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Enregistrer un geste"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="gesteMarketingId" label="Geste" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select
            onChange={handleGesteChange}
            options={gestes.map((g) => ({
              value: g.id,
              label: g.coutIndicatifFcfa != null ? `${g.libelle} (${formatFcfa(g.coutIndicatifFcfa)})` : g.libelle,
            }))}
          />
        </Form.Item>
        <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="coutFcfa" label="Coût réel (FCFA)">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="commentaire" label="Commentaire">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
