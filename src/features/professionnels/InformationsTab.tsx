'use client';

import { LockOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Select, Space, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { professionnelService } from '@/services';
import type { Centre, ProfessionnelSante, Specialite } from '@/types';
import { TitreProfessionnel } from '@/types';

interface Props {
  professionnel: ProfessionnelSante;
  centres: Centre[];
  specialites: Specialite[];
  onSaved: (updated: ProfessionnelSante) => void;
}

interface FormValues {
  nom: string;
  prenom?: string;
  titre?: TitreProfessionnel;
  centreId: string;
  specialiteIds: string[];
  telephones: string;
  observations?: string;
}

export function InformationsTab({ professionnel, centres, specialites, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const verrouille = professionnel.aDejaEuContact;

  useEffect(() => {
    form.setFieldsValue({
      nom: professionnel.nom,
      prenom: professionnel.prenom,
      titre: professionnel.titre,
      centreId: professionnel.centreId,
      specialiteIds: professionnel.specialiteIds,
      telephones: professionnel.telephones.join(', '),
      observations: professionnel.observations,
    });
    setEditing(false);
  }, [professionnel, form]);

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const updated = await professionnelService.updateProfessionnel(professionnel.id, {
        nom: values.nom,
        prenom: values.prenom,
        titre: values.titre,
        centreId: values.centreId,
        specialiteIds: values.specialiteIds,
        telephones: values.telephones.split(',').map((t) => t.trim()).filter(Boolean),
        observations: values.observations,
      });
      message.success('Fiche mise à jour.');
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
        <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Input readOnly={!editing} />
        </Form.Item>
        <Form.Item name="prenom" label="Prénom">
          <Input readOnly={!editing} />
        </Form.Item>
        <Form.Item name="titre" label="Titre">
          <Select
            disabled={!editing}
            options={Object.values(TitreProfessionnel).map((t) => ({ value: t, label: t }))}
            allowClear
          />
        </Form.Item>
        <Form.Item name="centreId" label="Centre" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select disabled={!editing} options={centres.map((c) => ({ value: c.id, label: c.nom }))} />
        </Form.Item>
        <Form.Item name="specialiteIds" label="Spécialités" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select
            disabled={!editing}
            mode="multiple"
            options={specialites.map((s) => ({ value: s.id, label: s.libelle }))}
          />
        </Form.Item>
        <Form.Item name="telephones" label="Téléphone(s)" extra="Séparés par des virgules">
          <Input readOnly={!editing} />
        </Form.Item>
        <Form.Item name="observations" label="Observations">
          <Input.TextArea readOnly={!editing} rows={3} />
        </Form.Item>
      </Form>

      <Space>
        {!editing ? (
          <Tooltip title={verrouille ? 'Modification réservée au manager/administrateur.' : ''}>
            <Button type="primary" disabled={verrouille} onClick={() => setEditing(true)}>
              Modifier
            </Button>
          </Tooltip>
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
