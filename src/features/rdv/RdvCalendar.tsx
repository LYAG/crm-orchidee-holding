'use client';

import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Button, Empty, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import type { RendezVous } from '@/types';
import { RdvStatut } from '@/types';

const { Text } = Typography;

/* ── Constantes grille ───────────────────────────────────────────────────── */

const START_HOUR = 8;
const END_HOUR = 19;
const SLOT_H = 44;           // hauteur d'un créneau 30 min (px)
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;
const GRID_H = TOTAL_SLOTS * SLOT_H;
const TIME_COL_W = 56;

type ViewMode = 'semaine' | 'mois' | 'jour';

const VIEW_LABELS: Record<ViewMode, string> = {
  semaine: 'Semaine',
  mois: 'Mois',
  jour: 'Jour',
};

const LEGEND = [
  { color: '#1565C0', label: 'À venir' },
  { color: '#E65100', label: 'À qualifier' },
  { color: '#2E7D32', label: 'Qualifié' },
  { color: '#9E9E9E', label: 'Annulé' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

interface RdvConfig { bg: string; color: string; label: string; icon: React.ReactNode }

function getRdvConfig(rdv: RendezVous): RdvConfig {
  if (rdv.statut === RdvStatut.ANNULE)
    return { bg: '#F5F5F5', color: '#9E9E9E', label: 'Annulé', icon: <CloseCircleFilled /> };
  const isPasse = new Date(rdv.dateHeure) < new Date();
  if (!isPasse)
    return { bg: '#EBF3FF', color: '#1565C0', label: 'À venir', icon: <ClockCircleOutlined /> };
  if (rdv.qualifie)
    return { bg: '#E8F5E9', color: '#2E7D32', label: 'Qualifié', icon: <CheckCircleFilled /> };
  return { bg: '#FFF3E0', color: '#E65100', label: 'À qualifier', icon: <ExclamationCircleFilled /> };
}

function hhmm(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Lundi de la semaine contenant `date` */
function getMonday(date: Dayjs): Dayjs {
  const dow = date.day(); // 0=dim, 1=lun…
  const offset = dow === 0 ? -6 : 1 - dow;
  return date.add(offset, 'day').startOf('day');
}

/** Position dans la grille pour un RDV */
function getEventPos(rdv: RendezVous) {
  const s = dayjs(rdv.dateHeure);
  const relMin = s.hour() * 60 + s.minute() - START_HOUR * 60;
  return {
    top: Math.max(0, (relMin / 30) * SLOT_H),
    height: Math.max(28, (rdv.dureeMinutes / 30) * SLOT_H - 2),
  };
}

/** Calcul de layout colonne pour les RDV qui se chevauchent */
function computeLayout(events: RendezVous[]): Map<string, { left: number; width: number }> {
  const sorted = [...events].sort((a, b) =>
    new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
  );
  const cols: RendezVous[][] = [];
  const assign = new Map<string, number>();

  for (const ev of sorted) {
    const evEnd = new Date(ev.dateHeure).getTime() + ev.dureeMinutes * 60_000;
    let placed = false;
    for (let c = 0; c < cols.length; c++) {
      const last = cols[c][cols[c].length - 1];
      if (new Date(last.dateHeure).getTime() + last.dureeMinutes * 60_000 <= new Date(ev.dateHeure).getTime()) {
        cols[c].push(ev); assign.set(ev.id, c); placed = true; break;
      }
    }
    if (!placed) { cols.push([ev]); assign.set(ev.id, cols.length - 1); }
    void evEnd; // suppress unused warning
  }

  const n = Math.max(cols.length, 1);
  const res = new Map<string, { left: number; width: number }>();
  for (const ev of sorted) {
    const c = assign.get(ev.id) ?? 0;
    res.set(ev.id, { left: (c / n) * 100, width: (1 / n) * 100 });
  }
  return res;
}

/* ── EventBlock — vue semaine / jour ─────────────────────────────────────── */

function EventBlock({
  rdv, top, height, left, width, onClick,
}: {
  rdv: RendezVous; top: number; height: number;
  left: number; width: number; onClick: () => void;
}) {
  const cfg = getRdvConfig(rdv);
  const end = dayjs(rdv.dateHeure).add(rdv.dureeMinutes, 'minute').format('HH:mm');
  const compact = height < 42;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        top,
        height,
        left: `calc(${left}% + 3px)`,
        width: `calc(${width}% - 6px)`,
        background: cfg.bg,
        borderRadius: 5,
        paddingTop: compact ? 2 : 4,
        paddingBottom: 2,
        paddingLeft: 8,
        paddingRight: 5,
        borderLeftWidth: 3,
        borderLeftStyle: 'solid' as const,
        borderLeftColor: cfg.color,
        cursor: 'pointer',
        overflow: 'hidden',
        zIndex: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.18)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)'; }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {hhmm(rdv.dateHeure)} – {end}
      </div>
      {!compact && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2, background: `${cfg.color}20`, borderRadius: 3, paddingLeft: 5, paddingRight: 5, paddingTop: 1, paddingBottom: 1 }}>
          <span style={{ color: cfg.color, fontSize: 9 }}>●</span>
          <Text style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>{cfg.label}</Text>
        </div>
      )}
    </div>
  );
}

