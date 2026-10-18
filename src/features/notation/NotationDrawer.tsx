'use client';

import { CalculatorOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Empty, Input, InputNumber, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { notationService } from '@/services';
import type { NotationMois } from '@/types';
import { formaterNote, MOIS_LONGS, styleNote } from './noteStyle';

const { Text } = Typography;

interface Props {
  notation: NotationMois | null;
  /** Manager (son équipe) ou admin : peut saisir les critères manuels. */
  peutNoter: boolean;
  onClose: () => void;
  onSaved: (notation: NotationMois) => void;
}

/** Détail d'une note mensuelle : critères calculés en lecture seule, critères manuels saisissables. */
export function NotationDrawer({ notation, peutNoter, onClose, onSaved }: Props) {
  return (
    <Drawer
      open={notation !== null}
      onClose={onClose}
      size={520}
      destroyOnHidden
      title={
        notation ? (
          <div>
            <div style={{ fontWeight: 600 }}>{notation.nomDelegue}</div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              Évaluation de {MOIS_LONGS[notation.mois - 1]} {notation.annee}
            </Text>
          </div>
        ) : null
      }
    >
      {notation && (
        <ContenuNotation key={`${notation.delegueId}-${notation.mois}`} notation={notation} peutNoter={peutNoter} onSaved={onSaved} />
      )}
    </Drawer>
  );
}

function ContenuNotation({ notation, peutNoter, onSaved }: Omit<Props, 'onClose' | 'notation'> & { notation: NotationMois }) {
  const { message } = App.useApp();
  const [notes, setNotes] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(notation.criteres.filter((c) => c.type === 'MANUEL').map((c) => [c.critereId, c.note])),
  );
  const [commentaire, setCommentaire] = useState(notation.commentaire ?? '');
  const [saving, setSaving] = useState(false);

  // Aperçu de la note finale avec les valeurs en cours de saisie (même calcul que le backend).
  let somme = 0;
  let poids = 0;
  for (const c of notation.criteres) {
    const note = c.type === 'MANUEL' ? notes[c.critereId] ?? null : c.note;
    if (note !== null) {
      somme += note * c.poids;
      poids += c.poids;
    }
  }
  const apercu = poids === 0 ? null : Math.round((somme / poids) * 100) / 100;
  const style = styleNote(apercu);

  async function enregistrer() {
    setSaving(true);
    try {
      const saisies = Object.fromEntries(
        Object.entries(notes).filter((entree): entree is [string, number] => entree[1] !== null),
      );
      const maj = await notationService.enregistrerNotation({
        delegueId: notation.delegueId,
        annee: notation.annee,
        mois: notation.mois,
        notes: saisies,
        commentaire: commentaire.trim() || null,
      });
      message.success('Évaluation enregistrée.');
      onSaved(maj);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (notation.criteres.length === 0) {
    return <Empty description="Aucun critère de notation actif. L'administrateur doit en paramétrer." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="oh-note-total" style={{ background: style.bg, color: style.color }}>
        <span className="oh-note-total__value">
          {formaterNote(apercu)}
          <span className="oh-note-total__max"> / 20</span>
        </span>
        <span className="oh-note-total__label">
          {notation.saisie ? (notation.complete ? 'Note du mois' : 'Évaluation incomplète') : 'Pas encore évaluée par le manager'}
        </span>
      </div>

      <div className="oh-note-criteres">
        {notation.criteres.map((c) => {
          const manuel = c.type === 'MANUEL';
          return (
            <div key={c.critereId} className="oh-note-critere">
              <div className="oh-note-critere__head">
                <div style={{ minWidth: 0 }}>
                  <div className="oh-note-critere__libelle">{c.libelle}</div>
                  <Space size={6} wrap style={{ marginTop: 4 }}>
                    {manuel ? (
                      <Tag icon={<EditOutlined />} style={{ marginInlineEnd: 0 }}>Saisie manager</Tag>
                    ) : (
                      <Tag icon={<CalculatorOutlined />} color="blue" style={{ marginInlineEnd: 0 }}>Calcul automatique</Tag>
                    )}
                    {c.poids > 1 && <Text type="secondary" style={{ fontSize: 12 }}>Coefficient {c.poids}</Text>}
                  </Space>
                </div>
                {manuel && peutNoter ? (
                  <InputNumber
                    aria-label={`Note ${c.libelle}`}
                    min={0}
                    max={20}
                    step={0.5}
                    precision={1}
                    placeholder="—"
                    value={notes[c.critereId] ?? null}
                    onChange={(v) => setNotes((prev) => ({ ...prev, [c.critereId]: v }))}
                    suffix="/ 20"
                    style={{ width: 120 }}
                  />
                ) : (
                  <span className="oh-note-pill" style={styleNote(manuel ? notes[c.critereId] ?? null : c.note)}>
                    {formaterNote(manuel ? notes[c.critereId] ?? null : c.note)}
                  </span>
                )}
              </div>
              {c.detail && <Text type="secondary" style={{ fontSize: 12.5 }}>{c.detail}</Text>}
            </div>
          );
        })}
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 6 }}>Commentaire</Text>
        {peutNoter ? (
          <Input.TextArea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={2000}
            placeholder="Points forts, axes de progrès…"
          />
        ) : (
          <Text type={notation.commentaire ? undefined : 'secondary'}>{notation.commentaire ?? 'Aucun commentaire.'}</Text>
        )}
      </div>

      {notation.saisie && notation.auteurNom && (
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          Évalué par {notation.auteurNom}
          {notation.dateModification ? ` le ${dayjs(notation.dateModification).format('DD/MM/YYYY à HH:mm')}` : ''}
        </Text>
      )}

      {peutNoter && (
        <Button type="primary" block loading={saving} onClick={enregistrer}>
          Enregistrer l&apos;évaluation
        </Button>
      )}
    </div>
  );
}
