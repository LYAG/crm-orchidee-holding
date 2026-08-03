'use client';

import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, List, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { rdvService } from '@/services';
import type { ProfessionnelSante, RendezVous } from '@/types';
import { RdvStatut } from '@/types';
import { PlanifierRdvModal } from './PlanifierRdvModal';

const STATUT_LABELS: Record<RdvStatut, { label: string; color: string }> = {
  [RdvStatut.PLANIFIE]: { label: 'Planifié', color: 'blue' },
  [RdvStatut.EN_COURS]: { label: 'En cours', color: 'gold' },
  [RdvStatut.REALISE]: { label: 'Réalisé', color: 'green' },
  [RdvStatut.ANNULE]: { label: 'Annulé', color: 'default' },
};

interface Props {
  professionnel: ProfessionnelSante;
  onProfessionnelChanged: () => void;
}

export function HistoriqueRdvTab({ professionnel, onProfessionnelChanged }: Props) {
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    rdvService.getAll({ professionnelId: professionnel.id }).then(setRdvs);
    onProfessionnelChanged();
  }

  useEffect(() => {
    load();
  }, [professionnel.id]);

  const aVenir = rdvs.filter((r) => r.statut === RdvStatut.PLANIFIE).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  const passes = rdvs.filter((r) => r.statut !== RdvStatut.PLANIFIE).sort((a, b) => b.dateHeure.localeCompare(a.dateHeure));

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)} style={{ marginBottom: 20 }}>
        Planifier un RDV
      </Button>

      {rdvs.length === 0 ? (
        <Empty description="Aucun RDV enregistré" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          {aVenir.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase', marginBottom: 8 }}>
                À venir
              </div>
              <List
                dataSource={aVenir}
                renderItem={(r) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CalendarOutlined style={{ color: '#0F6E52', fontSize: 18 }} />}
                      title={new Date(r.dateHeure).toLocaleString('fr-FR')}
                      description={<Tag color={STATUT_LABELS[r.statut].color}>{STATUT_LABELS[r.statut].label}</Tag>}
                    />
                  </List.Item>
                )}
                style={{ marginBottom: 20 }}
              />
            </>
          )}
          {passes.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase', marginBottom: 8 }}>
                Historique
              </div>
              <List
                dataSource={passes}
                renderItem={(r) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CalendarOutlined style={{ color: '#8FB0A8', fontSize: 18 }} />}
                      title={new Date(r.dateHeure).toLocaleString('fr-FR')}
                      description={<Tag color={STATUT_LABELS[r.statut].color}>{STATUT_LABELS[r.statut].label}</Tag>}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </>
      )}

      <PlanifierRdvModal
        open={modalOpen}
        professionnel={professionnel}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
