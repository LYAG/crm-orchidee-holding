'use client';

import {
  DrawerForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Alert, App, Form } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, rdvService, supportService } from '@/services';
import type { ProfessionnelSante, RendezVous, SupportCommercial } from '@/types';
import { estDisponibleCeJour, formatJoursConsultation, jourSemaineDepuisDate } from '../professionnels/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rdv?: RendezVous | null;
  delegueId: string;
  onSuccess: () => void;
  prefill?: { professionnelId?: string; dateHeure?: string };
}

interface FormValues {
  professionnelId: string;
  dateHeure: string;
  dureeMinutes: number;
  supportId: string;
  notes?: string;
}

export function RdvDrawerForm({ open, onOpenChange, rdv, delegueId, onSuccess, prefill }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const isEdit = !!rdv;
  const isDelegue = user?.role === UserRole.DELEGUE;
  const [form] = Form.useForm<FormValues>();
  const [professionnels, setProfessionnels] = useState<ProfessionnelSante[]>([]);
  const [supports, setSupports] = useState<SupportCommercial[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      professionnelService.getProfessionnels({ delegueId }),
      supportService.getAll(),
    ])
      .then(([p, s]) => { setProfessionnels(p); setSupports(s); })
      .catch(() => {});
  }, [open, delegueId]);

  const professionnelIdChoisi = Form.useWatch('professionnelId', form) ?? rdv?.professionnelId;
  const dateHeureChoisie = Form.useWatch('dateHeure', form);
  const professionnelSelectionne = professionnels.find((p) => p.id === professionnelIdChoisi) ?? null;
  const jourChoisi = dateHeureChoisie ? jourSemaineDepuisDate(dayjs(dateHeureChoisie).format('YYYY-MM-DD')) : null;
  const disponible = professionnelSelectionne && jourChoisi
    ? estDisponibleCeJour(professionnelSelectionne.joursConsultation, jourChoisi)
    : true;

  async function handleFinish(values: FormValues) {
    // ProFormDateTimePicker soumet par défaut "YYYY-MM-DD HH:mm:ss" (espace) — le
    // LocalDateTime du backend attend un séparateur 'T' (ISO_LOCAL_DATE_TIME).
    const dateHeure = dayjs(values.dateHeure).format('YYYY-MM-DDTHH:mm:ss');
    // Le blocage strict (jours de consultation) ne s'applique qu'au délégué : un
    // manager/admin peut forcer une exception, le backend l'autorise via `forcer`.
    const forcer = !isDelegue;
    try {
      if (isEdit && rdv) {
        await rdvService.update(rdv.id, {
          dateHeure,
          dureeMinutes: values.dureeMinutes,
          supportId: values.supportId,
          notes: values.notes,
          forcer,
        });
        message.success('Rendez-vous mis à jour.');
      } else {
        await rdvService.create({
          professionnelId: values.professionnelId,
          delegueId,
          supportId: values.supportId,
          dateHeure,
          dureeMinutes: values.dureeMinutes,
          notes: values.notes,
          forcer,
        });
        message.success('Rendez-vous créé avec succès.');
      }
      onSuccess();
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Une erreur est survenue.');
      return false;
    }
  }

  return (
    <DrawerForm<FormValues>
      form={form}
      title={isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleFinish}
      initialValues={
        rdv
          ? {
              professionnelId: rdv.professionnelId,
              dateHeure: rdv.dateHeure,
              dureeMinutes: rdv.dureeMinutes,
              supportId: rdv.supportId,
              notes: rdv.notes,
            }
          : { dureeMinutes: 60, ...prefill }
      }
      submitter={{ searchConfig: { submitText: isEdit ? 'Enregistrer' : 'Créer' } }}
      width={480}
    >
      <ProFormSelect
        name="professionnelId"
        label="Professionnel de santé"
        disabled={isEdit}
        rules={[{ required: true, message: 'Sélectionnez un professionnel de santé.' }]}
        options={professionnels.map((p) => ({
          value: p.id,
          label: `${p.titre ? p.titre + ' ' : ''}${p.nom} ${p.prenom ?? ''}`,
        }))}
        showSearch
        fieldProps={{ optionFilterProp: 'label' }}
      />

      {professionnelSelectionne && jourChoisi && !disponible && (
        <Alert
          type={isDelegue ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            isDelegue
              ? "Ce professionnel ne consulte pas ce jour-là."
              : "Attention : ce professionnel ne consulte pas ce jour-là (autorisé pour votre rôle)."
          }
          description={`Jours de consultation : ${formatJoursConsultation(professionnelSelectionne.joursConsultation)}.`}
        />
      )}

      <ProFormDateTimePicker
        name="dateHeure"
        label="Date et heure"
        rules={[
          { required: true, message: 'La date est requise.' },
          {
            validator: async (_, value: string | undefined) => {
              if (!isDelegue || !value || !professionnelSelectionne) return;
              const jour = jourSemaineDepuisDate(dayjs(value).format('YYYY-MM-DD'));
              if (!estDisponibleCeJour(professionnelSelectionne.joursConsultation, jour)) {
                throw new Error(
                  `Ce professionnel ne consulte pas ce jour-là (${formatJoursConsultation(professionnelSelectionne.joursConsultation)}).`,
                );
              }
            },
          },
        ]}
        fieldProps={{
          format: 'DD/MM/YYYY HH:mm',
          minuteStep: 15,
          disabledDate: (current) => {
            if (!isDelegue || !professionnelSelectionne || !current) return false;
            const jour = jourSemaineDepuisDate(current.format('YYYY-MM-DD'));
            return !estDisponibleCeJour(professionnelSelectionne.joursConsultation, jour);
          },
        }}
      />
      <ProFormDigit
        name="dureeMinutes"
        label="Durée (minutes)"
        rules={[{ required: true, message: 'La durée est requise.' }]}
        min={15}
        max={480}
        fieldProps={{ step: 15 }}
      />
      <ProFormSelect
        name="supportId"
        label="Support commercial"
        rules={[{ required: true, message: 'Un support est obligatoire.' }]}
        options={supports.map((s) => ({
          value: s.id,
          label: `${s.titre} (${s.nombreSlides} slides)`,
        }))}
      />
      <ProFormTextArea
        name="notes"
        label="Notes"
        fieldProps={{ rows: 3 }}
      />
    </DrawerForm>
  );
}
