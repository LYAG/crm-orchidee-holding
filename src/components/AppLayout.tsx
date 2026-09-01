'use client';

import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Avatar, Divider, Dropdown, Select, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMenuRoutes } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants';
import { zoneService } from '@/services';
import type { Zone } from '@/types';
import { HeaderNotifications } from './HeaderNotifications';
import { useZoneFilter } from './ZoneFilterContext';

const { Text } = Typography;

const ROLE_TAG_COLOR: Record<UserRole, string> = {
  DELEGUE: '#2E6B5B',
  MANAGER: '#1565C0',
  ADMIN: '#6A1B9A',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  // Filtre global partagé avec les pages de données via ZoneFilterContext.
  const { zoneFiltreId, setZoneFiltreId } = useZoneFilter();

  useEffect(() => {
    if (user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN) {
      zoneService.getAll().then(setZones).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const avatarLetter = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

  return (
    <div style={{ height: '100vh' }}>
      <ProLayout
        title="Orchidée Holding"
        logo={
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#0F6E52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#fff',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            O
          </div>
        }
        /*
         * layout="mix" :
         *  - GlobalHeader est rendu sur desktop (pas de return null)
         *  - showSiderExtraDom = false → actionsRender / avatarProps vont
         *    dans le GlobalHeader (top bar), PAS dans le sider
         *  - Le sider affiche uniquement les items de menu
         */
        layout="mix"
        fixSiderbar
        fixedHeader
        collapsed={collapsed}
        onCollapse={setCollapsed}
        route={getMenuRoutes(user.role as UserRole)}
        location={{ pathname }}
        splitMenus={false}
        menuItemRender={(item, dom) => (
          <Link href={item.path ?? '/'}>{dom}</Link>
        )}
        subMenuItemRender={(item, dom) => (
          <Link href={item.path ?? '/'}>{dom}</Link>
        )}
        /* En layout="mix", actionsRender va dans le GlobalHeader (top bar) */
        actionsRender={() => [
          (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) && zones.length > 0 ? (
            <Select
              key="zone-select"
              placeholder="Toutes les zones"
              allowClear
              size="small"
              style={{ minWidth: 150 }}
              value={zoneFiltreId}
              onChange={setZoneFiltreId}
              options={zones.map((z) => ({ value: z.id, label: z.nom }))}
            />
          ) : null,
          <HeaderNotifications key="notifs" user={user} />,
          <Divider
            key="sep"
            vertical
            style={{ height: 20, margin: '0 4px', borderColor: '#DCE8E4' }}
          />,
        ]}
        /* avatarProps rend le user dans le GlobalHeader à droite de actionsRender */
        avatarProps={{
          size: 'small',
          title: `${user.prenom} ${user.nom}`,
          render: (_props, _dom) => (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'info',
                    disabled: true,
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontWeight: 600, color: '#123832' }}>
                          {user.prenom} {user.nom}
                        </div>
                        <div style={{ fontSize: 12, color: '#8FB0A8' }}>{user.email}</div>
                      </div>
                    ),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Se déconnecter',
                    danger: true,
                    onClick: async () => {
                      await logout();
                      router.replace('/login');
                    },
                  },
                ],
              }}
            >
              <Space size={8} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                <Avatar
                  size={28}
                  icon={<UserOutlined />}
                  style={{
                    background: ROLE_TAG_COLOR[user.role as UserRole],
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {avatarLetter}
                </Avatar>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#123832', lineHeight: 1.2 }}>
                    {user.prenom} {user.nom}
                  </div>
                  <Tag
                    style={{
                      fontSize: 10,
                      padding: '0 6px',
                      lineHeight: '16px',
                      height: 16,
                      margin: 0,
                      borderRadius: 4,
                      background: `${ROLE_TAG_COLOR[user.role as UserRole]}18`,
                      color: ROLE_TAG_COLOR[user.role as UserRole],
                      border: `1px solid ${ROLE_TAG_COLOR[user.role as UserRole]}30`,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {USER_ROLE_LABELS[user.role as UserRole]}
                  </Tag>
                </div>
              </Space>
            </Dropdown>
          ),
        }}
        token={{
          colorPrimary: '#0F6E52',
          header: {
            colorBgHeader: '#ffffff',
            colorTextMenu: '#1F4E45',
            colorTextMenuSecondary: '#5C8079',
            colorTextMenuSelected: '#0F6E52',
            colorBgMenuItemSelected: '#E1F1EC',
            heightLayoutHeader: 56,
          },
          sider: {
            colorMenuBackground: '#171717',
            colorMenuItemDivider: 'rgba(255,255,255,0.08)',
            colorTextMenu: 'rgba(255,255,255,0.65)',
            colorTextMenuSecondary: 'rgba(255,255,255,0.45)',
            colorTextMenuSelected: '#ffffff',
            colorTextMenuItemHover: '#ffffff',
            colorTextMenuActive: '#ffffff',
            colorBgMenuItemHover: 'rgba(15,110,82,0.35)',
            colorBgMenuItemSelected: '#0F6E52',
            colorBgMenuItemCollapsedElevated: '#212121',
            colorTextSubMenuSelected: '#ffffff',
          },
          pageContainer: {
            paddingInlinePageContainerContent: 24,
            paddingBlockPageContainerContent: 24,
          },
        }}
        headerTitleRender={(logo, title) => (
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {logo}
            <Text
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: '#123832',
                letterSpacing: '-0.2px',
              }}
            >
              {title}
            </Text>
          </Link>
        )}
        breadcrumbRender={(routers) => routers}
      >
        {children}
      </ProLayout>
    </div>
  );
}
