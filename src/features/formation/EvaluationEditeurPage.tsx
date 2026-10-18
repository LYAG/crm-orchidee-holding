'use client';

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  BranchesOutlined,
  CheckCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SendOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, App, Button, Checkbox, Col, Descriptions, Empty, Input, List, Popconfirm, Radio, Result, Row, Space, Spin, Switch, Tabs, Tag, Typography } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { EvaluationDetail, HistoriqueFormation, Question } from '@/types/formation';
import { AffectationWizard } from './AffectationWizard';
import { StatutPublicationTag } from './components';
import { AFFICHAGES_CORRECTIONS, PUBLICATIONS_RESULTATS, TYPES_EVALUATION, TYPES_QUESTION, formatDate, messageErreur } from './constants';
import { EvaluationFormModal } from './EvaluationFormModal';
import { JournalFormation } from './FormationEditeurPage';
import { QuestionFormModal } from './QuestionFormModal';

const { Text, Paragraph } = Typography;

/** Aperçu d'une question telle que le délégué la voit ; avecCorrection affiche les bonnes réponses. */
function QuestionApercu({ q, avecCorrection }: { q: Question; avecCorrection: boolean }) {
  return (
    <div>
      <Paragraph style={{ marginBottom: 8 }}>
        <Text strong>
          {q.ordre}. {q.enonce}
        </Text>{' '}
        <Text type="secondary">({q.points} pt{q.points > 1 ? 's' : ''}{q.obligatoire ? '' : ', facultative'})</Text>
      </Paragraph>
      {(q.type === 'QCM_UNIQUE' || q.type === 'VRAI_FAUX') && (
        <Radio.Group value={avecCorrection ? q.propositions.find((p) => p.correcte)?.id : undefined}>
          <Space orientation="vertical">
            {q.propositions.map((p) => (
              <Radio key={p.id} value={p.id}>
                {p.libelle} {avecCorrection && p.correcte && <CheckCircleFilled style={{ color: '#1E7A4C' }} />}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}
      {q.type === 'QCM_MULTIPLE' && (
        <Space orientation="vertical">
          {q.propositions.map((p) => (
            <Checkbox key={p.id} checked={avecCorrection && p.correcte}>
              {p.libelle} {avecCorrection && p.correcte && <CheckCircleFilled style={{ color: '#1E7A4C' }} />}
            </Checkbox>
          ))}
        </Space>
      )}
      {q.type === 'REPONSE_COURTE' && <Input placeholder="Réponse courte" value={avecCorrection ? q.reponsesAcceptees.join(' / ') : ''} readOnly style={{ maxWidth: 420 }} />}
      {q.type === 'MANUELLE' && <Input.TextArea rows={3} placeholder="Réponse libre, corrigée par un manager" readOnly />}
      {avecCorrection && q.explication && <Alert type="success" style={{ marginTop: 8 }} message={q.explication} />}
    </div>
  );
}

export function EvaluationEditeurPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const [detail, setDetail] = useState<EvaluationDetail | null>(null);
  const [historique, setHistorique] = useState<HistoriqueFormation[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null | undefined>(undefined);
  const [parametres, setParametres] = useState(false);
  const [affecter, setAffecter] = useState(false);
  const [correction, setCorrection] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const charger = useCallback(() => {
    Promise.all([formationService.getEvaluation(id), formationService.getHistoriqueEvaluation(id)])
      .then(([d, h]) => {
        setDetail(d);
        setHistorique(h);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Évaluation introuvable.')));
  }, [id]);

  useEffect(charger, [charger]);

  async function executer(cle: string, fn: () => Promise<EvaluationDetail | void>, succes: string) {
    setAction(cle);
    try {
      const r = await fn();
      message.success(succes);
      if (r && r.resume.id !== id) router.push(`/formation/evaluations/${r.resume.id}`);
      else charger();
    } catch (err) {
      message.error(messageErreur(err, 'Action impossible.'));
    } finally {
      setAction(null);
    }
  }

  if (erreur) return <Result status="404" title="Évaluation indisponible" subTitle={erreur} extra={<Button onClick={() => router.back()}>Retour</Button>} />;
  if (!detail) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;

  const e = detail.resume;
  const d = e.droits;
  const retour = e.formationId ? `/formation/formations/${e.formationId}` : '/formation/catalogue';

  function deplacer(index: number, sens: -1 | 1) {
    const ids = detail!.questions.map((q) => q.id);
    [ids[index], ids[index + sens]] = [ids[index + sens], ids[index]];
    executer('ordre', () => formationService.reorderQuestions(e.id, ids).then(() => undefined), 'Questions réordonnées.');
  }

  return (
    <PageContainer
      title={
        <Space wrap>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push(retour)} aria-label="Retour" />
          <span>{e.titre}</span>
          {e.independante && <Tag style={{ borderRadius: 6 }}>v{e.version}</Tag>}
          <StatutPublicationTag statut={e.statut} />
        </Space>
      }
      subTitle={`${TYPES_EVALUATION[e.type]}${detail.formationTitre ? ` — ${detail.formationTitre}${detail.moduleTitre ? ` › ${detail.moduleTitre}` : ''}` : ' indépendant'}`}
      extra={[
        d.modifierParametres || d.modifierContenu ? <Button key="param" icon={<SettingOutlined />} onClick={() => setParametres(true)}>Paramètres</Button> : null,
        d.affecter ? <Button key="aff" icon={<TeamOutlined />} onClick={() => setAffecter(true)}>Affecter</Button> : null,
        e.independante && e.statut !== 'BROUILLON' && d.archiver ? <Button key="v" icon={<BranchesOutlined />} loading={action === 'v'} onClick={() => executer('v', () => formationService.dupliquerEvaluation(e.id, true), 'Nouvelle version créée en brouillon.')}>Nouvelle version</Button> : null,
        e.independante && d.dupliquer ? <Button key="c" icon={<CopyOutlined />} loading={action === 'c'} onClick={() => executer('c', () => formationService.dupliquerEvaluation(e.id, false), 'Copie créée.')}>Dupliquer</Button> : null,
        d.archiver ? <Popconfirm key="a" title="Archiver cet exercice ?" description="Les résultats sont conservés ; plus de nouvelle tentative." okText="Archiver" cancelText="Annuler" onConfirm={() => executer('a', () => formationService.archiverEvaluation(e.id), 'Exercice archivé.')}><Button>Archiver</Button></Popconfirm> : null,
        d.supprimer ? <Popconfirm key="s" title="Supprimer cette évaluation et ses questions ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler" onConfirm={() => executer('s', async () => { await formationService.deleteEvaluation(e.id); router.push(retour); }, 'Évaluation supprimée.')}><Button danger icon={<DeleteOutlined />} /></Popconfirm> : null,
        d.publier ? <Button key="p" type="primary" icon={<SendOutlined />} disabled={detail.controlesPublication.length > 0} loading={action === 'p'} onClick={() => executer('p', () => formationService.publierEvaluation(e.id), 'Exercice publié.')}>Publier</Button> : null,
      ].filter(Boolean)}
    >
      {!d.modifierContenu && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={e.statut === 'BROUILLON' ? 'Lecture seule.' : 'Contenu publié figé : les tentatives conservent cette version. Créez une nouvelle version pour modifier les questions.'} />
      )}
      {e.statut === 'BROUILLON' && detail.controlesPublication.length > 0 && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Ajoutez au moins une question pour pouvoir publier." />}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Tabs
            items={[
              {
                key: 'questions',
                label: `Questions (${detail.questions.length})`,
                children: (
                  <ProCard bordered>
                    <List
                      dataSource={detail.questions}
                      locale={{ emptyText: <Empty description="Aucune question">{d.modifierContenu && <Button type="primary" icon={<PlusOutlined />} onClick={() => setQuestion(null)}>Ajouter la première question</Button>}</Empty> }}
                      renderItem={(q, i) => (
                        <List.Item
                          actions={
                            d.modifierContenu
                              ? [
                                  <Button key="h" type="text" size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label="Monter" />,
                                  <Button key="b" type="text" size="small" icon={<ArrowDownOutlined />} disabled={i === detail.questions.length - 1} onClick={() => deplacer(i, 1)} aria-label="Descendre" />,
                                  <Button key="e" type="text" size="small" icon={<EditOutlined />} onClick={() => setQuestion(q)} aria-label="Modifier" />,
                                  <Popconfirm key="s" title="Supprimer cette question ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler" onConfirm={() => executer('sq', () => formationService.deleteQuestion(q.id), 'Question supprimée.')}>
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Supprimer" />
                                  </Popconfirm>,
                                ]
                              : []
                          }
                        >
                          <List.Item.Meta
                            title={<Space wrap><span>{q.ordre}. {q.enonce}</span></Space>}
                            description={
                              <Space wrap size={6}>
                                <Tag style={{ borderRadius: 6 }}>{TYPES_QUESTION[q.type].label}</Tag>
                                <Tag style={{ borderRadius: 6 }}>{q.points} pt(s)</Tag>
                                {!q.obligatoire && <Tag style={{ borderRadius: 6 }}>Facultative</Tag>}
                                {q.propositions.length > 0 && <Text type="secondary">Bonne(s) réponse(s) : {q.propositions.filter((p) => p.correcte).map((p) => p.libelle).join(', ')}</Text>}
                                {q.type === 'REPONSE_COURTE' && <Text type="secondary">Acceptées : {q.reponsesAcceptees.join(', ')}</Text>}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    {d.modifierContenu && detail.questions.length > 0 && (
                      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setQuestion(null)}>
                        Ajouter une question
                      </Button>
                    )}
                  </ProCard>
                ),
              },
              {
                key: 'apercu',
                label: 'Aperçu',
                children: (
                  <ProCard bordered extra={<Space><Text type="secondary">Afficher les bonnes réponses</Text><Switch checked={correction} onChange={setCorrection} /></Space>}>
                    {detail.consignes && <Alert type="info" message={detail.consignes} style={{ marginBottom: 16 }} />}
                    {detail.questions.length === 0 ? <Empty /> : (
                      <Space orientation="vertical" size={24} style={{ width: '100%' }}>
                        {detail.questions.map((q) => <QuestionApercu key={q.id} q={q} avecCorrection={correction} />)}
                      </Space>
                    )}
                  </ProCard>
                ),
              },
              { key: 'historique', label: 'Historique', children: <ProCard bordered><JournalFormation entrees={historique} /></ProCard> },
            ]}
          />
        </Col>
        <Col xs={24} xl={8}>
          <ProCard title="Règles" bordered style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Barème">{e.nbQuestions} question(s), {e.pointsTotal} point(s)</Descriptions.Item>
              <Descriptions.Item label="Score">Ramené sur 100 (ex. {e.pointsTotal ? `${Math.round(e.pointsTotal * 0.75 * 100) / 100}/${e.pointsTotal} = 75/100` : '30/40 = 75/100'})</Descriptions.Item>
              <Descriptions.Item label="Seuil de réussite"><Text strong>{detail.seuilEffectif}/100</Text>{e.seuilReussite == null && <Text type="secondary"> (hérité)</Text>}</Descriptions.Item>
              <Descriptions.Item label="Tentatives max">{detail.tentativesMax ?? 'Hérité / illimité'}</Descriptions.Item>
              <Descriptions.Item label="Après un échec">{detail.tentativeApresEchec == null ? 'Comme la formation' : detail.tentativeApresEchec ? 'Nouvelle tentative autorisée' : 'Pas de nouvelle tentative'}</Descriptions.Item>
              <Descriptions.Item label="Délai entre tentatives">{detail.delaiEntreTentativesHeures ? `${detail.delaiEntreTentativesHeures} h` : 'Hérité / aucun'}</Descriptions.Item>
              <Descriptions.Item label="Durée">{e.dureeMinutes ? `${e.dureeMinutes} min` : 'Libre'}</Descriptions.Item>
              <Descriptions.Item label="Résultat publié">{PUBLICATIONS_RESULTATS[detail.publicationResultats]}</Descriptions.Item>
              <Descriptions.Item label="Corrections visibles">{AFFICHAGES_CORRECTIONS[detail.affichageCorrections]}</Descriptions.Item>
              {e.moduleId && <Descriptions.Item label="Validation du module">{e.obligatoire ? 'Obligatoire' : 'Facultatif'}</Descriptions.Item>}
              <Descriptions.Item label="Créé par">{e.createurNom}</Descriptions.Item>
            </Descriptions>
          </ProCard>
          {e.independante && (
            <ProCard title="Versions" bordered>
              <List
                size="small"
                dataSource={detail.versions}
                renderItem={(v) => (
                  <List.Item style={{ cursor: v.id === e.id ? 'default' : 'pointer' }} onClick={() => v.id !== e.id && router.push(`/formation/evaluations/${v.id}`)} extra={<StatutPublicationTag statut={v.statut} />}>
                    <Text strong={v.id === e.id}>Version {v.version}</Text>
                    <Text type="secondary" style={{ marginInlineStart: 8 }}>{formatDate(v.datePublication ?? v.dateCreation)}</Text>
                  </List.Item>
                )}
              />
            </ProCard>
          )}
        </Col>
      </Row>

      <QuestionFormModal open={question !== undefined} evaluationId={e.id} question={question ?? null} onClose={() => setQuestion(undefined)} onSaved={() => { setQuestion(undefined); charger(); }} />
      <EvaluationFormModal open={parametres} evaluation={detail} onClose={() => setParametres(false)} onSaved={() => { setParametres(false); charger(); }} />
      {affecter && <AffectationWizard open contenu={{ evaluationId: e.id, titre: e.titre }} onClose={() => setAffecter(false)} onDone={() => { setAffecter(false); charger(); }} />}
    </PageContainer>
  );
}
