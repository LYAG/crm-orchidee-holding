'use client';

import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Select, Space, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { professionnelService } from '@/services';
import type { Centre, DonneesModificationProfessionnel, ProfessionnelSante, Specialite } from '@/types';
import { CategorieEtablissement, TitreProfessionnel, TypeDemandeValidation } from '@/types';

const CATEGORIE_LABELS: Record<CategorieEtablissement, string> = {
  [CategorieEtablissement.MEDECIN]: 'Médecin',
  [CategorieEtablissement.INFIRMIER]: 'Infirmier',
  [CategorieEtablissement.PHARMACIE]: 'Pharmacie',
};
const CATEGORIE_OPTIONS = Object.values(CategorieEtablissement).map((c) => ({ value: c, label: CATEGORIE_LABELS[c] }));

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
  categorie?: CategorieEtablissement;
  centreId: string;
  specialiteIds: string[];
  telephones: string;
  observations?: string;
}

export function InformationsTab({ professionnel, centres, specialites, onSaved }: Props) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const role = user?.role as UserRole | undefined;
  // Le verrou (RDV déjà eu) ne s'applique qu'au délégué — manager/admin peuvent toujours corriger la fiche.
  const peutOutrepasserVerrou = role === UserRole.MANAGER || role === UserRole.ADMIN;
  const verrouille = professionnel.aDejaEuContact && !peutOutrepasserVerrou;
  // Le délégué ne modifie plus la fiche directement : sa modification est une PROPOSITION soumise
  // à validation du manager/admin (même mécanisme que la reclassification T1/ST du Kanban).
  const soumisAValidation = role === UserRole.DELEGUE;

  useEffect(() => {
    queueMicrotask(() => {
      form.setFieldsValue({
        nom: professionnel.nom,
        prenom: professionnel.prenom,
        titre: professionnel.titre,
        categorie: professionnel.categorie,
        centreId: professionnel.centreId,
        specialiteIds: professionnel.specialiteIds,
        telephones: professionnel.telephones.join(', '),
        observations: professionnel.observations,
      });
      setEditing(false);
    });
  }, [professionnel, form]);

  async function handleSave() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const patch = {
        nom: values.nom,
        prenom: values.prenom,
        titre: values.titre,
        categorie: values.categorie,
        centreId: values.centreId,
        specialiteIds: values.specialiteIds,
        telephones: values.telephones.split(',').map((t) => t.trim()).filter(Boolean),
        observations: values.observations,
      };
      if (soumisAValidation && user) {
        const donnees: DonneesModificationProfessionnel = patch;
        await professionnelService.creerDemandeValidation({
          type: TypeDemandeValidation.MODIFICATION_PROFESSIONNEL,
          delegueId: professionnel.delegueId ?? user.id,
          libelle: `Modification de fiche proposée : ${values.nom} ${values.prenom ?? ''}`.trim(),
          donnees: donnees as unknown as Record<string, unknown>,
          professionnelExistantId: professionnel.id,
        });
        message.success('Modification proposée — en attente de validation par le manager/administrateur.');
        setEditing(false);
      } else {
        const updated = await professionnelService.updateProfessionnel(professionnel.id, patch);
        message.success('Fiche mise à jour.');
        onSaved(updated);
        setEditing(false);
      }
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

      {!verrouille && soumisAValidation && editing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#E3F2FD',
            color: '#1565C0',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <InfoCircleOutlined />
          Cette modification sera soumise à validation du manager/administrateur avant d&apos;être appliquée.
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
        <Form.Item name="categorie" label="Catégorie">
          <Select
            disabled={!editing}
            options={CATEGORIE_OPTIONS}
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
              {soumisAValidation ? 'Proposer la modification' : 'Enregistrer'}
            </Button>
            <Button onClick={() => { setEditing(false); form.resetFields(); }}>Annuler</Button>
          </>
        )}
      </Space>
    </div>
  );
}
