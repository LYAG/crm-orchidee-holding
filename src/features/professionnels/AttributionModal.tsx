'use client';

import { App, Modal, Select } from 'antd';
import { useState } from 'react';
import { professionnelService } from '@/services';
import type { ProfessionnelSante, Utilisateur } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionnel: ProfessionnelSante | null;
  delegues: Utilisateur[];
  onSuccess: () => void;
}

export function AttributionModal({ open, onOpenChange, professionnel, delegues, onSuccess }: Props) {
  const { message } = App.useApp();
  const [delegueId, setDelegueId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleOk() {
    if (!professionnel || !delegueId) return;
    setLoading(true);
    try {
      await professionnelService.attribuerAuDelegue(professionnel.id, delegueId);
      message.success('Professionnel attribué avec succès.');
      onOpenChange(false);
      setDelegueId(undefined);
      onSuccess();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Erreur lors de l'attribution.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Attribuer ce professionnel"
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      okButtonProps={{ disabled: !delegueId, loading }}
      okText="Attribuer"
    >
      <Select
        style={{ width: '100%' }}
        placeholder="Sélectionner un délégué"
        value={delegueId}
        onChange={setDelegueId}
        options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))}
      />
    </Modal>
  );
}
