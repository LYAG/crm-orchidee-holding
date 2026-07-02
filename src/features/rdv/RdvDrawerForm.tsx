'use client';

import {
  DrawerForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { prospectService, rdvService, supportService } from '@/services';
import type { Prospect, RendezVous, SupportCommercial } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rdv?: RendezVous | null;
  delegueId: string;
  onSuccess: () => void;
}

export function RdvDrawerForm({ open, onOpenChange, rdv, delegueId, onSuccess }: Props) {
  const isEdit = !!rdv;
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [supports, setSupports] = useState<SupportCommercial[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      prospectService.getAll({ delegueId }),
      supportService.getAll(),
    ])
      .then(([p, s]) => { setProspects(p); setSupports(s); })
      .catch(() => {});
  }, [open, delegueId]);

  async function handleFinish(values: Record<string, unknown>) {
    try {
      if (isEdit && rdv) {
        await rdvService.update(rdv.id, {
          dateHeure: values.dateHeure as string,
          dureeMinutes: values.dureeMinutes as number,
          supportId: values.supportId as string,
          notes: values.notes as string | undefined,
        });
        message.success('Rendez-vous mis à jour.');
      } else {
        await rdvService.create({
          prospectId: values.prospectId as string,
          delegueId,
          supportId: values.supportId as string,
          dateHeure: values.dateHeure as string,
          dureeMinutes: values.dureeMinutes as number,
          notes: values.notes as string | undefined,
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
    <DrawerForm
      title={isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleFinish}
      initialValues={
        rdv
          ? {
              prospectId: rdv.prospectId,
              dateHeure: rdv.dateHeure,
              dureeMinutes: rdv.dureeMinutes,
              supportId: rdv.supportId,
              notes: rdv.notes,
            }
          : { dureeMinutes: 60 }
      }
      submitter={{ searchConfig: { submitText: isEdit ? 'Enregistrer' : 'Créer' } }}
      width={480}
    >
      <ProFormSelect
        name="prospectId"
        label="Prospect"
        disabled={isEdit}
        rules={[{ required: true, message: 'Sélectionnez un prospect.' }]}
        options={prospects.map((p) => ({
          value: p.id,
          label: `${p.nom} ${p.prenom ?? ''} — ${p.entreprise}`,
        }))}
        showSearch
        fieldProps={{ optionFilterProp: 'label' }}
      />
      <ProFormDateTimePicker
        name="dateHeure"
        label="Date et heure"
        rules={[{ required: true, message: 'La date est requise.' }]}
        fieldProps={{ format: 'DD/MM/YYYY HH:mm', minuteStep: 15 }}
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
