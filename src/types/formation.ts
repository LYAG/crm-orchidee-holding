// ─── Module Formation (miroir des DTO de api_crm, package formation) ─────────

export type StatutPublication = 'BROUILLON' | 'PUBLIEE' | 'ARCHIVEE';
export type CategorieFormation =
  | 'PRODUITS_PHARMACEUTIQUES'
  | 'ANTISEPTIQUES'
  | 'TECHNIQUES_VENTE'
  | 'REGLEMENTATION'
  | 'PROCEDURES_INTERNES'
  | 'AUTRE';
export type NiveauFormation = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
/** Où le seuil de réussite est exigé ; ailleurs, l'évaluation doit seulement être passée. */
export type ExigenceSeuil = 'MODULES' | 'FINALE' | 'LES_DEUX';
export type TypeLecon = 'TEXTE' | 'PDF' | 'IMAGE' | 'VIDEO' | 'LIEN' | 'AUTRE';
export type TypeEvaluation = 'EXERCICE_REVISION' | 'QUIZ_ENTRAINEMENT' | 'EVALUATION_FINALE';
export type PublicationResultats = 'IMMEDIATE' | 'DIFFEREE';
export type AffichageCorrections = 'JAMAIS' | 'APRES_SOUMISSION' | 'APRES_REUSSITE' | 'APRES_DERNIERE_TENTATIVE';
export type TypeQuestion = 'QCM_UNIQUE' | 'QCM_MULTIPLE' | 'VRAI_FAUX' | 'REPONSE_COURTE' | 'MANUELLE';
export type CibleAffectation = 'DELEGUES' | 'EQUIPE' | 'REGION' | 'PERIMETRE';
export type PrioriteAffectation = 'BASSE' | 'NORMALE' | 'HAUTE';
export type StatutAffectation =
  | 'NON_COMMENCEE'
  | 'EN_COURS'
  | 'EN_ATTENTE_CORRECTION'
  | 'REUSSIE'
  | 'ECHOUEE'
  | 'ANNULEE';
export type StatutTentative = 'EN_COURS' | 'EN_ATTENTE_CORRECTION' | 'REUSSIE' | 'ECHOUEE';
export type StatutEtape =
  | 'VERROUILLE'
  | 'A_FAIRE'
  | 'EN_COURS'
  | 'EN_ATTENTE_CORRECTION'
  | 'TERMINEE'
  | 'REUSSIE'
  | 'VALIDE'
  | 'ECHOUEE';
export type ActionHistorique =
  | 'CREATION'
  | 'MODIFICATION'
  | 'CONTENU_MODIFIE'
  | 'PUBLICATION'
  | 'ARCHIVAGE'
  | 'DUPLICATION'
  | 'NOUVELLE_VERSION'
  | 'AFFECTATION'
  | 'REOUVERTURE'
  | 'ANNULATION_AFFECTATION'
  | 'CORRECTION'
  | 'PUBLICATION_RESULTAT';
export type TypeNotificationFormation =
  | 'NOUVELLE_FORMATION'
  | 'NOUVEL_EXERCICE'
  | 'ECHEANCE_PROCHE'
  | 'RETARD'
  | 'EVALUATION_TERMINEE'
  | 'RESULTAT_DISPONIBLE'
  | 'ECHEC'
  | 'NOUVELLE_TENTATIVE_AUTORISEE'
  | 'FORMATION_VALIDEE'
  | 'CORRECTION_TERMINEE'
  | 'RELANCE';
/** FORMATION : affectation d'une formation ; EVALUATION : d'un exercice indépendant. */
export type NatureAffectation = 'FORMATION' | 'EVALUATION';

export interface DroitsFormation {
  modifierContenu: boolean;
  modifierParametres: boolean;
  publier: boolean;
  archiver: boolean;
  dupliquer: boolean;
  supprimer: boolean;
  affecter: boolean;
}

export interface FormationResume {
  id: string;
  titre: string;
  description: string | null;
  categorie: CategorieFormation;
  niveau: NiveauFormation;
  dureeEstimeeMinutes: number | null;
  seuilReussite: number;
  tentativesMax: number | null;
  exigenceSeuil: ExigenceSeuil;
  echeance: string | null;
  statut: StatutPublication;
  version: number;
  formationRacineId: string;
  globale: boolean;
  createurId: string;
  createurNom: string;
  aCouverture: boolean;
  nbModules: number;
  nbLecons: number;
  nbEvaluations: number;
  nbAffectations: number;
  dateCreation: string;
  dateModification: string;
  datePublication: string | null;
  dateArchivage: string | null;
  droits: DroitsFormation;
}

