'use client';

import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DashboardOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MergeCellsOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  ColorPicker,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { UserRole } from '@/lib/constants';
import { roleService } from '@/services';
import type { PermissionAccess, PermissionModule, RoleDefinition } from '@/types';

const { Text } = Typography;

/* ── Icônes de module ────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  TrophyOutlined: <TrophyOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  MergeCellsOutlined: <MergeCellsOutlined />,
  UsergroupAddOutlined: <UsergroupAddOutlined />,
  SettingOutlined: <SettingOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  BellOutlined: <BellOutlined />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP).map((key) => ({
  value: key,
  label: (
    <Space>
      {ICON_MAP[key]}
      <span>{key.replace('Outlined', '')}</span>
    </Space>
  ),
}));

const ACCESS_OPTIONS: { value: PermissionAccess; label: string }[] = [
  { value: 'none', label: 'Aucun accès' },
  { value: 'partial', label: 'Accès partiel' },
  { value: 'full', label: 'Accès complet' },
];

/** Assombrit (percent < 0) ou éclaircit (percent > 0) une couleur hex. */
function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

/* ── Cellule de permission ───────────────────────────────────────────────── */

function AccessCell({
  access,
  label,
  color,
}: {
  access: PermissionAccess;
  label?: string;
  color: string;
}) {
  if (access === 'none') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CloseCircleFilled style={{ color: '#E0E0E0', fontSize: 14 }} />
        <Text style={{ color: '#C8C8C8', fontSize: 12 }}>—</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <CheckCircleFilled
        style={{
          color: access === 'full' ? color : `${color}99`,
          fontSize: 14,
          marginTop: 1,
          flexShrink: 0,
        }}
      />
      {label && (
        <Text style={{ fontSize: 12, color: '#1F4E45', lineHeight: 1.4 }}>
          {label}
        </Text>
      )}
    </div>
  );
}

/* ── Modal Rôle (Edit) ───────────────────────────────────────────────────── */

interface RoleFormValues {
  label: string;
  description: string;
  color: string;
}

