import type {
  AffichageCorrections,
  Affectation,
  AffectationDetail,
  ApercuAffectation,
  CategorieFormation,
  CibleAffectation,
  EspaceApprenant,
  EvaluationDetail,
  EvaluationResume,
  ExigenceSeuil,
  FiltresFormation,
  FormationDetail,
  FormationResume,
  HistoriqueFormation,
  Lecon,
  NatureAffectation,
  NiveauFormation,
  NotificationFormation,
  ParametresFormation,
  Parcours,
  PrioriteAffectation,
  PublicationResultats,
  Question,
  RelanceFormation,
  ReponseQuestion,
  ReportingFormation,
  ResultatAffectation,
  ResultatTentative,
  StatutAffectation,
  StatutPublication,
  SuiviDelegue,
  SuiviDelegueDetail,
  TableauBordFormation,
  TentativePassage,
  TentativeResume,
  TypeEvaluation,
  TypeLecon,
  TypeQuestion,
} from '@/types/formation';

export interface FormationDto {
  titre: string;
  description?: string | null;
  objectifs?: string | null;
  categorie: CategorieFormation;
  niveau: NiveauFormation;
  dureeEstimeeMinutes?: number | null;
  seuilReussite: number;
  tentativesMax?: number | null;
  delaiEntreTentativesHeures?: number | null;
  tentativeApresEchec?: boolean;
  exigenceSeuil: ExigenceSeuil;
  progressionSequentielle?: boolean;
  echeance?: string | null;
}

export interface ModuleDto {
  titre: string;
  description?: string | null;
  obligatoire?: boolean;
}

export interface LeconFormDto {
  titre: string;
  type: TypeLecon;
  contenu?: string | null;
  url?: string | null;
  dureeMinutes?: number | null;
  obligatoire?: boolean;
}

/** Rattachement : moduleId (quiz de module), formationId seul (finale / exercice), ou aucun (indépendante). */
export interface EvaluationDto {
  formationId?: string | null;
  moduleId?: string | null;
  type: TypeEvaluation;
  titre: string;
  consignes?: string | null;
  dureeMinutes?: number | null;
  seuilReussite?: number | null;
  tentativesMax?: number | null;
  delaiEntreTentativesHeures?: number | null;
  tentativeApresEchec?: boolean | null;
  publicationResultats?: PublicationResultats;
  affichageCorrections?: AffichageCorrections;
  obligatoire?: boolean;
}

export interface QuestionDto {
  type: TypeQuestion;
  enonce: string;
  points: number;
  explication?: string | null;
  reponsesAcceptees?: string[];
  obligatoire?: boolean;
  propositions?: { libelle: string; correcte: boolean }[];
}

export interface AffectationDto {
  formationId?: string | null;
  evaluationId?: string | null;
  cibleType: CibleAffectation;
  delegueIds?: string[];
  managerId?: string | null;
  region?: string | null;
  dateDebut?: string | null;
  dateLimite?: string | null;
  obligatoire?: boolean;
  priorite?: PrioriteAffectation;
  tentativesMax?: number | null;
  seuilReussite?: number | null;
}

export interface ReouvertureDto {
  tentativesSupplementaires: number;
  nouvelleDateLimite?: string | null;
  message?: string | null;
}

export interface FiltresMesAffectations {
  statut?: StatutAffectation;
  nature?: NatureAffectation;
  obligatoire?: boolean;
}

/**
 * Module Formation. Le backend applique les droits (rôle + matrice Rôles & permissions) et le
 * périmètre (équipe du manager) : le web ne fait que masquer ce qui serait refusé.
 */
export interface FormationService {
  // Conception — formations
  getFormations(filtres?: { statut?: StatutPublication; categorie?: CategorieFormation; q?: string }): Promise<FormationResume[]>;
  getFormation(id: string): Promise<FormationDetail>;
  createFormation(data: FormationDto): Promise<FormationDetail>;
  updateFormation(id: string, data: FormationDto): Promise<FormationDetail>;
  deleteFormation(id: string): Promise<void>;
  publierFormation(id: string): Promise<FormationDetail>;
  archiverFormation(id: string): Promise<FormationDetail>;
  /** nouvelleVersion : brouillon v(n+1) de la même formation ; sinon copie indépendante. */
  dupliquerFormation(id: string, nouvelleVersion: boolean): Promise<FormationDetail>;
  getHistoriqueFormation(id: string): Promise<HistoriqueFormation[]>;
  uploadCouverture(id: string, fichier: File): Promise<FormationDetail>;
  getCouverture(id: string): Promise<Blob>;

