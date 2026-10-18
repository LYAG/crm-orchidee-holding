'use client';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Checkbox, Col, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Switch, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { QuestionDto } from '@/services/api/FormationService';
import { formationService } from '@/services';
import type { Question, TypeQuestion } from '@/types/formation';
import { TYPES_QUESTION, messageErreur, options } from './constants';

const { Text } = Typography;

interface Valeurs {
  type: TypeQuestion;
  enonce: string;
  points: number;
  explication?: string;
  obligatoire: boolean;
  propositions: { libelle: string; correcte: boolean }[];
  reponsesAcceptees: string;
  bonneReponse?: number;
}

interface Props {
  open: boolean;
  evaluationId: string;
  question: Question | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Saisie guidée d'une question : propositions et bonne(s) réponse(s) selon le type, contrôles de cohérence. */
export function QuestionFormModal({ open, evaluationId, question, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const [envoi, setEnvoi] = useState(false);
  const type = (Form.useWatch('type', form) as TypeQuestion | undefined) ?? 'QCM_UNIQUE';
  const avecPropositions = type === 'QCM_UNIQUE' || type === 'QCM_MULTIPLE';

  useEffect(() => {
    if (!open) return;
    if (question) {
      form.setFieldsValue({
        type: question.type,
        enonce: question.enonce,
        points: question.points,
        explication: question.explication ?? undefined,
        obligatoire: question.obligatoire,
        propositions: question.propositions.map((p) => ({ libelle: p.libelle, correcte: p.correcte })),
        reponsesAcceptees: question.reponsesAcceptees.join('\n'),
        bonneReponse: question.type === 'VRAI_FAUX' ? (question.propositions.find((p) => p.correcte)?.libelle === 'Faux' ? 1 : 0) : Math.max(0, question.propositions.findIndex((p) => p.correcte)),
      });
    } else {
      form.resetFields();
    }
  }, [open, question, form]);

  async function enregistrer() {
    const v = await form.validateFields();
    let propositions: QuestionDto['propositions'] = [];
    if (v.type === 'QCM_UNIQUE' || v.type === 'QCM_MULTIPLE') {
      propositions = v.propositions.map((p) => ({ libelle: p.libelle, correcte: !!p.correcte }));
      if (!propositions.some((p) => p.correcte)) {
        message.warning(v.type === 'QCM_UNIQUE' ? 'Sélectionnez la bonne réponse.' : 'Cochez au moins une bonne réponse.');
        return;
      }
    } else if (v.type === 'VRAI_FAUX') {
      propositions = [
        { libelle: 'Vrai', correcte: v.bonneReponse === 0 },
        { libelle: 'Faux', correcte: v.bonneReponse === 1 },
      ];
    }
    const dto: QuestionDto = {
      type: v.type,
      enonce: v.enonce,
      points: v.points,
      explication: v.explication,
      obligatoire: v.obligatoire,
      propositions,
      reponsesAcceptees: v.type === 'REPONSE_COURTE' ? v.reponsesAcceptees.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    };
    setEnvoi(true);
    try {
      if (question) await formationService.updateQuestion(question.id, dto);
      else await formationService.addQuestion(evaluationId, dto);
      message.success('Question enregistrée.');
      onSaved();
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal open={open} title={question ? `Question ${question.ordre}` : 'Nouvelle question'} okText="Enregistrer" cancelText="Annuler" onOk={enregistrer} onCancel={onClose} confirmLoading={envoi} width={720} destroyOnHidden>
      <Form<Valeurs>
        form={form}
        layout="vertical"
        initialValues={{
          type: 'QCM_UNIQUE',
          points: 1,
          obligatoire: true,
          propositions: [{ libelle: '', correcte: false }, { libelle: '', correcte: false }],
          reponsesAcceptees: '',
          bonneReponse: 0,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="type" label="Type de question" extra={TYPES_QUESTION[type].aide}>
              <Select options={options(TYPES_QUESTION)} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="points" label="Points" rules={[{ required: true, message: 'Obligatoire.' }]}>
              <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="obligatoire" label="Obligatoire" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="enonce" label="Énoncé" rules={[{ required: true, whitespace: true, message: 'L’énoncé est obligatoire.' }, { max: 4000 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>

        {avecPropositions && (
          <Form.List
            name="propositions"
            rules={[
              {
                validator: async (_, props) => {
                  if (!props || props.length < 2) throw new Error('Au moins deux propositions.');
                },
              },
            ]}
          >
            {(champs, { add, remove }, { errors }) => (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Propositions</Text>
                <Text type="secondary"> — {type === 'QCM_UNIQUE' ? 'sélectionnez la bonne réponse' : 'cochez toutes les bonnes réponses'}</Text>
                <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }}>
                  {champs.map((champ, i) => (
                    <Space key={champ.key} align="start" style={{ width: '100%' }}>
                      <Form.Item name={[champ.name, 'correcte']} valuePropName="checked" noStyle>
                        {type === 'QCM_UNIQUE' ? (
                          // Réponse unique : cocher une proposition décoche les autres.
                          <Radio
                            aria-label={`Bonne réponse ${i + 1}`}
                            style={{ marginTop: 6 }}
                            onChange={() =>
                              form.setFieldValue(
                                'propositions',
                                (form.getFieldValue('propositions') as Valeurs['propositions']).map((p, j) => ({ ...p, correcte: j === i })),
                              )
                            }
                          />
                        ) : (
                          <Checkbox aria-label={`Bonne réponse ${i + 1}`} style={{ marginTop: 6 }} />
                        )}
                      </Form.Item>
                      <Form.Item name={[champ.name, 'libelle']} rules={[{ required: true, whitespace: true, message: 'Proposition vide.' }]} style={{ marginBottom: 0, flex: 1, minWidth: 260 }}>
                        <Input placeholder={`Proposition ${i + 1}`} />
                      </Form.Item>
                      <Button type="text" danger icon={<DeleteOutlined />} disabled={champs.length <= 2} onClick={() => remove(champ.name)} aria-label="Retirer" />
                    </Space>
                  ))}
                </Space>
                <Form.ErrorList errors={errors} />
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }} onClick={() => add({ libelle: '', correcte: false })}>
                  Ajouter une proposition
                </Button>
              </div>
            )}
          </Form.List>
        )}

        {type === 'VRAI_FAUX' && (
          <Form.Item name="bonneReponse" label="Bonne réponse">
            <Radio.Group optionType="button" options={[{ value: 0, label: 'Vrai' }, { value: 1, label: 'Faux' }]} />
          </Form.Item>
        )}
        {type === 'REPONSE_COURTE' && (
          <Form.Item
            name="reponsesAcceptees"
            label="Réponses acceptées"
            extra="Une par ligne. La comparaison ignore les majuscules, les accents et les espaces superflus."
            rules={[{ required: true, whitespace: true, message: 'Indiquez au moins une réponse acceptée.' }]}
          >
            <Input.TextArea rows={3} placeholder={'Chlorhexidine\nDigluconate de chlorhexidine'} />
          </Form.Item>
        )}
        {type === 'MANUELLE' && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Le résultat restera « en attente de correction » jusqu’à la notation par un manager ou un administrateur." />}

        <Form.Item name="explication" label="Explication (affichée avec la correction)" rules={[{ max: 4000 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
