'use client';

import { Alert, App, Button, Col, DatePicker, Form, InputNumber, List, Modal, Radio, Row, Select, Space, Steps, Switch, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import type { AffectationDto } from '@/services/api/FormationService';
import { formationService, utilisateurService, zoneService } from '@/services';
import type { Utilisateur, Zone } from '@/types';
import type { ApercuAffectation, CibleAffectation, EvaluationResume, FormationResume, ParametresFormation, PrioriteAffectation } from '@/types/formation';
import { CIBLES, PRIORITES, messageErreur, options } from './constants';

const { Text } = Typography;

interface Props {
  open: boolean;
  /** Contenu imposé (depuis l'éditeur) ; sinon le premier écran permet de le choisir. */
  contenu?: { formationId?: string; evaluationId?: string; titre: string };
  onClose: () => void;
  onDone: () => void;
}

interface Valeurs {
  nature: 'FORMATION' | 'EVALUATION';
  formationId?: string;
  evaluationId?: string;
  cibleType: CibleAffectation;
  delegueIds?: string[];
  managerId?: string;
  region?: string;
  dateDebut?: dayjs.Dayjs | null;
  dateLimite?: dayjs.Dayjs | null;
  obligatoire: boolean;
  priorite: PrioriteAffectation;
  tentativesMax?: number | null;
  seuilReussite?: number | null;
}

/** Affectation en 4 étapes : contenu, destinataires, paramètres, récapitulatif avant confirmation. */
export function AffectationWizard({ open, contenu, onClose, onDone }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<Valeurs>();
  const [etape, setEtape] = useState(contenu ? 1 : 0);
  const [formations, setFormations] = useState<FormationResume[]>([]);
  const [exercices, setExercices] = useState<EvaluationResume[]>([]);
  const [delegues, setDelegues] = useState<Utilisateur[]>([]);
  const [managers, setManagers] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [parametres, setParametres] = useState<ParametresFormation | null>(null);
  const [apercu, setApercu] = useState<ApercuAffectation | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const estAdmin = user?.role === UserRole.ADMIN;
  const nature = Form.useWatch('nature', form);
  const cible = Form.useWatch('cibleType', form);

  useEffect(() => {
    if (!open || !user) return;
    form.resetFields();
    form.setFieldsValue({
      nature: contenu?.evaluationId ? 'EVALUATION' : 'FORMATION',
      formationId: contenu?.formationId,
      evaluationId: contenu?.evaluationId,
      cibleType: 'DELEGUES',
      obligatoire: true,
      priorite: 'NORMALE',
      dateDebut: dayjs(),
    });
    formationService.getFormations({ statut: 'PUBLIEE' }).then(setFormations).catch(() => {});
    formationService.getEvaluationsIndependantes('PUBLIEE').then(setExercices).catch(() => {});
    formationService.getParametres().then(setParametres).catch(() => {});
    zoneService.getAll().then(setZones).catch(() => {});
    if (estAdmin) {
      utilisateurService.getByRole(UserRole.DELEGUE).then(setDelegues).catch(() => {});
      utilisateurService.getByRole(UserRole.MANAGER).then(setManagers).catch(() => {});
    } else {
      utilisateurService.getDeleguesByManager(user.id).then(setDelegues).catch(() => {});
    }
  }, [open, user, estAdmin, contenu?.formationId, contenu?.evaluationId, form]);

  const regions = useMemo(() => [...new Set(zones.map((z) => z.region).filter(Boolean))].sort(), [zones]);
  const seuilMin = estAdmin ? 0 : (parametres?.seuilMinManager ?? 0);

  function dto(): AffectationDto {
    const v = form.getFieldsValue(true) as Valeurs;
    return {
      formationId: v.nature === 'FORMATION' ? v.formationId : null,
      evaluationId: v.nature === 'EVALUATION' ? v.evaluationId : null,
      cibleType: v.cibleType,
      delegueIds: v.cibleType === 'DELEGUES' ? v.delegueIds : undefined,
      managerId: v.cibleType === 'EQUIPE' ? v.managerId : undefined,
      region: v.cibleType === 'REGION' ? v.region : undefined,
      dateDebut: v.dateDebut ? v.dateDebut.format('YYYY-MM-DD') : null,
      dateLimite: v.dateLimite ? v.dateLimite.format('YYYY-MM-DD') : null,
      obligatoire: v.obligatoire,
      priorite: v.priorite,
      tentativesMax: v.tentativesMax ?? null,
      seuilReussite: v.seuilReussite ?? null,
    };
  }

  const champsEtape: (keyof Valeurs)[][] = [
    ['nature', 'formationId', 'evaluationId'],
    ['cibleType', 'delegueIds', 'managerId', 'region'],
    ['dateDebut', 'dateLimite', 'obligatoire', 'priorite', 'tentativesMax', 'seuilReussite'],
  ];

  async function suivant() {
    await form.validateFields(champsEtape[etape]);
    if (etape === 2) {
      setEnvoi(true);
      try {
        setApercu(await formationService.apercuAffectation(dto()));
        setEtape(3);
      } catch (err) {
        message.error(messageErreur(err, 'Récapitulatif impossible.'));
      } finally {
        setEnvoi(false);
      }
      return;
    }
    setEtape(etape + 1);
  }

  async function confirmer() {
    setEnvoi(true);
    try {
      const r = await formationService.affecter(dto());
      message.success(`${r.creees} affectation(s) créée(s)${r.ignorees ? `, ${r.ignorees} délégué(s) déjà affecté(s) ignoré(s)` : ''}.`);
      onDone();
    } catch (err) {
      message.error(messageErreur(err, 'Affectation impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      open={open}
      title={contenu ? `Affecter « ${contenu.titre} »` : 'Nouvelle affectation'}
      width={760}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        etape > (contenu ? 1 : 0) ? (
          <Button key="prec" onClick={() => setEtape(etape - 1)}>
            Précédent
          </Button>
        ) : (
          <Button key="annuler" onClick={onClose}>
            Annuler
          </Button>
        ),
        <Button
          key="ok"
          type="primary"
          loading={envoi}
          disabled={etape === 3 && (apercu?.nouveaux ?? 0) === 0}
          onClick={etape === 3 ? confirmer : suivant}
        >
          {etape === 3 ? `Affecter ${apercu?.nouveaux ?? 0} délégué(s)` : etape === 2 ? 'Voir le récapitulatif' : 'Suivant'}
        </Button>,
      ]}
    >
      <Steps
        size="small"
        current={etape}
        style={{ marginBottom: 20 }}
        items={[{ title: 'Contenu' }, { title: 'Destinataires' }, { title: 'Paramètres' }, { title: 'Récapitulatif' }]}
      />
      <Form<Valeurs> form={form} layout="vertical" preserve>
        <div style={{ display: etape === 0 ? 'block' : 'none' }}>
          <Form.Item name="nature" label="Que voulez-vous affecter ?">
            <Radio.Group optionType="button" options={[{ value: 'FORMATION', label: 'Une formation' }, { value: 'EVALUATION', label: 'Un exercice indépendant' }]} />
          </Form.Item>
          {nature === 'FORMATION' ? (
            <Form.Item name="formationId" label="Formation publiée" rules={[{ required: etape === 0 && nature === 'FORMATION', message: 'Choisissez une formation.' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Choisir" options={formations.map((f) => ({ value: f.id, label: `${f.titre} — v${f.version}` }))} notFoundContent="Aucune formation publiée" />
            </Form.Item>
          ) : (
            <Form.Item name="evaluationId" label="Exercice publié" rules={[{ required: etape === 0 && nature === 'EVALUATION', message: 'Choisissez un exercice.' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Choisir" options={exercices.map((e) => ({ value: e.id, label: `${e.titre} — v${e.version}` }))} notFoundContent="Aucun exercice publié" />
            </Form.Item>
          )}
        </div>

        <div style={{ display: etape === 1 ? 'block' : 'none' }}>
          <Form.Item name="cibleType" label="Destinataires">
            <Radio.Group optionType="button" options={options(CIBLES).filter((o) => o.value !== 'EQUIPE' || estAdmin || user?.role === UserRole.MANAGER)} />
          </Form.Item>
          {cible === 'DELEGUES' && (
            <Form.Item name="delegueIds" label="Délégués" rules={[{ required: etape === 1, message: 'Sélectionnez au moins un délégué.' }]}>
              <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Choisir un ou plusieurs délégués" options={delegues.map((d) => ({ value: d.id, label: `${d.prenom} ${d.nom}` }))} />
            </Form.Item>
          )}
          {cible === 'EQUIPE' &&
            (estAdmin ? (
              <Form.Item name="managerId" label="Équipe du manager" rules={[{ required: etape === 1, message: 'Choisissez une équipe.' }]}>
                <Select options={managers.map((m) => ({ value: m.id, label: `${m.prenom} ${m.nom}` }))} />
              </Form.Item>
            ) : (
              <Alert type="info" showIcon message={`Tous les délégués de votre équipe (${delegues.length}).`} />
            ))}
          {cible === 'REGION' && (
            <Form.Item name="region" label="Région" rules={[{ required: etape === 1, message: 'Choisissez une région.' }]} extra={!estAdmin ? 'Limité aux délégués de votre équipe.' : undefined}>
              <Select options={regions.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          )}
          {cible === 'PERIMETRE' && <Alert type="info" showIcon message={estAdmin ? 'Tous les délégués.' : 'Tous les délégués de votre équipe.'} />}
        </div>

        <div style={{ display: etape === 2 ? 'block' : 'none' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="dateDebut" label="Date de début">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="dateLimite"
                label="Date limite"
                dependencies={['dateDebut']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, v) => {
                      const debut = getFieldValue('dateDebut');
                      return !v || !debut || !v.isBefore(debut, 'day') ? Promise.resolve() : Promise.reject(new Error('La date limite doit suivre la date de début.'));
                    },
                  }),
                ]}
                extra="Vide = échéance de la formation, s’il y en a une."
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="obligatoire" label="Obligatoire" valuePropName="checked">
                <Switch checkedChildren="Oui" unCheckedChildren="Non" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="priorite" label="Priorité">
                <Select options={options(PRIORITES)} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="tentativesMax" label="Tentatives max" extra="Vide = règle du contenu">
                <InputNumber min={1} max={parametres?.tentativesMaxPlafond} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="seuilReussite" label="Seuil (/100)" extra={seuilMin ? `Min. ${seuilMin} — vide = règle du contenu` : 'Vide = règle du contenu'}>
                <InputNumber min={seuilMin} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {etape === 3 && apercu && (
        <Space orientation="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type={apercu.nouveaux ? 'success' : 'warning'}
            showIcon
            message={`« ${apercu.titre} » → ${apercu.cibleLibelle}`}
            description={`${apercu.nouveaux} nouvelle(s) affectation(s) sur ${apercu.total} délégué(s) ciblé(s).`}
          />
          {apercu.avertissements.map((a) => (
            <Alert key={a} type="warning" showIcon message={a} />
          ))}
          <List
            size="small"
            bordered
            style={{ maxHeight: 280, overflow: 'auto' }}
            dataSource={apercu.delegues}
            renderItem={(d) => (
              <List.Item extra={d.dejaAffecte ? <Tag style={{ borderRadius: 6 }}>Déjà affecté — ignoré</Tag> : <Tag color="green" style={{ borderRadius: 6 }}>Nouveau</Tag>}>
                <Space orientation="vertical" size={0}>
                  <Text strong>{d.nom}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {[d.managerNom && `Équipe ${d.managerNom}`, d.regions.join(', ')].filter(Boolean).join(' · ')}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      )}
    </Modal>
  );
}
