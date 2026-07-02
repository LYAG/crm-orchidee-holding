'use client';

import {
  EnvironmentOutlined,
  MailOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Col,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { utilisateurService, zoneService } from '@/services';
import type { Utilisateur, Zone } from '@/types';

const { Text, Title } = Typography;

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN:   '#6A1B9A',
  MANAGER: '#1565C0',
  DELEGUE: '#4A7A4A',
};

const ROLE_BG: Record<UserRole, string> = {
  ADMIN:   '#F3E5F5',
  MANAGER: '#E3F2FD',
  DELEGUE: '#E8F5E9',
};

function initials(u: Utilisateur) {
  return `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
}

/* ── Carte Zone ──────────────────────────────────────────────────────────── */

function ZoneCard({
  zone,
  delegues,
  managers,
}: {
  zone: Zone;
  delegues: Utilisateur[];
  managers: Utilisateur[];
}) {
  const zoneDelegues = delegues.filter((d) => d.zoneIds?.includes(zone.id));
  const zoneManagers = managers.filter((m) =>
    zoneDelegues.some((d) => d.managerId === m.id),
  );

  return (
    <ProCard
      bordered
      style={{
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header coloré */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C3A1C 0%, #2D5A2D 100%)',
          padding: '20px 20px 16px',
        }}
      >
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
        {/* Managers */}
        {zoneManagers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#9DB89D',
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
                      style={{ background: ROLE_BG.MANAGER, color: ROLE_COLOR.MANAGER, fontSize: 10, fontWeight: 700 }}
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

        {/* Délégués */}
        <div>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#9DB89D',
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
                      background: '#F8FBF8',
                      border: '1px solid #EEF4EE',
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
                        style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('utilisateurs');

  useEffect(() => {
    Promise.all([utilisateurService.getAll(), zoneService.getAll()])
      .then(([u, z]) => {
        setUtilisateurs(u);
        setZones(z);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delegues = utilisateurs.filter((u) => u.role === UserRole.DELEGUE);
  const managers = utilisateurs.filter((u) => u.role === UserRole.MANAGER);
  const admins   = utilisateurs.filter((u) => u.role === UserRole.ADMIN);

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
      width: 120,
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
        if (u.role !== UserRole.DELEGUE || !u.zoneIds?.length) {
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
            <Avatar size={24} style={{ background: ROLE_BG.MANAGER, color: ROLE_COLOR.MANAGER, fontSize: 10, fontWeight: 700 }}>
              {initials(mgr)}
            </Avatar>
            <Text>{mgr.prenom} {mgr.nom}</Text>
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
        if (u.role !== UserRole.MANAGER || !u.delegueIds?.length) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Tooltip
            title={
              <div>
                {u.delegueIds.map((did) => {
                  const d = utilisateurs.find((d) => d.id === did);
                  return d ? <div key={did}>{d.prenom} {d.nom}</div> : null;
                })}
              </div>
            }
          >
            <Badge
              count={u.delegueIds.length}
              style={{ background: '#5B8C5A' }}
            >
              <Tag icon={<TeamOutlined />} style={{ borderRadius: 6, cursor: 'default' }}>
                délégués
              </Tag>
            </Badge>
          </Tooltip>
        );
      },
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
          {/* Stats rapides */}
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
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
                    <div style={{ fontSize: 24, fontWeight: 700, color: ROLE_COLOR[role], lineHeight: 1 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 12, color: ROLE_COLOR[role], marginTop: 2, fontWeight: 500 }}>
                      {label}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Table */}
          <ProCard bordered bodyStyle={{ padding: 0 }}>
            <Table<Utilisateur>
              dataSource={utilisateurs}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              rowClassName={() => 'crm-table-row'}
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
          <Tag style={{ borderRadius: 10, fontWeight: 600, fontSize: 11 }}>
            {zones.length}
          </Tag>
        </Space>
      ),
      children: loading ? (
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
              <ZoneCard zone={z} delegues={delegues} managers={managers} />
            </Col>
          ))}
        </Row>
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
    </PageContainer>
  );
}
