'use client';

import { ClockCircleOutlined, DragOutlined, PhoneOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useState } from 'react';
import { StatutProfessionnel } from '@/types';
import type { Centre, ProfessionnelSante } from '@/types';
import { STATUT_CONFIG } from './utils';

const { Text } = Typography;

const COLONNES = Object.values(StatutProfessionnel);

interface Props {
  professionnels: ProfessionnelSante[];
  centreMap: Record<string, Centre>;
  /** professionnelId -> libellé du statut demandé, pour les fiches avec une demande en attente. */
  demandesEnAttente: Record<string, string>;
  readOnly: boolean;
  onSelect: (p: ProfessionnelSante) => void;
  onDemanderChangement: (professionnel: ProfessionnelSante, statutDemande: StatutProfessionnel) => void;
}

/* ── Carte professionnel ─────────────────────────────────────────────────── */

function ProCard({
  professionnel,
  centre,
  color,
  draggable,
  isDragging,
  pendingLabel,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  professionnel: ProfessionnelSante;
  centre?: Centre;
  color: string;
  draggable: boolean;
  isDragging: boolean;
  pendingLabel?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 10,
        borderTop: `1px solid ${hovered ? color + '60' : '#E7F3F0'}`,
        borderRight: `1px solid ${hovered ? color + '60' : '#E7F3F0'}`,
        borderBottom: `1px solid ${hovered ? color + '60' : '#E7F3F0'}`,
        borderLeft: `3px solid ${color}`,
        padding: '12px 12px 10px',
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        opacity: isDragging ? 0.45 : 1,
        userSelect: 'none',
        boxShadow: hovered
          ? `0 4px 14px rgba(0,0,0,0.10), 0 0 0 1px ${color}20`
          : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hovered && !isDragging ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {draggable && hovered && (
        <div style={{ position: 'absolute', top: 8, right: 8, color: '#C7DAD5', fontSize: 12 }}>
          <DragOutlined />
        </div>
      )}

      <Text strong style={{ display: 'block', fontSize: 13, color: '#123832', lineHeight: 1.35, marginBottom: 3, paddingRight: 16 }}>
        {professionnel.titre ? `${professionnel.titre} ` : ''}
        {professionnel.nom} {professionnel.prenom ?? ''}
      </Text>

      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        {centre?.nom ?? '—'}
        {professionnel.telephones[0] && (
          <>
            {' · '}
            <PhoneOutlined style={{ fontSize: 9 }} /> {professionnel.telephones[0]}
          </>
        )}
      </Text>

      {pendingLabel && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#FFF8F0',
            color: '#E65100',
            borderRadius: 5,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <ClockCircleOutlined style={{ fontSize: 10 }} />
          {pendingLabel}
        </div>
      )}
    </div>
  );
}

/* ── Kanban principal ────────────────────────────────────────────────────── */

export function ClassificationKanban({
  professionnels,
  centreMap,
  demandesEnAttente,
  readOnly,
  onSelect,
  onDemanderChangement,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatut, setDragOverStatut] = useState<StatutProfessionnel | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStatut(null);
  }

  function handleDragOver(e: React.DragEvent, statut: StatutProfessionnel) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatut !== statut) setDragOverStatut(statut);
  }

  function handleDragEnter(e: React.DragEvent, statut: StatutProfessionnel) {
    e.preventDefault();
    setDragOverStatut(statut);
  }

  function handleDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverStatut(null);
    }
  }

  function handleDrop(e: React.DragEvent, statut: StatutProfessionnel) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDragOverStatut(null);
    if (!id) return;
    const professionnel = professionnels.find((p) => p.id === id);
    if (professionnel && professionnel.statut !== statut && !demandesEnAttente[id]) {
      onDemanderChangement(professionnel, statut);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
      {COLONNES.map((statut) => {
        const { color, bg, label } = STATUT_CONFIG[statut];
        const colPros = professionnels.filter((p) => p.statut === statut);
        const isOver = dragOverStatut === statut;

        return (
          <div
            key={statut}
            onDragEnter={(e) => handleDragEnter(e, statut)}
            onDragOver={(e) => handleDragOver(e, statut)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, statut)}
            style={{
              flex: '0 0 230px',
              borderRadius: 12,
              border: isOver ? `2px dashed ${color}` : '2px solid transparent',
              background: isOver ? bg : '#EFF6F4',
              transition: 'all 0.15s ease',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 14px 10px',
                background: isOver ? bg : '#E7EDEA',
                borderBottom: `2px solid ${isOver ? color + '40' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: 12,
                    background: color,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px',
                    boxShadow: `0 2px 6px ${color}50`,
                  }}
                >
                  {colPros.length}
                </div>
                <Text strong style={{ fontSize: 13, color: isOver ? color : '#1F4E45', letterSpacing: '-0.1px' }}>
                  {label}
                </Text>
              </div>
            </div>

            <div style={{ padding: '10px 10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colPros.map((p) => (
                <ProCard
                  key={p.id}
                  professionnel={p}
                  centre={centreMap[p.centreId]}
                  color={color}
                  draggable={!readOnly && !demandesEnAttente[p.id]}
                  isDragging={draggingId === p.id}
                  pendingLabel={demandesEnAttente[p.id]}
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(p)}
                />
              ))}

              {colPros.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 0',
                    opacity: isOver ? 0.8 : 0.45,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: `2px dashed ${color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <DragOutlined style={{ color, fontSize: 14 }} />
                  </div>
                  <Text style={{ fontSize: 12, color, fontWeight: 500 }}>Déposer ici</Text>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
