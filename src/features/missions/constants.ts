import { ActionOrdreMission, StatutOrdreMission } from '@/types';

export const STATUT_MISSION_CONFIG: Record<StatutOrdreMission, { label: string; color: string }> = {
  [StatutOrdreMission.BROUILLON]: { label: 'Brouillon', color: 'default' },
  [StatutOrdreMission.SOUMIS]: { label: 'Soumis', color: 'processing' },
  [StatutOrdreMission.VALIDE]: { label: 'Validé', color: 'success' },
  [StatutOrdreMission.REJETE]: { label: 'Rejeté', color: 'error' },
  [StatutOrdreMission.MODIFICATION_DEMANDEE]: { label: 'Modification demandée', color: 'warning' },
  [StatutOrdreMission.EN_COURS]: { label: 'En cours', color: 'cyan' },
  [StatutOrdreMission.CLOTURE]: { label: 'Clôturé', color: 'purple' },
};

export const ACTION_MISSION_LABELS: Record<ActionOrdreMission, string> = {
  [ActionOrdreMission.CREATION]: 'Création',
  [ActionOrdreMission.MODIFICATION]: 'Modification',
  [ActionOrdreMission.SOUMISSION]: 'Soumission',
  [ActionOrdreMission.VALIDATION]: 'Validation',
  [ActionOrdreMission.REJET]: 'Rejet',
  [ActionOrdreMission.DEMANDE_MODIFICATION]: 'Demande de modification',
  [ActionOrdreMission.DEMARRAGE]: 'Démarrage',
  [ActionOrdreMission.CLOTURE]: 'Clôture',
};

/** Ordre d'affichage (cycle de vie) — Object.values n'est pas garanti lisible. */
export const STATUTS_MISSION_ORDONNES: StatutOrdreMission[] = [
  StatutOrdreMission.BROUILLON,
  StatutOrdreMission.SOUMIS,
  StatutOrdreMission.MODIFICATION_DEMANDEE,
  StatutOrdreMission.VALIDE,
  StatutOrdreMission.REJETE,
  StatutOrdreMission.EN_COURS,
  StatutOrdreMission.CLOTURE,
];

/** "36 h" sous 48 h, "2,5 j" au-delà ; "—" si aucune décision rendue. */
export function formatDelai(heures: number | null): string {
  if (heures === null) return '—';
  if (heures < 48) return `${Math.round(heures)} h`;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(heures / 24)} j`;
}
