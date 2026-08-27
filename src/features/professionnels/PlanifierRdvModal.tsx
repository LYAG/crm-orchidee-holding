'use client';

import { Alert, App, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, rdvService, supportService } from '@/services';
import type { ProfessionnelSante, SupportCommercial } from '@/types';
import { estDisponibleCeJour, formatJoursConsultation, jourSemaineDepuisDate, JOUR_LABELS } from './utils';

interface Props {
  open: boolean;
  professionnel: ProfessionnelSante;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  date: dayjs.Dayjs;
  dureeMinutes: number;
  supportId: string;
  notes?: string;
}

export function PlanifierRdvModal({ open, professionnel, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [supports, setSupports] = useState<SupportCommercial[]>([]);
  const [saving, setSaving] = useState(false);
  const dateValue = Form.useWatch('date', form);

  useEffect(() => {
    if (open) {
      supportService.getAll().then(setSupports);
      form.resetFields();
      form.setFieldsValue({ dureeMinutes: 30 });
    }
  }, [open, form]);

  const isDelegue = user?.role === UserRole.DELEGUE;
  const jourChoisi = dateValue ? jourSemaineDepuisDate(dateValue.format('YYYY-MM-DD')) : null;
  const disponible = jourChoisi ? estDisponibleCeJour(professionnel.joursConsultation, jourChoisi) : true;
  const bloque = isDelegue && jourChoisi && !disponible;

  async function handleOk() {
    if (!user || bloque) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await rdvService.create({
        professionnelId: professionnel.id,
        delegueId: user.id,
        supportId: values.supportId,
        // Le DatePicker fournit un dayjs local ; on formate en LocalDateTime ISO ('T',
        // sans fuseau) plutôt que toISOString() qui convertit en UTC (heure décalée).
        dateHeure: values.date.format('YYYY-MM-DDTHH:mm:ss'),
        dureeMinutes: values.dureeMinutes,
        notes: values.notes,
        forcer: !isDelegue,
      });
      if (!professionnel.aDejaEuContact) {
        await professionnelService.marquerContactEffectue(professionnel.id);
      }
      message.success('RDV planifié.');
      onSaved();
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la planification.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Planifier un RDV — ${professionnel.nom} ${professionnel.prenom ?? ''}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText="Planifier"
      okButtonProps={{ disabled: bloque }}
      cancelText="Annuler"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="date" label="Date et heure" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="DD/MM/YYYY HH:mm"
            disabledDate={(current) => {
              if (!isDelegue || !current) return false;
              const jour = jourSemaineDepuisDate(current.format('YYYY-MM-DD'));
              return !estDisponibleCeJour(professionnel.joursConsultation, jour);
            }}
          />
        </Form.Item>

        {jourChoisi && !disponible && (
          <Alert
            type={isDelegue ? 'error' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
            message={
              isDelegue
                ? `${JOUR_LABELS[jourChoisi]} n'est pas un jour de consultation pour ce professionnel.`
                : `Attention : ${JOUR_LABELS[jourChoisi]} n'est pas un jour de consultation habituel (autorisé pour votre rôle).`
            }
            description={`Ce professionnel consulte : ${formatJoursConsultation(professionnel.joursConsultation)}.`}
          />
        )}

        <Form.Item name="dureeMinutes" label="Durée (minutes)" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <InputNumber style={{ width: '100%' }} min={5} step={5} />
        </Form.Item>
        <Form.Item name="supportId" label="Support commercial" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select options={supports.map((s) => ({ value: s.id, label: s.titre }))} />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
