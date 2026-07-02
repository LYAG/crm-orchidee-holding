'use client';

import { ProDescriptions } from '@ant-design/pro-components';
import { Button, Drawer, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { prospectService, supportService } from '@/services';
import type { Prospect, RendezVous, SupportCommercial } from '@/types';
import { RdvStatut } from '@/types';

const { Text } = Typography;

const STATUT_COLORS: Record<RdvStatut, string> = {
  [RdvStatut.PLANIFIE]: 'blue',
  [RdvStatut.EN_COURS]: 'processing',
  [RdvStatut.REALISE]: 'green',
  [RdvStatut.ANNULE]: 'default',
};

const STATUT_LABELS: Record<RdvStatut, string> = {
  [RdvStatut.PLANIFIE]: 'Planifié',
  [RdvStatut.EN_COURS]: 'En cours',
  [RdvStatut.REALISE]: 'Réalisé',
  [RdvStatut.ANNULE]: 'Annulé',
};

interface Props {
  open: boolean;
  onClose: () => void;
  rdv: RendezVous | null;
  onEdit: () => void;
  onAnnuler: () => void;
}

export function RdvDetailDrawer({ open, onClose, rdv, onEdit, onAnnuler }: Props) {
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [support, setSupport] = useState<SupportCommercial | null>(null);

  useEffect(() => {
    if (!rdv || !open) return;
    Promise.all([
      prospectService.getById(rdv.prospectId),
      supportService.getById(rdv.supportId),
    ])
      .then(([p, s]) => { setProspect(p); setSupport(s); })
      .catch(() => {});
  }, [rdv, open]);

  if (!rdv) return null;

  const isPasse = new Date(rdv.dateHeure) < new Date();
  const isAnnulable = rdv.statut === RdvStatut.PLANIFIE;
  const isEditable = rdv.statut === RdvStatut.PLANIFIE;

  return (
    <Drawer
      title="Détail du rendez-vous"
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          {isEditable && (
            <Button onClick={onEdit}>Modifier</Button>
          )}
          {isAnnulable && (
            <Button danger onClick={onAnnuler}>Annuler</Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <ProDescriptions column={1} size="small">
          <ProDescriptions.Item label="Statut">
            <Tag color={STATUT_COLORS[rdv.statut]}>{STATUT_LABELS[rdv.statut]}</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="Date & heure">
            {new Date(rdv.dateHeure).toLocaleString('fr-FR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="Durée">
            {rdv.dureeMinutes} min
          </ProDescriptions.Item>
          <ProDescriptions.Item label="Prospect">
            {prospect ? `${prospect.nom} ${prospect.prenom ?? ''} — ${prospect.entreprise}` : '—'}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="Support">
            {support ? `${support.titre} (${support.nombreSlides} slides)` : '—'}
          </ProDescriptions.Item>
          {rdv.motifAnnulation && (
            <ProDescriptions.Item label="Motif annulation">
              {rdv.motifAnnulation}
            </ProDescriptions.Item>
          )}
          {rdv.notes && (
            <ProDescriptions.Item label="Notes">
              {rdv.notes}
            </ProDescriptions.Item>
          )}
        </ProDescriptions>

        {!isPasse && rdv.statut === RdvStatut.PLANIFIE && support && (
          <Button
            block
            onClick={() => {
              onClose();
              router.push(`/supports/${rdv.supportId}/presentation?rdvId=${rdv.id}`);
            }}
          >
            Lancer la présentation
          </Button>
        )}

        {isPasse && rdv.statut === RdvStatut.REALISE && (
          <Button
            type="primary"
            block
            onClick={() => {
              onClose();
              router.push(`/rdv/${rdv.id}/qualification`);
            }}
          >
            {rdv.qualifie ? 'Voir la qualification' : 'Qualifier ce RDV'}
          </Button>
        )}
      </Space>
    </Drawer>
  );
}