/* ── EventPill — vue mois ────────────────────────────────────────────────── */

function EventPill({ rdv, onClick }: { rdv: RendezVous; onClick: () => void }) {
  const cfg = getRdvConfig(rdv);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: cfg.bg, borderRadius: 4,
        paddingTop: 2, paddingBottom: 2, paddingLeft: 5, paddingRight: 5,
        borderLeftWidth: 3, borderLeftStyle: 'solid' as const, borderLeftColor: cfg.color,
        fontSize: 10, fontWeight: 600, marginBottom: 2, cursor: 'pointer', color: '#123832',
        whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'opacity 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      <span style={{ color: cfg.color, fontSize: 8 }}>●</span>
      {hhmm(rdv.dateHeure)}
    </div>
  );
}

/* ── RdvCard — panneau agenda (mois) ─────────────────────────────────────── */

function RdvCard({ rdv, onClick }: { rdv: RendezVous; onClick: () => void }) {
  const cfg = getRdvConfig(rdv);
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 10, paddingBottom: 10, paddingLeft: 0, paddingRight: 12,
        borderRadius: 8, background: '#F7FAF9', cursor: 'pointer',
        transition: 'all 0.15s', marginBottom: 6, overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#F7FAF9'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ width: 4, alignSelf: 'stretch', background: cfg.color, borderRadius: '0 2px 2px 0', flexShrink: 0 }} />
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cfg.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, fontSize: 14, flexShrink: 0 }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#123832', fontSize: 13, lineHeight: 1.25 }}>
          {hhmm(rdv.dateHeure)}
          <span style={{ fontWeight: 400, color: '#8FB0A8', fontSize: 11, marginLeft: 5 }}>· {rdv.dureeMinutes} min</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 4, background: `${cfg.color}16`, color: cfg.color, borderRadius: 4, paddingTop: 1, paddingBottom: 1, paddingLeft: 6, paddingRight: 6, fontSize: 10, fontWeight: 700 }}>
          {cfg.label}
        </div>
      </div>
      <RightOutlined style={{ color: '#C7DAD5', fontSize: 10, flexShrink: 0 }} />
    </div>
  );
}

/* ── Barre de navigation unifiée ─────────────────────────────────────────── */

