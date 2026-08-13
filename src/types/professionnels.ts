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
// Entité unique : ce qui était historiquement appelé "Prospect" est en réalité
// un professionnel de santé (médecin, sage-femme, infirmier, pharmacie…) suivi
// par un délégué, rattaché à un centre lui-même rattaché à une zone.

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

export enum StatutProfessionnel {
  PNA = 'PNA',
  ST = 'ST',
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
  PERDU = 'PERDU',
}

export enum CategorieEtablissement {
  MEDECIN = 'MEDECIN',
  INFIRMIER = 'INFIRMIER',
  PHARMACIE = 'PHARMACIE',
}

export type ClassificationProfessionnel =
  | StatutProfessionnel.ST
  | StatutProfessionnel.T1
  | StatutProfessionnel.T2
  | StatutProfessionnel.T3;

/** ST = potentiel + prescrit, T1 = potentiel sans prescription, T2 = prescrit sans potentiel, T3 = ni l'un ni l'autre. */
export function calculerClassification(potentiel: boolean, prescrit: boolean): ClassificationProfessionnel {
  if (potentiel && prescrit) return StatutProfessionnel.ST;
  if (potentiel && !prescrit) return StatutProfessionnel.T1;
  if (!potentiel && prescrit) return StatutProfessionnel.T2;
  return StatutProfessionnel.T3;
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
  email?: string;
  adresse?: string;
  categorie?: CategorieEtablissement;
  joursConsultation: JoursConsultation;
  potentielCas?: PotentielCas;
  statut: StatutProfessionnel;
  classificationDemandee?: ClassificationProfessionnel;
  classificationDemandeeLe?: string;
  /** le délégué qui le suit ; absent tant que non affecté (statut PNA) */
  delegueId?: string;
  dateCreation: string;
  dernierContact?: string;
  motifPerdu?: string;
  observations?: string;
  actif: boolean;
  /** verrouille modification/suppression par le délégué dès qu'un RDV a eu lieu */
  aDejaEuContact: boolean;
}

// ─── Historique des changements de classification ─────────────────────────────

export interface HistoriqueChangementStatut {
  id: string;
  professionnelId: string;
  delegueId?: string;
  statutAvant: StatutProfessionnel;
  statutApres: StatutProfessionnel;
  date: string;
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
  statut?: StatutProfessionnel;
  recherche?: string;
}
