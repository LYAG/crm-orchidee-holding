'use client';

import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { rdvService, utilisateurService } from '@/services';
import type { RendezVous, Utilisateur } from '@/types';
import { AnnulationModal } from './AnnulationModal';
import { RdvCalendar } from './RdvCalendar';
import { RdvDetailDrawer } from './RdvDetailDrawer';
import { RdvDrawerForm } from './RdvDrawerForm';

dayjs.locale('fr');

export function RdvPage() {
  const { user } = useAuth();
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [filterDelegueId, setFilterDelegueId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [annulationOpen, setAnnulationOpen] = useState(false);

  if (!user) return null;

  const role = user.role as UserRole;

  const effectiveDelegueId =
    role === UserRole.DELEGUE ? user.id : filterDelegueId;

  const load = useCallback(() => {
    const filtres = effectiveDelegueId ? { delegueId: effectiveDelegueId } : undefined;
    rdvService.getAll(filtres).then(setRdvList).catch(() => {});
  }, [effectiveDelegueId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (role !== UserRole.DELEGUE) {
      const fn = role === UserRole.MANAGER
        ? utilisateurService.getDeleguesByManager(user.id)
        : utilisateurService.getByRole(UserRole.DELEGUE);
      fn.then(setDelegues).catch(() => {});
    }
  }, [role, user.id]);

  const activeDelegueId = role === UserRole.DELEGUE ? user.id : (filterDelegueId ?? user.id);

  return (
    <PageContainer
      title="Rendez-vous"
      extra={[
        (role === UserRole.MANAGER || role === UserRole.ADMIN) && delegues.length > 0 && (
          <Select
            key="delegue-filter"
            placeholder="Tous les délégués"
            allowClear
            style={{ width: 200 }}
            value={filterDelegueId}
            onChange={setFilterDelegueId}
            options={delegues.map((d) => ({
              value: d.id,
              label: `${d.prenom} ${d.nom}`,
            }))}
          />
        ),
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingRdv(null); setFormOpen(true); }}
        >
          Nouveau RDV
        </Button>,
      ].filter(Boolean)}
    >
      <RdvCalendar
        rdvList={rdvList}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onSelectRdv={(rdv) => { setSelectedRdv(rdv); setDetailOpen(true); }}
      />

      <RdvDrawerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        rdv={editingRdv}
        delegueId={activeDelegueId}
        onSuccess={() => { load(); setFormOpen(false); }}
      />

      <RdvDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        rdv={selectedRdv}
        onEdit={() => {
          setDetailOpen(false);
          setEditingRdv(selectedRdv);
          setFormOpen(true);
        }}
        onAnnuler={() => {
          setDetailOpen(false);
          setAnnulationOpen(true);
        }}
      />

      <AnnulationModal
        open={annulationOpen}
        onOpenChange={setAnnulationOpen}
        rdv={selectedRdv}
        onSuccess={() => { load(); setSelectedRdv(null); }}
      />
    </PageContainer>
  );
}
