'use client';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudDownloadOutlined,
  LockOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { messagerieService } from '@/services';
import {
  MESSAGERIE_VALEURS_RECOMMANDEES,
  type MessagerieConfig,
  type MessagerieConfigRequest,
  type ResultatTest,
  type SecuriteConnexion,
} from '@/types/messagerie';
import { formatDateHeure, messageErreur } from './format';

const { Text } = Typography;

const OPTIONS_SECURITE: { value: SecuriteConnexion; label: string }[] = [
  { value: 'SSL', label: 'SSL/TLS (recommandé)' },
  { value: 'STARTTLS', label: 'STARTTLS' },
  { value: 'AUCUNE', label: 'Aucune (déconseillé)' },
];

/** Port usuel pour chaque mode de sécurité, proposé quand l'admin change de mode. */
const PORTS: Record<'smtp' | 'imap', Record<SecuriteConnexion, number>> = {
  smtp: { SSL: 465, STARTTLS: 587, AUCUNE: 25 },
  imap: { SSL: 993, STARTTLS: 143, AUCUNE: 143 },
};

type Valeurs = MessagerieConfigRequest;

function versFormulaire(c: MessagerieConfig): Valeurs {
  return {
    smtpHote: c.smtpHote ?? MESSAGERIE_VALEURS_RECOMMANDEES.smtpHote,
    smtpPort: c.smtpPort,
    smtpSecurite: c.smtpSecurite,
    imapHote: c.imapHote ?? MESSAGERIE_VALEURS_RECOMMANDEES.imapHote,
    imapPort: c.imapPort,
    imapSecurite: c.imapSecurite,
    imapDossier: c.imapDossier,
    identifiant: c.identifiant ?? MESSAGERIE_VALEURS_RECOMMANDEES.identifiant,
    adresseExpediteur: c.adresseExpediteur ?? MESSAGERIE_VALEURS_RECOMMANDEES.adresseExpediteur,
    nomExpediteur: c.nomExpediteur ?? undefined,
    motDePasse: '',
    envoiActif: c.envoiActif,
    receptionActive: c.receptionActive,
  };
}

