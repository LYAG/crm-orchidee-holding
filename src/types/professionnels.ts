// ─── Centre de santé (référentiel dynamique) ──────────────────────────────────

export enum TypeCentre {
  HOPITAL = 'HOPITAL',
  CSU = 'CSU',
  FSU = 'FSU',
  INFIRMERIE = 'INFIRMERIE',
  CM = 'CM',
  CHR = 'CHR',
  AUTRE = 'AUTRE',
}

export interface Centre {
  id: string;
  nom: string;
  zoneId: string;
  type?: TypeCentre;
  adresse?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Spécialité (référentiel dynamique) ───────────────────────────────────────

export interface Specialite {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

// ─── Professionnel de santé ────────────────────────────────────────────────────

export enum TitreProfessionnel {
  DR = 'DR',
  SF = 'SF',
  MME = 'MME',
  M = 'M',
  MAJOR = 'MAJOR',
}

export enum JourSemaine {
  LUN = 'LUN',
  MAR = 'MAR',
  MER = 'MER',
  JEU = 'JEU',
  VEN = 'VEN',
  SAM = 'SAM',
  DIM = 'DIM',
}

export enum ModeJoursConsultation {
  JOURS_EXPLICITES = 'JOURS_EXPLICITES',
  FREQUENCE = 'FREQUENCE',
}

export interface JoursConsultation {
  mode: ModeJoursConsultation;
  /** si mode === JOURS_EXPLICITES */
  jours?: JourSemaine[];
  /** si mode === FREQUENCE (ex: 2 fois/semaine) */
  frequenceParSemaine?: number;
  commentaire?: string;
}

export enum UniteCas {
  JOUR = 'JOUR',
  SEMAINE = 'SEMAINE',
  MOIS = 'MOIS',
}

export enum TypeCas {
  CAS = 'CAS',
  ACCOUCHEMENT = 'ACCOUCHEMENT',
  CONSULTATION = 'CONSULTATION',
}

export interface PotentielCas {
  min: number;
  /** ex: "2 à 3 cas/jour" → min:2, max:3 */
  max?: number;
  unite: UniteCas;
  typeCas: TypeCas;
  /** pour "MIN 4 cas/jour" */
  estMinimum?: boolean;
}

export interface ProfessionnelSante {
  id: string;
  nom: string;
  prenom?: string;
  titre?: TitreProfessionnel;
  centreId: string;
  /** un professionnel peut avoir plusieurs spécialités (ex: CPN + SA) */
  specialiteIds: string[];
  /** plusieurs numéros possibles */
  telephones: string[];
  joursConsultation: JoursConsultation;
  potentielCas?: PotentielCas;
  /** le délégué qui le suit */
  delegueId: string;
  observations?: string;
  actif: boolean;
  /** verrouille modification/suppression par le délégué, même règle que aEuRdv sur Prospect */
  aDejaEuContact: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Geste marketing (référentiel dynamique) ──────────────────────────────────

export enum CategorieGeste {
  REPAS = 'REPAS',
  CADEAU = 'CADEAU',
  FINANCIER = 'FINANCIER',
  ECHANTILLON = 'ECHANTILLON',
  AUTRE = 'AUTRE',
}

export interface GesteMarketing {
  id: string;
  libelle: string;
  categorie?: CategorieGeste;
  coutIndicatifFcfa?: number;
  actif: boolean;
}

export interface GesteRealise {
  id: string;
  professionnelId: string;
  delegueId: string;
  gesteMarketingId: string;
  date: string;
  coutFcfa?: number;
  commentaire?: string;
  rdvId?: string;
}

// ─── Planning de tournée du délégué ────────────────────────────────────────────

export type JourTourneeKey = Exclude<JourSemaine, JourSemaine.DIM>;

export interface JourTournee {
  id: string;
  delegueId: string;
  jour: JourTourneeKey;
  centreIds: string[];
}

// ─── Filtres ────────────────────────────────────────────────────────────────

export interface FiltresProfessionnel {
  centreId?: string;
  specialiteId?: string;
  jourConsultation?: JourSemaine;
  delegueId?: string;
  zoneId?: string;
  recherche?: string;
}
