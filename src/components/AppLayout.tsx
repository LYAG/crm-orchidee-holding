'use client';

import { DownOutlined, EnvironmentOutlined, LogoutOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Avatar, Badge, Button, Dropdown, Grid, Popover, Select } from 'antd';
import Image from 'next/image';
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

const ROLE_COLOR: Record<UserRole, string> = {
  DELEGUE: '#0F6E52',
  MANAGER: '#1F5FA8',
  ADMIN: '#6B3FA0',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  // Rendu uniquement côté client (null tant que l'utilisateur n'est pas chargé) : matchMedia est sûr ici.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const [zones, setZones] = useState<Zone[]>([]);
  // Filtre global partagé avec les pages de données via ZoneFilterContext.
  const { zoneFiltreId, setZoneFiltreId } = useZoneFilter();

  useEffect(() => {
    if (user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN) {
      zoneService.getAll().then(setZones).catch(() => {});
    }
  }, [user]);

  // Sous 768 px le menu est un tiroir : fermé par défaut et refermé à chaque navigation.
  const estMobile = screens.md === false;
  useEffect(() => {
    if (estMobile) setCollapsed(true);
  }, [estMobile, pathname]);

  if (!user) return null;

  const role = user.role as UserRole;
  const initiales = `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase();
  const estLarge = screens.md !== false; // ≥ 768 px (true pendant l'hydratation)
  const afficheZones = (role === UserRole.MANAGER || role === UserRole.ADMIN) && zones.length > 0;
  const zoneActive = zones.find((z) => z.id === zoneFiltreId);

  const zoneSelect = (
    <Select
      key="zone-select"
      aria-label="Filtrer par zone"
      placeholder="Toutes les zones"
      allowClear
      suffixIcon={<EnvironmentOutlined />}
      style={{ width: estLarge ? 190 : '100%' }}
      value={zoneFiltreId}
      onChange={setZoneFiltreId}
      options={zones.map((z) => ({ value: z.id, label: z.nom }))}
      popupMatchSelectWidth={false}
    />
  );

  const zoneControl = !afficheZones ? null : estLarge ? (
    zoneSelect
  ) : (
    <Popover
      key="zone-popover"
      trigger="click"
      placement="bottomRight"
      title="Zone affichée"
      content={<div style={{ width: 240 }}>{zoneSelect}</div>}
    >
      <Button
        type="text"
        shape="circle"
        aria-label={zoneActive ? `Zone : ${zoneActive.nom}` : 'Filtrer par zone'}
        icon={
          <Badge dot={Boolean(zoneActive)} color="#0F6E52" offset={[-1, 2]}>
            <EnvironmentOutlined style={{ fontSize: 18, color: '#4E6A63' }} />
          </Badge>
        }
        style={{ width: 40, height: 40 }}
      />
    </Popover>
  );

  const menuUtilisateur = {
    items: [
      {
        key: 'info',
        disabled: true,
        style: { cursor: 'default' },
        label: (
          <div className="oh-usermenu">
            <div className="oh-usermenu__name">
              {user.prenom} {user.nom}
            </div>
            <div className="oh-usermenu__mail">{user.email}</div>
            <span className="oh-role" style={{ ['--oh-role' as string]: ROLE_COLOR[role] }}>
              {USER_ROLE_LABELS[role]}
            </span>
          </div>
        ),
      },
      { type: 'divider' as const },
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
  };

  return (
    <div className="oh-shell" style={{ minHeight: '100vh' }}>
      <ProLayout
        title="Saphir OH"
        logo={
          <Image
            src="/images/logo-orchidee-holding.png"
            alt="Orchidée Holding"
            width={32}
            height={32}
            priority
            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
        }
        /*
         * layout="mix" : header pleine largeur (logo + actions), menu dans le sider.
         * Sous 768 px, ProLayout bascule le sider en tiroir ouvert par le bouton menu.
         */
        layout="mix"
        fixSiderbar
        fixedHeader
        siderWidth={248}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        route={getMenuRoutes(role)}
        location={{ pathname }}
        splitMenus={false}
        menu={{ autoClose: false }}
        menuItemRender={(item, dom) => <Link href={item.path ?? '/'}>{dom}</Link>}
        subMenuItemRender={(item, dom) => <Link href={item.path ?? '/'}>{dom}</Link>}
        actionsRender={() => [
          zoneControl,
          <HeaderNotifications key="notifs" user={user} />,
        ]}
        avatarProps={{
          size: 'small',
          title: `${user.prenom} ${user.nom}`,
          render: () => (
            <Dropdown placement="bottomRight" trigger={['click']} menu={menuUtilisateur}>
              <button type="button" className="oh-userchip" aria-label="Menu du compte">
                <Avatar
                  size={32}
                  style={{
                    background: ROLE_COLOR[role],
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initiales}
                </Avatar>
                {estLarge && (
                  <span className="oh-userchip__text">
                    <span className="oh-userchip__name">
                      {user.prenom} {user.nom}
                    </span>
                    <span className="oh-userchip__role">{USER_ROLE_LABELS[role]}</span>
                  </span>
                )}
                {estLarge && <DownOutlined className="oh-userchip__caret" />}
              </button>
            </Dropdown>
          ),
        }}
        token={{
          colorPrimary: '#0F6E52',
          bgLayout: '#F5F7F6',
          header: {
            colorBgHeader: '#FFFFFF',
            colorHeaderTitle: '#123832',
            colorTextRightActionsItem: '#4E6A63',
            colorBgRightActionsItemHover: '#F1F5F3',
            heightLayoutHeader: 60,
          },
          sider: {
            colorMenuBackground: '#FFFFFF',
            colorMenuItemDivider: '#E3EAE7',
            colorTextMenu: '#4E6A63',
            colorTextMenuSecondary: '#627A74',
            colorTextMenuSelected: '#0F6E52',
            colorTextMenuItemHover: '#123832',
            colorTextMenuActive: '#123832',
            colorBgMenuItemHover: '#F1F5F3',
            colorBgMenuItemSelected: '#E8F2EE',
            colorBgMenuItemCollapsedElevated: '#FFFFFF',
            colorTextSubMenuSelected: '#0F6E52',
            colorBgCollapsedButton: '#FFFFFF',
            colorTextCollapsedButton: '#4E6A63',
            colorTextCollapsedButtonHover: '#0F6E52',
            paddingInlineLayoutMenu: 4,
            paddingBlockLayoutMenu: 8,
          },
          pageContainer: {
            paddingInlinePageContainerContent: 24,
            paddingBlockPageContainerContent: 20,
            colorBgPageContainer: 'transparent',
          },
        }}
        headerTitleRender={(logo) => (
          <Link href="/" className="oh-brand" aria-label="Saphir OH — accueil">
            {logo}
            <span className="oh-brand__text">
              <span className="oh-brand__name">Saphir OH</span>
              {estLarge && <span className="oh-brand__org">Orchidée Holding</span>}
            </span>
          </Link>
        )}
        breadcrumbRender={(routers = []) => (routers.length > 1 ? routers : [])}
      >
        {children}
      </ProLayout>
    </div>
  );
}
