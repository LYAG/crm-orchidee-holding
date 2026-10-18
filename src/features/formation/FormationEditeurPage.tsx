'use client';

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  BranchesOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  InboxOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Timeline,
  Typography,
  Upload,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { LeconFormDto, ModuleDto } from '@/services/api/FormationService';
import type { EvaluationResume, FormationDetail, HistoriqueFormation, Lecon, ModuleFormation, TypeLecon } from '@/types/formation';
import { AffectationWizard } from './AffectationWizard';
import { StatutPublicationTag } from './components';
import { ApercuFormation } from './ApercuFormation';
import {
  CATEGORIES,
  EXIGENCES,
  NIVEAUX,
  TYPES_EVALUATION,
  TYPES_LECON,
  formatDate,
  formatDateHeure,
  formatDuree,
  messageErreur,
  options,
} from './constants';
import { EvaluationFormModal } from './EvaluationFormModal';
import { FormationFormModal } from './FormationFormModal';

const { Text, Paragraph } = Typography;

const LIBELLES_ACTION: Record<string, string> = {
  CREATION: 'Création',
  MODIFICATION: 'Modification',
  CONTENU_MODIFIE: 'Contenu modifié',
  PUBLICATION: 'Publication',
  ARCHIVAGE: 'Archivage',
  DUPLICATION: 'Duplication',
  NOUVELLE_VERSION: 'Nouvelle version',
  AFFECTATION: 'Affectation',
  REOUVERTURE: 'Nouvelle chance accordée',
  ANNULATION_AFFECTATION: 'Affectation annulée',
  CORRECTION: 'Correction',
  PUBLICATION_RESULTAT: 'Résultat publié',
};

export function JournalFormation({ entrees }: { entrees: HistoriqueFormation[] }) {
  if (entrees.length === 0) return <Empty description="Aucun événement" />;
  return (
    <Timeline
      items={entrees.map((h) => ({
        key: h.id,
        color: h.action === 'PUBLICATION' ? 'green' : h.action === 'ARCHIVAGE' ? 'purple' : 'blue',
        children: (
          <div>
            <Text strong>{LIBELLES_ACTION[h.action] ?? h.action}</Text>
            <Text type="secondary"> — {h.auteurNom}, {formatDateHeure(h.dateAction)}</Text>
            {h.detail && <div style={{ color: 'var(--oh-ink-2)' }}>{h.detail}</div>}
          </div>
        ),
      }))}
    />
  );
}

