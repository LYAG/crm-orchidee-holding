import type { UserRole } from '@/lib/constants';

export type { UserRole };

export * from './professionnels';
export * from './validations';

// ─── Zone ────────────────────────────────────────────────────────────────────

export interface Zone {
  id: string;
  nom: string;
  region: string;
}

// ─── Utilisateur / Auth ───────────────────────────────────────────────────────

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  /** DELEGUE uniquement */
  zoneIds?: string[];
  managerId?: string;
  /** MANAGER uniquement */
  delegueIds?: string[];
}

// ─── Support commercial ───────────────────────────────────────────────────────

export enum SupportType {
  PPT = 'PPT',
  PDF = 'PDF',
}

export interface SupportCommercial {
  id: string;
  titre: string;
  type: SupportType;
  nombreSlides: number;
  dateVersion: string;
  apercu?: string;
  actif: boolean;
}

export interface SlideMetrique {
  slideIndex: number;
  titreSlide: string;
  tempsPasse: number; // secondes
}

export interface MetriquePresentation {
  id: string;
  supportId: string;
  rdvId?: string;
  datePresentation: string;
  dureeTotal: number; // secondes
  slides: SlideMetrique[];
  conforme: boolean;
  dureeMinimaleAttendue: number; // secondes
}

// ─── Paramètres globaux ───────────────────────────────────────────────────────

export interface ParametresApp {
  tempsMoyenParSlide: number; // secondes
}

// ─── Rôles & permissions ──────────────────────────────────────────────────────

export interface RoleDefinition {
  key: UserRole;
  label: string;
  color: string;
  bg: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
}

export type PermissionAccess = 'full' | 'partial' | 'none';

export interface PermissionModule {
  id: string;
  module: string;
  icon: string;
  access: Record<UserRole, PermissionAccess>;
  labels: Partial<Record<UserRole, string>>;
}

// ─── Rendez-vous ─────────────────────────────────────────────────────────────

export enum RdvStatut {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  REALISE = 'REALISE',
  ANNULE = 'ANNULE',
}

export interface RendezVous {
  id: string;
  professionnelId: string;
  delegueId: string;
  supportId: string;
  dateHeure: string;
  dureeMinutes: number;
  statut: RdvStatut;
  motifAnnulation?: string;
  qualifie: boolean;
  metriqueId?: string;
  notes?: string;
  dateCreation: string;
}

// ─── Qualification RDV ────────────────────────────────────────────────────────

export enum QualificationProductif {
  PRODUCTIF = 'PRODUCTIF',
  NON_PRODUCTIF = 'NON_PRODUCTIF',
}

export enum MotifNonProductif {
  CLIENT_ABSENT = 'CLIENT_ABSENT',
  REPORTE = 'REPORTE',
  PAS_INTERESSE = 'PAS_INTERESSE',
  AUTRE = 'AUTRE',
}

export enum QualificationOpportunite {
  OPPORTUNITE_IDENTIFIEE = 'OPPORTUNITE_IDENTIFIEE',
  DEVIS_DEMANDE = 'DEVIS_DEMANDE',
  AUCUNE = 'AUCUNE',
}

export enum QualificationTransformation {
  TRANSFORME_CLIENT = 'TRANSFORME_CLIENT',
  RELANCE_NECESSAIRE = 'RELANCE_NECESSAIRE',
}

export enum CanalRelance {
  TELEPHONE = 'TELEPHONE',
  EMAIL = 'EMAIL',
  VISITE = 'VISITE',
}

export interface QualificationRDV {
  id: string;
  rdvId: string;
  productif: QualificationProductif;
  motifNonProductif?: MotifNonProductif;
  motifNonProductifAutre?: string;
  opportunite: QualificationOpportunite;
  montantEstimeDevis?: number;
  descriptionDevis?: string;
  transformation: QualificationTransformation;
  dateRelance?: string;
  canalRelance?: CanalRelance;
  dateQualification: string;
  qualifiePar: string;
  modifiePar?: string;
  dateModification?: string;
  logModification?: string;
}

// ─── Opportunité & Devis ──────────────────────────────────────────────────────

export enum OpportuniteEtape {
  IDENTIFIEE = 'IDENTIFIEE',
  DEVIS_ENVOYE = 'DEVIS_ENVOYE',
  NEGOCIATION = 'NEGOCIATION',
  GAGNEE = 'GAGNEE',
  PERDUE = 'PERDUE',
}

export enum DevisStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
}

export interface Devis {
  id: string;
  opportuniteId: string;
  montant: number;
  dateEnvoi: string;
  statut: DevisStatut;
  description?: string;
}

export interface NoteOpportunite {
  id: string;
  contenu: string;
  auteurId: string;
  date: string;
}

export interface Opportunite {
  id: string;
  professionnelId: string;
  delegueId: string;
  titre: string;
  montantEstime: number;
  probabilite: number; // 0–100
  etape: OpportuniteEtape;
  rdvIds: string[];
  devis: Devis[];
  notes: NoteOpportunite[];
  dateDerniereMaj: string;
  dateCreation: string;
  motifPerte?: string;
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export interface KpiDelegue {
  delegueId: string;
  rdvSemaine: number;
  tauxTransformation: number; // 0–1
  montantPipelineEnCours: number;
  relancesAVenir: number;
  activiteParSemaine: { semaine: string; nbRdv: number }[];
}

export interface KpiManager {
  managerId: string;
  delegues: {
    delegueId: string;
    nom: string;
    nbRdv: number;
    tauxTransformation: number;
    montantPipeline: number;
  }[];
  pipelineGlobal: number;
  tauxTransformationGlobal: number;
}

export interface KpiAdmin {
  doublonsEnAttente: number;
  professionnelsNonAttribuesSup30j: number;
  pipelineTotal: number;
  tauxTransformationGlobal: number;
}

// ─── Filtres génériques ───────────────────────────────────────────────────────

export interface FiltresRdv {
  delegueId?: string;
  professionnelId?: string;
  statut?: RdvStatut;
  dateDebut?: string;
  dateFin?: string;
}

export interface FiltresOpportunite {
  etape?: OpportuniteEtape;
  delegueId?: string;
  zoneId?: string;
}

export interface PeriodeRapport {
  debut: string;
  fin: string;
}