export interface VersionContenu {
  id: string;
  version: number;
  statut: StatutPublication;
  dateCreation: string;
  datePublication: string | null;
}

export interface Lecon {
  id: string;
  moduleId: string;
  titre: string;
  type: TypeLecon;
  contenu: string | null;
  url: string | null;
  aFichier: boolean;
  fichierNom: string | null;
  fichierType: string | null;
  fichierTaille: number | null;
  dureeMinutes: number | null;
  ordre: number;
  obligatoire: boolean;
}

export interface EvaluationResume {
  id: string;
  formationId: string | null;
  moduleId: string | null;
  type: TypeEvaluation;
  titre: string;
  statut: StatutPublication;
  version: number;
  evaluationRacineId: string;
  nbQuestions: number;
  pointsTotal: number;
  seuilReussite: number | null;
  dureeMinutes: number | null;
  obligatoire: boolean;
  ordre: number;
  independante: boolean;
  globale: boolean;
  createurNom: string;
  nbAffectations: number;
  dateModification: string;
  droits: DroitsFormation;
}

export interface ModuleFormation {
  id: string;
  formationId: string;
  titre: string;
  description: string | null;
  ordre: number;
  obligatoire: boolean;
  lecons: Lecon[];
  evaluations: EvaluationResume[];
}

export interface FormationDetail {
  resume: FormationResume;
  objectifs: string | null;
  delaiEntreTentativesHeures: number;
  tentativeApresEchec: boolean;
  progressionSequentielle: boolean;
  modules: ModuleFormation[];
  /** Évaluations rattachées à la formation elle-même (finale, exercices facultatifs). */
  evaluations: EvaluationResume[];
  versions: VersionContenu[];
  /** Ce qui empêche encore la publication (vide = publiable). */
  controlesPublication: string[];
}

export interface Proposition {
  id: string;
  libelle: string;
  correcte: boolean;
  ordre: number;
}

export interface Question {
  id: string;
  evaluationId: string;
  type: TypeQuestion;
  enonce: string;
  points: number;
  explication: string | null;
  reponsesAcceptees: string[];
  ordre: number;
  obligatoire: boolean;
  propositions: Proposition[];
}

export interface EvaluationDetail {
  resume: EvaluationResume;
  consignes: string | null;
  tentativesMax: number | null;
  delaiEntreTentativesHeures: number | null;
  tentativeApresEchec: boolean | null;
  publicationResultats: PublicationResultats;
  affichageCorrections: AffichageCorrections;
  formationTitre: string | null;
  moduleTitre: string | null;
  seuilEffectif: number;
  questions: Question[];
  versions: VersionContenu[];
  controlesPublication: string[];
}

export interface HistoriqueFormation {
  id: string;
  action: ActionHistorique;
  auteurNom: string;
  dateAction: string;
  detail: string | null;
  formationId: string | null;
  evaluationId: string | null;
  affectationId: string | null;
}

export interface Affectation {
  id: string;
  formationId: string | null;
  evaluationId: string | null;
  titre: string;
  nature: NatureAffectation;
  categorie: CategorieFormation | null;
  typeEvaluation: TypeEvaluation | null;
  version: number;
  delegueId: string;
  delegueNom: string;
  assigneParNom: string;
  cibleType: CibleAffectation;
  cibleLibelle: string | null;
  dateDebut: string;
  dateLimite: string | null;
  obligatoire: boolean;
  priorite: PrioriteAffectation;
  tentativesMax: number | null;
  seuilReussite: number;
  tentativesSupplementaires: number;
  statut: StatutAffectation;
  score: number | null;
  progression: number;
  enRetard: boolean;
  dateAffectation: string;
  datePremiereActivite: string | null;
  dateDerniereActivite: string | null;
  dateFin: string | null;
  nbTentatives: number;
  correctionsEnAttente: number;
}

export interface DelegueCible {
  id: string;
  nom: string;
  email: string;
  managerNom: string | null;
  regions: string[];
  dejaAffecte: boolean;
}

export interface ApercuAffectation {
  titre: string;
  cibleLibelle: string;
  total: number;
  nouveaux: number;
  dejaAffectes: number;
  delegues: DelegueCible[];
  avertissements: string[];
}