function ModuleModal({ open, module, onClose, onSave }: { open: boolean; module: ModuleFormation | null; onClose: () => void; onSave: (d: ModuleDto) => Promise<void> }) {
  const [form] = Form.useForm<ModuleDto>();
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => {
    if (open) form.setFieldsValue(module ? { titre: module.titre, description: module.description, obligatoire: module.obligatoire } : { titre: '', description: '', obligatoire: true });
  }, [open, module, form]);
  return (
    <Modal
      open={open}
      title={module ? 'Modifier le module' : 'Nouveau module'}
      okText="Enregistrer"
      cancelText="Annuler"
      confirmLoading={envoi}
      onCancel={onClose}
      destroyOnHidden
      onOk={async () => {
        const v = await form.validateFields();
        setEnvoi(true);
        try {
          await onSave(v);
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="titre" label="Titre du module" rules={[{ required: true, whitespace: true, message: 'Le titre est obligatoire.' }, { max: 200 }]}>
          <Input placeholder="Ex. Familles d’antiseptiques" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 2000 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="obligatoire" label="Module obligatoire" valuePropName="checked" extra="Un module facultatif ne bloque ni la suite ni la réussite.">
          <Switch checkedChildren="Obligatoire" unCheckedChildren="Facultatif" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function LeconModal({ open, lecon, onClose, onSave }: { open: boolean; lecon: Lecon | null; onClose: () => void; onSave: (d: LeconFormDto, fichier: File | null) => Promise<void> }) {
  const [form] = Form.useForm<LeconFormDto & { tempsMinimalMinutes?: number | null }>();
  const [envoi, setEnvoi] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);
  const type = Form.useWatch('type', form) as TypeLecon | undefined;
  const avecFichier = type === 'PDF' || type === 'IMAGE' || type === 'VIDEO' || type === 'AUTRE';

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      lecon
        ? { titre: lecon.titre, type: lecon.type, contenu: lecon.contenu, url: lecon.url, dureeMinutes: lecon.dureeMinutes, tempsMinimalMinutes: lecon.tempsMinimalSecondes == null ? null : lecon.tempsMinimalSecondes / 60, obligatoire: lecon.obligatoire }
        : { titre: '', type: 'TEXTE', contenu: '', url: '', dureeMinutes: null, tempsMinimalMinutes: null, obligatoire: true },
    );
  }, [open, lecon, form]);

  return (
    <Modal
      open={open}
      title={lecon ? 'Modifier la leçon' : 'Nouvelle leçon'}
      okText="Enregistrer"
      cancelText="Annuler"
      width={720}
      confirmLoading={envoi}
      onCancel={() => { setFichier(null); onClose(); }}
      destroyOnHidden
      onOk={async () => {
        const { tempsMinimalMinutes, ...v } = await form.validateFields();
        if (avecFichier && !fichier && !v.url && !lecon?.aFichier) {
          form.setFields([{ name: 'url', errors: ['Ajoutez un fichier ou indiquez un lien.'] }]);
          return;
        }
        setEnvoi(true);
        try {
          await onSave(
            { ...v, tempsMinimalSecondes: tempsMinimalMinutes == null ? null : Math.round(tempsMinimalMinutes * 60) },
            avecFichier ? fichier : null,
          );
          setFichier(null);
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="titre" label="Titre de la leçon" rules={[{ required: true, whitespace: true, message: 'Le titre est obligatoire.' }, { max: 200 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="type" label="Support" rules={[{ required: true }]}>
              <Select options={options(TYPES_LECON)} />
            </Form.Item>
          </Col>
        </Row>
        {type === 'TEXTE' && (
          <Form.Item name="contenu" label="Contenu" rules={[{ required: true, whitespace: true, message: 'Une leçon texte doit avoir un contenu.' }]}>
            <Input.TextArea rows={8} placeholder="Texte de la leçon (les retours à la ligne sont conservés)." />
          </Form.Item>
        )}
        {type !== 'TEXTE' && (
          <Form.Item
            name="url"
            label={type === 'LIEN' ? 'Adresse du lien' : 'Lien (facultatif si un fichier est joint)'}
            rules={[
              { required: type === 'LIEN', message: 'Indiquez l’adresse du lien.' },
              { pattern: /^https?:\/\/.+/i, message: 'Le lien doit commencer par http:// ou https://.' },
            ]}
          >
            <Input placeholder="https://…" />
          </Form.Item>
        )}
        {avecFichier && (
          <Form.Item label="Fichier" extra={lecon?.aFichier && !fichier ? `Fichier actuel : ${lecon.fichierNom}` : 'PDF, image, vidéo, présentation… (50 Mo max)'}>
            <Upload.Dragger
              maxCount={1}
              beforeUpload={(f) => {
                setFichier(f);
                return false;
              }}
              onRemove={() => setFichier(null)}
              fileList={fichier ? [{ uid: '1', name: fichier.name, status: 'done' }] : []}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Glissez un fichier ou cliquez pour le choisir</p>
            </Upload.Dragger>
          </Form.Item>
        )}
        {type !== 'TEXTE' && (
          <Form.Item name="contenu" label="Texte d’accompagnement (facultatif)">
            <Input.TextArea rows={3} />
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col xs={12} md={8}>
            <Form.Item name="dureeMinutes" label="Durée estimée (min)">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="tempsMinimalMinutes"
              label="Temps minimal de consultation (min)"
              extra="Avant de pouvoir valider la leçon. Vide = durée estimée ; 0 = aucun."
            >
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="obligatoire" label="Consultation obligatoire" valuePropName="checked">
              <Switch checkedChildren="Obligatoire" unCheckedChildren="Facultative" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

function EvaluationLigne({ e, onOpen }: { e: EvaluationResume; onOpen: () => void }) {
  return (
    <List.Item
      style={{ paddingInline: 12, background: 'var(--oh-surface-muted)', borderRadius: 8, marginBottom: 6, border: 'none', cursor: 'pointer' }}
      onClick={onOpen}
      actions={[<Button key="ouvrir" size="small" type="link">{e.droits.modifierContenu ? 'Éditer les questions' : 'Voir'}</Button>]}
    >
      <List.Item.Meta
        avatar={<Tag color={e.type === 'EVALUATION_FINALE' ? 'geekblue' : 'cyan'} style={{ borderRadius: 6 }}>{TYPES_EVALUATION[e.type]}</Tag>}
        title={<span>{e.titre} {e.obligatoire && <Tag style={{ borderRadius: 6 }}>Obligatoire</Tag>}</span>}
        description={`${e.nbQuestions} question(s) · ${e.pointsTotal} point(s)${e.seuilReussite != null ? ` · seuil ${e.seuilReussite}/100` : ''}${e.dureeMinutes ? ` · ${e.dureeMinutes} min` : ''}`}
      />
    </List.Item>
  );
}

export function FormationEditeurPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [detail, setDetail] = useState<FormationDetail | null>(null);
  const [historique, setHistorique] = useState<HistoriqueFormation[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState(false);
  const [moduleEdite, setModuleEdite] = useState<ModuleFormation | null | undefined>(undefined);
  const [leconEditee, setLeconEditee] = useState<{ moduleId: string; lecon: Lecon | null } | null>(null);
  const [nouvelleEval, setNouvelleEval] = useState<{ formationId?: string; moduleId?: string; moduleTitre?: string } | null>(null);
  const [affecter, setAffecter] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const charger = useCallback(() => {
    Promise.all([formationService.getFormation(id), formationService.getHistoriqueFormation(id)])
      .then(([d, h]) => {
        setDetail(d);
        setHistorique(h);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Formation introuvable.')));
  }, [id]);

  useEffect(charger, [charger]);

  async function executer(cle: string, fn: () => Promise<FormationDetail | void>, succes: string) {
    setAction(cle);
    try {
      const r = await fn();
      message.success(succes);
      if (r && r.resume.id !== id) router.push(`/formation/formations/${r.resume.id}`);
      else charger();
    } catch (err) {
      message.error(messageErreur(err, 'Action impossible.'));
    } finally {
      setAction(null);
    }
  }

  if (erreur) {
    return <Result status="404" title="Formation indisponible" subTitle={erreur} extra={<Button onClick={() => router.push('/formation/catalogue')}>Retour au catalogue</Button>} />;
  }
  if (!detail) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  const f = detail.resume;
  const d = f.droits;
  const modifiable = d.modifierContenu;

  function deplacerModule(index: number, sens: -1 | 1) {
    const ids = detail!.modules.map((m) => m.id);
    [ids[index], ids[index + sens]] = [ids[index + sens], ids[index]];
    executer('ordre', () => formationService.reorderModules(f.id, ids), 'Modules réordonnés.');
  }

  function deplacerLecon(m: ModuleFormation, index: number, sens: -1 | 1) {
    const ids = m.lecons.map((l) => l.id);
    [ids[index], ids[index + sens]] = [ids[index + sens], ids[index]];
    executer('ordre', () => formationService.reorderLecons(m.id, ids).then(() => undefined), 'Leçons réordonnées.');
  }

  const actions = [
    d.modifierParametres || (f.statut === 'PUBLIEE' && d.archiver) ? (
      <Button key="edit" icon={<EditOutlined />} onClick={() => setEdition(true)}>
        Informations
      </Button>
    ) : null,
    d.affecter ? (
      <Button key="aff" icon={<TeamOutlined />} onClick={() => setAffecter(true)}>
        Affecter
      </Button>
    ) : null,
    f.statut !== 'BROUILLON' && d.archiver ? (
      <Button key="version" icon={<BranchesOutlined />} loading={action === 'version'} onClick={() => executer('version', () => formationService.dupliquerFormation(f.id, true), 'Nouvelle version créée en brouillon.')}>
        Nouvelle version
      </Button>
    ) : null,
    d.dupliquer ? (
      <Button key="copie" icon={<CopyOutlined />} loading={action === 'copie'} onClick={() => executer('copie', () => formationService.dupliquerFormation(f.id, false), 'Copie créée en brouillon.')}>
        Dupliquer
      </Button>
    ) : null,
    d.archiver ? (
      <Popconfirm key="arch" title="Archiver cette formation ?" description="Les délégués gardent leurs résultats mais ne pourront plus faire de nouvelle tentative." okText="Archiver" cancelText="Annuler" onConfirm={() => executer('arch', () => formationService.archiverFormation(f.id), 'Formation archivée.')}>
        <Button loading={action === 'arch'}>Archiver</Button>
      </Popconfirm>
    ) : null,
    d.supprimer ? (
      <Popconfirm key="sup" title="Supprimer ce brouillon ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler" onConfirm={() => executer('sup', async () => { await formationService.deleteFormation(f.id); router.push('/formation/catalogue'); }, 'Brouillon supprimé.')}>
        <Button danger icon={<DeleteOutlined />} />
      </Popconfirm>
    ) : null,
    d.publier ? (
      <Button
        key="pub"
        type="primary"
        icon={<SendOutlined />}
        loading={action === 'pub'}
        disabled={detail.controlesPublication.length > 0}
        onClick={() =>
          modal.confirm({
            title: 'Publier cette formation ?',
            content: 'Une fois publiée, sa structure et ses règles de notation sont figées : toute évolution passera par une nouvelle version. Les versions publiées précédentes seront archivées.',
            okText: 'Publier',
            cancelText: 'Annuler',
            onOk: () => executer('pub', () => formationService.publierFormation(f.id), 'Formation publiée.'),
          })
        }
      >
        Publier
      </Button>
    ) : null,
  ].filter(Boolean);

  return (
    <PageContainer
      title={
        <Space wrap>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/formation/catalogue')} aria-label="Retour" />
          <span>{f.titre}</span>
          <Tag style={{ borderRadius: 6 }}>v{f.version}</Tag>
          <StatutPublicationTag statut={f.statut} />
        </Space>
      }
      subTitle={`${CATEGORIES[f.categorie]} · ${NIVEAUX[f.niveau]}`}
      extra={actions}
    >
      {f.statut === 'BROUILLON' && detail.controlesPublication.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Avant de pouvoir publier"
          description={
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {detail.controlesPublication.map((c) => (
                <li key={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</li>
              ))}
            </ul>
          }
        />
      )}
      {f.statut !== 'BROUILLON' && (
        <Alert
          type={f.statut === 'ARCHIVEE' ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
          message={f.statut === 'ARCHIVEE' ? 'Version archivée : consultable, résultats conservés.' : 'Version publiée : contenu figé.'}
          description="Pour faire évoluer le contenu, créez une nouvelle version : les tentatives déjà passées gardent le contenu et les règles de leur version."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Tabs
            items={[
              {
                key: 'contenu',
                label: 'Modules et leçons',
                children: (
                  <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                    {detail.modules.length === 0 && <Empty description="Aucun module pour l’instant">{modifiable && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModuleEdite(null)}>Ajouter un module</Button>}</Empty>}
                    {detail.modules.map((m, i) => (
                      <ProCard
                        key={m.id}
                        bordered
                        title={
                          <Space wrap>
                            <Text type="secondary">Module {m.ordre}</Text>
                            <Text strong>{m.titre}</Text>
                            {m.obligatoire ? <Tag style={{ borderRadius: 6 }}>Obligatoire</Tag> : <Tag style={{ borderRadius: 6 }} color="default">Facultatif</Tag>}
                          </Space>
                        }
                        extra={
                          modifiable && (
                            <Space size={0}>
                              <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => deplacerModule(i, -1)} aria-label="Monter" />
                              <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={i === detail.modules.length - 1} onClick={() => deplacerModule(i, 1)} aria-label="Descendre" />
                              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setModuleEdite(m)} aria-label="Modifier" />
                              <Popconfirm title="Supprimer ce module, ses leçons et ses quiz ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler" onConfirm={() => executer('supm', () => formationService.deleteModule(m.id), 'Module supprimé.')}>
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Supprimer" />
                              </Popconfirm>
                            </Space>
                          )
                        }
                      >
                        {m.description && <Paragraph type="secondary">{m.description}</Paragraph>}
                        <Text strong>Leçons</Text>
                        <List
                          size="small"
                          dataSource={m.lecons}
                          locale={{ emptyText: 'Aucune leçon' }}
                          renderItem={(l, j) => (
                            <List.Item
                              actions={
                                modifiable
                                  ? [
                                      <Button key="h" type="text" size="small" icon={<ArrowUpOutlined />} disabled={j === 0} onClick={() => deplacerLecon(m, j, -1)} aria-label="Monter" />,
                                      <Button key="b" type="text" size="small" icon={<ArrowDownOutlined />} disabled={j === m.lecons.length - 1} onClick={() => deplacerLecon(m, j, 1)} aria-label="Descendre" />,
                                      <Button key="e" type="text" size="small" icon={<EditOutlined />} onClick={() => setLeconEditee({ moduleId: m.id, lecon: l })} aria-label="Modifier" />,
                                      <Popconfirm key="s" title="Supprimer cette leçon ?" okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler" onConfirm={() => executer('supl', () => formationService.deleteLecon(l.id), 'Leçon supprimée.')}>
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Supprimer" />
                                      </Popconfirm>,
                                    ]
                                  : []
                              }
                            >
                              <List.Item.Meta
                                title={
                                  <Space wrap size={6}>
                                    <span>{l.ordre}. {l.titre}</span>
                                    <Tag style={{ borderRadius: 6 }}>{TYPES_LECON[l.type]}</Tag>
                                    {!l.obligatoire && <Tag style={{ borderRadius: 6 }}>Facultative</Tag>}
                                  </Space>
                                }
                                description={
                                  <Space size={12} wrap>
                                    {l.dureeMinutes && <span>{formatDuree(l.dureeMinutes)}</span>}
                                    {l.aFichier && (
                                      <span>
                                        <PaperClipOutlined /> {l.fichierNom}
                                      </span>
                                    )}
                                    {!l.contenu && !l.url && !l.aFichier && <Text type="danger">Aucun contenu</Text>}
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                        {modifiable && (
                          <Button type="dashed" size="small" icon={<FileAddOutlined />} onClick={() => setLeconEditee({ moduleId: m.id, lecon: null })} style={{ marginTop: 8 }}>
                            Ajouter une leçon
                          </Button>
                        )}
                        <div style={{ marginTop: 16 }}>
                          <Text strong>Quiz du module</Text>
                          <List
                            size="small"
                            style={{ marginTop: 8 }}
                            dataSource={m.evaluations}
                            locale={{ emptyText: f.exigenceSeuil === 'FINALE' ? 'Aucun quiz (facultatif ici)' : 'Aucun quiz — requis pour valider ce module' }}
                            renderItem={(e) => <EvaluationLigne e={e} onOpen={() => router.push(`/formation/evaluations/${e.id}`)} />}
                          />
                          {modifiable && (
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setNouvelleEval({ moduleId: m.id, moduleTitre: m.titre })}>
                              Ajouter un quiz
                            </Button>
                          )}
                        </div>
                      </ProCard>
                    ))}
                    {modifiable && detail.modules.length > 0 && (
                      <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setModuleEdite(null)}>
                        Ajouter un module
                      </Button>
                    )}
                  </Space>
                ),
              },
              {
                key: 'evaluations',
                label: `Évaluation finale et exercices (${detail.evaluations.length})`,
                children: (
                  <ProCard bordered>
                    <List
                      dataSource={detail.evaluations}
                      locale={{ emptyText: 'Aucune évaluation rattachée à la formation' }}
                      renderItem={(e) => <EvaluationLigne e={e} onOpen={() => router.push(`/formation/evaluations/${e.id}`)} />}
                    />
                    {modifiable && (
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => setNouvelleEval({ formationId: f.id })}>
                        {detail.evaluations.some((e) => e.type === 'EVALUATION_FINALE') ? 'Ajouter un exercice' : 'Ajouter l’évaluation finale'}
                      </Button>
                    )}
                  </ProCard>
                ),
              },
              {
                key: 'apercu',
                label: 'Aperçu délégué',
                children: <ApercuFormation detail={detail} />,
              },
              {
                key: 'historique',
                label: 'Historique',
                children: (
                  <ProCard bordered>
                    <JournalFormation entrees={historique} />
                  </ProCard>
                ),
              },
            ]}
          />
        </Col>
        <Col xs={24} xl={8}>
          <ProCard title="Règles de la formation" bordered style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Seuil de réussite">
                <Text strong>{f.seuilReussite}/100</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Seuil exigé">{EXIGENCES[f.exigenceSeuil].label}</Descriptions.Item>
              <Descriptions.Item label="Tentatives max">{f.tentativesMax ?? 'Illimitées'}</Descriptions.Item>
              <Descriptions.Item label="Après un échec">{detail.tentativeApresEchec ? 'Nouvelle tentative autorisée' : 'Pas de nouvelle tentative'}</Descriptions.Item>
              <Descriptions.Item label="Délai entre tentatives">{detail.delaiEntreTentativesHeures ? `${detail.delaiEntreTentativesHeures} h` : 'Aucun'}</Descriptions.Item>
              <Descriptions.Item label="Progression">{detail.progressionSequentielle ? 'Séquentielle' : 'Libre'}</Descriptions.Item>
              <Descriptions.Item label="Durée estimée">{formatDuree(f.dureeEstimeeMinutes)}</Descriptions.Item>
              <Descriptions.Item label="Échéance">{formatDate(f.echeance)}</Descriptions.Item>
              <Descriptions.Item label="Créée par">{f.createurNom}</Descriptions.Item>
              <Descriptions.Item label="Affectations">{f.nbAffectations}</Descriptions.Item>
            </Descriptions>
          </ProCard>
          <ProCard title="Versions" bordered style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={detail.versions}
              renderItem={(v) => (
                <List.Item
                  style={{ cursor: v.id === f.id ? 'default' : 'pointer' }}
                  onClick={() => v.id !== f.id && router.push(`/formation/formations/${v.id}`)}
                  extra={<StatutPublicationTag statut={v.statut} />}
                >
                  <Text strong={v.id === f.id}>Version {v.version}</Text>
                  <Text type="secondary" style={{ marginInlineStart: 8 }}>
                    {v.datePublication ? `publiée le ${formatDate(v.datePublication)}` : `créée le ${formatDate(v.dateCreation)}`}
                  </Text>
                </List.Item>
              )}
            />
          </ProCard>
          {(detail.resume.description || detail.objectifs) && (
            <ProCard title="Présentation" bordered>
              {detail.resume.description && <Paragraph>{detail.resume.description}</Paragraph>}
              {detail.objectifs && (
                <>
                  <Text strong>Objectifs pédagogiques</Text>
                  <ul style={{ paddingInlineStart: 18, marginTop: 4 }}>
                    {detail.objectifs.split('\n').filter(Boolean).map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
            </ProCard>
          )}
        </Col>
      </Row>

      <FormationFormModal open={edition} formation={detail} onClose={() => setEdition(false)} onSaved={() => { setEdition(false); charger(); }} />
      <ModuleModal
        open={moduleEdite !== undefined}
        module={moduleEdite ?? null}
        onClose={() => setModuleEdite(undefined)}
        onSave={async (v) => {
          try {
            const r = moduleEdite ? await formationService.updateModule(moduleEdite.id, v) : await formationService.addModule(f.id, v);
            setDetail(r);
            setModuleEdite(undefined);
            message.success('Module enregistré.');
            charger();
          } catch (err) {
            message.error(messageErreur(err, 'Enregistrement impossible.'));
          }
        }}
      />
      <LeconModal
        open={leconEditee !== null}
        lecon={leconEditee?.lecon ?? null}
        onClose={() => setLeconEditee(null)}
        onSave={async (v, fichier) => {
          try {
            const l = leconEditee!.lecon ? await formationService.updateLecon(leconEditee!.lecon.id, v) : await formationService.addLecon(leconEditee!.moduleId, v);
            if (fichier) await formationService.uploadFichierLecon(l.id, fichier);
            setLeconEditee(null);
            message.success('Leçon enregistrée.');
            charger();
          } catch (err) {
            message.error(messageErreur(err, 'Enregistrement impossible.'));
          }
        }}
      />
      <EvaluationFormModal
        open={nouvelleEval !== null}
        rattachement={nouvelleEval ?? undefined}
        seuilHerite={f.seuilReussite}
        onClose={() => setNouvelleEval(null)}
        onSaved={(e) => {
          setNouvelleEval(null);
          router.push(`/formation/evaluations/${e.resume.id}`);
        }}
      />
      {affecter && <AffectationWizard open contenu={{ formationId: f.id, titre: f.titre }} onClose={() => setAffecter(false)} onDone={() => { setAffecter(false); charger(); }} />}
    </PageContainer>
  );
}
