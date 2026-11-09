'use client';

import {
  CheckCircleFilled,
  CloseCircleFilled,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Spin, Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService } from '@/services';
import type { InvitationInfo } from '@/services/api/AuthService';
import { PanneauMarque } from './PanneauMarque';

const { Title, Text } = Typography;

const REGLES = [
  { libelle: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { libelle: 'Au moins une lettre', test: (v: string) => /\p{L}/u.test(v) },
  { libelle: 'Au moins un chiffre', test: (v: string) => /\d/.test(v) },
];

type Etat =
  | { statut: 'chargement' }
  | { statut: 'invalide'; message: string }
  | { statut: 'pret'; info: InvitationInfo };

/**
 * Page publique ouverte depuis l'e-mail d'invitation : le nouvel utilisateur choisit son mot de
 * passe, puis se connecte. Le lien ne sert qu'une fois.
 */
export function CreerMotDePassePage() {
  const router = useRouter();
  const jeton = useSearchParams().get('jeton') ?? '';
  const [etat, setEtat] = useState<Etat>(
    jeton ? { statut: 'chargement' } : { statut: 'invalide', message: 'Ce lien est incomplet.' },
  );
  const [form] = Form.useForm<{ motDePasse: string; confirmation: string }>();
  const motDePasse = Form.useWatch('motDePasse', form) ?? '';
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!jeton) return;
    let annule = false;
    authService
      .getInvitation(jeton)
      .then((info) => !annule && setEtat({ statut: 'pret', info }))
      .catch(
        (err) =>
          !annule &&
          setEtat({
            statut: 'invalide',
            message: err instanceof Error ? err.message : 'Ce lien n’est plus valide.',
          }),
      );
    return () => {
      annule = true;
    };
  }, [jeton]);

  async function enregistrer(v: { motDePasse: string }) {
    setErreur(null);
    setEnvoi(true);
    try {
      await authService.definirMotDePasse(jeton, v.motDePasse);
      router.replace('/login?compte=cree');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le mot de passe n’a pas pu être enregistré.');
      setEnvoi(false);
    }
  }

  return (
    <div className="oh-login">
      <PanneauMarque />

      <main className="oh-login__main">
        <div className="oh-login__card">
          <Image
            src="/images/logo-saphir-vert.png"
            alt="Saphir OH"
            width={56}
            height={56}
            priority
            className="oh-login__card-logo"
          />

          {etat.statut === 'chargement' && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          )}

          {etat.statut === 'invalide' && (
            <>
              <Title level={2} className="oh-login__card-title">
                Lien expiré ou déjà utilisé
              </Title>
              <Text type="secondary" className="oh-login__card-sub">
                {etat.message}
              </Text>
              <Link href="/login">
                <Button size="large" block className="oh-login__submit">
                  Aller à la connexion
                </Button>
              </Link>
            </>
          )}

          {etat.statut === 'pret' && (
            <>
              <Title level={2} className="oh-login__card-title">
                Bienvenue, {etat.info.prenom}
              </Title>
              <Text type="secondary" className="oh-login__card-sub">
                Choisissez le mot de passe de votre compte <strong>{etat.info.email}</strong>. Vous
                l’utiliserez sur le web et sur l’application mobile.
              </Text>

              {erreur && (
                <Alert title={erreur} type="error" showIcon style={{ marginBottom: 20 }} />
              )}

              <Form form={form} layout="vertical" onFinish={enregistrer} requiredMark={false}>
                {/* Aide les gestionnaires de mots de passe à associer le compte. */}
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  value={etat.info.email}
                  readOnly
                  hidden
                />
                <Form.Item
                  name="motDePasse"
                  label="Nouveau mot de passe"
                  rules={[
                    {
                      validator: (_, v?: string) =>
                        REGLES.every((r) => r.test(v ?? ''))
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Le mot de passe ne respecte pas les règles.'),
                            ),
                    },
                  ]}
                >
                  <Input.Password
                    size="large"
                    autoFocus
                    prefix={<LockOutlined className="oh-login__prefixe" />}
                    autoComplete="new-password"
                    maxLength={72}
                  />
                </Form.Item>

                <ul className="oh-mdp__regles" aria-label="Règles du mot de passe">
                  {REGLES.map((r) => {
                    const ok = r.test(motDePasse);
                    return (
                      <li key={r.libelle} className={ok ? 'is-ok' : undefined}>
                        {ok ? <CheckCircleFilled /> : <CloseCircleFilled />} {r.libelle}
                      </li>
                    );
                  })}
                </ul>

                <Form.Item
                  name="confirmation"
                  label="Confirmer le mot de passe"
                  dependencies={['motDePasse']}
                  rules={[
                    { required: true, message: 'Confirmez votre mot de passe.' },
                    ({ getFieldValue }) => ({
                      validator: (_, v?: string) =>
                        !v || v === getFieldValue('motDePasse')
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Les deux mots de passe ne correspondent pas.'),
                            ),
                    }),
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="oh-login__prefixe" />}
                    autoComplete="new-password"
                    maxLength={72}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={envoi}
                  className="oh-login__submit"
                >
                  Créer mon mot de passe
                </Button>
              </Form>
            </>
          )}
        </div>

        <Text type="secondary" className="oh-login__securite">
          <SafetyCertificateOutlined /> Lien personnel à usage unique
        </Text>
      </main>
    </div>
  );
}
