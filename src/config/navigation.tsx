import {
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GiftOutlined,
  MedicineBoxOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
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
    path: '/professionnels',
    name: 'Professionnels de santé',
    icon: <MedicineBoxOutlined />,
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
    path: '/validations',
    name: 'File de validation',
    icon: <SafetyCertificateOutlined />,
    roles: ['ADMIN', 'DELEGUE'],
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
  '/professionnels': 'Professionnels de santé',
  '/rdv': 'Rendez-vous',
  '/opportunites': 'Opportunités',
  '/supports': 'Supports commerciaux',
  '/reporting': 'Reporting équipe',
  '/validations': 'File de validation',
  '/professionnels/import': 'Import professionnels de santé',
  '/utilisateurs': 'Utilisateurs & Zones',
  '/referentiels': 'Référentiels',
  '/referentiels/centres': 'Centres de santé',
  '/referentiels/specialites': 'Spécialités',
  '/referentiels/gestes': 'Gestes marketing',
  '/parametres': 'Paramètres',
  '/parametres/presentation': 'Présentation commerciale',
  '/parametres/roles': 'Rôles & permissions',
};
