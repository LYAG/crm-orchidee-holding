'use client';

import { LockOutlined } from '@ant-design/icons';
import { App, Button, Form, InputNumber, Radio, Select, Space, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { professionnelService } from '@/services';
import type { JoursConsultation, PotentielCas, ProfessionnelSante } from '@/types';
import { JourSemaine, ModeJoursConsultation, TypeCas, UniteCas } from '@/types';
import { JOUR_LABELS } from './utils';

interface Props {
  professionnel: ProfessionnelSante;
  onSaved: (updated: ProfessionnelSante) => void;
}

interface FormValues {
  mode: ModeJoursConsultation;
  jours?: JourSemaine[];
  frequenceParSemaine?: number;
  min?: number;
  max?: number;
  unite?: UniteCas;
  typeCas?: TypeCas;
  estMinimum?: boolean;
}

export function DisponibilitesTab({ professionnel, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const mode = Form.useWatch('mode', form);

  const verrouille = professionnel.aDejaEuContact;

  useEffect(() => {
    form.setFieldsValue({
      mode: professionnel.joursConsultation.mode,
      jours: professionnel.joursConsultation.jours,
      frequenceParSemaine: professionnel.joursConsultation.frequenceParSemaine,
      min: professionnel.potentielCas?.min,
      max: professionnel.potentielCas?.max,
      unite: professionnel.potentielCas?.unite,
      typeCas: professionnel.potentielCas?.typeCas,
      estMinimum: professionnel.potentielCas?.estMinimum,
    });
    setEditing(false);
  }, [professionnel, form]);

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const joursConsultation: JoursConsultation =
        values.mode === ModeJoursConsultation.JOURS_EXPLICITES
          ? { mode: values.mode, jours: values.jours ?? [] }
          : { mode: values.mode, frequenceParSemaine: values.frequenceParSemaine };

      const potentielCas: PotentielCas | undefined =
        values.min != null && values.unite && values.typeCas
          ? { min: values.min, max: values.max, unite: values.unite, typeCas: values.typeCas, estMinimum: values.estMinimum }
          : undefined;

      const updated = await professionnelService.updateProfessionnel(professionnel.id, {
        joursConsultation,
        potentielCas,
      });
      message.success('Disponibilités mises à jour.');
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {verrouille && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFF3E0',
            color: '#E65100',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <LockOutlined />
          Ce professionnel a déjà eu un RDV : la modification est réservée au manager/administrateur.
        </div>
      )}

      <Form form={form} layout="vertical" disabled={verrouille && !editing}>
        <Form.Item label="Jours de consultation">
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Form.Item name="mode" noStyle>
              <Radio.Group disabled={!editing}>
                <Radio value={ModeJoursConsultation.JOURS_EXPLICITES}>Jours précis</Radio>
                <Radio value={ModeJoursConsultation.FREQUENCE}>Fréquence / semaine</Radio>
              </Radio.Group>
            </Form.Item>
            {mode === ModeJoursConsultation.FREQUENCE ? (
              <Form.Item name="frequenceParSemaine" noStyle>
                <InputNumber disabled={!editing} min={1} max={7} addonAfter="fois / semaine" />
              </Form.Item>
            ) : (
              <Form.Item name="jours" noStyle>
                <Select
                  disabled={!editing}
                  mode="multiple"
                  style={{ width: '100%' }}
                  options={Object.values(JourSemaine).map((j) => ({ value: j, label: JOUR_LABELS[j] }))}
                />
              </Form.Item>
            )}
          </Space>
        </Form.Item>

        <Form.Item label="Potentiel de cas">
          <Space wrap>
            <Form.Item name="min" noStyle>
              <InputNumber disabled={!editing} min={0} placeholder="Min" />
            </Form.Item>
            <Form.Item name="max" noStyle>
              <InputNumber disabled={!editing} min={0} placeholder="Max (optionnel)" />
            </Form.Item>
            <Form.Item name="unite" noStyle>
              <Select
                disabled={!editing}
                style={{ width: 110 }}
                options={Object.values(UniteCas).map((u) => ({ value: u, label: u.toLowerCase() }))}
                placeholder="Unité"
              />
            </Form.Item>
            <Form.Item name="typeCas" noStyle>
              <Select
                disabled={!editing}
                style={{ width: 130 }}
                options={Object.values(TypeCas).map((t) => ({ value: t, label: t.toLowerCase() }))}
                placeholder="Type"
              />
            </Form.Item>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Form.Item name="estMinimum" valuePropName="checked" noStyle>
              <Switch disabled={!editing} size="small" />
            </Form.Item>
            <span style={{ marginLeft: 8, fontSize: 13 }}>Minimum garanti</span>
          </div>
        </Form.Item>
      </Form>

      <Space>
        {!editing ? (
          <Button type="primary" disabled={verrouille} onClick={() => setEditing(true)}>
            Modifier
          </Button>
        ) : (
          <>
            <Button type="primary" loading={saving} onClick={handleSave}>
              Enregistrer
            </Button>
            <Button onClick={() => { setEditing(false); form.resetFields(); }}>Annuler</Button>
          </>
        )}
      </Space>
    </div>
  );
}
