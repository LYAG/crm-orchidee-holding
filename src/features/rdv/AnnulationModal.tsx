'use client';

import { Form, Input, Modal, message } from 'antd';
import { useState } from 'react';
import { rdvService } from '@/services';
import type { RendezVous } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rdv: RendezVous | null;
  onSuccess: () => void;
}

export function AnnulationModal({ open, onOpenChange, rdv, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function handleOk() {
    const { motif } = await form.validateFields();
    if (!rdv) return;
    setLoading(true);
    try {
      await rdvService.annuler(rdv.id, motif);
      message.success('Rendez-vous annulé.');
      form.resetFields();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Annuler le rendez-vous"
      open={open}
      onCancel={() => { form.resetFields(); onOpenChange(false); }}
      onOk={handleOk}
      okText="Confirmer l'annulation"
      okButtonProps={{ danger: true, loading }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="motif"
          label="Motif d'annulation"
          rules={[{ required: true, message: 'Un motif est requis.' }]}
        >
          <Input.TextArea rows={3} placeholder="Décrivez la raison de l'annulation…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