  // Conception — modules et leçons
  addModule(formationId: string, data: ModuleDto): Promise<FormationDetail>;
  updateModule(moduleId: string, data: ModuleDto): Promise<FormationDetail>;
  deleteModule(moduleId: string): Promise<FormationDetail>;
  reorderModules(formationId: string, ids: string[]): Promise<FormationDetail>;
  addLecon(moduleId: string, data: LeconFormDto): Promise<Lecon>;
  updateLecon(leconId: string, data: LeconFormDto): Promise<Lecon>;
  deleteLecon(leconId: string): Promise<void>;
  reorderLecons(moduleId: string, ids: string[]): Promise<Lecon[]>;
  uploadFichierLecon(leconId: string, fichier: File): Promise<Lecon>;
  getFichierLecon(leconId: string): Promise<Blob>;

  // Conception — évaluations et questions
  getEvaluationsIndependantes(statut?: StatutPublication): Promise<EvaluationResume[]>;
  getEvaluation(id: string): Promise<EvaluationDetail>;
  createEvaluation(data: EvaluationDto): Promise<EvaluationDetail>;
  updateEvaluation(id: string, data: EvaluationDto): Promise<EvaluationDetail>;
  deleteEvaluation(id: string): Promise<void>;
  publierEvaluation(id: string): Promise<EvaluationDetail>;
  archiverEvaluation(id: string): Promise<EvaluationDetail>;
  dupliquerEvaluation(id: string, nouvelleVersion: boolean): Promise<EvaluationDetail>;
  getHistoriqueEvaluation(id: string): Promise<HistoriqueFormation[]>;
  addQuestion(evaluationId: string, data: QuestionDto): Promise<Question>;
  updateQuestion(questionId: string, data: QuestionDto): Promise<Question>;
  deleteQuestion(questionId: string): Promise<void>;
  reorderQuestions(evaluationId: string, ids: string[]): Promise<Question[]>;

  // Affectations
  apercuAffectation(data: AffectationDto): Promise<ApercuAffectation>;
  affecter(data: AffectationDto): Promise<ResultatAffectation>;
  getAffectations(filtres?: FiltresFormation & { statut?: StatutAffectation }): Promise<Affectation[]>;
  getAffectation(id: string): Promise<AffectationDetail>;
  reouvrirAffectation(id: string, data: ReouvertureDto): Promise<AffectationDetail>;
  annulerAffectation(id: string): Promise<void>;

  // Suivi, corrections, statistiques
  getTableauDeBord(filtres?: FiltresFormation): Promise<TableauBordFormation>;
  getSuiviDelegues(filtres?: FiltresFormation): Promise<SuiviDelegue[]>;
  getSuiviDelegue(delegueId: string): Promise<SuiviDelegueDetail>;
  getReporting(filtres?: FiltresFormation): Promise<ReportingFormation>;
  exporterReporting(filtres?: FiltresFormation): Promise<Blob>;
  getRelances(filtres?: FiltresFormation): Promise<RelanceFormation[]>;
  relancer(affectationIds: string[], message?: string): Promise<number>;
  getCorrections(): Promise<TentativeResume[]>;
  getTentative(id: string): Promise<ResultatTentative>;
  corriger(id: string, notes: { questionId: string; points: number; commentaire?: string }[], publierResultat?: boolean): Promise<ResultatTentative>;
  publierResultat(id: string): Promise<ResultatTentative>;

  // Espace apprenant (délégué)
  getMonEspace(): Promise<EspaceApprenant>;
  getMesAffectations(filtres?: FiltresMesAffectations): Promise<Affectation[]>;
  getParcours(affectationId: string): Promise<Parcours>;
  consulterLecon(affectationId: string, leconId: string): Promise<Parcours>;
  getFichierLeconApprenant(affectationId: string, leconId: string): Promise<Blob>;
  demarrerTentative(affectationId: string, evaluationId: string): Promise<TentativePassage>;
  getPassage(tentativeId: string): Promise<TentativePassage>;
  enregistrerReponses(tentativeId: string, reponses: ReponseQuestion[]): Promise<TentativePassage>;
  soumettre(tentativeId: string, reponses: ReponseQuestion[]): Promise<ResultatTentative>;
  getResultat(tentativeId: string): Promise<ResultatTentative>;
  getMonHistorique(): Promise<TentativeResume[]>;

  // Notifications et paramètres
  getNotifications(): Promise<NotificationFormation[]>;
  marquerNotificationLue(id: string): Promise<NotificationFormation>;
  marquerToutesLues(): Promise<void>;
  getParametres(): Promise<ParametresFormation>;
  updateParametres(data: ParametresFormation): Promise<ParametresFormation>;
}
