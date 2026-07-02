'use client';

import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  RightOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { Calendar, Empty, Space, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import type { RendezVous } from '@/types';
import { RdvStatut } from '@/types';

const { Text, Title } = Typography;

/* ── Config couleurs par statut ─────────────────────────────────────────── */

interface RdvConfig {
  bg: string;
  color: string;
  border: string;
  label: string;
  icon: React.ReactNode;
}

function getRdvConfig(rdv: RendezVous): RdvConfig {
  if (rdv.statut === RdvStatut.ANNULE) {
    return { bg: '#F5F5F5', color: '#9E9E9E', border: '#E0E0E0', label: 'Annulé', icon: <CloseCircleFilled /> };
  }
  const isPasse = new Date(rdv.dateHeure) < new Date();
  if (!isPasse) {
    return { bg: '#E3F2FD', color: '#1565C0', border: '#BBDEFB', label: 'À venir', icon: <ClockCircleOutlined /> };
  }
  if (rdv.qualifie) {
    return { bg: '#E8F5E9', color: '#2E7D32', border: '#C8E6C9', label: 'Qualifié', icon: <CheckCircleFilled /> };
  }
  return { bg: '#FFF3E0', color: '#E65100', border: '#FFE0B2', label: 'À qualifier', icon: <ExclamationCircleFilled /> };
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ── Pill événement (dans la cellule du calendrier) ─────────────────────── */

function EventPill({ rdv, onClick }: { rdv: RendezVous; onClick: () => void }) {
  const cfg = getRdvConfig(rdv);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        borderRadius: 5,
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: 600,
        marginBottom: 2,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: 'opacity 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {formatTime(rdv.dateHeure)}
    </div>
  );
}

/* ── Carte RDV (dans le panneau latéral) ────────────────────────────────── */

function RdvCard({ rdv, onClick }: { rdv: RendezVous; onClick: () => void }) {
  const cfg = getRdvConfig(rdv);
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Indicateur coloré */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${cfg.color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: cfg.color,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: 14, lineHeight: 1.2 }}>
          {formatTime(rdv.dateHeure)}
          <span style={{ fontWeight: 400, color: '#9E9E9E', fontSize: 12, marginLeft: 6 }}>
            {rdv.dureeMinutes} min
          </span>
        </div>
        <Tag
          style={{
            marginTop: 4,
            fontSize: 10,
            padding: '0 6px',
            lineHeight: '16px',
            height: 16,
            borderRadius: 4,
            background: `${cfg.color}18`,
            color: cfg.color,
            border: 'none',
            fontWeight: 600,
          }}
        >
          {cfg.label}
        </Tag>
      </div>

      <RightOutlined style={{ color: '#C8D8C8', fontSize: 11, flexShrink: 0 }} />
    </div>
  );
}

/* ── Légende ────────────────────────────────────────────────────────────── */

const LEGEND = [
  { bg: '#E3F2FD', color: '#1565C0', border: '#BBDEFB', label: 'À venir' },
  { bg: '#FFF3E0', color: '#E65100', border: '#FFE0B2', label: 'À qualifier' },
  { bg: '#E8F5E9', color: '#2E7D32', border: '#C8E6C9', label: 'Qualifié' },
  { bg: '#F5F5F5', color: '#9E9E9E', border: '#E0E0E0', label: 'Annulé' },
];

/* ── Composant principal ─────────────────────────────────────────────────── */

interface Props {
  rdvList: RendezVous[];
  selectedDate: Dayjs | null;
  onSelectDate: (date: Dayjs) => void;
  onSelectRdv: (rdv: RendezVous) => void;
}

export function RdvCalendar({ rdvList, selectedDate, onSelectDate, onSelectRdv }: Props) {
  function getRdvForDate(date: Dayjs): RendezVous[] {
    return rdvList.filter((rdv) => {
      const d = new Date(rdv.dateHeure);
      return (
        d.getFullYear() === date.year() &&
        d.getMonth() === date.month() &&
        d.getDate() === date.date()
      );
    });
  }

  function cellRender(date: Dayjs, info: { type: string }) {
    if (info.type !== 'date') return null;
    const rdvs = getRdvForDate(date);
    if (rdvs.length === 0) return null;
    return (
      <div style={{ padding: '0 2px' }}>
        {rdvs.slice(0, 3).map((rdv) => (
          <EventPill key={rdv.id} rdv={rdv} onClick={() => onSelectRdv(rdv)} />
        ))}
        {rdvs.length > 3 && (
          <div style={{ fontSize: 10, color: '#9E9E9E', fontWeight: 600, padding: '1px 6px' }}>
            +{rdvs.length - 3} autres
          </div>
        )}
      </div>
    );
  }

  const rdvDuJour = selectedDate ? getRdvForDate(selectedDate) : [];

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Calendrier (colonne principale) ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ProCard
          bordered
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        >
          {/* Légende */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderBottom: '1px solid #EEF4EE',
              background: '#FAFCFA',
              flexWrap: 'wrap',
            }}
          >
            {LEGEND.map((l) => (
              <div
                key={l.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: l.bg,
                  border: `1px solid ${l.border}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: l.color,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Calendar Ant Design */}
          <div style={{ padding: '0 8px 8px' }}>
            <Calendar
              cellRender={cellRender}
              onSelect={onSelectDate}
              mode="month"
            />
          </div>
        </ProCard>
      </div>

      {/* ── Panneau jour sélectionné (colonne latérale) ── */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <ProCard
          bordered
          style={{ borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 72 }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Header du panneau */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #1C3A1C 0%, #2D5A2D 100%)',
            }}
          >
            <Space size={8} align="center">
              <CalendarOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
              {selectedDate ? (
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                    {selectedDate.format('DD MMMM')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                    {selectedDate.format('YYYY')} · {rdvDuJour.length} RDV
                  </div>
                </div>
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  Sélectionner une date
                </Text>
              )}
            </Space>
          </div>

          {/* Liste des RDV */}
          <div style={{ padding: 12 }}>
            {!selectedDate || rdvDuJour.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text style={{ fontSize: 12, color: '#C8D8C8' }}>
                    {selectedDate ? 'Aucun rendez-vous' : 'Cliquez sur une date'}
                  </Text>
                }
                style={{ margin: '16px 0' }}
              />
            ) : (
              rdvDuJour.map((rdv) => (
                <RdvCard key={rdv.id} rdv={rdv} onClick={() => onSelectRdv(rdv)} />
              ))
            )}
          </div>
        </ProCard>
      </div>

    </div>
  );
}
