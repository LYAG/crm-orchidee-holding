'use client';

import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DashboardOutlined,
  FileTextOutlined,
  MergeCellsOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Tag, Typography } from 'antd';

const { Text } = Typography;

/* ── Types ───────────────────────────────────────────────────────────────── */

type Access = 'full' | 'partial' | 'none';

interface Permission {
  module: string;
  icon: React.ReactNode;
  delegue: Access;
  manager: Access;
  admin: Access;
  delegueLabel?: string;
  managerLabel?: string;
  adminLabel?: string;
}

/* ── Config rôles ────────────────────────────────────────────────────────── */

const ROLES = [
  {
    key: 'DELEGUE',
    label: 'Délégué',
    color: '#4A7A4A',
    bg: '#E8F5E9',
    gradientFrom: '#2E5C2E',
    gradientTo: '#4A7A4A',
    description: 'Agent commercial terrain. Gère ses propres prospects et rendez-vous dans sa zone.',
  },
  {
    key: 'MANAGER',
    label: 'Manager',
    color: '#1565C0',
    bg: '#E3F2FD',
    gradientFrom: '#0D47A1',
    gradientTo: '#1565C0',
    description: 'Responsable d\'équipe. Supervise les délégués, visualise le reporting et attribue les prospects.',
  },
  {
    key: 'ADMIN',
    label: 'Administrateur',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    gradientFrom: '#4A148C',
    gradientTo: '#6A1B9A',
    description: 'Accès complet. Administre les utilisateurs, zones, paramètres et toutes les données.',
  },
] as const;

/* ── Matrice des permissions ─────────────────────────────────────────────── */

const PERMISSIONS: Permission[] = [
  {
    module: 'Tableau de bord',
    icon: <DashboardOutlined />,
    delegue: 'partial',
    manager: 'partial',
    admin: 'full',
    delegueLabel: 'Ses propres KPIs',
    managerLabel: 'KPIs de l\'équipe',
    adminLabel: 'Vue globale',
  },
  {
    module: 'Prospects',
    icon: <TeamOutlined />,
    delegue: 'partial',
    manager: 'partial',
    admin: 'full',
    delegueLabel: 'Sa zone (PNA + attribués)',
    managerLabel: 'Équipe + attribution',
    adminLabel: 'Tous + CRUD complet',
  },
  {
    module: 'Rendez-vous',
    icon: <CalendarOutlined />,
    delegue: 'partial',
    manager: 'partial',
    admin: 'full',
    delegueLabel: 'Ses propres RDV',
    managerLabel: 'RDV de l\'équipe',
    adminLabel: 'Tous les RDV',
  },
  {
    module: 'Opportunités',
    icon: <TrophyOutlined />,
    delegue: 'partial',
    manager: 'partial',
    admin: 'full',
    delegueLabel: 'Ses propres opportunités',
    managerLabel: 'Équipe + pipeline',
    adminLabel: 'Toutes + pipeline global',
  },
  {
    module: 'Supports commerciaux',
    icon: <FileTextOutlined />,
    delegue: 'partial',
    manager: 'partial',
    admin: 'full',
    delegueLabel: 'Consultation + présentation',
    managerLabel: 'Consultation + présentation',
    adminLabel: 'CRUD complet + import',
  },
  {
    module: 'Reporting équipe',
    icon: <BarChartOutlined />,
    delegue: 'none',
    manager: 'full',
    admin: 'full',
    delegueLabel: undefined,
    managerLabel: 'Son équipe',
    adminLabel: 'Toutes les équipes',
  },
  {
    module: 'Gestion des doublons',
    icon: <MergeCellsOutlined />,
    delegue: 'none',
    manager: 'none',
    admin: 'full',
    adminLabel: 'Fusion & suppression',
  },
  {
    module: 'Utilisateurs & Zones',
    icon: <UsergroupAddOutlined />,
    delegue: 'none',
    manager: 'none',
    admin: 'full',
    adminLabel: 'CRUD complet',
  },
  {
    module: 'Paramètres',
    icon: <SettingOutlined />,
    delegue: 'none',
    manager: 'none',
    admin: 'full',
    adminLabel: 'Configuration globale',
  },
];

/* ── Cellule de permission ───────────────────────────────────────────────── */

function AccessCell({
  access,
  label,
  color,
}: {
  access: Access;
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
        <Text style={{ fontSize: 12, color: '#3D5C3D', lineHeight: 1.4 }}>
          {label}
        </Text>
      )}
    </div>
  );
}

/* ── Carte rôle (en-tête du tableau) ────────────────────────────────────── */

function RoleHeader({ role }: { role: typeof ROLES[number] }) {
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
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #EEF4EE',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Header gradient */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #1C3A1C 0%, #2D5A2D 100%)',
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

        {/* Tableau */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            {/* En-têtes rôles */}
            <thead>
              <tr>
                <th
                  style={{
                    width: '28%',
                    padding: '20px 24px 16px',
                    textAlign: 'left',
                    verticalAlign: 'bottom',
                    borderBottomWidth: 2,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#EEF4EE',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 700, color: '#9DB89D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Module
                  </Text>
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role.key}
                    style={{
                      width: '24%',
                      padding: '16px 16px 16px',
                      verticalAlign: 'bottom',
                      borderBottomWidth: 2,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#EEF4EE',
                    }}
                  >
                    <RoleHeader role={role} />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Lignes modules */}
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr
                  key={perm.module}
                  style={{ background: i % 2 === 0 ? '#FAFCFA' : '#fff' }}
                >
                  {/* Nom du module */}
                  <td
                    style={{
                      padding: '14px 24px',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#F0F4F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: '#EEF4EE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5B8C5A',
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {perm.icon}
                      </div>
                      <Text style={{ fontWeight: 600, color: '#1C3A1C', fontSize: 13 }}>
                        {perm.module}
                      </Text>
                    </div>
                  </td>

                  {/* DELEGUE */}
                  <td
                    style={{
                      padding: '14px 16px',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#F0F4F0',
                    }}
                  >
                    <AccessCell
                      access={perm.delegue}
                      label={perm.delegueLabel}
                      color={ROLES[0].color}
                    />
                  </td>

                  {/* MANAGER */}
                  <td
                    style={{
                      padding: '14px 16px',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#F0F4F0',
                    }}
                  >
                    <AccessCell
                      access={perm.manager}
                      label={perm.managerLabel}
                      color={ROLES[1].color}
                    />
                  </td>

                  {/* ADMIN */}
                  <td
                    style={{
                      padding: '14px 16px',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#F0F4F0',
                    }}
                  >
                    <AccessCell
                      access={perm.admin}
                      label={perm.adminLabel}
                      color={ROLES[2].color}
                    />
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
            borderTopColor: '#EEF4EE',
            background: '#FAFCFA',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap' as const,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 700, color: '#9DB89D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Légende
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled style={{ color: '#4A7A4A', fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: '#5C7A5C' }}>Accès complet</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled style={{ color: '#4A7A4A99', fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: '#5C7A5C' }}>Accès partiel</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CloseCircleFilled style={{ color: '#E0E0E0', fontSize: 13 }} />
            <Text style={{ fontSize: 12, color: '#9E9E9E' }}>Aucun accès</Text>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
