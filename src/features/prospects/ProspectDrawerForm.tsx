'use client';

import {
  DrawerForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { prospectService, zoneService } from '@/services';
import type { Prospect, Zone } from '@/types';
import { ProspectStatut } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: Prospect | null;
  onSuccess: () => void;
  defaultZoneId?: string;
}

export function ProspectDrawerForm({ open, onOpenChange, prospect, onSuccess, defaultZoneId }: Props) {
  const isEdit = !!prospect;
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    zoneService.getAll().then(setZones).catch(() => {});
  }, []);

  async function handleFinish(values: Record<string, string>) {
    try {
      if (isEdit && prospect) {
        await prospectService.update(prospect.id, values);
        message.success('Prospect mis à jour.');
      } else {
        await prospectService.create({
          ...values,
          zoneId: values.zoneId ?? defaultZoneId ?? '',
          statut: ProspectStatut.PNA,
        } as Omit<Prospect, 'id' | 'dateCreation' | 'aEuRdv'>);
        message.success('Prospect créé avec succès.');
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
      title={isEdit ? 'Modifier le prospect' : 'Nouveau prospect'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleFinish}
      initialValues={prospect ?? {}}
      submitter={{ searchConfig: { submitText: isEdit ? 'Enregistrer' : 'Créer' } }}
      width={480}
    >
      <ProFormText
        name="nom"
        label="Nom"
        rules={[{ required: true, message: 'Le nom est requis.' }]}
      />
      <ProFormText name="prenom" label="Prénom" />
      <ProFormText
        name="entreprise"
        label="Entreprise"
        rules={[{ required: true, message: "L'entreprise est requise." }]}
      />
      <ProFormText name="email" label="E-mail" fieldProps={{ type: 'email' }} />
      <ProFormText name="telephone" label="Téléphone" />
      <ProFormSelect
        name="zoneId"
        label="Zone"
        rules={[{ required: true, message: 'La zone est requise.' }]}
        options={zones.map((z) => ({ value: z.id, label: z.nom }))}
      />
      <ProFormText name="adresse" label="Adresse" />
      <ProFormTextArea name="notes" label="Notes" fieldProps={{ rows: 3 }} />
    </DrawerForm>
  );
}
