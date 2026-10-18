'use client';

import { Alert, Empty, Select, Skeleton, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { notationService } from '@/services';
import type { NotationMois } from '@/types';
import { NotationDrawer } from './NotationDrawer';
import { formaterNote, MOIS_COURTS, styleNote } from './noteStyle';

const { Text } = Typography;

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = Array.from({ length: 3 }, (_, i) => ANNEE_COURANTE - i);

interface LigneDelegue {
  delegueId: string;
  nomDelegue: string;
  parMois: Record<number, NotationMois>;
  moyenne: number | null;
}

interface Props {
  /** Restreint l'affichage à un délégué (vue « Mes notes » du délégué). */
  delegueId?: string;
}

/**
 * Notes mensuelles /20 des délégués : un tableau délégués × mois. Un clic sur une case ouvre le
 * détail par critère ; le manager (son équipe) et l'admin y saisissent les critères manuels.
 */
export function NotesMensuellesTab({ delegueId }: Props) {
  const { user } = useAuth();
  const [annee, setAnnee] = useState(ANNEE_COURANTE);
  const [notations, setNotations] = useState<NotationMois[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [selection, setSelection] = useState<NotationMois | null>(null);

  const peutNoter = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  useEffect(() => {
    let annule = false;
    notationService
      .getNotations(annee, delegueId)
      .then((liste) => {
        if (!annule) {
          setNotations(liste);
          setErreur(null);
        }
      })
      .catch((err) => {
        if (!annule) {
          setNotations([]);
          setErreur(err instanceof Error ? err.message : 'Erreur lors du chargement des notes.');
        }
      });
    return () => {
      annule = true;
    };
  }, [annee, delegueId]);

  const nbMois = useMemo(() => (notations ? Math.max(0, ...notations.map((n) => n.mois)) : 0), [notations]);

  const lignes = useMemo<LigneDelegue[]>(() => {
    const parDelegue = new Map<string, LigneDelegue>();
    for (const n of notations ?? []) {
      const ligne = parDelegue.get(n.delegueId) ?? { delegueId: n.delegueId, nomDelegue: n.nomDelegue, parMois: {}, moyenne: null };
      ligne.parMois[n.mois] = n;
      parDelegue.set(n.delegueId, ligne);
    }
    for (const ligne of parDelegue.values()) {
      const notes = Object.values(ligne.parMois).map((n) => n.noteFinale).filter((v): v is number => v !== null);
      ligne.moyenne = notes.length ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 100) / 100 : null;
    }
    return [...parDelegue.values()];
  }, [notations]);

  function remplacer(maj: NotationMois) {
    setNotations((prev) => (prev ?? []).map((n) => (n.delegueId === maj.delegueId && n.mois === maj.mois ? maj : n)));
    setSelection(maj);
  }

  const colonnes: ColumnsType<LigneDelegue> = [
    {
      title: 'Délégué',
      dataIndex: 'nomDelegue',
      fixed: 'left',
      width: 190,
      render: (nom: string) => <Text strong>{nom}</Text>,
    },
    ...Array.from({ length: nbMois }, (_, i) => {
      const mois = i + 1;
      return {
        title: MOIS_COURTS[i],
        key: `m${mois}`,
        align: 'center' as const,
        width: 84,
        render: (_: unknown, ligne: LigneDelegue) => {
          const n = ligne.parMois[mois];
          if (!n) return null;
          const style = styleNote(n.noteFinale);
          const aide = !n.saisie
            ? peutNoter ? 'Critères calculés uniquement — cliquez pour évaluer' : 'Pas encore évaluée par le manager'
            : n.complete ? 'Voir le détail' : 'Évaluation incomplète';
          return (
            <Tooltip title={aide}>
              <button
                type="button"
                className="oh-note-cell"
                data-pending={!n.saisie || !n.complete || undefined}
                style={{ color: style.color, background: style.bg }}
                onClick={() => setSelection(n)}
                aria-label={`${ligne.nomDelegue}, ${MOIS_COURTS[i]} : ${formaterNote(n.noteFinale)} sur 20`}
              >
                {formaterNote(n.noteFinale)}
              </button>
            </Tooltip>
          );
        },
      };
    }),
    {
      title: 'Moyenne',
      key: 'moyenne',
      align: 'center',
      fixed: 'right',
      width: 96,
      render: (_: unknown, ligne: LigneDelegue) => (
        <span className="oh-note-pill" style={styleNote(ligne.moyenne)}>
          {formaterNote(ligne.moyenne)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text type="secondary" style={{ maxWidth: '70ch' }}>
          Note sur 20 par mois : moyenne pondérée des critères paramétrés par l&apos;administrateur, dont
          l&apos;atteinte des objectifs de visites et de conversion T1 → ST, calculée automatiquement.
        </Text>
        <Space>
          <Text type="secondary">Année</Text>
          <Select
            aria-label="Année"
            value={annee}
            onChange={(v) => {
              setNotations(null);
              setAnnee(v);
            }}
            options={ANNEES.map((a) => ({ value: a, label: a }))}
            style={{ width: 100 }}
          />
        </Space>
      </div>

      {erreur && <Alert type="error" showIcon title={erreur} />}

      {notations === null ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : lignes.length === 0 ? (
        <Empty description={delegueId ? 'Aucune note pour cette année.' : 'Aucun délégué à afficher pour cette année.'} />
      ) : (
        <>
          <Table
            rowKey="delegueId"
            columns={colonnes}
            dataSource={lignes}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
            bordered
          />
          <Space size={16} wrap>
            {[
              { label: '≥ 14 : objectifs tenus', note: 14 },
              { label: '10 à 14 : à consolider', note: 10 },
              { label: '< 10 : en difficulté', note: 0 },
            ].map((l) => (
              <Space key={l.label} size={6}>
                <span className="oh-note-swatch" style={{ background: styleNote(l.note).color }} />
                <Text type="secondary" style={{ fontSize: 12.5 }}>{l.label}</Text>
              </Space>
            ))}
            <Space size={6}>
              <span className="oh-note-swatch" data-pending />
              <Text type="secondary" style={{ fontSize: 12.5 }}>Pointillés : évaluation manager manquante ou incomplète</Text>
            </Space>
          </Space>
        </>
      )}

      <NotationDrawer notation={selection} peutNoter={peutNoter} onClose={() => setSelection(null)} onSaved={remplacer} />
    </div>
  );
}
