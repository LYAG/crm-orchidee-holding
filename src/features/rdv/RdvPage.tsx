'use client';

import {
  MedicineBoxOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Empty, Tag, Tooltip, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService, rdvService, utilisateurService } from '@/services';
import type { FiltresRdv, ProfessionnelSante, RendezVous, Utilisateur } from '@/types';
import { CategorieEtablissement } from '@/types';
import { AnnulationModal } from './AnnulationModal';
import { RdvCalendar } from './RdvCalendar';
import type { ViewMode } from './RdvCalendar';

/** Plage de dates couvrant largement la grille affichée pour la vue donnée (avec marge). */
function plagePourVue(viewMode: ViewMode, currentDate: Dayjs): { debut: Dayjs; fin: Dayjs } {
  if (viewMode === 'jour') {
    return { debut: currentDate.startOf('day'), fin: currentDate.endOf('day') };
  }
  if (viewMode === 'mois') {
    return { debut: currentDate.startOf('month').subtract(7, 'day'), fin: currentDate.endOf('month').add(7, 'day') };
  }
  const dow = currentDate.day();
  const monday = currentDate.add(dow === 0 ? -6 : 1 - dow, 'day').startOf('day');
  return { debut: monday, fin: monday.add(6, 'day').endOf('day') };
}
import { RdvDetailDrawer } from './RdvDetailDrawer';
import { RdvDrawerForm } from './RdvDrawerForm';

dayjs.locale('fr');

const { Text } = Typography;

/* ── Config catégorie prospect ───────────────────────────────────────────── */

const CAT_CONFIG: Record<CategorieEtablissement, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  [CategorieEtablissement.MEDECIN]: {
    label: 'Médecins',
    color: '#1565C0',
    bg: '#E3F2FD',
    icon: <MedicineBoxOutlined />,
  },
  [CategorieEtablissement.INFIRMIER]: {
    label: 'Infirmiers',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    icon: <MedicineBoxOutlined />,
  },
  [CategorieEtablissement.PHARMACIE]: {
    label: 'Pharmacies',
    color: '#2E7D32',
    bg: '#E8F5E9',
    icon: <MedicineBoxOutlined />,
  },
};

const CAT_ORDER: CategorieEtablissement[] = [
  CategorieEtablissement.MEDECIN,
  CategorieEtablissement.INFIRMIER,
  CategorieEtablissement.PHARMACIE,
];

/* ── Panel délégués ──────────────────────────────────────────────────────── */

