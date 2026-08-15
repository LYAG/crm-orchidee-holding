import type { PurgeResult, PurgeService, PurgeableTable } from '@/services/api/PurgeService';
import {
  centres,
  gestesMarketing,
  gestesRealises,
  historiqueChangementsStatut,
  joursTournee,
  professionnels,
  specialites,
} from './professionnelsData';
import { metriques, opportunites, permissionModules, qualifications, rendezvous, roleDefinitions, supports, utilisateurs, zones } from './data';

/**
 * Chaque *ServiceMock détient son propre état interne cloné (voir ProfessionnelServiceMock,
 * RdvServiceMock, etc.) — seuls les tableaux exportés directement par data.ts / professionnelsData.ts
 * sont purgeables ici en mode mock ; ce n'est qu'une démo locale, la source de vérité est le backend réel.
 */
const TABLES: Record<string, unknown[]> = {
  zone: zones,
  utilisateur: utilisateurs,
  centre: centres,
  specialite: specialites,
  geste_marketing: gestesMarketing,
  geste_realise: gestesRealises,
  jour_tournee: joursTournee,
  professionnel_sante: professionnels,
  historique_changement_statut: historiqueChangementsStatut,
  support_commercial: supports,
  role_definition: roleDefinitions,
  permission_module: permissionModules,
  rendez_vous: rendezvous,
  qualification_rdv: qualifications,
  metrique_presentation: metriques,
  opportunite: opportunites,
};

export class PurgeServiceMock implements PurgeService {
  async getTablesPurgeables(): Promise<PurgeableTable[]> {
    return Object.entries(TABLES)
      .map(([nom, arr]) => ({ nom, nombreLignes: arr.length }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  async purger(tables: string[], confirmation: string): Promise<PurgeResult> {
    if (confirmation !== 'PURGER') {
      throw new Error('La confirmation est incorrecte.');
    }
    const resultats = tables
      .filter((nom) => TABLES[nom])
      .map((nom) => {
        const arr = TABLES[nom];
        const lignesSupprimees = arr.length;
        arr.length = 0;
        return { table: nom, lignesSupprimees };
      });
    return { resultats };
  }
}
