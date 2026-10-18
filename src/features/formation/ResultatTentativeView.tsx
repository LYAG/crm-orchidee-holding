'use client';

import { CheckCircleFilled, CloseCircleFilled, MinusCircleOutlined } from '@ant-design/icons';
import { Alert, Descriptions, Input, InputNumber, Space, Tag, Typography } from 'antd';
import type { QuestionCorrigee, ResultatTentative } from '@/types/formation';
import { ScoreSeuil, StatutTentativeTag } from './components';
import { TYPES_QUESTION, formatDateHeure } from './constants';

const { Text, Paragraph } = Typography;

export interface NoteSaisie {
  points?: number | null;
  commentaire?: string;
}

interface Props {
  resultat: ResultatTentative;
  /** Mode correction : saisie des points des questions à correction manuelle. */
  notes?: Record<string, NoteSaisie>;
  onNote?: (questionId: string, note: NoteSaisie) => void;
}

function Icone({ q }: { q: QuestionCorrigee }) {
  if (q.correcte === true) return <CheckCircleFilled style={{ color: '#1E7A4C' }} />;
  if (q.correcte === false) return <CloseCircleFilled style={{ color: '#B42F29' }} />;
  return <MinusCircleOutlined style={{ color: 'var(--oh-ink-3)' }} />;
}

/** Résultat d'une tentative, filtré par le backend selon les règles de publication. */
export function ResultatTentativeView({ resultat: r, notes, onNote }: Props) {
  const modeCorrection = !!onNote;
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type={!r.resultatVisible ? 'info' : r.reussie ? 'success' : 'error'}
        showIcon
        message={r.message}
        description={
          r.resultatVisible && r.pointsObtenus != null ? (
            <span>
              {r.pointsObtenus.toLocaleString('fr-FR')} / {r.pointsMax.toLocaleString('fr-FR')} points → <ScoreSeuil score={r.score} seuil={r.seuil} />
            </span>
          ) : undefined
        }
      />
      <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label="Délégué">{r.delegueNom}</Descriptions.Item>
        <Descriptions.Item label="Statut"><StatutTentativeTag statut={r.statut} /></Descriptions.Item>
        <Descriptions.Item label="Commencée">{formatDateHeure(r.dateDebut)}</Descriptions.Item>
        <Descriptions.Item label="Soumise">{formatDateHeure(r.dateSoumission)}</Descriptions.Item>
        {r.dateCorrection && <Descriptions.Item label="Corrigée">{formatDateHeure(r.dateCorrection)}{r.correcteurNom ? ` par ${r.correcteurNom}` : ''}</Descriptions.Item>}
        <Descriptions.Item label="Seuil">{r.seuil}/100</Descriptions.Item>
      </Descriptions>
      {!r.correctionsVisibles && r.resultatVisible && <Text type="secondary">Les bonnes réponses ne sont pas communiquées pour cette évaluation.</Text>}

      {r.questions.map((q) => {
        const aCorriger = modeCorrection && q.correctionManuelle && !q.corrigee;
        return (
          <div key={q.id} style={{ border: '1px solid var(--oh-line)', borderRadius: 10, padding: 12, background: aCorriger ? '#FFFBEB' : '#fff' }}>
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Space align="start">
                {r.correctionsVisibles && <Icone q={q} />}
                <Text strong>
                  {q.ordre}. {q.enonce}
                </Text>
              </Space>
              <Space size={4}>
                <Tag style={{ borderRadius: 6 }}>{TYPES_QUESTION[q.type].label}</Tag>
                <Tag style={{ borderRadius: 6 }}>
                  {q.pointsObtenus != null ? `${q.pointsObtenus} / ${q.points}` : `${q.points}`} pt(s)
                </Tag>
              </Space>
            </Space>
            {q.propositions.length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>
                {q.propositions.map((p) => (
                  <li key={p.id} style={{ color: p.correcte ? '#1E7A4C' : p.choisie && p.correcte === false ? '#B42F29' : undefined }}>
                    {p.libelle} {p.choisie && <Tag style={{ borderRadius: 6 }}>Réponse donnée</Tag>} {p.correcte && <Tag color="green" style={{ borderRadius: 6 }}>Bonne réponse</Tag>}
                  </li>
                ))}
              </ul>
            )}
            {(q.type === 'REPONSE_COURTE' || q.type === 'MANUELLE') && (
              <Paragraph style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                <Text type="secondary">Réponse : </Text>
                {q.texteDonne || <Text type="secondary">(sans réponse)</Text>}
              </Paragraph>
            )}
            {q.reponsesAcceptees && q.reponsesAcceptees.length > 0 && <Text type="secondary">Réponses acceptées : {q.reponsesAcceptees.join(', ')}</Text>}
            {q.explication && <Alert style={{ marginTop: 8 }} type="info" message={q.explication} />}
            {q.commentaire && !aCorriger && <Alert style={{ marginTop: 8 }} type="warning" message={`Commentaire du correcteur : ${q.commentaire}`} />}
            {aCorriger && (
              <Space wrap style={{ marginTop: 10 }}>
                <InputNumber
                  min={0}
                  max={q.points}
                  step={0.5}
                  placeholder="Points"
                  value={notes?.[q.id]?.points ?? null}
                  onChange={(v) => onNote!(q.id, { ...notes?.[q.id], points: v })}
                  suffix={`/ ${q.points}`}
                  style={{ width: 140 }}
                  aria-label={`Points de la question ${q.ordre}`}
                />
                <Input
                  style={{ minWidth: 280 }}
                  placeholder="Commentaire pour le délégué (facultatif)"
                  value={notes?.[q.id]?.commentaire}
                  onChange={(e) => onNote!(q.id, { ...notes?.[q.id], commentaire: e.target.value })}
                />
              </Space>
            )}
          </div>
        );
      })}
    </Space>
  );
}