function DeleguePanel({
  delegues,
  selectedId,
  onSelect,
}: {
  delegues: Utilisateur[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        width: 190,
        flexShrink: 0,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#E7F3F0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        background: '#fff',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 72,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 13 }} />
          </div>
          <Text style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Délégués</Text>
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '6px 6px 8px' }}>
        {delegues.length === 0 ? (
          <Text style={{ fontSize: 11, color: '#C7DAD5', display: 'block', textAlign: 'center', padding: '12px 0' }}>
            Aucun délégué
          </Text>
        ) : (
          delegues.map((d) => {
            const isSelected = selectedId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  background: isSelected ? '#E7F3F0' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  marginBottom: 2,
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F2F9F7'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <Text style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? '#123832' : '#1F4E45', fontSize: 12, lineHeight: 1.3 }}>
                  {d.prenom} {d.nom}
                </Text>
                {isSelected && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F6E52', marginTop: 3 }} />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Panel contacts ──────────────────────────────────────────────────────── */

const AUTRES = 'AUTRES' as const;
const AUTRES_CONFIG = { label: 'Autres', color: '#6D7B76', bg: '#EEF1F0', icon: <TeamOutlined /> };

function ContactsPanel({
  professionnels,
  selectedDelegue,
  loading,
}: {
  professionnels: ProfessionnelSante[];
  selectedDelegue: Utilisateur | null;
  loading: boolean;
}) {
  const grouped = CAT_ORDER.reduce<Record<string, ProfessionnelSante[]>>((acc, cat) => {
    acc[cat] = professionnels.filter((p) => p.categorie === cat);
    return acc;
  }, {});
  // Un professionnel sans catégorie renseignée (champ facultatif, souvent absent des
  // fiches créées avant l'ajout de ce champ) ne doit pas disparaître du glisser-déposer.
  grouped[AUTRES] = professionnels.filter((p) => !CAT_ORDER.includes(p.categorie as CategorieEtablissement));

  const hasAny = professionnels.length > 0;

  return (
    <div
      style={{
        width: 210,
        flexShrink: 0,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#E7F3F0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        background: '#fff',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 72,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MedicineBoxOutlined style={{ color: '#fff', fontSize: 13 }} />
          </div>
          <div>
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 13, display: 'block', lineHeight: 1.2 }}>
              {selectedDelegue ? `${selectedDelegue.prenom} ${selectedDelegue.nom}` : 'Contacts'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
              Glisser sur le calendrier
            </Text>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '6px 6px 8px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        {loading ? (
          <Text style={{ fontSize: 11, color: '#C7DAD5', display: 'block', textAlign: 'center', padding: '16px 0' }}>
            Chargement…
          </Text>
        ) : !selectedDelegue && professionnels.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text style={{ fontSize: 11, color: '#C7DAD5' }}>Sélectionnez un délégué</Text>}
            style={{ margin: '14px 0' }}
          />
        ) : !hasAny ? (
          <Text style={{ fontSize: 11, color: '#C7DAD5', display: 'block', textAlign: 'center', padding: '12px 0' }}>
            Aucun contact affecté
          </Text>
        ) : (
          [...CAT_ORDER, AUTRES].map((cat) => {
            const list = grouped[cat];
            if (!list || list.length === 0) return null;
            const cfg = cat === AUTRES ? AUTRES_CONFIG : CAT_CONFIG[cat as CategorieEtablissement];
            return (
              <div key={cat} style={{ marginBottom: 6 }}>
                {/* Label catégorie */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px 4px' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, fontSize: 10 }}>
                    {cfg.icon}
                  </div>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {cfg.label}
                  </Text>
                </div>

                {/* Items draggables */}
                {list.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', p.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '7px 10px',
                      borderRadius: 7,
                      cursor: 'grab',
                      background: '#F7FAF9',
                      marginBottom: 3,
                      borderLeftWidth: 3,
                      borderLeftStyle: 'solid',
                      borderLeftColor: cfg.color,
                      transition: 'box-shadow 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Text style={{ fontWeight: 600, fontSize: 11, color: '#123832', lineHeight: 1.3 }}>
                      {p.titre ? `${p.titre} ` : ''}{p.nom} {p.prenom ?? ''}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#8FB0A8', lineHeight: 1.3, marginTop: 1 }}>
                      {p.telephones[0] ?? ''}
                    </Text>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {hasAny && (
        <div style={{ padding: '8px 12px', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: '#E7F3F0', background: '#F7FAF9' }}>
          <Text style={{ fontSize: 10, color: '#B0C8B0' }}>
            ↕ Glissez un contact sur une date
          </Text>
        </div>
      )}
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */

export function RdvPage() {
  const { user } = useAuth();
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [selectedDelegueId, setSelectedDelegueId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ProfessionnelSante[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [calendarViewMode, setCalendarViewMode] = useState<ViewMode>('semaine');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [formPrefill, setFormPrefill] = useState<{ professionnelId?: string; dateHeure?: string } | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [annulationOpen, setAnnulationOpen] = useState(false);

  // Calculés avant les hooks (avec chaînage optionnel) pour que ceux-ci restent appelés
  // inconditionnellement — le garde-fou `if (!user) return null;` vient après tous les hooks.
  const role = user?.role as UserRole | undefined;
  const isDelegue = role === UserRole.DELEGUE;

  // Pour le délégué connecté, son ID est fixe
  const effectiveDelegueId = isDelegue ? user?.id : (selectedDelegueId ?? undefined);

  // Chargement des RDV — bornés à la plage visible du calendrier plutôt que la table entière.
  const load = useCallback(() => {
    const { debut, fin } = plagePourVue(calendarViewMode, calendarCurrentDate);
    const filtres: FiltresRdv = {
      dateDebut: debut.toISOString(),
      dateFin: fin.toISOString(),
      ...(effectiveDelegueId ? { delegueId: effectiveDelegueId } : {}),
    };
    rdvService.getAll(filtres).then(setRdvList).catch(() => {});
  }, [effectiveDelegueId, calendarViewMode, calendarCurrentDate]);

  useEffect(() => { load(); }, [load]);

  // Chargement des délégués (admin/manager uniquement)
  useEffect(() => {
    if (!user || isDelegue) return;
    const fn = role === UserRole.MANAGER
      ? utilisateurService.getDeleguesByManager(user.id)
      : utilisateurService.getByRole(UserRole.DELEGUE);
    fn.then(setDelegues).catch(() => {});
  }, [role, user, isDelegue]);

  // Chargement des contacts pour le délégué sélectionné (ou le délégué lui-même)
  useEffect(() => {
    queueMicrotask(() => {
      const delegueId = isDelegue ? user?.id : selectedDelegueId;
      if (!delegueId) {
        setContacts([]);
        return;
      }
      setContactsLoading(true);
      professionnelService
        .getProfessionnels({ delegueId })
        .then(setContacts)
        .catch(() => {})
        .finally(() => setContactsLoading(false));
    });
  }, [isDelegue, user?.id, selectedDelegueId]);

  if (!user) return null;

  // Un manager/admin n'est pas lui-même un délégué : tant qu'il n'en a pas choisi un
  // dans le panneau, il n'y a pas de délégué "actif" pour créer un RDV.
  const activeDelegueId = isDelegue ? user.id : selectedDelegueId ?? undefined;
  const selectedDelegue = delegues.find((d) => d.id === selectedDelegueId) ?? null;

  function openNewForm(pf?: { professionnelId?: string; dateHeure?: string }) {
    if (!activeDelegueId) return;
    setEditingRdv(null);
    setFormPrefill(pf);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleDropProfessionnel(professionnelId: string, dateTime: Dayjs) {
    // Vue semaine : dateTime a déjà l'heure du créneau. Vue mois : heure = 0:00 → défaut 9h.
    const final = (dateTime.hour() === 0 && dateTime.minute() === 0)
      ? dateTime.hour(9).minute(0)
      : dateTime;
    openNewForm({ professionnelId, dateHeure: final.second(0).millisecond(0).toISOString() });
  }

  return (
    <PageContainer
      title="Rendez-vous"
      tags={
        <Tag
          style={{
            background: '#E7F3F0',
            color: '#0F6E52',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Calendrier
        </Tag>
      }
      extra={[
        <Tooltip key="create" title={!activeDelegueId ? 'Sélectionnez un délégué dans le panneau pour créer un RDV' : undefined}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!activeDelegueId}
            onClick={() => openNewForm()}
          >
            Nouveau RDV
          </Button>
        </Tooltip>,
      ]}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* ── Panel 1 : liste des délégués (Admin / Manager uniquement) ── */}
        {!isDelegue && delegues.length > 0 && (
          <DeleguePanel
            delegues={delegues}
            selectedId={selectedDelegueId}
            onSelect={(id) => setSelectedDelegueId((prev) => prev === id ? null : id)}
          />
        )}

        {/* ── Panel 2 : contacts du délégué sélectionné ── */}
        <ContactsPanel
          professionnels={contacts}
          selectedDelegue={isDelegue ? (user as unknown as Utilisateur) : selectedDelegue}
          loading={contactsLoading}
        />

        {/* ── Calendrier + panneau agenda ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <RdvCalendar
            rdvList={rdvList}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectRdv={(rdv) => { setSelectedRdv(rdv); setDetailOpen(true); }}
            onDropProfessionnel={handleDropProfessionnel}
            delegues={!isDelegue ? delegues : undefined}
            viewMode={calendarViewMode}
            currentDate={calendarCurrentDate}
            onViewModeChange={setCalendarViewMode}
            onCurrentDateChange={setCalendarCurrentDate}
          />
        </div>
      </div>

      <RdvDrawerForm
        key={formKey}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFormPrefill(undefined);
        }}
        rdv={editingRdv}
        delegueId={editingRdv?.delegueId ?? activeDelegueId ?? ''}
        onSuccess={() => { load(); setFormOpen(false); setFormPrefill(undefined); }}
        prefill={formPrefill}
      />

      <RdvDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        rdv={selectedRdv}
        onEdit={() => {
          setDetailOpen(false);
          setEditingRdv(selectedRdv);
          setFormPrefill(undefined);
          setFormKey((k) => k + 1);
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
