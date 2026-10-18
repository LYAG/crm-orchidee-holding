'use client';

import { Alert, App, Col, Form, Input, InputNumber, Modal, Row, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import type { EvaluationDto } from '@/services/api/FormationService';
import { formationService } from '@/services';
import type { EvaluationDetail, ParametresFormation, TypeEvaluation } from '@/types/formation';
import { AFFICHAGES_CORRECTIONS, PUBLICATIONS_RESULTATS, TYPES_EVALUATION, messageErreur, options } from './constants';

interface Props {
  open: boolean;
  /** Rattachement (création) : quiz de module, évaluation de formation ou exercice indépendant. */
  rattachement?: { formationId?: string; moduleId?: string; moduleTitre?: string };
  /** Évaluation à modifier ; absente = création. */
  evaluation?: EvaluationDetail | null;
  /** Seuil hérité de la formation (affiché quand le seuil est laissé vide). */
  seuilHerite?: number;
  onClose: () => void;
  onSaved: (e: EvaluationDetail) => void;
}

type ApresEchec = 'HERITE' | 'OUI' | 'NON';
interface Valeurs extends Omit<EvaluationDto, 'tentativeApresEchec'> {
  apresEchec: ApresEchec;
}

export function EvaluationFormModal({ open, rattachement, evaluation, seuilHerite, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);
  const [parametres, setParametres] = useState<ParametresFormation | null>(null);

  const formationId = evaluation?.resume.formationId ?? rattachement?.formationId ?? null;
  const moduleId = evaluation?.resume.moduleId ?? rattachement?.moduleId ?? null;
  const independante = !formationId && !moduleId;
  const seuilMin = user?.role === UserRole.ADMIN ? 0 : (parametres?.seuilMinManager ?? 0);
  const herite = seuilHerite ?? parametres?.seuilDefaut;

  const typesPossibles: TypeEvaluation[] = moduleId
    ? ['QUIZ_ENTRAINEMENT', 'EXERCICE_REVISION']
    : independante
      ? ['EXERCICE_REVISION', 'QUIZ_ENTRAINEMENT', 'EVALUATION_FINALE']
      : ['EVALUATION_FINALE', 'EXERCICE_REVISION', 'QUIZ_ENTRAINEMENT'];

  useEffect(() => {
    if (!open) return;
    formationService.getParametres().then(setParametres).catch(() => {});
    if (evaluation) {
      const r = evaluation.resume;
      form.setFieldsValue({
        type: r.type,
        titre: r.titre,
        consignes: evaluation.consignes,
        dureeMinutes: r.dureeMinutes,
        seuilReussite: r.seuilReussite,
        tentativesMax: evaluation.tentativesMax,
        delaiEntreTentativesHeures: evaluation.delaiEntreTentativesHeures,
        apresEchec: evaluation.tentativeApresEchec == null ? 'HERITE' : evaluation.tentativeApresEchec ? 'OUI' : 'NON',
        publicationResultats: evaluation.publicationResultats,
        affichageCorrections: evaluation.affichageCorrections,
        obligatoire: r.obligatoire,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ type: typesPossibles[0] });
    }
    // typesPossibles dépend uniquement du rattachement, stable pendant l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evaluation, form]);

  async function enregistrer() {
    const { apresEchec, ...v } = await form.validateFields();
    const dto: EvaluationDto = {
      ...v,
      formationId,
      moduleId,
      tentativeApresEchec: apresEchec === 'HERITE' ? null : apresEchec === 'OUI',
    };
    setEnvoi(true);
    try {
      const e = evaluation ? await formationService.updateEvaluation(evaluation.resume.id, dto) : await formationService.createEvaluation(dto);
      message.success(evaluation ? 'Paramètres enregistrés.' : 'Évaluation créée : ajoutez maintenant ses questions.');
      onSaved(e);
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  const titre = evaluation
    ? 'Paramètres de l’évaluation'
    : moduleId
      ? `Nouveau quiz — ${rattachement?.moduleTitre ?? 'module'}`
      : independante
        ? 'Nouvel exercice indépendant'
        : 'Nouvelle évaluation de la formation';

  return (
    <Modal open={open} title={titre} okText="Enregistrer" cancelText="Annuler" onOk={enregistrer} onCancel={onClose} confirmLoading={envoi} width={720} destroyOnHidden>
      {!independante && !moduleId && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="L’évaluation finale conditionne la réussite de la formation ; les autres exercices rattachés à la formation restent facultatifs."
        />
      )}
      <Form<Valeurs>
        form={form}
        layout="vertical"
        initialValues={{ apresEchec: 'HERITE', publicationResultats: 'IMMEDIATE', affichageCorrections: 'APRES_SOUMISSION', obligatoire: true }}
      >
        <Row gutter={16}>
          <Col xs={24} md={10}>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select options={typesPossibles.map((t) => ({ value: t, label: TYPES_EVALUATION[t] }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={14}>
            <Form.Item name="titre" label="Titre" rules={[{ required: true, whitespace: true, message: 'Le titre est obligatoire.' }, { max: 200 }]}>
              <Input placeholder="Ex. Quiz — familles d’antiseptiques" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="consignes" label="Consignes" rules={[{ max: 4000 }]}>
          <Input.TextArea rows={2} placeholder="Ce que le délégué doit savoir avant de commencer." />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="dureeMinutes" label="Durée (min)" extra="Vide = libre">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="seuilReussite" label="Seuil (/100)" extra={herite != null ? `Vide = ${herite} (hérité)` : 'Vide = hérité'}>
              <InputNumber min={seuilMin} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="tentativesMax" label="Tentatives max" extra="Vide = hérité">
              <InputNumber min={1} max={parametres?.tentativesMaxPlafond} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="delaiEntreTentativesHeures" label="Délai (h)" extra="Entre tentatives">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="apresEchec" label="Nouvelle tentative après échec">
              <Select options={[{ value: 'HERITE', label: 'Comme la formation' }, { value: 'OUI', label: 'Autorisée' }, { value: 'NON', label: 'Non autorisée' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="publicationResultats" label="Publication du résultat">
              <Select options={options(PUBLICATIONS_RESULTATS)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="affichageCorrections" label="Bonnes réponses et explications">
              <Select options={options(AFFICHAGES_CORRECTIONS)} />
            </Form.Item>
          </Col>
        </Row>
        {moduleId && (
          <Form.Item name="obligatoire" valuePropName="checked" label="Quiz obligatoire pour valider le module">
            <Switch checkedChildren="Obligatoire" unCheckedChildren="Facultatif" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
