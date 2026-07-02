'use client';

import {
  DrawerForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App } from 'antd';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { opportuniteService, prospectService, utilisateurService } from '@/services';
import { OpportuniteEtape, ProspectStatut } from '@/types';
import type { Opportunite, Prospect, Utilisateur } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (created: Opportunite) => void;
}

export function NouvelleOpportuniteDrawer({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedDelegueId, setSelectedDelegueId] = useState<string | undefined>(
    user?.role === UserRole.DELEGUE ? user.id : undefined,
  );

  useEffect(() => {
    if (!open || !user) return;

    const loadDelegues = async () => {
      if (user.role === UserRole.MANAGER) {
        return utilisateurService.getDeleguesByManager(user.id);
      } else if (user.role === UserRole.ADMIN) {
        return utilisateurService.getByRole(UserRole.DELEGUE);
      }
      return [user as Utilisateur];
    };

    loadDelegues()
      .then((d) => {
        setDelegues(d);
        if (d.length > 0 && !selectedDelegueId) {
          setSelectedDelegueId(d[0].id);
        }
      })
      .catch(() => {});
  }, [open, user]);

  useEffect(() => {
    if (!selectedDelegueId) return;
    prospectService
      .getAll({ delegueId: selectedDelegueId })
      .then((p) => setProspects(p.filter((pr) => pr.statut !== ProspectStatut.CLIENT)))
      .catch(() => {});
  }, [selectedDelegueId]);

  if (!user) return null;

  const isDelegue = user.role === UserRole.DELEGUE;

  return (
    <DrawerForm
      title="Nouvelle opportunité"
      open={open}
      onOpenChange={onOpenChange}
      drawerProps={{ width: 480 }}
      onFinish={async (values) => {
        try {
          const created = await opportuniteService.create({
            prospectId: values.prospectId,
            delegueId: isDelegue ? user.id : values.delegueId,
            titre: values.titre,
            montantEstime: values.montantEstime,
            probabilite: values.probabilite ?? 10,
            etape: OpportuniteEtape.IDENTIFIEE,
            rdvIds: [],
          });
          message.success('Opportunité créée avec succès.');
          onSuccess(created);
          return true;
        } catch {
          message.error('Erreur lors de la création.');
          return false;
        }
      }}
    >
      {!isDelegue && delegues.length > 0 && (
        <ProFormSelect
          name="delegueId"
          label="Délégué responsable"
          rules={[{ required: true }]}
          onChange={(v) => setSelectedDelegueId(v as string)}
          options={delegues.map((d) => ({
            value: d.id,
            label: `${d.prenom} ${d.nom}`,
          }))}
        />
      )}

      <ProFormSelect
        name="prospectId"
        label="Prospect"
        rules={[{ required: true, message: 'Sélectionnez un prospect.' }]}
        options={prospects.map((p) => ({
          value: p.id,
          label: `${p.nom} ${p.prenom ?? ''} — ${p.entreprise}`,
        }))}
        placeholder="Sélectionner un prospect"
      />

      <ProFormText
        name="titre"
        label="Titre de l'opportunité"
        rules={[{ required: true, message: 'Saisissez un titre.' }]}
        placeholder="Ex : Contrat maintenance annuel — Entreprise X"
      />

      <ProFormDigit
        name="montantEstime"
        label="Montant estimé (€)"
        rules={[{ required: true, message: 'Saisissez un montant.' }]}
        min={0}
        fieldProps={{ step: 500 }}
      />

      <ProFormDigit
        name="probabilite"
        label="Probabilité (%)"
        min={0}
        max={100}
        initialValue={10}
        fieldProps={{ step: 5 }}
      />
    </DrawerForm>
  );
}
