'use client';

import { CheckCircleFilled, FileTextOutlined, LinkOutlined, LockOutlined, PaperClipOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Collapse, Descriptions, Empty, List, Space, Tag, Tooltip, Typography } from 'antd';
import type { EvaluationParcours, LeconParcours, Parcours } from '@/types/formation';
import { Progression, ScoreSeuil, StatutAffectationTag, StatutEtapeTag } from './components';
import { EXIGENCES, NIVEAUX, PRIORITES, TYPES_EVALUATION, TYPES_LECON, formatDate, formatDateHeure, formatDuree } from './constants';

const { Text, Paragraph } = Typography;

interface Props {
  parcours: Parcours;
  /** Délégué : ouvre la leçon (et la marque consultée). Absent = lecture seule. */
  onOuvrirLecon?: (lecon: LeconParcours) => void;
  /** Délégué : démarre ou reprend l'évaluation. */
  onDemarrer?: (evaluation: EvaluationParcours) => void;
  chargementEvaluation?: string | null;
}

function iconeLecon(l: LeconParcours) {
  if (l.type === 'LIEN' || l.type === 'VIDEO') return l.aFichier ? <PlayCircleOutlined /> : <LinkOutlined />;
  return l.aFichier ? <PaperClipOutlined /> : <FileTextOutlined />;
}

function EvaluationCarte({ e, onDemarrer, chargement }: { e: EvaluationParcours; onDemarrer?: Props['onDemarrer']; chargement?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--oh-line)', borderRadius: 10, padding: 12, background: 'var(--oh-surface-muted)' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap size={6}>
          <Tag color={e.type === 'EVALUATION_FINALE' ? 'geekblue' : 'cyan'} style={{ borderRadius: 6 }}>{TYPES_EVALUATION[e.type]}</Tag>
          <Text strong>{e.titre}</Text>
          <StatutEtapeTag statut={e.statut} />
        </Space>
        {onDemarrer && (
          <Tooltip title={!e.peutDemarrer ? e.raisonBlocage : undefined}>
            <Button type="primary" size="small" disabled={!e.peutDemarrer} loading={chargement} onClick={() => onDemarrer(e)}>
              {e.tentativeEnCoursId ? 'Reprendre' : e.tentativesUtilisees > 0 ? 'Nouvelle tentative' : 'Commencer'}
            </Button>
          </Tooltip>
        )}
      </Space>
      <Space wrap size={[16, 4]} style={{ marginTop: 8 }}>
        <Text type="secondary">{e.nbQuestions} question(s) · {e.pointsTotal} pt(s)</Text>
        <Text type="secondary">
          Seuil {e.seuilReussite}/100{e.seuilExige ? ' exigé' : ' (à passer, seuil non exigé)'}
        </Text>
        {e.dureeMinutes && <Text type="secondary">{e.dureeMinutes} min</Text>}
        <Text type="secondary">
          Tentatives : {e.tentativesUtilisees}
          {e.tentativesMax != null ? ` / ${e.tentativesMax}` : ' (illimitées)'}
        </Text>
        {e.meilleurScore != null && (
          <span>
            Meilleur score : <ScoreSeuil score={e.meilleurScore} seuil={e.seuilReussite} />
          </span>
        )}
      </Space>
      {!e.peutDemarrer && e.raisonBlocage && e.statut !== 'REUSSIE' && e.statut !== 'TERMINEE' && (
        <div style={{ marginTop: 6 }}>
          <Text type="warning" style={{ fontSize: 12 }}>
            {e.raisonBlocage}
          </Text>
        </div>
      )}
      {e.consignes && <Paragraph type="secondary" style={{ margin: '6px 0 0', fontSize: 13 }}>{e.consignes}</Paragraph>}
    </div>
  );
}

