'use client';

import {
  ProFormDigit,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  StepsForm,
} from '@ant-design/pro-components';
import { App, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { professionnelService, zoneService } from '@/services';
import type { Centre, JoursConsultation, PotentielCas, Specialite, Zone } from '@/types';
import { JourSemaine, ModeJoursConsultation, StatutProfessionnel, TitreProfessionnel, TypeCas, UniteCas } from '@/types';

const TITRE_OPTIONS = Object.values(TitreProfessionnel).map((t) => ({ value: t, label: t }));
const JOUR_OPTIONS = Object.values(JourSemaine).map((j) => ({ value: j, label: j }));
const UNITE_OPTIONS = Object.values(UniteCas).map((u) => ({ value: u, label: u.toLowerCase() }));
const TYPE_CAS_OPTIONS = Object.values(TypeCas).map((t) => ({ value: t, label: t.toLowerCase() }));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDelegueId?: string;
  onSuccess: () => void;
}

interface FormValues {
  nom: string;
  prenom?: string;
  titre?: TitreProfessionnel;
  telephones: { numero: string }[];
  observations?: string;
  centreId: string;
  specialiteIds: string[];
  mode: ModeJoursConsultation;
  jours?: JourSemaine[];
  frequenceParSemaine?: number;
  min: number;
  max?: number;
  unite: UniteCas;
  typeCas: TypeCas;
  estMinimum?: boolean;
}

export function ProfessionnelFormModal({ open, onOpenChange, defaultDelegueId, onSuccess }: Props) {
  const { message, modal } = App.useApp();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);

  useEffect(() => {
    if (open) {
      professionnelService.getCentres().then(setCentres).catch(() => {});
      professionnelService.getSpecialites().then(setSpecialites).catch(() => {});
    }
  }, [open]);

  async function handleFinish(values: FormValues) {
    if (!defaultDelegueId) {
      message.error('Aucun délégué courant identifié.');
      return false;
    }

    const nomNormalise = values.nom.trim().toLowerCase();
    const existants = await professionnelService.getProfessionnels({ centreId: values.centreId });
    const doublon = existants.find((p) => p.nom.trim().toLowerCase() === nomNormalise);
    if (doublon) {
      const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: 'Professionnel similaire détecté',
          content: `"${doublon.nom} ${doublon.prenom ?? ''}" existe déjà dans ce centre. Créer quand même "${values.nom}" ?`,
          okText: 'Créer quand même',
          cancelText: 'Annuler',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) return false;
    }

    const joursConsultation: JoursConsultation =
      values.mode === ModeJoursConsultation.JOURS_EXPLICITES
        ? { mode: values.mode, jours: values.jours ?? [] }
        : { mode: values.mode, frequenceParSemaine: values.frequenceParSemaine };

    const potentielCas: PotentielCas | undefined = values.min
      ? { min: values.min, max: values.max, unite: values.unite, typeCas: values.typeCas, estMinimum: values.estMinimum }
      : undefined;

    try {
      await professionnelService.createProfessionnel({
        nom: values.nom,
        prenom: values.prenom,
        titre: values.titre,
        centreId: values.centreId,
        specialiteIds: values.specialiteIds ?? [],
        telephones: (values.telephones ?? []).map((t) => t.numero).filter(Boolean),
        joursConsultation,
        potentielCas,
        delegueId: defaultDelegueId,
        observations: values.observations,
        actif: true,
        statut: StatutProfessionnel.T3,
      });
      message.success('Professionnel créé.');
      onSuccess();
      onOpenChange(false);
      return true;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la création.');
      return false;
    }
  }

  return (
    <Modal
      title="Nouveau professionnel de santé"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={860}
      destroyOnClose
    >
      <StepsForm<FormValues>
        onFinish={handleFinish}
        formProps={{ initialValues: { mode: ModeJoursConsultation.JOURS_EXPLICITES, unite: UniteCas.JOUR, typeCas: TypeCas.CAS } }}
      >
        <StepsForm.StepForm name="identite" title="Identité">
          <ProFormText name="nom" label="Nom" rules={[{ required: true, message: 'Obligatoire.' }]} />
          <ProFormText name="prenom" label="Prénom" />
          <ProFormSelect name="titre" label="Titre" options={TITRE_OPTIONS} />
          <ProFormList name="telephones" label="Téléphone(s)" creatorButtonProps={{ creatorButtonText: 'Ajouter un numéro' }}>
            <ProFormText name="numero" placeholder="0708123456" rules={[{ required: true, message: 'Obligatoire.' }]} />
          </ProFormList>
          <ProFormText name="observations" label="Observations" />
        </StepsForm.StepForm>

        <StepsForm.StepForm name="centreSpecialites" title="Centre & spécialités">
          <ProFormSelect
            name="centreId"
            label="Centre"
            rules={[{ required: true, message: 'Obligatoire.' }]}
            options={centres.map((c) => ({ value: c.id, label: c.nom }))}
          />
          <ProFormSelect
            name="specialiteIds"
            label="Spécialités"
            mode="multiple"
            rules={[{ required: true, message: 'Sélectionnez au moins une spécialité.' }]}
            options={specialites.map((s) => ({ value: s.id, label: s.libelle }))}
          />
        </StepsForm.StepForm>

        <StepsForm.StepForm name="disponibilites" title="Disponibilités">
          <ProFormRadio.Group
            name="mode"
            label="Mode"
            options={[
              { value: ModeJoursConsultation.JOURS_EXPLICITES, label: 'Jours précis' },
              { value: ModeJoursConsultation.FREQUENCE, label: 'Fréquence / semaine' },
            ]}
          />
          <ProFormSelect name="jours" label="Jours de consultation" mode="multiple" options={JOUR_OPTIONS} />
          <ProFormDigit name="frequenceParSemaine" label="Fois par semaine" min={1} max={7} />
        </StepsForm.StepForm>

        <StepsForm.StepForm name="potentiel" title="Potentiel de cas">
          <ProFormDigit name="min" label="Minimum" min={0} rules={[{ required: true, message: 'Obligatoire.' }]} />
          <ProFormDigit name="max" label="Maximum (optionnel)" min={0} />
          <ProFormSelect name="unite" label="Unité" options={UNITE_OPTIONS} rules={[{ required: true }]} />
          <ProFormSelect name="typeCas" label="Type de cas" options={TYPE_CAS_OPTIONS} rules={[{ required: true }]} />
          <ProFormSwitch name="estMinimum" label="C'est un minimum garanti" />
        </StepsForm.StepForm>
      </StepsForm>
    </Modal>
  );
}