export interface ResultatAffectation {
  creees: number;
  ignorees: number;
  affectations: Affectation[];
}

export interface LeconParcours {
  id: string;
  titre: string;
  type: TypeLecon;
  contenu: string | null;
  url: string | null;
  aFichier: boolean;
  fichierNom: string | null;
  fichierType: string | null;
  dureeMinutes: number | null;
  ordre: number;
  obligatoire: boolean;
  consultee: boolean;
  dateConsultation: string | null;
}

export interface EvaluationParcours {
  id: string;
  titre: string;
  type: TypeEvaluation;
  consignes: string | null;
  dureeMinutes: number | null;
  obligatoire: boolean;
  seuilReussite: number;
  seuilExige: boolean;
  nbQuestions: number;
  pointsTotal: number;
  statut: StatutEtape;
  tentativesUtilisees: number;
  /** null = illimité. */
  tentativesMax: number | null;
  tentativesRestantes: number | null;
  peutDemarrer: boolean;
  raisonBlocage: string | null;
  tentativeEnCoursId: string | null;
  meilleurScore: number | null;
  prochaineTentativePossible: string | null;
}

export interface ModuleParcours {
  id: string;
  titre: string;
  description: string | null;
  ordre: number;
  obligatoire: boolean;
  statut: StatutEtape;
  accessible: boolean;
  leconsVues: number;
  leconsObligatoires: number;
  leconsTotal: number;
  lecons: LeconParcours[];
  evaluations: EvaluationParcours[];
}

export interface Parcours {
  affectation: Affectation;
  description: string | null;
  objectifs: string | null;
  niveau: NiveauFormation | null;
  dureeEstimeeMinutes: number | null;
  exigenceSeuil: ExigenceSeuil | null;
  progressionSequentielle: boolean;
  modules: ModuleParcours[];
  evaluationFinale: EvaluationParcours | null;
  evaluationFinaleAccessible: boolean;
  exercices: EvaluationParcours[];
  modulesRestants: number;
  conditionsRestantes: string[];
}

export interface QuestionPassage {
  id: string;
  type: TypeQuestion;
  enonce: string;
  points: number;
  ordre: number;
  obligatoire: boolean;
  propositions: { id: string; libelle: string }[];
}

export interface ReponseQuestion {
  questionId: string;
  propositionIds: string[];
  texte: string | null;
}

export interface TentativePassage {
  id: string;
  affectationId: string;
  evaluationId: string;
  titre: string;
  consignes: string | null;
  type: TypeEvaluation;
  numero: number;
  statut: StatutTentative;
  dateDebut: string;
  dateExpiration: string | null;
  dureeMinutes: number | null;
  pointsMax: number;
  seuil: number;
  questions: QuestionPassage[];
  reponses: ReponseQuestion[];
}

export interface QuestionCorrigee {
  id: string;
  type: TypeQuestion;
  enonce: string;
  points: number;
  ordre: number;
  correctionManuelle: boolean;
  propositions: { id: string; libelle: string; correcte: boolean | null; choisie: boolean }[];
  texteDonne: string | null;
  pointsObtenus: number | null;
  correcte: boolean | null;
  corrigee: boolean;
  explication: string | null;
  reponsesAcceptees: string[] | null;
  commentaire: string | null;
}

export interface ResultatTentative {
  id: string;
  affectationId: string;
  evaluationId: string;
  delegueId: string;
  delegueNom: string;
  titre: string;
  type: TypeEvaluation;
  numero: number;
  statut: StatutTentative;
  dateDebut: string;
  dateSoumission: string | null;
  dateCorrection: string | null;
  correcteurNom: string | null;
  resultatPublie: boolean;
  resultatVisible: boolean;
  correctionsVisibles: boolean;
  score: number | null;
  pointsObtenus: number | null;
  pointsMax: number;
  seuil: number;
  reussie: boolean | null;
  message: string;
  questions: QuestionCorrigee[];
}

export interface TentativeResume {
  id: string;
  affectationId: string;
  evaluationId: string;
  evaluationTitre: string;
  formationTitre: string | null;
  type: TypeEvaluation | null;
  delegueId: string;
  delegueNom: string;
  numero: number;
  statut: StatutTentative;
  dateDebut: string;
  dateSoumission: string | null;
  dateCorrection: string | null;
  score: number | null;
  seuil: number;
  resultatPublie: boolean;
}

