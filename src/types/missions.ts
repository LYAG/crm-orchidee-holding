// ─── Ordres de mission ────────────────────────────────────────────────────────
// Créés côté mobile par les délégués ; le web ne fait que la consultation et la
// validation (MANAGER de l'équipe, ADMIN pour tout le périmètre).

export enum StatutOrdreMission {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  MODIFICATION_DEMANDEE = 'MODIFICATION_DEMANDEE',
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
}

export enum ActionOrdreMission {
  CREATION = 'CREATION',
  MODIFICATION = 'MODIFICATION',
  SOUMISSION = 'SOUMISSION',
  VALIDATION = 'VALIDATION',
  REJET = 'REJET',
  DEMANDE_MODIFICATION = 'DEMANDE_MODIFICATION',
  DEMARRAGE = 'DEMARRAGE',
  CLOTURE = 'CLOTURE',
}

/**
 * Référentiel dynamique géré par l'ADMIN (types de mission, moyens de transport) —
 * jamais de liste en dur côté front : un libellé désactivé reste affiché sur les
 * missions existantes mais n'est plus proposé à la création (mobile).
 */
export interface ReferentielMission {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

export type TypeMission = ReferentielMission;
export type MoyenTransport = ReferentielMission;

/** Montants en FCFA (entiers). */
export interface BudgetMission {
  avanceFonds: number;
  transport: number;
  hebergement: number;
  restauration: number;
}

export interface PieceJointeMission {
  id: string;
  nomFichier: string;
  typeMime: string;
  /** Octets. */
  taille: number;
  dateAjout: string;
}

export interface OrdreMission {
  id: string;
  /** Référence lisible (ex. OM-2026-0042), générée côté serveur. */
  reference: string;
  delegueId: string;
  nomDelegue: string;
  managerId: string;
  nomManager: string;
  objet: string;
  typeMissionId: string;
  typeMissionLibelle: string;
  zoneIds: string[];
  centreIds: string[];
  /** YYYY-MM-DD */
  dateDebut: string;
  /** YYYY-MM-DD */
  dateFin: string;
  moyenTransportId: string;
  moyenTransportLibelle: string;
  budget: BudgetMission;
  /** Somme des postes de `budget`, calculée côté serveur. */
  budgetTotal: number;
  piecesJointes: PieceJointeMission[];
  statut: StatutOrdreMission;
  motifRejet?: string;
  commentaireManager?: string;
  /** Date+heure ISO */
  dateCreation: string;
  /** Date+heure ISO de la dernière soumission (point de départ du délai de validation). */
  dateSoumission?: string;
  /** Date+heure ISO de la décision du manager (validation / rejet / demande de modification). */
  dateDecision?: string;
}

/** Une entrée du journal de traçabilité (cahier des charges §11). */
export interface HistoriqueOrdreMission {
  id: string;
  action: ActionOrdreMission;
  statutAvant?: StatutOrdreMission;
  statutApres: StatutOrdreMission;
  auteurId: string;
  auteurNom: string;
  auteurRole: string;
  /** Date+heure ISO */
  date: string;
  commentaire?: string;
}

export interface FiltresOrdreMission {
  delegueId?: string;
  zoneId?: string;
  statut?: StatutOrdreMission;
  /** YYYY-MM-DD — missions dont la période chevauche [dateDebut, dateFin]. */
  dateDebut?: string;
  dateFin?: string;
}

export interface KpiOrdresMission {
  /** Toujours les 7 statuts, à 0 si aucune mission. */
  parStatut: Record<StatutOrdreMission, number>;
  total: number;
  /** Somme des budgets des missions VALIDE, EN_COURS et CLOTURE. */
  budgetPrevisionnelCumule: number;
  /** Moyenne (dateDecision − dateSoumission) en heures ; null tant qu'aucune décision n'a été rendue. */
  delaiMoyenValidationHeures: number | null;
}
