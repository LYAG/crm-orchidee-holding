'use client';

import { App, Form, Input, Modal, Select } from 'antd';
import { useState } from 'react';
import { messagerieService } from '@/services';
import { messageErreur } from './format';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Valeurs {
  destinataires: string[];
  copie?: string[];
  sujet: string;
  corps: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onEnvoye: () => void;
}

const validerAdresses = (obligatoire: boolean) => ({
  validator: (_: unknown, v?: string[]) => {
    if (obligatoire && (!v || v.length === 0))
      return Promise.reject(new Error('Au moins un destinataire est obligatoire.'));
    const invalide = (v ?? []).find((a) => !EMAIL.test(a.trim()));
    return invalide
      ? Promise.reject(new Error(`Adresse invalide : ${invalide}`))
      : Promise.resolve();
  },
});

/** Rédaction d'un e-mail texte envoyé avec le compte de messagerie du CRM. */
export function NouveauMessageModal({ open, onClose, onEnvoye }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    const v = await form.validateFields();
    setEnvoi(true);
    try {
      await messagerieService.envoyer({
        destinataires: v.destinataires.map((a) => a.trim()),
        copie: v.copie?.map((a) => a.trim()),
        sujet: v.sujet,
        corps: v.corps,
      });
      message.success('E-mail envoyé.');
      form.resetFields();
      onEnvoye();
    } catch (err) {
      message.error(messageErreur(err, "L'e-mail n'a pas pu être envoyé."));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nouveau message"
      okText="Envoyer"
      cancelText="Annuler"
      onOk={envoyer}
      onCancel={onClose}
      confirmLoading={envoi}
      width={640}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical">
        <Form.Item name="destinataires" label="À" required rules={[validerAdresses(true)]}>
          <Select
            mode="tags"
            tokenSeparators={[',', ';', ' ']}
            open={false}
            suffixIcon={null}
            placeholder="adresse@exemple.com"
          />
        </Form.Item>
        <Form.Item name="copie" label="Cc" rules={[validerAdresses(false)]}>
          <Select
            mode="tags"
            tokenSeparators={[',', ';', ' ']}
            open={false}
            suffixIcon={null}
            placeholder="Facultatif"
          />
        </Form.Item>
        <Form.Item
          name="sujet"
          label="Objet"
          rules={[{ required: true, whitespace: true, message: "L'objet est obligatoire." }]}
        >
          <Input maxLength={500} />
        </Form.Item>
        <Form.Item
          name="corps"
          label="Message"
          rules={[{ required: true, whitespace: true, message: 'Le message est obligatoire.' }]}
        >
          <Input.TextArea autoSize={{ minRows: 8, maxRows: 18 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
