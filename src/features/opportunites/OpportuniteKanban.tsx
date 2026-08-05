'use client';

import {
  ArrowRightOutlined,
  DragOutlined,
  EuroOutlined,
  TrophyFilled,
} from '@ant-design/icons';
import { Progress, Typography } from 'antd';
import { useState } from 'react';
import { OpportuniteEtape } from '@/types';
import type { Opportunite, ProfessionnelSante, Utilisateur } from '@/types';
import { ETAPES_CONFIG } from './constants';

const { Text } = Typography;

interface Props {
  opportunites: Opportunite[];
  professionnelMap: Record<string, ProfessionnelSante>;
  utilisateurMap: Record<string, Utilisateur>;
  onSelect: (opp: Opportunite) => void;
  onEtapeChange: (oppId: string, etape: OpportuniteEtape) => void;
}

/* ── Carte opportunité ───────────────────────────────────────────────────── */

function OppCard({
  opp,
  professionnel,
  color,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  opp: Opportunite;
  professionnel?: ProfessionnelSante;
  color: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
        cursor: isDragging ? 'grabbing' : 'grab',
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
      {/* Drag handle hint */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#C7DAD5',
            fontSize: 12,
          }}
        >
          <DragOutlined />
        </div>
      )}

      {/* Titre */}
      <Text
        strong
        style={{
          display: 'block',
          fontSize: 13,
          color: '#123832',
          lineHeight: 1.35,
          marginBottom: 3,
          paddingRight: 16,
        }}
      >
        {opp.titre.length > 42 ? `${opp.titre.slice(0, 39)}…` : opp.titre}
      </Text>

      {/* Centre / établissement */}
      {professionnel && (
        <Text
          type="secondary"
          style={{ fontSize: 11, display: 'block', marginBottom: 8 }}
        >
          {professionnel.titre ? `${professionnel.titre} ` : ''}
          {professionnel.nom} {professionnel.prenom ?? ''}
        </Text>
      )}

      {/* Montant + probabilité */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: `${color}12`,
            color: color,
            borderRadius: 5,
            padding: '2px 7px',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <EuroOutlined style={{ fontSize: 9 }} />
          {opp.montantEstime.toLocaleString('fr-FR')}
        </div>

        <Progress
          percent={opp.probabilite}
          size="small"
          showInfo={false}
          strokeColor={color}
          trailColor={`${color}20`}
          style={{ flex: 1, marginBottom: 0 }}
        />

        <Text style={{ fontSize: 11, color, fontWeight: 700, flexShrink: 0 }}>
          {opp.probabilite}%
        </Text>
      </div>

      {/* Badge gagné */}
      {opp.etape === OpportuniteEtape.GAGNEE && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#E8F5E9',
            color: '#2E7D32',
            borderRadius: 5,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <TrophyFilled style={{ fontSize: 10 }} />
          Affaire gagnée
        </div>
      )}

      {/* Voir le détail hint */}
      {hovered && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: color,
            fontSize: 10,
            fontWeight: 600,
            marginTop: 6,
          }}
        >
          <span>Voir le détail</span>
          <ArrowRightOutlined style={{ fontSize: 9 }} />
        </div>
      )}
    </div>
  );
}

/* ── Kanban principal ────────────────────────────────────────────────────── */

export function OpportuniteKanban({
  opportunites,
  prospectMap,
  onSelect,
  onEtapeChange,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverEtape, setDragOverEtape] = useState<OpportuniteEtape | null>(null);

  function handleDragStart(e: React.DragEvent, oppId: string) {
    // Store in dataTransfer — React state updates are async and can be stale in drop handler
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(oppId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverEtape(null);
  }

  function handleDragOver(e: React.DragEvent, etape: OpportuniteEtape) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverEtape !== etape) setDragOverEtape(etape);
  }

  function handleDragEnter(e: React.DragEvent, etape: OpportuniteEtape) {
    e.preventDefault();
    setDragOverEtape(etape);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when truly leaving the column (not moving between children)
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverEtape(null);
    }
  }

  function handleDrop(e: React.DragEvent, etape: OpportuniteEtape) {
    e.preventDefault();
    e.stopPropagation();
    // Read from dataTransfer — always reliable, unlike React state closures
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId) {
      const opp = opportunites.find((o) => o.id === oppId);
      if (opp && opp.etape !== etape) onEtapeChange(oppId, etape);
    }
    setDraggingId(null);
    setDragOverEtape(null);
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 12,
        alignItems: 'flex-start',
      }}
    >
      {ETAPES_CONFIG.map(({ key, label, color, bgColor }) => {
        const colOpps = opportunites.filter((o) => o.etape === key);
        const isOver = dragOverEtape === key;
        const colTotal = colOpps.reduce((s, o) => s + o.montantEstime, 0);

        return (
          <div
            key={key}
            onDragEnter={(e) => handleDragEnter(e, key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, key)}
            style={{
              flex: '0 0 230px',
              borderRadius: 12,
              border: isOver ? `2px dashed ${color}` : '2px solid transparent',
              background: isOver ? bgColor : '#EFF6F4',
              transition: 'all 0.15s ease',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header de colonne */}
            <div
              style={{
                padding: '12px 14px 10px',
                background: isOver ? bgColor : '#E7EDEA',
                borderBottom: `2px solid ${isOver ? color + '40' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: colTotal > 0 ? 6 : 0 }}>
                {/* Badge count */}
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
                  {colOpps.length}
                </div>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: isOver ? color : '#1F4E45',
                    letterSpacing: '-0.1px',
                  }}
                >
                  {label}
                </Text>
              </div>

              {/* Montant total */}
              {colTotal > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: `${color}14`,
                    color: color,
                    borderRadius: 5,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <EuroOutlined style={{ fontSize: 9 }} />
                  {colTotal.toLocaleString('fr-FR')} €
                </div>
              )}
            </div>

            {/* Corps de la colonne */}
            <div style={{ padding: '10px 10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colOpps.map((opp) => (
                <OppCard
                  key={opp.id}
                  opp={opp}
                  professionnel={professionnelMap[opp.professionnelId]}
                  color={color}
                  isDragging={draggingId === opp.id}
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(opp)}
                />
              ))}

              {colOpps.length === 0 && (
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
                  <Text style={{ fontSize: 12, color, fontWeight: 500 }}>
                    Déposer ici
                  </Text>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