function CalendarTopBar({
  viewMode, currentDate, onViewChange, onNavigate,
}: {
  viewMode: ViewMode;
  currentDate: Dayjs;
  onViewChange: (v: ViewMode) => void;
  onNavigate: (d: Dayjs) => void;
}) {
  function getTitle() {
    if (viewMode === 'mois') return currentDate.format('MMMM YYYY');
    if (viewMode === 'jour') return currentDate.format('dddd D MMMM YYYY');
    const mon = getMonday(currentDate);
    const sun = mon.add(6, 'day');
    if (mon.month() === sun.month()) return `${mon.date()} – ${sun.format('D MMM YYYY')}`;
    return `${mon.format('D MMM')} – ${sun.format('D MMM YYYY')}`;
  }

  function navigatePrev() {
    if (viewMode === 'mois') onNavigate(currentDate.subtract(1, 'month'));
    else if (viewMode === 'jour') onNavigate(currentDate.subtract(1, 'day'));
    else onNavigate(currentDate.subtract(1, 'week'));
  }
  function navigateNext() {
    if (viewMode === 'mois') onNavigate(currentDate.add(1, 'month'));
    else if (viewMode === 'jour') onNavigate(currentDate.add(1, 'day'));
    else onNavigate(currentDate.add(1, 'week'));
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 12, paddingBottom: 12, paddingLeft: 20, paddingRight: 20,
        borderBottomWidth: 1, borderBottomStyle: 'solid' as const, borderBottomColor: '#E7F3F0',
        flexWrap: 'wrap' as const, gap: 10, background: '#fff',
      }}
    >
      {/* Navigation gauche */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Button size="small" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, height: 28 }} onClick={() => onNavigate(dayjs())}>
          Aujourd&apos;hui
        </Button>
        <Button type="text" size="small" icon={<LeftOutlined style={{ fontSize: 11 }} />} style={{ borderRadius: 6, width: 28, height: 28 }} onClick={navigatePrev} />
        <Button type="text" size="small" icon={<RightOutlined style={{ fontSize: 11 }} />} style={{ borderRadius: 6, width: 28, height: 28 }} onClick={navigateNext} />
        <span style={{ fontWeight: 700, fontSize: 15, color: '#123832', marginLeft: 6, letterSpacing: '-0.3px' }}>
          {getTitle()}
        </span>
      </div>

      {/* Droite : vue + légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Légende (semaine/jour uniquement) */}
        {viewMode !== 'mois' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {LEGEND.map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#4F7169' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Vue switcher */}
        <div style={{ display: 'flex', background: '#E7F3F0', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['semaine', 'mois', 'jour'] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              style={{
                background: viewMode === v ? '#fff' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '4px 11px',
                fontSize: 12,
                fontWeight: viewMode === v ? 700 : 500,
                color: viewMode === v ? '#123832' : '#4F7169',
                cursor: 'pointer',
                boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Colonne jour (semaine / jour) ───────────────────────────────────────── */

function DayColumn({
  day, rdvList, isToday, onSelectRdv, onDropProfessionnel,
}: {
  day: Dayjs;
  rdvList: RendezVous[];
  isToday: boolean;
  onSelectRdv: (rdv: RendezVous) => void;
  onDropProfessionnel?: (professionnelId: string, dateTime: Dayjs) => void;
}) {
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const colRef = useRef<HTMLDivElement>(null);

  const rdvs = rdvList.filter((r) => dayjs(r.dateHeure).isSame(day, 'day'));
  const layout = computeLayout(rdvs);

  function slotFromY(clientY: number): number {
    const rect = colRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const rel = Math.max(0, clientY - rect.top);
    return Math.floor(rel / SLOT_H);
  }

  function timeFromY(clientY: number): Dayjs {
    const slot = slotFromY(clientY);
    const totalMin = START_HOUR * 60 + slot * 30;
    return day.hour(Math.floor(totalMin / 60)).minute(totalMin % 60).second(0);
  }

  return (
    <div
      ref={colRef}
      style={{
        flex: 1,
        position: 'relative' as const,
        height: GRID_H,
        background: isToday ? 'rgba(15,110,82,0.025)' : '#fff',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid' as const,
        borderLeftColor: '#E7F3F0',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragSlot(slotFromY(e.clientY)); }}
      onDragLeave={(e) => {
        const rel = e.relatedTarget as Node | null;
        if (!rel || !e.currentTarget.contains(rel)) setDragSlot(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const pid = e.dataTransfer.getData('text/plain');
        setDragSlot(null);
        if (pid && onDropProfessionnel) onDropProfessionnel(pid, timeFromY(e.clientY));
      }}
    >
      {/* Lignes de grille */}
      {Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * SLOT_H,
            left: 0,
            right: 0,
            height: 1,
            background: i % 2 === 0 ? '#DCE8E4' : '#EFF6F4',
          }}
        />
      ))}

      {/* Surbrillance drag */}
      {dragSlot !== null && (
        <div style={{
          position: 'absolute',
          top: dragSlot * SLOT_H + 1,
          left: 3, right: 3,
          height: SLOT_H - 2,
          background: 'rgba(15,110,82,0.13)',
          borderRadius: 5,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#0F6E52',
          pointerEvents: 'none',
          zIndex: 3,
        }} />
      )}

      {/* Événements */}
      {rdvs.map((rdv) => {
        const { top, height } = getEventPos(rdv);
        const { left, width } = layout.get(rdv.id) ?? { left: 0, width: 100 };
        return (
          <EventBlock
            key={rdv.id}
            rdv={rdv}
            top={top}
            height={height}
            left={left}
            width={width}
            onClick={() => onSelectRdv(rdv)}
          />
        );
      })}
    </div>
  );
}

/* ── Vue Semaine / Jour ──────────────────────────────────────────────────── */

function WeekView({
  weekStart, numDays, rdvList, onSelectRdv, onDropProfessionnel,
}: {
  weekStart: Dayjs;
  numDays: number;
  rdvList: RendezVous[];
  onSelectRdv: (rdv: RendezVous) => void;
  onDropProfessionnel?: (professionnelId: string, dateTime: Dayjs) => void;
}) {
  const now = dayjs();
  const days = Array.from({ length: numDays }, (_, i) => weekStart.add(i, 'day'));
  const isCurrentRange = days.some((d) => d.isSame(now, 'day'));
  const nowTop = ((now.hour() - START_HOUR) * 60 + now.minute()) / 30 * SLOT_H;

  function countRdv(day: Dayjs) {
    return rdvList.filter((r) => dayjs(r.dateHeure).isSame(day, 'day')).length;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      {/* En-têtes des jours */}
      <div style={{ display: 'flex', borderBottomWidth: 2, borderBottomStyle: 'solid' as const, borderBottomColor: '#E7F3F0', background: '#F7FAF9' }}>
        {/* Coin heure */}
        <div style={{ width: TIME_COL_W, flexShrink: 0 }} />

        {days.map((day) => {
          const isToday = day.isSame(now, 'day');
          const cnt = countRdv(day);
          return (
            <div
              key={day.format('YYYY-MM-DD')}
              style={{
                flex: 1,
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 14,
                borderLeftWidth: 1,
                borderLeftStyle: 'solid' as const,
                borderLeftColor: '#E7F3F0',
                background: isToday ? 'rgba(15,110,82,0.05)' : undefined,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase' as const, letterSpacing: '0.6px', lineHeight: 1 }}>
                {day.format('ddd')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: isToday ? '#0F6E52' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: isToday ? 800 : 600,
                  color: isToday ? '#fff' : '#123832',
                }}>
                  {day.date()}
                </div>
                {cnt > 0 && (
                  <span style={{ fontSize: 10, color: '#8FB0A8', fontWeight: 600 }}>
                    {cnt} RDV
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grille horaire */}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        <div style={{ display: 'flex', position: 'relative' as const, height: GRID_H }}>
          {/* Colonne heures */}
          <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative' as const }}>
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const totMin = START_HOUR * 60 + i * 30;
              const h = Math.floor(totMin / 60);
              const m = totMin % 60;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute' as const,
                    top: i === 0 ? 4 : i * SLOT_H - 9,
                    right: 10,
                    left: 0,
                    textAlign: 'right' as const,
                    fontSize: 11,
                    color: '#A0B8A0',
                    fontWeight: m === 0 ? 600 : 400,
                    userSelect: 'none' as const,
                  }}
                >
                  {m === 0 ? `${h}:00` : ''}
                </div>
              );
            })}
          </div>

          {/* Colonnes des jours */}
          <div style={{ flex: 1, display: 'flex', position: 'relative' as const }}>
            {days.map((day) => (
              <DayColumn
                key={day.format('YYYY-MM-DD')}
                day={day}
                rdvList={rdvList}
                isToday={day.isSame(now, 'day')}
                onSelectRdv={onSelectRdv}
                onDropProfessionnel={onDropProfessionnel}
              />
            ))}

            {/* Indicateur heure actuelle */}
            {isCurrentRange && nowTop >= 0 && nowTop <= GRID_H && (
              <div
                style={{
                  position: 'absolute' as const,
                  top: nowTop,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  pointerEvents: 'none' as const,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E53935', flexShrink: 0, marginLeft: -5 }} />
                <div style={{ flex: 1, height: 2, background: '#E53935' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Grille mois ─────────────────────────────────────────────────────────── */

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function MonthGrid({
  calendarDate, rdvList, selectedDate, onSelectDate, onSelectRdv, onDropProfessionnel,
}: {
  calendarDate: Dayjs;
  rdvList: RendezVous[];
  selectedDate: Dayjs | null;
  onSelectDate: (d: Dayjs) => void;
  onSelectRdv: (rdv: RendezVous) => void;
  onDropProfessionnel?: (professionnelId: string, dateTime: Dayjs) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const startOfGrid = getMonday(calendarDate.startOf('month'));
  const cells = Array.from({ length: 42 }, (_, i) => startOfGrid.add(i, 'day'));
  const now = dayjs();

  function getRdvForDate(d: Dayjs) {
    return rdvList.filter((r) => {
      const rd = new Date(r.dateHeure);
      return rd.getFullYear() === d.year() && rd.getMonth() === d.month() && rd.getDate() === d.date();
    });
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F7FAF9', borderBottomWidth: 1, borderBottomStyle: 'solid' as const, borderBottomColor: '#E7F3F0' }}>
        {JOURS.map((j) => (
          <div key={j} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#8FB0A8', padding: '7px 4px', textTransform: 'uppercase' as const, letterSpacing: '0.6px' }}>
            {j}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day) => {
          const dk = day.format('YYYY-MM-DD');
          const rdvs = getRdvForDate(day);
          const isCurMonth = day.month() === calendarDate.month();
          const isToday = day.isSame(now, 'day');
          const isSel = selectedDate?.isSame(day, 'day') ?? false;
          const isDO = dragKey === dk;

          return (
            <div
              key={dk}
              onClick={() => onSelectDate(day)}
              onDragOver={(e) => { e.preventDefault(); setDragKey(dk); }}
              onDragLeave={(e) => {
                const rel = e.relatedTarget as Node | null;
                if (!rel || !e.currentTarget.contains(rel)) setDragKey(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragKey(null);
                const pid = e.dataTransfer.getData('text/plain');
                if (pid && onDropProfessionnel) onDropProfessionnel(pid, day);
              }}
              style={{
                minHeight: 90,
                borderRightWidth: 1, borderRightStyle: 'solid' as const, borderRightColor: '#E7F3F0',
                borderBottomWidth: 1, borderBottomStyle: 'solid' as const, borderBottomColor: '#E7F3F0',
                padding: '4px 3px',
                cursor: 'pointer',
                background: isDO ? '#E6F2EE' : isSel ? '#E7F3F0' : '#fff',
                transition: 'background 0.1s',
                position: 'relative' as const,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isToday ? '#0F6E52' : 'transparent',
                  color: isToday ? '#fff' : isCurMonth ? '#123832' : '#C7DAD5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: isToday ? 700 : isCurMonth ? 500 : 400,
                }}>
                  {day.date()}
                </div>
              </div>
              {rdvs.slice(0, 2).map((rdv) => (
                <EventPill key={rdv.id} rdv={rdv} onClick={() => onSelectRdv(rdv)} />
              ))}
              {rdvs.length > 2 && (
                <div style={{ fontSize: 10, color: '#8FB0A8', fontWeight: 600, paddingLeft: 4 }}>+{rdvs.length - 2}</div>
              )}
              {isDO && <div style={{ position: 'absolute', inset: 0, borderWidth: 2, borderStyle: 'dashed', borderColor: '#0F6E52', pointerEvents: 'none' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panneau agenda (mois) ───────────────────────────────────────────────── */

function AgendaPanel({
  selectedDate, rdvDuJour, onSelectRdv,
}: {
  selectedDate: Dayjs | null;
  rdvDuJour: RendezVous[];
  onSelectRdv: (rdv: RendezVous) => void;
}) {
  return (
    <div style={{ width: 270, flexShrink: 0 }}>
      <ProCard bordered style={{ borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 72 }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selectedDate ? (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                    {selectedDate.format('MMM')}
                  </span>
                  <span style={{ color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: 1 }}>{selectedDate.format('DD')}</span>
                </>
              ) : (
                <CalendarOutlined style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }} />
              )}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                {selectedDate ? selectedDate.format('dddd') : 'Agenda'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>
                {selectedDate ? `${selectedDate.format('D MMMM YYYY')} · ${rdvDuJour.length} RDV` : 'Sélectionner une date'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 10px 12px' }}>
          {!selectedDate || rdvDuJour.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ fontSize: 12, color: '#C7DAD5' }}>{selectedDate ? 'Aucun rendez-vous' : 'Cliquez sur une date'}</Text>} style={{ margin: '16px 0' }} />
          ) : (
            rdvDuJour.map((rdv) => <RdvCard key={rdv.id} rdv={rdv} onClick={() => onSelectRdv(rdv)} />)
          )}
        </div>
      </ProCard>
    </div>
  );
}

/* ── Composant principal ─────────────────────────────────────────────────── */

interface Props {
  rdvList: RendezVous[];
  selectedDate: Dayjs | null;
  onSelectDate: (date: Dayjs) => void;
  onSelectRdv: (rdv: RendezVous) => void;
  onDropProfessionnel?: (professionnelId: string, dateTime: Dayjs) => void;
}

export function RdvCalendar({ rdvList, selectedDate, onSelectDate, onSelectRdv, onDropProfessionnel }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('semaine');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  const weekStart = getMonday(currentDate);

  function getRdvForDate(d: Dayjs): RendezVous[] {
    return rdvList.filter((r) => {
      const rd = new Date(r.dateHeure);
      return rd.getFullYear() === d.year() && rd.getMonth() === d.month() && rd.getDate() === d.date();
    });
  }

  const rdvDuJour = selectedDate ? getRdvForDate(selectedDate) : [];

  if (viewMode === 'mois') {
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProCard bordered bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden' }}>
            <CalendarTopBar viewMode={viewMode} currentDate={currentDate} onViewChange={setViewMode} onNavigate={setCurrentDate} />
            <MonthGrid
              calendarDate={currentDate}
              rdvList={rdvList}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              onSelectRdv={onSelectRdv}
              onDropProfessionnel={onDropProfessionnel}
            />
          </ProCard>
        </div>
        <AgendaPanel selectedDate={selectedDate} rdvDuJour={rdvDuJour} onSelectRdv={onSelectRdv} />
      </div>
    );
  }

  const numDays = viewMode === 'jour' ? 1 : 7;
  const ws = viewMode === 'jour' ? currentDate.startOf('day') : weekStart;

  return (
    <ProCard
      bordered
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '75vh' }}
      style={{ borderRadius: 12, overflow: 'hidden' }}
    >
      <CalendarTopBar viewMode={viewMode} currentDate={currentDate} onViewChange={setViewMode} onNavigate={setCurrentDate} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <WeekView
          weekStart={ws}
          numDays={numDays}
          rdvList={rdvList}
          onSelectRdv={onSelectRdv}
          onDropProfessionnel={onDropProfessionnel}
        />
      </div>
    </ProCard>
  );
}