/** Parcours d'un délégué : modules, leçons consultées, évaluations, conditions restantes. */
export function ParcoursView({ parcours: p, onOuvrirLecon, onDemarrer, chargementEvaluation }: Props) {
  const a = p.affectation;
  const estFormation = a.nature === 'FORMATION';
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <div style={{ background: '#fff', border: '1px solid var(--oh-line)', borderRadius: 12, padding: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <StatutAffectationTag statut={a.statut} enRetard={a.enRetard} />
          <div style={{ minWidth: 220 }}>
            <Progression valeur={a.progression} statut={a.statut} />
          </div>
        </Space>
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} style={{ marginTop: 12 }}>
          <Descriptions.Item label="Score">
            <ScoreSeuil score={a.score} seuil={a.seuilReussite} />
          </Descriptions.Item>
          <Descriptions.Item label="Date limite">{formatDate(a.dateLimite)}</Descriptions.Item>
          <Descriptions.Item label="Obligatoire">{a.obligatoire ? 'Oui' : 'Non'}</Descriptions.Item>
          <Descriptions.Item label="Priorité">{PRIORITES[a.priorite].label}</Descriptions.Item>
          {estFormation && p.niveau && <Descriptions.Item label="Niveau">{NIVEAUX[p.niveau]}</Descriptions.Item>}
          {p.dureeEstimeeMinutes && <Descriptions.Item label="Durée">{formatDuree(p.dureeEstimeeMinutes)}</Descriptions.Item>}
          {p.exigenceSeuil && <Descriptions.Item label="Seuil exigé">{EXIGENCES[p.exigenceSeuil].label}</Descriptions.Item>}
          <Descriptions.Item label="Dernière activité">{formatDateHeure(a.dateDerniereActivite)}</Descriptions.Item>
        </Descriptions>
        {p.conditionsRestantes.length > 0 && a.statut !== 'REUSSIE' && (
          <Alert
            style={{ marginTop: 12 }}
            type={a.statut === 'ECHOUEE' ? 'error' : 'info'}
            showIcon
            message={a.statut === 'ECHOUEE' ? 'Plus aucune tentative possible : contactez votre manager.' : 'Pour valider'}
            description={p.conditionsRestantes.join(' · ')}
          />
        )}
        {a.statut === 'REUSSIE' && <Alert style={{ marginTop: 12 }} type="success" showIcon message={estFormation ? 'Formation validée' : 'Exercice réussi'} />}
      </div>

      {p.description && estFormation && <Paragraph style={{ margin: 0 }}>{p.description}</Paragraph>}
      {p.objectifs && (
        <div>
          <Text strong>Objectifs</Text>
          <ul style={{ paddingInlineStart: 18, margin: '4px 0 0' }}>
            {p.objectifs.split('\n').filter(Boolean).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {estFormation && (
        p.modules.length === 0 ? <Empty description="Aucun module" /> : (
          <Collapse
            defaultActiveKey={p.modules.filter((m) => m.accessible && m.statut !== 'VALIDE').slice(0, 1).map((m) => m.id)}
            items={p.modules.map((m) => ({
              key: m.id,
              collapsible: m.accessible ? undefined : 'disabled',
              label: (
                <Space wrap>
                  {!m.accessible && <LockOutlined />}
                  {m.statut === 'VALIDE' && <CheckCircleFilled style={{ color: '#1E7A4C' }} />}
                  <Text strong>Module {m.ordre} — {m.titre}</Text>
                  <StatutEtapeTag statut={m.statut} />
                  {!m.obligatoire && <Tag style={{ borderRadius: 6 }}>Facultatif</Tag>}
                  <Text type="secondary">{m.leconsVues}/{m.leconsTotal} leçon(s) consultée(s)</Text>
                </Space>
              ),
              children: (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                  {m.description && <Text type="secondary">{m.description}</Text>}
                  <List
                    size="small"
                    dataSource={m.lecons}
                    renderItem={(l) => (
                      <List.Item
                        style={{ cursor: onOuvrirLecon ? 'pointer' : 'default' }}
                        onClick={() => onOuvrirLecon?.(l)}
                        extra={l.consultee ? <Tag color="green" style={{ borderRadius: 6 }}>Consultée</Tag> : l.obligatoire ? <Tag style={{ borderRadius: 6 }}>À consulter</Tag> : <Tag style={{ borderRadius: 6 }}>Facultative</Tag>}
                      >
                        <List.Item.Meta
                          avatar={iconeLecon(l)}
                          title={onOuvrirLecon ? <a>{l.ordre}. {l.titre}</a> : `${l.ordre}. ${l.titre}`}
                          description={`${TYPES_LECON[l.type]}${l.dureeMinutes ? ` · ${formatDuree(l.dureeMinutes)}` : ''}${l.dateConsultation ? ` · vue le ${formatDate(l.dateConsultation)}` : ''}`}
                        />
                      </List.Item>
                    )}
                  />
                  {m.evaluations.map((e) => (
                    <EvaluationCarte key={e.id} e={e} onDemarrer={onDemarrer} chargement={chargementEvaluation === e.id} />
                  ))}
                </Space>
              ),
            }))}
          />
        )
      )}

      {p.evaluationFinale && (
        <div>
          {estFormation && <Text strong style={{ display: 'block', marginBottom: 8 }}>Évaluation finale</Text>}
          <EvaluationCarte e={p.evaluationFinale} onDemarrer={onDemarrer} chargement={chargementEvaluation === p.evaluationFinale.id} />
        </div>
      )}
      {p.exercices.length > 0 && (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Exercices facultatifs</Text>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {p.exercices.map((e) => (
              <EvaluationCarte key={e.id} e={e} onDemarrer={onDemarrer} chargement={chargementEvaluation === e.id} />
            ))}
          </Space>
        </div>
      )}
    </Space>
  );
}
