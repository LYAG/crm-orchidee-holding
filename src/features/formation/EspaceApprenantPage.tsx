'use client';

import { BellOutlined, BookOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EditOutlined, RiseOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Badge, Button, Card, Col, Empty, List, Row, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { formationService } from '@/services';
import type { Affectation, EspaceApprenant, NotificationFormation, TentativeResume } from '@/types/formation';
import { Progression, ScoreSeuil, StatutAffectationTag } from './components';
import { CATEGORIES, NOTIFICATIONS, PRIORITES, TYPES_EVALUATION, formatDate, formatDateHeure, messageErreur } from './constants';

const { Text, Paragraph } = Typography;

type Filtre = 'toutes' | 'obligatoires' | 'encours' | 'terminees' | 'exercices';

function CarteAffectation({ a, onOpen }: { a: Affectation; onOpen: () => void }) {
  return (
    <Card hoverable onClick={onOpen} style={{ height: '100%', borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap size={4}>
          <Tag style={{ borderRadius: 6 }}>{a.nature === 'FORMATION' ? (a.categorie ? CATEGORIES[a.categorie] : 'Formation') : a.typeEvaluation ? TYPES_EVALUATION[a.typeEvaluation] : 'Exercice'}</Tag>
          {a.obligatoire && <Tag color="geekblue" style={{ borderRadius: 6 }}>Obligatoire</Tag>}
          {a.priorite === 'HAUTE' && <Tag color={PRIORITES.HAUTE.color} style={{ borderRadius: 6 }}>Priorité haute</Tag>}
        </Space>
        <Text strong style={{ fontSize: 16 }}>{a.titre}</Text>
        <StatutAffectationTag statut={a.statut} enRetard={a.enRetard} />
        <Progression valeur={a.progression} statut={a.statut} />
        <Space wrap size={[16, 0]}>
          <Text type="secondary">Limite : {formatDate(a.dateLimite)}</Text>
          <span>
            <Text type="secondary">Score : </Text>
            <ScoreSeuil score={a.score} seuil={a.seuilReussite} />
          </span>
        </Space>
      </Space>
    </Card>
  );
}

/** Espace Formation du délégué : ses affectations, échéances, résultats et notifications. */
export function EspaceApprenantPage() {
  const router = useRouter();
  const [tableau, setTableau] = useState<EspaceApprenant | null>(null);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [notifications, setNotifications] = useState<NotificationFormation[]>([]);
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([formationService.getMonEspace(), formationService.getMesAffectations(), formationService.getNotifications()])
      .then(([t, a, n]) => {
        setTableau(t);
        setAffectations(a);
        setNotifications(n);
      })
      .catch((err) => setErreur(messageErreur(err, 'Impossible de charger votre espace Formation.')));
  }, []);

  const visibles = useMemo(
    () =>
      affectations.filter((a) => {
        switch (filtre) {
          case 'obligatoires':
            return a.obligatoire;
          case 'encours':
            return a.statut === 'EN_COURS' || a.statut === 'NON_COMMENCEE' || a.statut === 'EN_ATTENTE_CORRECTION';
          case 'terminees':
            return a.statut === 'REUSSIE' || a.statut === 'ECHOUEE';
          case 'exercices':
            return a.nature === 'EVALUATION';
          default:
            return true;
        }
      }),
    [affectations, filtre],
  );

  async function lireNotification(n: NotificationFormation) {
    if (!n.lue) {
      formationService.marquerNotificationLue(n.id).catch(() => {});
      setNotifications((l) => l.map((x) => (x.id === n.id ? { ...x, lue: true } : x)));
    }
    if (n.affectationId && affectations.some((a) => a.id === n.affectationId)) router.push(`/formation/mon-espace/${n.affectationId}`);
    else if (n.tentativeId) router.push(`/formation/mon-espace/resultats/${n.tentativeId}`);
  }

  if (erreur) return <PageContainer title="Mon espace Formation"><Alert type="error" showIcon message={erreur} /></PageContainer>;
  if (!tableau) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;
  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <PageContainer title="Mon espace Formation" subTitle="Vos formations, exercices et résultats">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><StatCard icon={<BookOutlined />} label="Affectées" value={tableau.affectees} accent="#0F6E52" bg="#E8F2EE" /></Col>
        <Col xs={12} md={6}><StatCard icon={<EditOutlined />} label="En cours" value={tableau.enCours + tableau.nonCommencees} accent="#1F5FA8" bg="#E6EEF8" /></Col>
        <Col xs={12} md={6}><StatCard icon={<CheckCircleOutlined />} label="Réussies" value={tableau.reussies} accent="#1E7A4C" bg="#E5F3EA" /></Col>
        <Col xs={12} md={6}><StatCard icon={<ClockCircleOutlined />} label="En retard" value={tableau.enRetard} accent="#B42F29" bg="#FBEAEA" alert /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Segmented<Filtre>
            block
            style={{ marginBottom: 16 }}
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: 'toutes', label: 'Toutes' },
              { value: 'obligatoires', label: 'Obligatoires' },
              { value: 'encours', label: 'À faire' },
              { value: 'terminees', label: 'Terminées' },
              { value: 'exercices', label: 'Exercices' },
            ]}
          />
          {visibles.length === 0 ? (
            <Empty description={affectations.length === 0 ? 'Aucune formation ne vous a encore été affectée.' : 'Rien dans cette catégorie.'} />
          ) : (
            <Row gutter={[16, 16]}>
              {visibles.map((a) => (
                <Col key={a.id} xs={24} md={12}>
                  <CarteAffectation a={a} onOpen={() => router.push(`/formation/mon-espace/${a.id}`)} />
                </Col>
              ))}
            </Row>
          )}
        </Col>
        <Col xs={24} xl={8}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <ProCard title={<Space><BellOutlined /> Notifications <Badge count={nonLues} /></Space>} bordered extra={nonLues > 0 && <Button type="link" size="small" onClick={() => { formationService.marquerToutesLues().catch(() => {}); setNotifications((l) => l.map((n) => ({ ...n, lue: true }))); }}>Tout marquer lu</Button>}>
              <List
                size="small"
                dataSource={notifications.slice(0, 8)}
                locale={{ emptyText: 'Aucune notification' }}
                renderItem={(n) => (
                  <List.Item style={{ cursor: 'pointer', opacity: n.lue ? 0.65 : 1 }} onClick={() => lireNotification(n)}>
                    <List.Item.Meta
                      title={<Space size={6}>{!n.lue && <Badge status="processing" />}<span>{n.titre}</span></Space>}
                      description={<span><Tag style={{ borderRadius: 6 }}>{NOTIFICATIONS[n.type]}</Tag>{formatDateHeure(n.dateCreation)}{n.message && <Paragraph type="secondary" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{n.message}</Paragraph>}</span>}
                    />
                  </List.Item>
                )}
              />
            </ProCard>
            <ProCard title="Prochaines échéances" bordered>
              <List
                size="small"
                dataSource={tableau.prochainesEcheances}
                locale={{ emptyText: 'Aucune échéance' }}
                renderItem={(a) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => router.push(`/formation/mon-espace/${a.id}`)} extra={<Text type={a.enRetard ? 'danger' : 'secondary'}>{formatDate(a.dateLimite)}</Text>}>
                    {a.titre}
                  </List.Item>
                )}
              />
            </ProCard>
            <ProCard title={<Space><RiseOutlined /> Derniers résultats</Space>} bordered>
              <List<TentativeResume>
                size="small"
                dataSource={tableau.derniersResultats}
                locale={{ emptyText: 'Aucun résultat publié' }}
                renderItem={(t) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => router.push(`/formation/mon-espace/resultats/${t.id}`)} extra={t.statut === 'REUSSIE' ? <CheckCircleOutlined style={{ color: '#1E7A4C' }} /> : <CloseCircleOutlined style={{ color: '#B42F29' }} />}>
                    <Space orientation="vertical" size={0}>
                      <Text>{t.evaluationTitre}</Text>
                      <ScoreSeuil score={t.score} seuil={t.seuil} />
                    </Space>
                  </List.Item>
                )}
              />
            </ProCard>
          </Space>
        </Col>
      </Row>
    </PageContainer>
  );
}
