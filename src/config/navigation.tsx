import {
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GiftOutlined,
  MergeCellsOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/lib/constants';

export interface MenuRoute {
  path: string;
  name: string;
  icon?: React.ReactNode;
  routes?: MenuRoute[];
  /** Rôles autorisés. Absent = tous les rôles authentifiés. */
  roles?: UserRole[];
  hideInMenu?: boolean;
}

const allRoutes: MenuRoute[] = [
  {
    path: '/',
    name: 'Tableau de bord',
    icon: <DashboardOutlined />,
  },
  {
    path: '/prospects',
    name: 'Prospects',
    icon: <TeamOutlined />,
  },
  {
    path: '/rdv',
    name: 'Rendez-vous',
    icon: <CalendarOutlined />,
  },
  {
    path: '/opportunites',
    name: 'Opportunités',
    icon: <TrophyOutlined />,
  },
  {
    path: '/supports',
    name: 'Supports commerciaux',
    icon: <FileTextOutlined />,
  },
  {
    path: '/reporting',
    name: 'Reporting équipe',
    icon: <BarChartOutlined />,
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    path: '/doublons',
    name: 'Gestion des doublons',
    icon: <MergeCellsOutlined />,
    roles: ['ADMIN'],
  },
  {
    path: '/utilisateurs',
    name: 'Utilisateurs & Zones',
    icon: <UsergroupAddOutlined />,
    roles: ['ADMIN'],
  },
  {
    path: '/referentiels',
    name: 'Référentiels',
    icon: <DatabaseOutlined />,
    roles: ['ADMIN', 'MANAGER'],
    routes: [
      {
        path: '/referentiels/centres',
        name: 'Centres de santé',
        icon: <EnvironmentOutlined />,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        path: '/referentiels/specialites',
        name: 'Spécialités',
        icon: <SafetyCertificateOutlined />,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        path: '/referentiels/gestes',
        name: 'Gestes marketing',
        icon: <GiftOutlined />,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    path: '/parametres',
    name: 'Paramètres',
    icon: <SettingOutlined />,
    roles: ['ADMIN'],
    routes: [
      {
        path: '/parametres/presentation',
        name: 'Présentation commerciale',
        icon: <PlayCircleOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/roles',
        name: 'Rôles & permissions',
        icon: <SafetyCertificateOutlined />,
        roles: ['ADMIN'],
      },
    ],
  },
];

export function getMenuRoutes(role: UserRole) {
  const filtered = allRoutes.filter(
    (r) => !r.roles || r.roles.includes(role),
  );
  return {
    path: '/',
    routes: filtered,
  };
}

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/prospects': 'Prospects',
  '/rdv': 'Rendez-vous',
  '/opportunites': 'Opportunités',
  '/supports': 'Supports commerciaux',
  '/reporting': 'Reporting équipe',
  '/doublons': 'Gestion des doublons',
  '/utilisateurs': 'Utilisateurs & Zones',
  '/referentiels': 'Référentiels',
  '/referentiels/centres': 'Centres de santé',
  '/referentiels/specialites': 'Spécialités',
  '/referentiels/gestes': 'Gestes marketing',
  '/parametres': 'Paramètres',
  '/parametres/presentation': 'Présentation commerciale',
  '/parametres/roles': 'Rôles & permissions',
};
