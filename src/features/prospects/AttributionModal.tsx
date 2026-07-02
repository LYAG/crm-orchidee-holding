'use client';

import { Modal, Select, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { prospectService, utilisateurService } from '@/services';
import type { Prospect, Utilisateur } from '@/types';
import { UserRole } from '@/lib/constants';

const { Text } = Typography;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  managerId?: string;
  onSuccess: () => void;
}

export function AttributionModal({ open, onOpenChange, prospect, managerId, onSuccess }: Props) {
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = managerId
      ? utilisateurService.getDeleguesByManager(managerId)
      : utilisateurService.getByRole(UserRole.DELEGUE);
    load.then(setDelegues).catch(() => {});
  }, [open, managerId]);

  async function handleOk() {
    if (!selectedId || !prospect) return;
    setLoading(true);
    try {
      await prospectService.attribuerAuDelegue(prospect.id, selectedId);
      message.success('Prospect attribué avec succès.');
      onSuccess();
      onOpenChange(false);
      setSelectedId(undefined);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de l\'attribution.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Attribuer le prospect"
      open={open}
      onCancel={() => { onOpenChange(false); setSelectedId(undefined); }}
      onOk={handleOk}
      okText="Attribuer"
      okButtonProps={{ disabled: !selectedId, loading }}
    >
      {prospect && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Prospect : <strong>{prospect.nom} {prospect.prenom}</strong> —{' '}
            {prospect.entreprise}
          </Text>
          <Select
            placeholder="Choisir un délégué"
            style={{ width: '100%' }}
            value={selectedId}
            onChange={setSelectedId}
            options={delegues.map((d) => ({
              value: d.id,
              label: `${d.prenom} ${d.nom}`,
            }))}
          />
        </Space>
      )}
    </Modal>
  );
}
