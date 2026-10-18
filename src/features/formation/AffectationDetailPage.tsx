'use client';

import { ArrowLeftOutlined, RedoOutlined, StopOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { App, Button, Col, DatePicker, Drawer, Empty, Form, Input, InputNumber, Modal, Popconfirm, Result, Row, Spin, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { formationService } from '@/services';
import type { AffectationDetail, ResultatTentative, TentativeResume } from '@/types/formation';
import { ScoreSeuil, StatutTentativeTag } from './components';
import { formatDateHeure, messageErreur } from './constants';
import { ParcoursView } from './ParcoursView';
import { ResultatTentativeView } from './ResultatTentativeView';

const { Text } = Typography;

/** Vue manager d'une affectation : parcours détaillé, tentatives, nouvelle chance, annulation. */
export function AffectationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const peutAffecter = usePermission('FORMATION_AFFECTATION');
  const [detail, setDetail] = useState<AffectationDetail | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reouverture, setReouverture] = useState(false);
  const [tentative, setTentative] = useState<ResultatTentative | null>(null);
  const [form] = Form.useForm<{ tentativesSupplementaires: number; nouvelleDateLimite?: dayjs.Dayjs; message?: string }>();

  const charger = useCallback(() => {
    formationService
      .getAffectation(id)
      .then((d) => {
        setDetail(d);
        setErreur(null);
      })
      .catch((err) => setErreur(messageErreur(err, 'Affectation introuvable.')));
  }, [id]);
  useEffect(charger, [charger]);

  async function ouvrirTentative(t: TentativeResume) {
    try {
      setTentative(await formationService.getTentative(t.id));
    } catch (err) {
      message.error(messageErreur(err, 'Tentative indisponible.'));
    }
  }

  if (erreur) return <Result status="403" title="Affectation indisponible" subTitle={erreur} extra={<Button onClick={() => router.back()}>Retour</Button>} />;
  if (!detail) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin size="large" /></div>;
  const a = detail.parcours.affectation;
  const active = a.statut !== 'ANNULEE' && a.statut !== 'REUSSIE';

  return (
    <PageContainer
      title={
        <span>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} aria-label="Retour" /> {a.titre}
        </span>
      }
      subTitle={`${a.delegueNom} · affecté par ${a.assigneParNom} le ${formatDateHeure(a.dateAffectation)}`}
      extra={
        peutAffecter && active
          ? [
              <Button key="r" icon={<RedoOutlined />} onClick={() => { form.resetFields(); setReouverture(true); }}>
                Accorder une nouvelle chance
              </Button>,
              <Popconfirm key="a" title="Annuler cette affectation ?" description="Les tentatives et résultats déjà enregistrés sont conservés." okText="Annuler l’affectation" cancelText="Non" onConfirm={async () => {
                try {
                  await formationService.annulerAffectation(a.id);
                  message.success('Affectation annulée.');
                  charger();
                } catch (err) {
                  message.error(messageErreur(err, 'Annulation impossible.'));
                }
              }}>
                <Button danger icon={<StopOutlined />}>Annuler</Button>
              </Popconfirm>,
            ]
          : []
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <ParcoursView parcours={detail.parcours} />
        </Col>
        <Col xs={24} xl={9}>
          <ProCard title={`Tentatives (${detail.tentatives.length})`} bordered>
            <Table<TentativeResume>
              size="small"
              rowKey="id"
              dataSource={detail.tentatives}
              pagination={false}
              scroll={{ x: 420 }}
              locale={{ emptyText: <Empty description="Aucune tentative" /> }}
              onRow={(t) => ({ onClick: () => ouvrirTentative(t), style: { cursor: 'pointer' } })}
              columns={[
                { title: 'Évaluation', dataIndex: 'evaluationTitre', render: (e, t) => <span>{e} <Text type="secondary">n° {t.numero}</Text></span> },
                { title: 'Score', dataIndex: 'score', render: (s, t) => <ScoreSeuil score={s} seuil={t.seuil} /> },
                { title: 'Statut', dataIndex: 'statut', render: (s, t) => <span><StatutTentativeTag statut={s} />{!t.resultatPublie && (s === 'REUSSIE' || s === 'ECHOUEE') && <Text type="secondary" style={{ fontSize: 12 }}> non publié</Text>}</span> },
              ]}
            />
          </ProCard>
        </Col>
      </Row>

      <Modal
        open={reouverture}
        title={`Nouvelle chance pour ${a.delegueNom}`}
        okText="Accorder"
        cancelText="Annuler"
        onCancel={() => setReouverture(false)}
        destroyOnHidden
        onOk={async () => {
          const v = await form.validateFields();
          try {
            const d = await formationService.reouvrirAffectation(a.id, {
              tentativesSupplementaires: v.tentativesSupplementaires ?? 0,
              nouvelleDateLimite: v.nouvelleDateLimite ? v.nouvelleDateLimite.format('YYYY-MM-DD') : null,
              message: v.message,
            });
            setDetail(d);
            setReouverture(false);
            message.success('Le délégué a été notifié.');
          } catch (err) {
            message.error(messageErreur(err, 'Action impossible.'));
          }
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ tentativesSupplementaires: 1 }}>
          <Form.Item name="tentativesSupplementaires" label="Tentatives supplémentaires (sur chaque évaluation)" extra={`Déjà accordées : ${a.tentativesSupplementaires}. S’applique même si la nouvelle tentative après échec était interdite.`}>
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nouvelleDateLimite" label="Nouvelle date limite (facultative)">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="message" label="Message au délégué (facultatif)">
            <Input.TextArea rows={2} maxLength={1000} placeholder="Ex. Relis le module 2 avant de retenter." />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer open={tentative !== null} onClose={() => setTentative(null)} size={720} title={tentative ? `${tentative.titre} — tentative ${tentative.numero}` : ''} destroyOnHidden>
        {tentative && <ResultatTentativeView resultat={tentative} />}
      </Drawer>
    </PageContainer>
  );
}