export interface EspaceApprenant {
  affectees: number;
  obligatoires: number;
  nonCommencees: number;
  enCours: number;
  enAttenteCorrection: number;
  reussies: number;
  echouees: number;
  enRetard: number;
  exercices: number;
  scoreMoyen: number | null;
  prochainesEcheances: Affectation[];
  derniersResultats: TentativeResume[];
  notificationsNonLues: number;
}

export interface FiltresFormation {
  dateDebut?: string;
  dateFin?: string;
  formationId?: string;
  evaluationId?: string;
  delegueId?: string;
  managerId?: string;
  region?: string;
}

export interface StatFormation {
  formationId: string | null;
  evaluationId: string | null;
  titre: string;
  version: number;
  nature: NatureAffectation;
  affectes: number;
  commences: number;
  termines: number;
  reussis: number;
  echoues: number;
  enRetard: number;
  tauxParticipation: number;
  tauxCompletion: number;
  tauxReussite: number;
  scoreMoyen: number | null;
  tentativesMoyennesAvantReussite: number | null;
}

export interface TableauBordFormation {
  formationsCreees: number;
  formationsBrouillon: number;
  formationsPubliees: number;
  formationsArchivees: number;
  evaluationsIndependantes: number;
  affectations: number;
  deleguesAffectes: number;
  deleguesAyantCommence: number;
  deleguesAyantTermine: number;
  tauxCompletion: number;
  tauxReussite: number;
  scoreMoyen: number | null;
  affectationsEnRetard: number;
  deleguesEnEchec: number;
  correctionsEnAttente: number;
  repartitionStatuts: Partial<Record<StatutAffectation, number>>;
  parFormation: StatFormation[];
  dernieresTentatives: TentativeResume[];
}

export interface SuiviDelegue {
  delegueId: string;
  delegueNom: string;
  managerNom: string | null;
  regions: string[];
  affectees: number;
  commencees: number;
  terminees: number;
  reussies: number;
  echouees: number;
  enRetard: number;
  correctionsEnAttente: number;
  progressionMoyenne: number;
  scoreMoyen: number | null;
  nbTentatives: number;
  derniereActivite: string | null;
}

export interface SuiviDelegueDetail {
  synthese: SuiviDelegue;
  affectations: Affectation[];
  tentatives: TentativeResume[];
}

export interface AffectationDetail {
  parcours: Parcours;
  tentatives: TentativeResume[];
}

export interface StatModule {
  moduleId: string;
  moduleTitre: string;
  formationId: string;
  formationTitre: string;
  tentatives: number;
  reussites: number;
  echecs: number;
  tauxReussite: number;
  scoreMoyen: number | null;
  deleguesBloques: number;
}

export interface StatQuestion {
  questionId: string;
  enonce: string;
  evaluationTitre: string;
  type: TypeQuestion;
  reponses: number;
  echecs: number;
  tauxEchec: number;
}

export interface RetardFormation {
  affectationId: string;
  delegueId: string;
  delegueNom: string;
  titre: string;
  dateLimite: string | null;
  statut: StatutAffectation;
  progression: number;
  enRetard: boolean;
}

export interface ReportingFormation {
  parFormation: StatFormation[];
  parModule: StatModule[];
  questionsLesPlusEchouees: StatQuestion[];
  modulesLesPlusDifficiles: StatModule[];
  obligatoiresNonTerminees: RetardFormation[];
  formationsEchues: StatFormation[];
}

export type MotifRelance = 'RETARD' | 'ECHEANCE_PROCHE' | 'INACTIF' | 'ECHEC';

export interface RelanceFormation {
  affectationId: string;
  delegueId: string;
  delegueNom: string;
  titre: string;
  motif: MotifRelance;
  dateLimite: string | null;
  derniereActivite: string | null;
  statut: StatutAffectation;
  progression: number;
}

export interface NotificationFormation {
  id: string;
  type: TypeNotificationFormation;
  titre: string;
  message: string | null;
  affectationId: string | null;
  formationId: string | null;
  evaluationId: string | null;
  tentativeId: string | null;
  dateCreation: string;
  lue: boolean;
}

export interface ParametresFormation {
  seuilDefaut: number;
  seuilMinManager: number;
  tentativesMaxPlafond: number;
  joursAlerteEcheance: number;
  joursInactiviteRelance: number;
}
