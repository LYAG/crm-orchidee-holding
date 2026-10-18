'use client';

import { CopyOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Col, Empty, Input, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formationService } from '@/services';
import type { CategorieFormation, EvaluationResume, FormationResume, StatutPublication } from '@/types/formation';
import { StatutPublicationTag } from './components';
import { CATEGORIES, NIVEAUX, STATUTS_PUBLICATION, TYPES_EVALUATION, formatDate, formatDuree, messageErreur, options } from './constants';
import { EvaluationFormModal } from './EvaluationFormModal';
import { FormationFormModal } from './FormationFormModal';

const { Text } = Typography;

export function CatalogueFormationPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [onglet, setOnglet] = useState('formations');
  const [statut, setStatut] = useState<StatutPublication | undefined>();
  const [categorie, setCategorie] = useState<CategorieFormation | undefined>();
  const [recherche, setRecherche] = useState('');
  const [formations, setFormations] = useState<FormationResume[]>([]);
  const [exercices, setExercices] = useState<EvaluationResume[]>([]);
  const [chargement, setChargement] = useState(true);
  const [creationFormation, setCreationFormation] = useState(false);
  const [creationExercice, setCreationExercice] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    Promise.all([
      formationService.getFormations({ statut, categorie, q: recherche || undefined }),
      formationService.getEvaluationsIndependantes(statut),
    ])
      .then(([f, e]) => {
        setFormations(f);
        setExercices(e);
      })
      .catch((err) => message.error(messageErreur(err, 'Impossible de charger le catalogue.')))
      .finally(() => setChargement(false));
  }, [statut, categorie, recherche, message]);

  useEffect(() => {
    const t = setTimeout(charger, recherche ? 250 : 0);
    return () => clearTimeout(t);
  }, [charger, recherche]);

  async function dupliquer(id: string) {
    try {
      const f = await formationService.dupliquerFormation(id, false);
      message.success('Copie créée en brouillon.');
      router.push(`/formation/formations/${f.resume.id}`);
    } catch (err) {
      message.error(messageErreur(err, 'Duplication impossible.'));
    }
  }

  const filtres = (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} md={10}>
        <Input allowClear prefix={<SearchOutlined />} placeholder="Rechercher par titre" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </Col>
      <Col xs={12} md={7}>
        <Select allowClear style={{ width: '100%' }} placeholder="Tous les statuts" value={statut} onChange={setStatut} options={options(STATUTS_PUBLICATION)} />
      </Col>
      {onglet === 'formations' && (
        <Col xs={12} md={7}>
          <Select allowClear style={{ width: '100%' }} placeholder="Toutes les catégories" value={categorie} onChange={setCategorie} options={options(CATEGORIES)} />
        </Col>
      )}
    </Row>
  );

  return (
    <PageContainer
      title="Formations et exercices"
      subTitle="Concevez, publiez et faites évoluer les contenus de formation"
      extra={[
        <Button key="exo" icon={<PlusOutlined />} onClick={() => setCreationExercice(true)}>
          Exercice indépendant
        </Button>,
        <Button key="form" type="primary" icon={<PlusOutlined />} onClick={() => setCreationFormation(true)}>
          Nouvelle formation
        </Button>,
      ]}
    >
      <div className="oh-card-surface" style={{ background: '#fff', borderRadius: 12, padding: '4px 16px 16px', border: '1px solid var(--oh-line)' }}>
        <Tabs
          activeKey={onglet}
          onChange={setOnglet}
          items={[
            {
              key: 'formations',
              label: `Formations (${formations.length})`,
              children: (
                <>
                  {filtres}
                  <Table<FormationResume>
                    rowKey="id"
                    loading={chargement}
                    dataSource={formations}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    locale={{
                      emptyText: (
                        <Empty description="Aucune formation">
                          <Button type="primary" onClick={() => setCreationFormation(true)}>
                            Créer la première formation
                          </Button>
                        </Empty>
                      ),
                    }}
                    onRow={(f) => ({ onClick: () => router.push(`/formation/formations/${f.id}`), style: { cursor: 'pointer' } })}
                    columns={[
                      {
                        title: 'Formation',
                        dataIndex: 'titre',
                        render: (t, f) => (
                          <Space orientation="vertical" size={0}>
                            <Text strong>{t}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {CATEGORIES[f.categorie]} · {NIVEAUX[f.niveau]} · {formatDuree(f.dureeEstimeeMinutes)}
                            </Text>
                          </Space>
                        ),
                      },
                      { title: 'Version', dataIndex: 'version', align: 'center', render: (v) => <Tag style={{ borderRadius: 6 }}>v{v}</Tag> },
                      { title: 'Statut', dataIndex: 'statut', render: (s) => <StatutPublicationTag statut={s} /> },
                      { title: 'Contenu', render: (_, f) => <Text type="secondary">{f.nbModules} module(s) · {f.nbLecons} leçon(s) · {f.nbEvaluations} quiz</Text> },
                      { title: 'Seuil', dataIndex: 'seuilReussite', align: 'right', render: (s) => `${s}/100` },
                      { title: 'Affectations', dataIndex: 'nbAffectations', align: 'right' },
                      { title: 'Créée par', dataIndex: 'createurNom', render: (n, f) => <span>{n}{!f.globale && <Tag style={{ marginInlineStart: 6, borderRadius: 6 }}>Équipe</Tag>}</span> },
                      { title: 'Modifiée le', dataIndex: 'dateModification', render: formatDate },
                      {
                        title: '',
                        key: 'actions',
                        width: 100,
                        render: (_, f) => (
                          <Space size={0} onClick={(e) => e.stopPropagation()}>
                            <Button type="link" size="small" icon={<EyeOutlined />} aria-label="Ouvrir" onClick={() => router.push(`/formation/formations/${f.id}`)} />
                            {f.droits.dupliquer && <Button type="link" size="small" icon={<CopyOutlined />} aria-label="Dupliquer" title="Dupliquer" onClick={() => dupliquer(f.id)} />}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: 'exercices',
              label: `Exercices indépendants (${exercices.length})`,
              children: (
                <>
                  {filtres}
                  <Table<EvaluationResume>
                    rowKey="id"
                    loading={chargement}
                    dataSource={exercices}
                    scroll={{ x: 760 }}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    locale={{
                      emptyText: (
                        <Empty description="Aucun exercice indépendant">
                          <Button onClick={() => setCreationExercice(true)}>Créer un exercice</Button>
                        </Empty>
                      ),
                    }}
                    onRow={(e) => ({ onClick: () => router.push(`/formation/evaluations/${e.id}`), style: { cursor: 'pointer' } })}
                    columns={[
                      { title: 'Exercice', dataIndex: 'titre', render: (t, e) => <Space orientation="vertical" size={0}><Text strong>{t}</Text><Text type="secondary" style={{ fontSize: 12 }}>{TYPES_EVALUATION[e.type]}</Text></Space> },
                      { title: 'Version', dataIndex: 'version', align: 'center', render: (v) => <Tag style={{ borderRadius: 6 }}>v{v}</Tag> },
                      { title: 'Statut', dataIndex: 'statut', render: (s) => <StatutPublicationTag statut={s} /> },
                      { title: 'Questions', dataIndex: 'nbQuestions', align: 'right', render: (n, e) => `${n} (${e.pointsTotal} pts)` },
                      { title: 'Seuil', dataIndex: 'seuilReussite', align: 'right', render: (s) => (s == null ? 'Par défaut' : `${s}/100`) },
                      { title: 'Affectations', dataIndex: 'nbAffectations', align: 'right' },
                      { title: 'Créé par', dataIndex: 'createurNom' },
                      { title: 'Modifié le', dataIndex: 'dateModification', render: formatDate },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </div>

      <FormationFormModal
        open={creationFormation}
        onClose={() => setCreationFormation(false)}
        onSaved={(f) => {
          setCreationFormation(false);
          router.push(`/formation/formations/${f.resume.id}`);
        }}
      />
      <EvaluationFormModal
        open={creationExercice}
        onClose={() => setCreationExercice(false)}
        onSaved={(e) => {
          setCreationExercice(false);
          router.push(`/formation/evaluations/${e.resume.id}`);
        }}
      />
    </PageContainer>
  );
}
