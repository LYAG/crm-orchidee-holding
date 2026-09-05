import {
  AimOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeleteOutlined,
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
    roles: ['ADMIN', 'MANAGER', 'DELEGUE'],
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
    roles: ['ADMIN', 'MANAGER'],
    routes: [
      {
        path: '/parametres/presentation',
        name: 'Présentation commerciale',
        icon: <PlayCircleOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/objectifs',
        name: 'Objectifs de conversion',
        icon: <AimOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/objectifs-rdv',
        name: 'Objectifs de RDV',
        icon: <CalendarOutlined />,
        roles: ['MANAGER'],
      },
      {
        path: '/parametres/roles',
        name: 'Rôles & permissions',
        icon: <SafetyCertificateOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/purge',
        name: 'Purge base de données',
        icon: <DeleteOutlined />,
        roles: ['ADMIN'],
      },
    ],
  },
];

/** Filtre récursif : un item sans `roles` est visible par tous, un sous-item hérite de sa propre
 * restriction indépendamment de son parent (ex. un manager voit "Paramètres" mais seulement
 * "Objectifs de RDV" à l'intérieur, pas les pages réservées à l'admin). */
function filtrerParRole(routes: MenuRoute[], role: UserRole): MenuRoute[] {
  return routes
    .filter((r) => !r.roles || r.roles.includes(role))
    .map((r) => (r.routes ? { ...r, routes: filtrerParRole(r.routes, role) } : r));
}

export function getMenuRoutes(role: UserRole) {
  return {
    path: '/',
    routes: filtrerParRole(allRoutes, role),
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
  '/parametres/objectifs': 'Objectifs de conversion',
  '/parametres/objectifs-rdv': 'Objectifs de RDV',
  '/parametres/roles': 'Rôles & permissions',
  '/parametres/purge': 'Purge base de données',
};
