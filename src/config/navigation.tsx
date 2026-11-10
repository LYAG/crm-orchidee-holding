import {
  AimOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  CarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  GiftOutlined,
  LineChartOutlined,
  MailOutlined,
  MedicineBoxOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/lib/constants';
import { aLaPermission } from '@/hooks/usePermission';
import type { PermissionModule } from '@/types';
import { estActive, type Fonctionnalite } from '@/config/fonctionnalites';

export interface MenuRoute {
  path: string;
  name: string;
  icon?: React.ReactNode;
  routes?: MenuRoute[];
  /** Rôles autorisés. Absent = tous les rôles authentifiés. */
  roles?: UserRole[];
  /** Code de la matrice Rôles & permissions : s'il est présent, il remplace `roles` (accès configurable). */
  permission?: string;
  /** Module activable (voir src/config/fonctionnalites.ts) : masqué tant qu'il est désactivé. */
  fonctionnalite?: Fonctionnalite;
  hideInMenu?: boolean;
  /** ProLayout : affiche l'entrée sans dérouler ses sous-pages dans le menu. */
  hideChildrenInMenu?: boolean;
  /** Sous-titre de la tuile sur une page d'accueil de section (ex. Paramètres). */
  description?: string;
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
    fonctionnalite: 'opportunites',
  },
  {
    path: '/supports',
    name: 'Supports commerciaux',
    icon: <FileTextOutlined />,
  },
  {
    path: '/formation',
    name: 'Formation',
    icon: <ReadOutlined />,
    // Visible dès qu'au moins une sous-page l'est (matrice Rôles & permissions, codes FORMATION_*).
    routes: [
      {
        path: '/formation/mon-espace',
        name: 'Mon espace',
        icon: <BookOutlined />,
        permission: 'FORMATION_ESPACE',
      },
      {
        path: '/formation/tableau-de-bord',
        name: 'Tableau de bord',
        icon: <DashboardOutlined />,
        permission: 'FORMATION_SUIVI',
      },
      {
        path: '/formation/catalogue',
        name: 'Formations et exercices',
        icon: <ReadOutlined />,
        permission: 'FORMATION_CONCEPTION',
      },
      {
        path: '/formation/affectations',
        name: 'Affectations',
        icon: <UsergroupAddOutlined />,
        permission: 'FORMATION_AFFECTATION',
      },
      {
        path: '/formation/suivi',
        name: 'Suivi des délégués',
        icon: <TeamOutlined />,
        permission: 'FORMATION_SUIVI',
      },
      {
        path: '/formation/corrections',
        name: 'Corrections',
        icon: <EditOutlined />,
        permission: 'FORMATION_SUIVI',
      },
      {
        path: '/formation/statistiques',
        name: 'Statistiques',
        icon: <LineChartOutlined />,
        permission: 'FORMATION_SUIVI',
      },
      {
        path: '/formation/notifications',
        name: 'Notifications',
        icon: <BellOutlined />,
      },
      {
        path: '/formation/parametres',
        name: 'Paramètres Formation',
        icon: <SettingOutlined />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    path: '/ordres-mission',
    name: 'Ordres de mission',
    icon: <FileProtectOutlined />,
    roles: ['MANAGER', 'ADMIN'],
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
      {
        path: '/referentiels/types-mission',
        name: 'Types de mission',
        icon: <FileProtectOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/referentiels/moyens-transport',
        name: 'Moyens de transport',
        icon: <CarOutlined />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    path: '/parametres',
    name: 'Paramètres',
    icon: <SettingOutlined />,
    // Pas de restriction propre : visible dès qu'au moins une sous-page l'est (voir filtrerParRole).
    // Les sous-pages ne sont pas listées dans le menu : /parametres les présente en tuiles.
    hideChildrenInMenu: true,
    routes: [
      {
        path: '/parametres/presentation',
        name: 'Présentation commerciale',
        description: 'Durée minimale attendue par slide',
        icon: <PlayCircleOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/objectifs',
        name: 'Objectifs de conversion',
        description: 'Cibles mensuelles de conversion T1 → ST',
        icon: <AimOutlined />,
        permission: 'OBJECTIFS_CONVERSION',
      },
      {
        path: '/parametres/objectifs-rdv',
        name: 'Objectifs de RDV',
        description: 'Nombre de visites attendues par délégué',
        icon: <CalendarOutlined />,
        permission: 'OBJECTIFS_RDV',
      },
      {
        path: '/parametres/criteres-notation',
        name: 'Critères de notation',
        description: 'Critères et pondérations de la note mensuelle',
        icon: <StarOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/mail',
        name: 'Mail',
        description: 'Compte e-mail SMTP/IMAP, tests, journal',
        icon: <MailOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/roles',
        name: 'Rôles & permissions',
        description: 'Accès de chaque rôle aux modules',
        icon: <SafetyCertificateOutlined />,
        roles: ['ADMIN'],
      },
      {
        path: '/parametres/purge',
        name: 'Purge base de données',
        description: 'Suppression définitive de données',
        icon: <DeleteOutlined />,
        roles: ['ADMIN'],
      },
    ],
  },
];

/** Filtre récursif : un item sans `roles` ni `permission` est visible par tous, un sous-item hérite
 * de sa propre restriction indépendamment de son parent (ex. un manager voit "Paramètres" mais
 * seulement "Objectifs de RDV" à l'intérieur, pas les pages réservées à l'admin). Un item à
 * `permission` suit la matrice configurable ; un parent n'est affiché que s'il lui reste un enfant. */
function filtrerParRole(routes: MenuRoute[], role: UserRole, modules: PermissionModule[]): MenuRoute[] {
  return routes
    .filter((r) => !r.fonctionnalite || estActive(r.fonctionnalite))
    .filter((r) => (r.permission ? aLaPermission(modules, r.permission, role) : !r.roles || r.roles.includes(role)))
    .map((r) => (r.routes ? { ...r, routes: filtrerParRole(r.routes, role, modules) } : r))
    .filter((r) => !r.routes || r.routes.length > 0);
}


/** `modules` : matrice Rôles & permissions (vide tant qu'elle n'est pas chargée → fail-closed). */
export function getMenuRoutes(role: UserRole, modules: PermissionModule[] = []) {
  return {
    path: '/',
    routes: filtrerParRole(allRoutes, role, modules),
  };
}

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/professionnels': 'Professionnels de santé',
  '/rdv': 'Rendez-vous',
  '/opportunites': 'Opportunités',
  '/supports': 'Supports commerciaux',
  '/ordres-mission': 'Ordres de mission',
  '/reporting': 'Reporting équipe',
  '/validations': 'File de validation',
  '/professionnels/import': 'Import professionnels de santé',
  '/utilisateurs': 'Utilisateurs & Zones',
  '/referentiels': 'Référentiels',
  '/referentiels/centres': 'Centres de santé',
  '/referentiels/specialites': 'Spécialités',
  '/referentiels/gestes': 'Gestes marketing',
  '/referentiels/types-mission': 'Types de mission',
  '/referentiels/moyens-transport': 'Moyens de transport',
  '/parametres': 'Paramètres',
  '/parametres/presentation': 'Présentation commerciale',
  '/parametres/objectifs': 'Objectifs de conversion',
  '/parametres/objectifs-rdv': 'Objectifs de RDV',
  '/parametres/criteres-notation': 'Critères de notation',
  '/parametres/mail': 'Mail',
  '/messagerie': 'Messagerie',
  '/parametres/roles': 'Rôles & permissions',
  '/parametres/purge': 'Purge base de données',
  '/formation': 'Formation',
  '/formation/mon-espace': 'Mon espace Formation',
  '/formation/tableau-de-bord': 'Formation — tableau de bord',
  '/formation/catalogue': 'Formations et exercices',
  '/formation/affectations': 'Affectations',
  '/formation/suivi': 'Suivi des délégués',
  '/formation/corrections': 'Corrections',
  '/formation/statistiques': 'Statistiques de formation',
  '/formation/notifications': 'Notifications Formation',
  '/formation/parametres': 'Paramètres Formation',
};