function Resultat({ resultat }: { resultat: ResultatTest | null }) {
  if (!resultat) return null;
  return (
    <Alert
      style={{ marginTop: 12 }}
      type={resultat.succes ? 'success' : 'error'}
      showIcon
      title={resultat.succes ? 'Test réussi' : 'Échec du test'}
      description={
        <>
          {resultat.message}
          <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
            Durée :{' '}
            {(resultat.dureeMs / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s
          </Text>
        </>
      }
    />
  );
}

function Etat({ actif, oui, non }: { actif: boolean; oui: string; non: string }) {
  return actif ? (
    <Tag color="success" icon={<CheckCircleFilled />}>
      {oui}
    </Tag>
  ) : (
    <Tag icon={<CloseCircleFilled />}>{non}</Tag>
  );
}

export function ConfigurationMessagerie() {
  const { message } = App.useApp();
  const [form] = Form.useForm<Valeurs>();
  const [config, setConfig] = useState<MessagerieConfig | null>(null);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [modifie, setModifie] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [destinataireTest, setDestinataireTest] = useState('');
  const [testSmtp, setTestSmtp] = useState<{ enCours: boolean; resultat: ResultatTest | null }>({
    enCours: false,
    resultat: null,
  });
  const [testImap, setTestImap] = useState<{ enCours: boolean; resultat: ResultatTest | null }>({
    enCours: false,
    resultat: null,
  });

  useEffect(() => {
    messagerieService
      .getConfig()
      .then((c) => {
        setConfig(c);
        form.setFieldsValue(versFormulaire(c));
      })
      .catch((err) => setErreurChargement(messageErreur(err, 'Configuration indisponible.')));
  }, [form]);

  function appliquerRecommandees() {
    form.setFieldsValue({ ...MESSAGERIE_VALEURS_RECOMMANDEES });
    setModifie(true);
  }

  function changerSecurite(protocole: 'smtp' | 'imap', securite: SecuriteConnexion) {
    form.setFieldValue(protocole === 'smtp' ? 'smtpPort' : 'imapPort', PORTS[protocole][securite]);
  }

  async function enregistrer() {
    const v = await form.validateFields();
    setEnregistrement(true);
    try {
      const c = await messagerieService.enregistrerConfig({
        ...v,
        motDePasse: v.motDePasse || undefined,
      });
      setConfig(c);
      form.setFieldsValue(versFormulaire(c));
      setModifie(false);
      message.success('Configuration de la messagerie enregistrée.');
    } catch (err) {
      message.error(messageErreur(err, 'Enregistrement impossible.'));
    } finally {
      setEnregistrement(false);
    }
  }

  async function effacerMotDePasse() {
    const v = form.getFieldsValue(true) as Valeurs;
    setEnregistrement(true);
    try {
      const c = await messagerieService.enregistrerConfig({
        ...v,
        motDePasse: undefined,
        effacerMotDePasse: true,
        envoiActif: false,
        receptionActive: false,
      });
      setConfig(c);
      form.setFieldsValue(versFormulaire(c));
      setModifie(false);
      message.success('Mot de passe supprimé ; envoi et réception désactivés.');
    } catch (err) {
      message.error(messageErreur(err, 'Suppression impossible.'));
    } finally {
      setEnregistrement(false);
    }
  }

  async function lancerTestSmtp() {
    const destinataire = destinataireTest.trim();
    if (destinataire && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinataire)) {
      message.warning('Adresse du destinataire invalide.');
      return;
    }
    setTestSmtp({ enCours: true, resultat: null });
    try {
      setTestSmtp({
        enCours: false,
        resultat: await messagerieService.testerSmtp(destinataire || undefined),
      });
    } catch (err) {
      setTestSmtp({
        enCours: false,
        resultat: { succes: false, message: messageErreur(err, 'Test impossible.'), dureeMs: 0 },
      });
    }
  }

  async function lancerTestImap() {
    setTestImap({ enCours: true, resultat: null });
    try {
      setTestImap({ enCours: false, resultat: await messagerieService.testerImap() });
    } catch (err) {
      setTestImap({
        enCours: false,
        resultat: { succes: false, message: messageErreur(err, 'Test impossible.'), dureeMs: 0 },
      });
    }
  }

  if (erreurChargement) return <Alert type="error" showIcon title={erreurChargement} />;
  if (!config) return <Spin />;

  const testsBloques = modifie || !config.motDePasseDefini;
  const raisonBlocage = modifie
    ? 'Enregistrez la configuration avant de la tester.'
    : !config.motDePasseDefini
      ? 'Saisissez et enregistrez le mot de passe du compte avant de tester.'
      : undefined;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={15}>
        <ProCard
          bordered
          title="Compte de messagerie"
          extra={
            <Button size="small" icon={<ThunderboltOutlined />} onClick={appliquerRecommandees}>
              Valeurs recommandées
            </Button>
          }
        >
          {!config.chiffrementDisponible && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              title="Clé de chiffrement absente sur le serveur"
              description="Le mot de passe ne peut pas être enregistré tant que la variable d'environnement MESSAGERIE_CLE_CHIFFREMENT n'est pas définie pour le backend (puis redémarré)."
            />
          )}
          <Space wrap size={[8, 8]} style={{ marginBottom: 16 }}>
            <Etat
              actif={config.motDePasseDefini}
              oui="Mot de passe enregistré"
              non="Mot de passe non défini"
            />
            <Etat actif={config.envoiActif} oui="Envoi actif" non="Envoi inactif" />
            <Etat actif={config.receptionActive} oui="Réception active" non="Réception inactive" />
            {config.dateDerniereSynchro && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Dernière relève : {formatDateHeure(config.dateDerniereSynchro)}
              </Text>
            )}
          </Space>

          <Form form={form} layout="vertical" onValuesChange={() => setModifie(true)}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="identifiant"
                  label="Nom d'utilisateur"
                  rules={[{ required: true, message: "L'identifiant est obligatoire." }]}
                  extra="Adresse complète du compte, ex. saphir@orchideeholding.com."
                >
                  <Input autoComplete="off" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="motDePasse"
                  label="Mot de passe du compte de messagerie"
                  extra={
                    config.motDePasseDefini
                      ? 'Un mot de passe est enregistré (chiffré). Laissez vide pour le conserver.'
                      : 'Chiffré avant enregistrement, jamais réaffiché.'
                  }
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    autoComplete="new-password"
                    placeholder={
                      config.motDePasseDefini ? '•••••••• (enregistré)' : 'Saisir le mot de passe'
                    }
                    disabled={!config.chiffrementDisponible}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="adresseExpediteur"
                  label="Adresse d'expédition"
                  rules={[
                    { required: true, message: "L'adresse d'expédition est obligatoire." },
                    { type: 'email', message: 'Adresse e-mail invalide.' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="nomExpediteur"
                  label="Nom affiché de l'expéditeur"
                  extra="Ex. « Saphir OH »."
                >
                  <Input maxLength={120} />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="start" plain>
              Serveur sortant (SMTP)
            </Divider>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="smtpHote"
                  label="Serveur"
                  rules={[{ required: true, message: 'Le serveur SMTP est obligatoire.' }]}
                >
                  <Input placeholder="mail.orchideeholding.com" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="smtpSecurite" label="Sécurité" rules={[{ required: true }]}>
                  <Select
                    options={OPTIONS_SECURITE}
                    onChange={(s: SecuriteConnexion) => changerSecurite('smtp', s)}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item
                  name="smtpPort"
                  label="Port"
                  rules={[{ required: true, message: 'Port obligatoire.' }]}
                >
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="start" plain>
              Serveur entrant (IMAP)
            </Divider>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="imapHote"
                  label="Serveur"
                  rules={[{ required: true, message: 'Le serveur IMAP est obligatoire.' }]}
                >
                  <Input placeholder="mail.orchideeholding.com" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="imapSecurite" label="Sécurité" rules={[{ required: true }]}>
                  <Select
                    options={OPTIONS_SECURITE}
                    onChange={(s: SecuriteConnexion) => changerSecurite('imap', s)}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item
                  name="imapPort"
                  label="Port"
                  rules={[{ required: true, message: 'Port obligatoire.' }]}
                >
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="imapDossier"
                  label="Dossier relevé"
                  extra="INBOX = boîte de réception. Le CRM lit sans rien modifier sur le serveur."
                >
                  <Input placeholder="INBOX" />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="start" plain>
              Activation
            </Divider>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="envoiActif"
                  label="Envoi d'e-mails depuis le CRM"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="receptionActive"
                  label="Relève automatique (toutes les 5 min)"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
              </Col>
            </Row>

            <Space wrap>
              <Button type="primary" loading={enregistrement} onClick={enregistrer}>
                Enregistrer
              </Button>
              {config.motDePasseDefini && (
                <Button danger disabled={enregistrement} onClick={effacerMotDePasse}>
                  Supprimer le mot de passe
                </Button>
              )}
              {modifie && <Text type="warning">Modifications non enregistrées</Text>}
            </Space>
          </Form>
        </ProCard>
      </Col>

      <Col xs={24} xl={9}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <ProCard bordered title="Tester l'envoi (SMTP)">
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
              Avec une adresse, un vrai e-mail de test lui est envoyé. Sans adresse, seules la
              connexion et l’authentification sont vérifiées.
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="destinataire@exemple.com (facultatif)"
                value={destinataireTest}
                onChange={(e) => setDestinataireTest(e.target.value)}
                onPressEnter={() => !testsBloques && lancerTestSmtp()}
                type="email"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={testSmtp.enCours}
                disabled={testsBloques}
                onClick={lancerTestSmtp}
              >
                Tester l&apos;envoi
              </Button>
            </Space.Compact>
            {raisonBlocage && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                {raisonBlocage}
              </Text>
            )}
            <Resultat resultat={testSmtp.resultat} />
          </ProCard>

          <ProCard bordered title="Tester la réception (IMAP)">
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
              Se connecte à la boîte et compte les messages du dossier, sans les importer ni les
              marquer lus.
            </Text>
            <Button
              icon={<CloudDownloadOutlined />}
              loading={testImap.enCours}
              disabled={testsBloques}
              onClick={lancerTestImap}
              block
            >
              Tester la réception
            </Button>
            <Resultat resultat={testImap.resultat} />
          </ProCard>

          <Alert
            type="info"
            showIcon
            title="Réglages de l'hébergeur"
            description={
              <Text style={{ fontSize: 13 }}>
                Entrant : mail.orchideeholding.com, IMAP 993 (SSL). Sortant :
                mail.orchideeholding.com, SMTP 465 (SSL). Authentification obligatoire avec le mot
                de passe du compte.
              </Text>
            }
          />
        </Space>
      </Col>
    </Row>
  );
}
