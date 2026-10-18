'use client';

import { Alert, App, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import type { FormationDto } from '@/services/api/FormationService';
import { formationService } from '@/services';
import type { ExigenceSeuil, FormationDetail, ParametresFormation } from '@/types/formation';
import { CATEGORIES, EXIGENCES, NIVEAUX, messageErreur, options } from './constants';

const { Text } = Typography;

interface Valeurs extends Omit<FormationDto, 'echeance'> {
  echeance?: dayjs.Dayjs | null;
}

interface Props {
  open: boolean;
  /** Formation à modifier ; absente = création. */
  formation?: FormationDetail | null;
  onClose: () => void;
  onSaved: (f: FormationDetail) => void;
}

/** Création / modification guidée d'une formation (règles de notation figées une fois publiée). */
export function FormationFormModal({ open, formation, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);
  const [parametres, setParametres] = useState<ParametresFormation | null>(null);
  const publiee = formation?.resume.statut === 'PUBLIEE';
  const exigence = Form.useWatch('exigenceSeuil', form) as ExigenceSeuil | undefined;
  const seuilMin = user?.role === UserRole.ADMIN ? 0 : (parametres?.seuilMinManager ?? 0);

  useEffect(() => {
    if (!open) return;
    formationService.getParametres().then(setParametres).catch(() => {});
    if (formation) {
      const r = formation.resume;
      form.setFieldsValue({
        titre: r.titre,
        description: r.description,
        objectifs: formation.objectifs,
        categorie: r.categorie,
        niveau: r.niveau,
        dureeEstimeeMinutes: r.dureeEstimeeMinutes,
        seuilReussite: r.seuilReussite,
        tentativesMax: r.tentativesMax,
        delaiEntreTentativesHeures: formation.delaiEntreTentativesHeures,
        tentativeApresEchec: formation.tentativeApresEchec,
        exigenceSeuil: r.exigenceSeuil,
        progressionSequentielle: formation.progressionSequentielle,
        echeance: r.echeance ? dayjs(r.echeance) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, formation, form]);

  async function enregistrer() {
    const v = await form.validateFields();
    const dto: FormationDto = { ...v, echeance: v.echeance ? v.echeance.format('YYYY-MM-DD') : null };
    setEnvoi(true);
    try {
      const f = formation ? await formationService.updateFormation(formation.resume.id, dto) : await formationService.createFormation(dto);
      message.success(formation ? 'Formation mise à jour.' : 'Formation créée en brouillon.');
      onSaved(f);
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      open={open}
      title={formation ? 'Modifier la formation' : 'Nouvelle formation'}
      okText={formation ? 'Enregistrer' : 'Créer le brouillon'}
      cancelText="Annuler"
      onOk={enregistrer}
      onCancel={onClose}
      confirmLoading={envoi}
      width={760}
      destroyOnHidden
    >
      {publiee && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Formation publiée"
          description="Seuls la description, les objectifs, la durée et l’échéance restent modifiables. Pour changer les règles de notation ou le contenu, créez une nouvelle version."
        />
      )}
      <Form<Valeurs>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={{
          niveau: 'DEBUTANT',
          seuilReussite: parametres?.seuilDefaut ?? 70,
          tentativeApresEchec: true,
          progressionSequentielle: true,
          exigenceSeuil: 'LES_DEUX',
          delaiEntreTentativesHeures: 0,
        }}
      >
        <Form.Item name="titre" label="Titre" rules={[{ required: true, whitespace: true, message: 'Le titre est obligatoire.' }, { max: 200 }]}>
          <Input placeholder="Ex. Les antiseptiques" disabled={publiee} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="categorie" label="Catégorie" rules={[{ required: true, message: 'Choisissez une catégorie.' }]}>
              <Select options={options(CATEGORIES)} placeholder="Choisir" disabled={publiee} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="niveau" label="Niveau" rules={[{ required: true }]}>
              <Select options={options(NIVEAUX)} disabled={publiee} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description" rules={[{ max: 4000 }]}>
          <Input.TextArea rows={2} placeholder="À quoi sert cette formation ?" />
        </Form.Item>
        <Form.Item name="objectifs" label="Objectifs pédagogiques" extra="Un objectif par ligne." rules={[{ max: 4000 }]}>
          <Input.TextArea rows={3} placeholder={'Connaître les familles d’antiseptiques\nChoisir l’antiseptique adapté'} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="dureeEstimeeMinutes" label="Durée estimée (min)">
              <InputNumber min={1} style={{ width: '100%' }} placeholder="90" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="echeance" label="Échéance (facultative)">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="seuilReussite"
              label="Seuil de réussite (/100)"
              rules={[{ required: true, message: 'Le seuil est obligatoire.' }]}
              extra={seuilMin > 0 ? `Minimum autorisé : ${seuilMin}/100` : undefined}
            >
              <InputNumber min={seuilMin} max={100} style={{ width: '100%' }} disabled={publiee} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="exigenceSeuil" label="Où le seuil est-il exigé ?" rules={[{ required: true }]} extra={exigence ? EXIGENCES[exigence].aide : undefined}>
          <Radio.Group disabled={publiee} optionType="button" options={options(EXIGENCES)} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="tentativesMax"
              label="Tentatives max par évaluation"
              extra={parametres ? `Vide = illimité (plafond ${parametres.tentativesMaxPlafond})` : 'Vide = illimité'}
            >
              <InputNumber min={1} max={parametres?.tentativesMaxPlafond} style={{ width: '100%' }} disabled={publiee} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="delaiEntreTentativesHeures" label="Délai entre tentatives (h)">
              <InputNumber min={0} style={{ width: '100%' }} disabled={publiee} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Form.Item name="tentativeApresEchec" label="Nouvelle tentative après échec" valuePropName="checked" style={{ marginBottom: 8 }}>
                <Switch checkedChildren="Autorisée" unCheckedChildren="Non" disabled={publiee} />
              </Form.Item>
            </Space>
          </Col>
        </Row>
        <Form.Item name="progressionSequentielle" valuePropName="checked" label="Progression séquentielle" style={{ marginBottom: 0 }}>
          <Switch checkedChildren="Oui" unCheckedChildren="Non" disabled={publiee} />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Activée : chaque module obligatoire doit être validé avant d’accéder au suivant.
        </Text>
      </Form>
    </Modal>
  );
}
