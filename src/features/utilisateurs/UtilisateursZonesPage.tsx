'use client';

import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  KeyOutlined,
  MailOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import {
  App,
  Avatar,
  Badge,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { utilisateurService, zoneService } from '@/services';
import type { Utilisateur, Zone } from '@/types';

const { Text, Title } = Typography;

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: '#6A1B9A',
  MANAGER: '#1565C0',
  DELEGUE: '#2E6B5B',
};

const ROLE_BG: Record<UserRole, string> = {
  ADMIN: '#F3E5F5',
  MANAGER: '#E3F2FD',
  DELEGUE: '#E8F5E9',
};

function initials(u: Utilisateur) {
  return `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
}

/* ── Modal Utilisateur (Create / Edit) ────────────────────────────────────── */

interface UtilisateurFormValues {
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
  zoneIds?: string[];
  managerId?: string;
}

function UtilisateurModal({
  open,
  editing,
  utilisateurs,
  zones,
  onClose,
  onSaved,
  onCreated,
}: {
  open: boolean;
  editing: Utilisateur | null;
  utilisateurs: Utilisateur[];
  zones: Zone[];
  onClose: () => void;
  onSaved: () => void;
  onCreated: (email: string, motDePasse: string) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UtilisateurFormValues>();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          prenom: editing.prenom,
          nom: editing.nom,
          email: editing.email,
          role: editing.role as UserRole,
          zoneIds: editing.zoneIds,
          managerId: editing.managerId,
        });
        setRole(editing.role as UserRole);
      } else {
        form.resetFields();
        setRole(null);
      }
    }
  }, [open, editing, form]);

  async function handleOk() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const data: Omit<Utilisateur, 'id'> = {
        prenom: values.prenom,
        nom: values.nom,
        email: values.email,
        role: values.role,
        zoneIds:
          values.role === UserRole.DELEGUE || values.role === UserRole.MANAGER ? values.zoneIds : undefined,
        managerId: values.role === UserRole.DELEGUE ? values.managerId : undefined,
      };
      if (editing) {
        await utilisateurService.update(editing.id, data);
        message.success('Utilisateur mis à jour.');
        onSaved();
        onClose();
      } else {
        const { motDePasseGenere } = await utilisateurService.create(data);
        onSaved();
        onClose();
        onCreated(data.email, motDePasseGenere);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  const managers = utilisateurs.filter((u) => u.role === UserRole.MANAGER);

  return (
    <Modal
      open={open}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#E8F5E9',
              color: '#0F6E52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserOutlined />
          </div>
          <span style={{ color: '#123832' }}>
            {editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </span>
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Obligatoire.' }]}>
              <Input placeholder="Marie" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Obligatoire.' }]}>
              <Input placeholder="Dupont" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Adresse e-mail"
          rules={[
            { required: true, message: 'Obligatoire.' },
            { type: 'email', message: 'E-mail invalide.' },
          ]}
        >
          <Input placeholder="marie.dupont@orchidee-holding.fr" />
        </Form.Item>

        <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select
            placeholder="Sélectionner un rôle"
            onChange={(v) => {
              setRole(v as UserRole);
              form.setFieldsValue({ zoneIds: undefined, managerId: undefined });
            }}
            options={Object.entries(USER_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
        </Form.Item>

        {role === UserRole.DELEGUE && (
          <>
            <Form.Item name="zoneIds" label="Zone(s)">
              <Select
                mode="multiple"
                placeholder="Sélectionner une ou plusieurs zones"
                options={zones.map((z) => ({ value: z.id, label: `${z.nom} — ${z.region}` }))}
              />
            </Form.Item>
            <Form.Item name="managerId" label="Manager responsable">
              <Select
                allowClear
                placeholder="Aucun manager"
                options={managers.map((m) => ({
                  value: m.id,
                  label: `${m.prenom} ${m.nom}`,
                }))}
              />
            </Form.Item>
          </>
        )}

        {role === UserRole.MANAGER && (
          <Form.Item
            name="zoneIds"
            label="Zone(s) supervisée(s)"
            extra="Le manager hérite automatiquement de tous les délégués rattachés à ces zones."
          >
            <Select
              mode="multiple"
              placeholder="Sélectionner une ou plusieurs zones"
              options={zones.map((z) => ({ value: z.id, label: `${z.nom} — ${z.region}` }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

/* ── Modal Identifiants générés ──────────────────────────────────────────── */

function CredentialsModal({
  credentials,
  onClose,
}: {
  credentials: { email: string; motDePasse: string } | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!credentials}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#E8F5E9',
              color: '#0F6E52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyOutlined />
          </div>
          <span style={{ color: '#123832' }}>Accès générés</span>
        </Space>
      }
      onCancel={onClose}
      onOk={onClose}
      okText="Terminé"
      cancelButtonProps={{ style: { display: 'none' } }}
      destroyOnClose
      width={440}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Communiquez ces identifiants au collaborateur. Le mot de passe ne sera plus affiché ensuite —
        pensez à le copier maintenant.
      </Text>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
            Adresse e-mail
          </Text>
          <Text copyable strong>
            {credentials?.email}
          </Text>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
            Mot de passe temporaire
          </Text>
          <Text
            copyable={{ text: credentials?.motDePasse }}
            strong
            style={{ fontFamily: 'monospace', fontSize: 16 }}
          >
            {credentials?.motDePasse}
          </Text>
        </div>
      </Space>
    </Modal>
  );
}

/* ── Modal Zone (Create / Edit) ──────────────────────────────────────────── */

function ZoneModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Zone | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ nom: string; region: string }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({ nom: editing.nom, region: editing.region });
      } else {
        form.resetFields();
      }
    }
  }, [open, editing, form]);

  async function handleOk() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await zoneService.update(editing.id, values);
        message.success('Zone mise à jour.');
      } else {
        await zoneService.create(values);
        message.success('Zone créée.');
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#E8F5E9',
              color: '#0F6E52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EnvironmentOutlined />
          </div>
          <span style={{ color: '#123832' }}>
            {editing ? 'Modifier la zone' : 'Nouvelle zone'}
          </span>
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      destroyOnClose
      width={420}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="nom" label="Nom de la zone" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Input placeholder="Nord" />
        </Form.Item>
        <Form.Item name="region" label="Région" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Input placeholder="Hauts-de-France" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Carte Zone ──────────────────────────────────────────────────────────── */

function ZoneCard({
  zone,
  delegues,
  managers,
  onEdit,
  onDelete,
}: {
  zone: Zone;
  delegues: Utilisateur[];
  managers: Utilisateur[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const zoneDelegues = delegues.filter((d) => d.zoneIds?.includes(zone.id));
  const zoneManagers = managers.filter((m) => m.zoneIds?.includes(zone.id));

  return (
    <ProCard
      bordered
      style={{ height: '100%', borderRadius: 12, overflow: 'hidden' }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header coloré */}
      <div
        style={{
          background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)',
          padding: '20px 20px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Space align="center" size={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
              }}
            >
              <EnvironmentOutlined />
            </div>
            <div>
              <Title level={5} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
                {zone.nom}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {zone.region}
              </Text>
            </div>
          </Space>

          {/* Actions */}
          <Space size={4}>
            <Tooltip title="Modifier">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onClick={onEdit}
              />
            </Tooltip>
            <Tooltip title="Supprimer">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                style={{ color: 'rgba(255,100,100,0.8)' }}
                onClick={onDelete}
              />
            </Tooltip>
          </Space>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {zoneDelegues.length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              délégué{zoneDelegues.length > 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {zoneManagers.length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              manager{zoneManagers.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: '16px 20px' }}>
        {zoneManagers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#8FB0A8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Managers
            </Text>
            <Space wrap size={6}>
              {zoneManagers.map((m) => (
                <Tooltip key={m.id} title={m.email}>
                  <Space size={6} style={{ cursor: 'default' }}>
                    <Avatar
                      size={24}
                      style={{
                        background: ROLE_BG.MANAGER,
                        color: ROLE_COLOR.MANAGER,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {initials(m)}
                    </Avatar>
                    <Text style={{ fontSize: 13 }}>
                      {m.prenom} {m.nom}
                    </Text>
                  </Space>
                </Tooltip>
              ))}
            </Space>
          </div>
        )}

        <div>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#8FB0A8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Délégués
          </Text>
          {zoneDelegues.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Aucun délégué affecté
            </Text>
          ) : (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {zoneDelegues.map((d) => {
                const mgr = managers.find((m) => m.id === d.managerId);
                return (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#F3F9F7',
                      border: '1px solid #E7F3F0',
                    }}
                  >
                    <Avatar
                      size={30}
                      style={{
                        background: ROLE_BG.DELEGUE,
                        color: ROLE_COLOR.DELEGUE,
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(d)}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ display: 'block', fontSize: 13, lineHeight: 1.2 }}>
                        {d.prenom} {d.nom}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.email}
                      </Text>
                    </div>
                    {mgr && (
                      <Tooltip title={`Manager : ${mgr.prenom} ${mgr.nom}`}>
                        <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                          {mgr.prenom}
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </Space>
          )}
        </div>
      </div>
    </ProCard>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */

export function UtilisateursZonesPage() {
  const { modal, message } = App.useApp();

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('utilisateurs');
  const tableRef = useRef<ActionType | undefined>(undefined);

  // Modal utilisateur
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);

  // Modal identifiants générés (création ou réinitialisation)
  const [credentials, setCredentials] = useState<{ email: string; motDePasse: string } | null>(null);

  // Modal zone
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  // Liste complète : nécessaire aux tuiles de comptage, aux menus déroulants du formulaire
  // (manager/délégués) et aux colonnes dérivées (Manager, Équipe) — le tableau affiché,
  // lui, se charge indépendamment page par page via loadUtilisateursPage ci-dessous.
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([utilisateurService.getAll(), zoneService.getAll()])
      .then(([u, z]) => {
        setUtilisateurs(u);
        setZones(z);
        tableRef.current?.reload();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadUtilisateursPage(params: Record<string, unknown> & { current?: number; pageSize?: number }) {
    const page = (params.current ?? 1) - 1;
    const pageSize = params.pageSize ?? 10;
    const resultat = await utilisateurService.getAllPagine(undefined, page, pageSize);
    return { data: resultat.contenu, success: true, total: resultat.total };
  }

  useEffect(() => {
    load();
  }, [load]);

  const delegues = utilisateurs.filter((u) => u.role === UserRole.DELEGUE);
  const managers = utilisateurs.filter((u) => u.role === UserRole.MANAGER);
  const admins = utilisateurs.filter((u) => u.role === UserRole.ADMIN);

  function openCreateUser() {
    setEditingUser(null);
    setUserModalOpen(true);
  }

  function openEditUser(u: Utilisateur) {
    setEditingUser(u);
    setUserModalOpen(true);
  }

  function confirmDeleteUser(u: Utilisateur) {
    modal.confirm({
      title: 'Supprimer cet utilisateur ?',
      content: `${u.prenom} ${u.nom} (${USER_ROLE_LABELS[u.role as UserRole]}) sera définitivement supprimé.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await utilisateurService.delete(u.id);
        load();
      },
    });
  }

  function confirmResetPassword(u: Utilisateur) {
    modal.confirm({
      title: 'Réinitialiser le mot de passe ?',
      content: `Un nouveau mot de passe temporaire sera généré pour ${u.prenom} ${u.nom}. L'ancien cessera de fonctionner immédiatement.`,
      okText: 'Générer',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          const motDePasse = await utilisateurService.regenererMotDePasse(u.id);
          setCredentials({ email: u.email, motDePasse });
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Erreur lors de la génération.');
        }
      },
    });
  }

  function openCreateZone() {
    setEditingZone(null);
    setZoneModalOpen(true);
  }

  function openEditZone(z: Zone) {
    setEditingZone(z);
    setZoneModalOpen(true);
  }

  function confirmDeleteZone(z: Zone) {
    modal.confirm({
      title: 'Supprimer cette zone ?',
      content: `La zone "${z.nom}" sera supprimée. Les délégués affectés perdront leur rattachement à cette zone.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await zoneService.delete(z.id);
        load();
      },
    });
  }

  /* ── Colonnes table Utilisateurs ── */
  const columns = [
    {
      title: 'Collaborateur',
      key: 'nom',
      render: (_: unknown, u: Utilisateur) => (
        <Space size={12}>
          <Avatar
            size={36}
            style={{
              background: ROLE_BG[u.role as UserRole],
              color: ROLE_COLOR[u.role as UserRole],
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {initials(u)}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 14 }}>
              {u.prenom} {u.nom}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {u.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rôle',
      key: 'role',
      width: 130,
      render: (_: unknown, u: Utilisateur) => (
        <Tag
          style={{
            background: ROLE_BG[u.role as UserRole],
            color: ROLE_COLOR[u.role as UserRole],
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          {USER_ROLE_LABELS[u.role as UserRole]}
        </Tag>
      ),
    },
    {
      title: 'Zone(s)',
      key: 'zones',
      render: (_: unknown, u: Utilisateur) => {
        if ((u.role !== UserRole.DELEGUE && u.role !== UserRole.MANAGER) || !u.zoneIds?.length) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space wrap size={4}>
            {u.zoneIds.map((zid) => {
              const z = zones.find((z) => z.id === zid);
              return z ? (
                <Tag key={zid} icon={<EnvironmentOutlined />} style={{ borderRadius: 6 }}>
                  {z.nom}
                </Tag>
              ) : null;
            })}
          </Space>
        );
      },
    },
    {
      title: 'Manager',
      key: 'manager',
      render: (_: unknown, u: Utilisateur) => {
        if (u.role !== UserRole.DELEGUE || !u.managerId) {
          return <Text type="secondary">—</Text>;
        }
        const mgr = utilisateurs.find((m) => m.id === u.managerId);
        return mgr ? (
          <Space size={8}>
            <Avatar
              size={24}
              style={{
                background: ROLE_BG.MANAGER,
                color: ROLE_COLOR.MANAGER,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {initials(mgr)}
            </Avatar>
            <Text>
              {mgr.prenom} {mgr.nom}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: 'Équipe',
      key: 'equipe',
      render: (_: unknown, u: Utilisateur) => {
        if (u.role !== UserRole.MANAGER) {
          return <Text type="secondary">—</Text>;
        }
        const equipe = utilisateurs.filter(
          (d) => d.role === UserRole.DELEGUE && d.zoneIds?.some((z) => u.zoneIds?.includes(z)),
        );
        if (equipe.length === 0) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Tooltip
            title={
              <div>
                {equipe.map((d) => (
                  <div key={d.id}>
                    {d.prenom} {d.nom}
                  </div>
                ))}
              </div>
            }
          >
            <Badge count={equipe.length} style={{ background: '#0F6E52' }}>
              <Tag icon={<TeamOutlined />} style={{ borderRadius: 6, cursor: 'default' }}>
                délégués
              </Tag>
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, u: Utilisateur) => (
        <Space size={4}>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: '#0F6E52' }}
              onClick={() => openEditUser(u)}
            />
          </Tooltip>
          <Tooltip title="Réinitialiser le mot de passe">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              style={{ color: '#1565C0' }}
              onClick={() => confirmResetPassword(u)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDeleteUser(u)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'utilisateurs',
      label: (
        <Space>
          <UserOutlined />
          <span>Utilisateurs</span>
          <Tag style={{ borderRadius: 10, fontWeight: 600, fontSize: 11 }}>
            {utilisateurs.length}
          </Tag>
        </Space>
      ),
      children: (
        <div>
          {/* Stats rapides + bouton créer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Row gutter={[12, 12]} style={{ flex: 1 }}>
              {[
                { label: 'Administrateurs', count: admins.length, role: UserRole.ADMIN },
                { label: 'Managers', count: managers.length, role: UserRole.MANAGER },
                { label: 'Délégués', count: delegues.length, role: UserRole.DELEGUE },
              ].map(({ label, count, role }) => (
                <Col key={role} xs={24} sm={8}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      borderRadius: 10,
                      background: ROLE_BG[role],
                      border: `1px solid ${ROLE_COLOR[role]}20`,
                    }}
                  >
                    <Avatar
                      size={40}
                      style={{ background: ROLE_COLOR[role], flexShrink: 0 }}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: ROLE_COLOR[role],
                          lineHeight: 1,
                        }}
                      >
                        {count}
                      </div>
                      <div
                        style={{ fontSize: 12, color: ROLE_COLOR[role], marginTop: 2, fontWeight: 500 }}
                      >
                        {label}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateUser}
              style={{ flexShrink: 0 }}
            >
              Ajouter un utilisateur
            </Button>
          </div>

          {/* Table */}
          <ProCard bordered bodyStyle={{ padding: 0 }}>
            <ProTable<Utilisateur>
              actionRef={tableRef}
              request={loadUtilisateursPage}
              columns={columns}
              rowKey="id"
              search={false}
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            />
          </ProCard>
        </div>
      ),
    },
    {
      key: 'zones',
      label: (
        <Space>
          <EnvironmentOutlined />
          <span>Zones</span>
          <Tag style={{ borderRadius: 10, fontWeight: 600, fontSize: 11 }}>{zones.length}</Tag>
        </Space>
      ),
      children: (
        <div>
          {/* Header zones */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {zones.length} zone{zones.length > 1 ? 's' : ''} géographique
              {zones.length > 1 ? 's' : ''}
            </Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateZone}>
              Ajouter une zone
            </Button>
          </div>

          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map((i) => (
                <Col key={i} xs={24} md={8}>
                  <Skeleton active />
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {zones.map((z) => (
                <Col key={z.id} xs={24} md={8}>
                  <ZoneCard
                    zone={z}
                    delegues={delegues}
                    managers={managers}
                    onEdit={() => openEditZone(z)}
                    onDelete={() => confirmDeleteZone(z)}
                  />
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Utilisateurs & Zones"
      subTitle={`${utilisateurs.length} collaborateurs · ${zones.length} zones`}
    >
      <ProCard
        tabs={{
          activeKey: activeTab,
          onChange: setActiveTab,
          items: tabItems,
          size: 'large',
        }}
        style={{ borderRadius: 12 }}
      />

      <UtilisateurModal
        open={userModalOpen}
        editing={editingUser}
        utilisateurs={utilisateurs}
        zones={zones}
        onClose={() => setUserModalOpen(false)}
        onSaved={load}
        onCreated={(email, motDePasse) => setCredentials({ email, motDePasse })}
      />

      <ZoneModal
        open={zoneModalOpen}
        editing={editingZone}
        onClose={() => setZoneModalOpen(false)}
        onSaved={load}
      />

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </PageContainer>
  );
}
