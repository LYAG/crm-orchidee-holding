'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { Alert, Button, Form, Typography } from 'antd';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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
      {/* ── Panneau de marque (masqué sur mobile) ───────────────────── */}
      <aside className="oh-login__brand">
        <div className="oh-login__logo">
          <Image src="/images/logo-orchidee-holding.png" alt="Orchidée Holding" width={44} height={44} priority />
        </div>
        <div>
          <Title level={2} className="oh-login__title">
            Saphir OH
          </Title>
          <Text className="oh-login__sub">CRM B2B Orchidée Holding — Espace collaborateurs</Text>
          <Text className="oh-login__lead">
            Gérez vos prospects, planifiez vos rendez-vous et suivez vos opportunités commerciales en temps réel.
          </Text>
        </div>
        <Text className="oh-login__legal">© {new Date().getFullYear()} Orchidée Holding — Usage interne</Text>
      </aside>

      {/* ── Formulaire ───────────────────────────────────────────────── */}
      <main className="oh-login__main">
        <div className="oh-login__card">
          <div className="oh-login__compact-brand">
            <Image src="/images/logo-orchidee-holding.png" alt="" width={36} height={36} style={{ borderRadius: 8 }} />
            <span>Saphir OH</span>
          </div>
          <Title level={3} style={{ margin: 0, marginBottom: 6, fontWeight: 650, letterSpacing: '-0.015em' }}>
            Connexion
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 28 }}>
            Entrez vos identifiants pour accéder à votre espace.
          </Text>

          {!error && sessionExpiree && (
            <Alert
              title="Votre session a expiré. Veuillez vous reconnecter."
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="email"
              label={<span>Adresse e-mail</span>}
              rules={[{ required: true, message: 'Veuillez saisir votre e-mail.' }]}
            >
              <ProFormText
                fieldProps={{
                  prefix: <UserOutlined style={{ color: '#627A74' }} />,
                  autoComplete: 'email',
                  size: 'large',
                  placeholder: 'nom@orchidee-holding.ci',
                }}
                noStyle
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span>Mot de passe</span>}
              rules={[{ required: true, message: 'Veuillez saisir votre mot de passe.' }]}
            >
              <ProFormText.Password
                fieldProps={{
                  prefix: <LockOutlined style={{ color: '#627A74' }} />,
                  autoComplete: 'current-password',
                  size: 'large',
                  placeholder: '••••••••',
                }}
                noStyle
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ marginTop: 4, height: 44, fontWeight: 600 }}
            >
              Se connecter
            </Button>
          </Form>
        </div>
        <Text type="secondary" className="oh-login__legal-mobile">
          © {new Date().getFullYear()} Orchidée Holding — Usage interne
        </Text>
      </main>
    </div>
  );
}
