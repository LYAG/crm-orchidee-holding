'use client';

import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Typography } from 'antd';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { PanneauMarque } from '@/features/auth/PanneauMarque';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpiree = searchParams.get('session') === 'expiree';
  const compteCree = searchParams.get('compte') === 'cree';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const annee = new Date().getFullYear();

  async function handleSubmit(values: { email: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="oh-login">
      <PanneauMarque />

      {/* ── Formulaire ───────────────────────────────────────────────── */}
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
          <Title level={2} className="oh-login__card-title">
            Connexion à Saphir OH
          </Title>
          <Text type="secondary" className="oh-login__card-sub">
            Saisissez vos identifiants professionnels pour accéder à votre espace.
          </Text>

          {!error && compteCree && (
            <Alert
              title="Votre mot de passe est enregistré. Connectez-vous pour accéder à votre espace."
              type="success"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {!error && sessionExpiree && (
            <Alert
              title="Votre session a expiré. Veuillez vous reconnecter."
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {error && <Alert title={error} type="error" showIcon style={{ marginBottom: 20 }} />}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="email"
              label="Adresse e-mail"
              rules={[{ required: true, message: 'Veuillez saisir votre e-mail.' }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined className="oh-login__prefixe" />}
                autoComplete="email"
                inputMode="email"
                placeholder="nom@orchidee-holding.ci"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: 'Veuillez saisir votre mot de passe.' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined className="oh-login__prefixe" />}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="oh-login__submit"
            >
              Se connecter
            </Button>
          </Form>

          <Text type="secondary" className="oh-login__aide">
            Mot de passe oublié ? Contactez votre administrateur.
          </Text>
        </div>

        <Text type="secondary" className="oh-login__securite">
          <SafetyCertificateOutlined /> Connexion sécurisée — accès réservé aux collaborateurs
        </Text>
        <Text type="secondary" className="oh-login__legal-mobile">
          © {annee} Orchidée Holding — Usage interne
        </Text>
      </main>
    </div>
  );
}
