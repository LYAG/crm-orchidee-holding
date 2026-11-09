'use client';

import { TeamOutlined } from '@ant-design/icons';
import { Alert, App, Form, Input, Modal, Segmented, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import type { CibleDiffusion, CibleDiffusionOption } from '@/types/messagerie';
import { EditeurMessage, texteDepuisHtml } from './EditeurMessage';
import { messageErreur } from './format';

const { Text } = Typography;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** adresses : saisie libre (admin) ; groupe : managers et/ou délégués enregistrés dans le CRM. */
export type ModeRedaction = 'adresses' | 'groupe';

interface Valeurs {
  destinataires?: string[];
  copie?: string[];
  cible?: CibleDiffusion;
  sujet: string;
  /** HTML produit par l'éditeur. */
  corps: string;
}

interface Props {
  modes: ModeRedaction[];
  open: boolean;
  onClose: () => void;
  onEnvoye: () => void;
  /** Préremplissage (réponse à un message reçu) : force le mode « adresses ». corps : HTML. */
  initial?: { destinataires: string[]; sujet: string; corps: string } | null;
}

const validerAdresses = (obligatoire: boolean) => ({
  validator: (_: unknown, v?: string[]) => {
    if (obligatoire && (!v || v.length === 0))
      return Promise.reject(new Error('Au moins un destinataire est obligatoire.'));
    const invalide = (v ?? []).find((a) => !EMAIL.test(a.trim()));
    return invalide
      ? Promise.reject(new Error(`Adresse invalide : ${invalide}`))
      : Promise.resolve();
  },
});

/**
 * Rédaction d'un e-mail texte envoyé avec le compte de messagerie du CRM : à des adresses libres,
 * ou à un groupe d'utilisateurs (copie cachée, réponses vers l'adresse de l'expéditeur).
 */
export function NouveauMessageModal({ modes, open, onClose, onEnvoye, initial }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  // Le parent remonte la fenêtre (key) à chaque ouverture : l'état initial suffit.
  const [mode, setMode] = useState<ModeRedaction>(initial ? 'adresses' : modes[0]);
  const [cibles, setCibles] = useState<CibleDiffusionOption[] | null>(null);
  const [erreurCibles, setErreurCibles] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const cible = Form.useWatch('cible', form);
  const option = cibles?.find((c) => c.cible === cible);
  const groupeDisponible = modes.includes('groupe');

  useEffect(() => {
    if (!open || !groupeDisponible) return;
    messagerieService
      .getCiblesDiffusion()
      .then((c) => {
        setCibles(c);
        setErreurCibles(null);
      })
      .catch((err) => setErreurCibles(messageErreur(err, 'Groupes indisponibles.')));
  }, [open, groupeDisponible]);

  async function envoyer() {
    const v = await form.validateFields();
    const corps = { corps: texteDepuisHtml(v.corps), corpsHtml: v.corps };
    setEnvoi(true);
    try {
      if (mode === 'groupe' && v.cible) {
        await messagerieService.envoyerDiffusion({
          cible: v.cible,
          sujet: v.sujet,
          ...corps,
        });
        message.success(`E-mail envoyé à ${option?.nombre ?? ''} destinataire(s).`);
      } else {
        await messagerieService.envoyer({
          destinataires: (v.destinataires ?? []).map((a) => a.trim()),
          copie: v.copie?.map((a) => a.trim()),
          sujet: v.sujet,
          ...corps,
        });
        message.success('E-mail envoyé.');
      }
      form.resetFields();
      onEnvoye();
    } catch (err) {
      message.error(messageErreur(err, "L'e-mail n'a pas pu être envoyé."));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      open={open}
      title={
        initial
          ? 'Répondre'
          : modes.includes('adresses')
            ? 'Nouveau message'
            : 'Nouvel envoi groupé'
      }
      okText="Envoyer"
      cancelText="Annuler"
      onOk={envoyer}
      onCancel={onClose}
      confirmLoading={envoi}
      okButtonProps={{ disabled: mode === 'groupe' && option?.nombre === 0 }}
      width={720}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical" initialValues={initial ?? undefined}>
        {modes.length > 1 && (
          <Form.Item label="Destinataires">
            <Segmented
              block
              value={mode}
              onChange={(v) => setMode(v as ModeRedaction)}
              options={[
                { value: 'adresses', label: 'Adresses e-mail' },
                { value: 'groupe', label: 'Groupe d’utilisateurs', icon: <TeamOutlined /> },
              ]}
            />
          </Form.Item>
        )}

        {mode === 'adresses' ? (
          <>
            <Form.Item name="destinataires" label="À" required rules={[validerAdresses(true)]}>
              <Select
                mode="tags"
                tokenSeparators={[',', ';', ' ']}
                open={false}
                suffixIcon={null}
                placeholder="adresse@exemple.com"
              />
            </Form.Item>
            <Form.Item name="copie" label="Cc" rules={[validerAdresses(false)]}>
              <Select
                mode="tags"
                tokenSeparators={[',', ';', ' ']}
                open={false}
                suffixIcon={null}
                placeholder="Facultatif"
              />
            </Form.Item>
          </>
        ) : (
          <>
            {erreurCibles && (
              <Alert type="error" showIcon title={erreurCibles} style={{ marginBottom: 16 }} />
            )}
            <Form.Item
              name="cible"
              label="Groupe"
              rules={[{ required: true, message: 'Choisissez un groupe de destinataires.' }]}
              extra={
                option && option.nombre > 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.apercuNoms.join(', ')}
                    {option.nombre > option.apercuNoms.length &&
                      ` et ${option.nombre - option.apercuNoms.length} autre(s)`}
                  </Text>
                ) : undefined
              }
            >
              <Select
                loading={!cibles && !erreurCibles}
                placeholder="Choisir les destinataires"
                options={(cibles ?? []).map((c) => ({
                  value: c.cible,
                  label: `${c.libelle} — ${c.nombre} destinataire${c.nombre > 1 ? 's' : ''}`,
                  disabled: c.nombre === 0,
                }))}
              />
            </Form.Item>
            {cibles && cibles.length > 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                title={`Les réponses arriveront à votre adresse : ${cibles[0].repondreA}`}
                description="Le message part du compte e-mail du CRM à votre nom. Les destinataires sont en copie cachée et vous recevez votre propre exemplaire."
              />
            )}
          </>
        )}

        <Form.Item
          name="sujet"
          label="Objet"
          rules={[{ required: true, whitespace: true, message: "L'objet est obligatoire." }]}
        >
          <Input maxLength={500} />
        </Form.Item>
        <Form.Item
          name="corps"
          label="Message"
          required
          rules={[
            {
              validator: (_, html?: string) =>
                texteDepuisHtml(html ?? '').trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error('Le message est obligatoire.')),
            },
          ]}
        >
          <EditeurMessage placeholder="Rédigez votre message…" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
