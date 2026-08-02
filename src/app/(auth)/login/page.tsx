'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { ProFormText } from '@ant-design/pro-components';
import { Alert, Button, Form, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        minHeight: '100vh',
      }}
    >
      {/* ── Left brand panel ────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0F2210 0%, #123832 40%, #1B4A40 75%, #2E6B5B 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(15,110,82,0.18)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(15,110,82,0.12)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 160,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo + brand */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: '#fff',
              fontWeight: 800,
              marginBottom: 24,
              backdropFilter: 'blur(8px)',
            }}
          >
            O
          </div>
          <Title
            level={2}
            style={{
              color: '#ffffff',
              margin: 0,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
          >
            Orchidée
            <br />
            Holding
          </Title>
          <Text
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              display: 'block',
              marginTop: 8,
            }}
          >
            CRM B2B — Espace collaborateurs
          </Text>
        </div>

        {/* Center quote */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 40,
              height: 2,
              background: 'rgba(255,255,255,0.25)',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13,
              lineHeight: 1.6,
              display: 'block',
            }}
          >
            Gérez vos prospects, planifiez vos rendez-vous et suivez vos
            opportunités commerciales en temps réel.
          </Text>
        </div>

        {/* Test accounts */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 10,
            }}
          >
            Comptes de test
          </Text>
          {[
            { role: 'Délégué', email: 'k.nguessan@orchidee-holding.ci', pwd: 'delegue2026' },
            { role: 'Manager', email: 'f.kone@orchidee-holding.ci', pwd: 'manager2026' },
            { role: 'Admin', email: 'admin@orchidee-holding.ci', pwd: 'admin2026' },
          ].map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => {
                form.setFieldsValue({ email: acc.email, password: acc.pwd });
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                marginBottom: 4,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}>
                {acc.role}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}>
                {acc.pwd}
              </Text>
            </button>
          ))}
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4, display: 'block' }}>
            Cliquez sur un compte pour le pré-remplir
          </Text>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 56px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 8, fontWeight: 700, color: '#123832' }}>
            Connexion
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
            Entrez vos identifiants pour accéder à votre espace.
          </Text>

          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, color: '#1F4E45' }}>Adresse e-mail</span>}
              rules={[{ required: true, message: 'Veuillez saisir votre e-mail.' }]}
            >
              <ProFormText
                fieldProps={{
                  prefix: <UserOutlined style={{ color: '#8FB0A8' }} />,
                  autoComplete: 'email',
                  size: 'large',
                  style: { borderRadius: 8 },
                  placeholder: 'nom@orchidee-holding.ci',
                }}
                noStyle
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, color: '#1F4E45' }}>Mot de passe</span>}
              rules={[{ required: true, message: 'Veuillez saisir votre mot de passe.' }]}
            >
              <ProFormText.Password
                fieldProps={{
                  prefix: <LockOutlined style={{ color: '#8FB0A8' }} />,
                  autoComplete: 'current-password',
                  size: 'large',
                  style: { borderRadius: 8 },
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
              style={{
                marginTop: 8,
                borderRadius: 8,
                height: 46,
                fontWeight: 600,
                fontSize: 15,
                background: 'linear-gradient(135deg, #0F6E52 0%, #2E6B5B 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(15,110,82,0.35)',
              }}
            >
              Se connecter
            </Button>
          </Form>

          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid #E7F3F0',
              textAlign: 'center',
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              © {new Date().getFullYear()} Orchidée Holding — Usage interne uniquement
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