function RoleModal({
  open,
  role,
  onClose,
  onSaved,
}: {
  open: boolean;
  role: RoleDefinition | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<RoleFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && role) {
      form.setFieldsValue({ label: role.label, description: role.description, color: role.color });
    }
  }, [open, role, form]);

  async function handleOk() {
    if (!role) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      const color = typeof values.color === 'string' ? values.color : String(values.color);
      await roleService.updateRole(role.key, {
        label: values.label,
        description: values.description,
        color,
        bg: `${color}1A`,
        gradientFrom: shadeColor(color, -25),
        gradientTo: color,
      });
      message.success('Rôle mis à jour.');
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
              background: '#F3E5F5',
              color: '#6A1B9A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <span style={{ color: '#123832' }}>Modifier le rôle</span>
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText="Enregistrer"
      cancelText="Annuler"
      destroyOnClose
      width={420}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="label" label="Libellé" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Input placeholder="Manager" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Input.TextArea rows={3} placeholder="Rôle et périmètre d'action" />
        </Form.Item>
        <Form.Item name="color" label="Couleur" getValueFromEvent={(c) => (typeof c === 'string' ? c : c.toHexString())}>
          <ColorPicker format="hex" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Modal Module de permission (Create / Edit) ─────────────────────────── */

interface PermissionFormValues {
  module: string;
  icon: string;
  access: Record<UserRole, PermissionAccess>;
  labels: Partial<Record<UserRole, string>>;
}

function PermissionModal({
  open,
  editing,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PermissionModule | null;
  roles: RoleDefinition[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PermissionFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          module: editing.module,
          icon: editing.icon,
          access: editing.access,
          labels: editing.labels,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          icon: 'AppstoreOutlined',
          access: { DELEGUE: 'none', MANAGER: 'none', ADMIN: 'none' },
        });
      }
    }
  }, [open, editing, form]);

  async function handleOk() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const data = {
        module: values.module,
        icon: values.icon,
        access: values.access,
        labels: values.labels ?? {},
      };
      if (editing) {
        await roleService.updatePermissionModule(editing.id, data);
        message.success('Module mis à jour.');
      } else {
        await roleService.createPermissionModule(data);
        message.success('Module créé.');
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
              background: '#E7F3F0',
              color: '#0F6E52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppstoreOutlined />
          </div>
          <span style={{ color: '#123832' }}>
            {editing ? 'Modifier le module' : 'Nouveau module de permission'}
          </span>
        </Space>
      }
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText={editing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="module"
            label="Nom du module"
            rules={[{ required: true, message: 'Obligatoire.' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Facturation" />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="icon" label="Icône" rules={[{ required: true, message: 'Obligatoire.' }]}>
          <Select options={ICON_OPTIONS} />
        </Form.Item>

        <Text style={{ fontSize: 12, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase' }}>
          Accès par rôle
        </Text>
        {roles.map((role) => (
          <div
            key={role.key}
            style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'flex-start' }}
          >
            <Tag
              style={{
                background: role.bg,
                color: role.color,
                border: 'none',
                fontWeight: 600,
                borderRadius: 6,
                width: 100,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {role.label}
            </Tag>
            <Form.Item name={['access', role.key]} style={{ flex: 1, marginBottom: 8 }}>
              <Select options={ACCESS_OPTIONS} />
            </Form.Item>
            <Form.Item name={['labels', role.key]} style={{ flex: 1, marginBottom: 8 }}>
              <Input placeholder="Précision (facultatif)" />
            </Form.Item>
          </div>
        ))}
      </Form>
    </Modal>
  );
}

/* ── Carte rôle (en-tête du tableau) ────────────────────────────────────── */

function RoleHeader({ role, onEdit }: { role: RoleDefinition; onEdit: () => void }) {
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: role.bg,
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: `linear-gradient(135deg, ${role.gradientFrom} 0%, ${role.gradientTo} 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <Tooltip title="Modifier le rôle">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: 'rgba(255,255,255,0.75)' }}
              onClick={onEdit}
            />
          </Tooltip>
        </div>
        <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14, display: 'block' }}>
          {role.label}
        </Text>
      </div>
      <div style={{ padding: '10px 12px', background: role.bg }}>
        <Text style={{ fontSize: 11, color: role.color, lineHeight: 1.5 }}>
          {role.description}
        </Text>
      </div>
    </div>
  );
}

/* ── Composant principal ─────────────────────────────────────────────────── */

export function RolesPermissionsPage() {
  const { modal } = App.useApp();

  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<PermissionModule[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionModule | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([roleService.getRoles(), roleService.getPermissionModules()])
      .then(([r, p]) => {
        setRoles(r);
        setPermissions(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEditRole(role: RoleDefinition) {
    setEditingRole(role);
    setRoleModalOpen(true);
  }

  function openCreatePermission() {
    setEditingPerm(null);
    setPermModalOpen(true);
  }

  function openEditPermission(p: PermissionModule) {
    setEditingPerm(p);
    setPermModalOpen(true);
  }

  function confirmDeletePermission(p: PermissionModule) {
    modal.confirm({
      title: 'Supprimer ce module ?',
      content: `Le module "${p.module}" sera retiré de la matrice des permissions.`,
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        await roleService.deletePermissionModule(p.id);
        load();
      },
    });
  }

  return (
    <PageContainer
      title="Rôles & permissions"
      tags={
        <Tag
          icon={<SafetyCertificateOutlined />}
          style={{
            background: '#F3E5F5',
            color: '#6A1B9A',
            border: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Administration
        </Tag>
      }
      extra={[
        <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreatePermission}>
          Ajouter un module
        </Button>,
      ]}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E7F3F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #123832 0%, #1B4A40 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
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
            <SafetyCertificateOutlined />
          </div>
          <div>
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'block', lineHeight: 1.2 }}>
              Matrice des accès
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Récapitulatif des droits par rôle utilisateur
            </Text>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <>
            {/* Tableau */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        width: '22%',
                        padding: '20px 24px 16px',
                        textAlign: 'left',
                        verticalAlign: 'bottom',
                        borderBottomWidth: 2,
                        borderBottomStyle: 'solid',
                        borderBottomColor: '#E7F3F0',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Module
                      </Text>
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.key}
                        style={{
                          width: '24%',
                          padding: '16px 16px 16px',
                          verticalAlign: 'bottom',
                          borderBottomWidth: 2,
                          borderBottomStyle: 'solid',
                          borderBottomColor: '#E7F3F0',
                        }}
                      >
                        <RoleHeader role={role} onEdit={() => openEditRole(role)} />
                      </th>
                    ))}
                    <th
                      style={{
                        width: '6%',
                        padding: '16px 16px 16px',
                        verticalAlign: 'bottom',
                        borderBottomWidth: 2,
                        borderBottomStyle: 'solid',
                        borderBottomColor: '#E7F3F0',
                      }}
                    />
                  </tr>
                </thead>

                <tbody>
                  {permissions.map((perm, i) => (
                    <tr key={perm.id} style={{ background: i % 2 === 0 ? '#F7FAF9' : '#fff' }}>
                      <td
                        style={{
                          padding: '14px 24px',
                          borderBottomWidth: 1,
                          borderBottomStyle: 'solid',
                          borderBottomColor: '#EEF5F3',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: '#E7F3F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0F6E52',
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {ICON_MAP[perm.icon] ?? <AppstoreOutlined />}
                          </div>
                          <Text style={{ fontWeight: 600, color: '#123832', fontSize: 13 }}>
                            {perm.module}
                          </Text>
                        </div>
                      </td>

                      {roles.map((role) => (
                        <td
                          key={role.key}
                          style={{
                            padding: '14px 16px',
                            borderBottomWidth: 1,
                            borderBottomStyle: 'solid',
                            borderBottomColor: '#EEF5F3',
                          }}
                        >
                          <AccessCell
                            access={perm.access[role.key]}
                            label={perm.labels[role.key]}
                            color={role.color}
                          />
                        </td>
                      ))}

                      <td
                        style={{
                          padding: '14px 16px',
                          borderBottomWidth: 1,
                          borderBottomStyle: 'solid',
                          borderBottomColor: '#EEF5F3',
                        }}
                      >
                        <Space size={4}>
                          <Tooltip title="Modifier">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              style={{ color: '#0F6E52' }}
                              onClick={() => openEditPermission(perm)}
                            />
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => confirmDeletePermission(perm)}
                            />
                          </Tooltip>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div
              style={{
                padding: '14px 24px',
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderTopColor: '#E7F3F0',
                background: '#F7FAF9',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                flexWrap: 'wrap' as const,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#8FB0A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Légende
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleFilled style={{ color: '#2E6B5B', fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: '#4F7169' }}>Accès complet</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircleFilled style={{ color: '#2E6B5B99', fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: '#4F7169' }}>Accès partiel</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CloseCircleFilled style={{ color: '#E0E0E0', fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: '#9E9E9E' }}>Aucun accès</Text>
              </div>
            </div>
          </>
        )}
      </div>

      <RoleModal
        open={roleModalOpen}
        role={editingRole}
        onClose={() => setRoleModalOpen(false)}
        onSaved={load}
      />

      <PermissionModal
        open={permModalOpen}
        editing={editingPerm}
        roles={roles}
        onClose={() => setPermModalOpen(false)}
        onSaved={load}
      />
    </PageContainer>
  );
}
