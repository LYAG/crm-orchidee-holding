import type {
  AffectationDto,
  EvaluationDto,
  FiltresMesAffectations,
  FormationDto,
  FormationService,
  LeconFormDto,
  ModuleDto,
  QuestionDto,
  ReouvertureDto,
} from '@/services/api/FormationService';
import type {
  Affectation,
  AffectationDetail,
  ApercuAffectation,
  CategorieFormation,
  EspaceApprenant,
  EvaluationDetail,
  EvaluationResume,
  FiltresFormation,
  FormationDetail,
  FormationResume,
  HistoriqueFormation,
  Lecon,
  NotificationFormation,
  ParametresFormation,
  Parcours,
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
} from '@/types/formation';
import { apiFetch, apiFetchBlob, qs } from './httpClient';

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

function fichier(f: File): FormData {
  const data = new FormData();
  data.append('file', f);
  return data;
}

function filtresQs(f: FiltresFormation & { statut?: string } = {}): string {
  return qs({ ...f });
}

export class FormationServiceReal implements FormationService {
  // ─── Formations ─────────────────────────────────────────────────────────────
  getFormations(f: { statut?: StatutPublication; categorie?: CategorieFormation; q?: string } = {}): Promise<FormationResume[]> {
    return apiFetch(`/formation/formations${qs({ ...f })}`);
  }
  getFormation(id: string): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}`);
  }
  createFormation(data: FormationDto): Promise<FormationDetail> {
    return apiFetch('/formation/formations', json('POST', data));
  }
  updateFormation(id: string, data: FormationDto): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}`, json('PUT', data));
  }
  async deleteFormation(id: string): Promise<void> {
    await apiFetch<void>(`/formation/formations/${id}`, { method: 'DELETE' });
  }
  publierFormation(id: string): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}/publier`, { method: 'POST' });
  }
  archiverFormation(id: string): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}/archiver`, { method: 'POST' });
  }
  dupliquerFormation(id: string, nouvelleVersion: boolean): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}/dupliquer${qs({ nouvelleVersion: String(nouvelleVersion) })}`, {
      method: 'POST',
    });
  }
  getHistoriqueFormation(id: string): Promise<HistoriqueFormation[]> {
    return apiFetch(`/formation/formations/${id}/historique`);
  }
  uploadCouverture(id: string, f: File): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${id}/couverture`, { method: 'POST', body: fichier(f) });
  }
  getCouverture(id: string): Promise<Blob> {
    return apiFetchBlob(`/formation/formations/${id}/couverture`);
  }

  // ─── Modules et leçons ──────────────────────────────────────────────────────
  addModule(formationId: string, data: ModuleDto): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${formationId}/modules`, json('POST', data));
  }
  updateModule(moduleId: string, data: ModuleDto): Promise<FormationDetail> {
    return apiFetch(`/formation/modules/${moduleId}`, json('PUT', data));
  }
  deleteModule(moduleId: string): Promise<FormationDetail> {
    return apiFetch(`/formation/modules/${moduleId}`, { method: 'DELETE' });
  }
  reorderModules(formationId: string, ids: string[]): Promise<FormationDetail> {
    return apiFetch(`/formation/formations/${formationId}/modules/ordre`, json('PUT', { ids }));
  }
  addLecon(moduleId: string, data: LeconFormDto): Promise<Lecon> {
    return apiFetch(`/formation/modules/${moduleId}/lecons`, json('POST', data));
  }
  updateLecon(leconId: string, data: LeconFormDto): Promise<Lecon> {
    return apiFetch(`/formation/lecons/${leconId}`, json('PUT', data));
  }
  async deleteLecon(leconId: string): Promise<void> {
    await apiFetch<void>(`/formation/lecons/${leconId}`, { method: 'DELETE' });
  }
  reorderLecons(moduleId: string, ids: string[]): Promise<Lecon[]> {
    return apiFetch(`/formation/modules/${moduleId}/lecons/ordre`, json('PUT', { ids }));
  }
  uploadFichierLecon(leconId: string, f: File): Promise<Lecon> {
    return apiFetch(`/formation/lecons/${leconId}/fichier`, { method: 'POST', body: fichier(f) });
  }
  getFichierLecon(leconId: string): Promise<Blob> {
    return apiFetchBlob(`/formation/lecons/${leconId}/fichier`);
  }

  // ─── Évaluations et questions ───────────────────────────────────────────────
  getEvaluationsIndependantes(statut?: StatutPublication): Promise<EvaluationResume[]> {
    return apiFetch(`/formation/evaluations${qs({ statut })}`);
  }
  getEvaluation(id: string): Promise<EvaluationDetail> {
    return apiFetch(`/formation/evaluations/${id}`);
  }
  createEvaluation(data: EvaluationDto): Promise<EvaluationDetail> {
    return apiFetch('/formation/evaluations', json('POST', data));
  }
  updateEvaluation(id: string, data: EvaluationDto): Promise<EvaluationDetail> {
    return apiFetch(`/formation/evaluations/${id}`, json('PUT', data));
  }
  async deleteEvaluation(id: string): Promise<void> {
    await apiFetch<void>(`/formation/evaluations/${id}`, { method: 'DELETE' });
  }
  publierEvaluation(id: string): Promise<EvaluationDetail> {
    return apiFetch(`/formation/evaluations/${id}/publier`, { method: 'POST' });
  }
  archiverEvaluation(id: string): Promise<EvaluationDetail> {
    return apiFetch(`/formation/evaluations/${id}/archiver`, { method: 'POST' });
  }
  dupliquerEvaluation(id: string, nouvelleVersion: boolean): Promise<EvaluationDetail> {
    return apiFetch(`/formation/evaluations/${id}/dupliquer${qs({ nouvelleVersion: String(nouvelleVersion) })}`, {
      method: 'POST',
    });
  }
  getHistoriqueEvaluation(id: string): Promise<HistoriqueFormation[]> {
    return apiFetch(`/formation/evaluations/${id}/historique`);
  }
  addQuestion(evaluationId: string, data: QuestionDto): Promise<Question> {
    return apiFetch(`/formation/evaluations/${evaluationId}/questions`, json('POST', data));
  }
  updateQuestion(questionId: string, data: QuestionDto): Promise<Question> {
    return apiFetch(`/formation/questions/${questionId}`, json('PUT', data));
  }
  async deleteQuestion(questionId: string): Promise<void> {
    await apiFetch<void>(`/formation/questions/${questionId}`, { method: 'DELETE' });
  }
  reorderQuestions(evaluationId: string, ids: string[]): Promise<Question[]> {
    return apiFetch(`/formation/evaluations/${evaluationId}/questions/ordre`, json('PUT', { ids }));
  }

  // ─── Affectations ───────────────────────────────────────────────────────────
  apercuAffectation(data: AffectationDto): Promise<ApercuAffectation> {
    return apiFetch('/formation/affectations/apercu', json('POST', data));
  }
  affecter(data: AffectationDto): Promise<ResultatAffectation> {
    return apiFetch('/formation/affectations', json('POST', data));
  }
  getAffectations(f: FiltresFormation & { statut?: StatutAffectation } = {}): Promise<Affectation[]> {
    return apiFetch(`/formation/affectations${filtresQs(f)}`);
  }
  getAffectation(id: string): Promise<AffectationDetail> {
    return apiFetch(`/formation/affectations/${id}`);
  }
  reouvrirAffectation(id: string, data: ReouvertureDto): Promise<AffectationDetail> {
    return apiFetch(`/formation/affectations/${id}/reouvrir`, json('POST', data));
  }
  async annulerAffectation(id: string): Promise<void> {
    await apiFetch<void>(`/formation/affectations/${id}`, { method: 'DELETE' });
  }

  // ─── Suivi ──────────────────────────────────────────────────────────────────
  getTableauDeBord(f: FiltresFormation = {}): Promise<TableauBordFormation> {
    return apiFetch(`/formation/tableau-de-bord${filtresQs(f)}`);
  }
  getSuiviDelegues(f: FiltresFormation = {}): Promise<SuiviDelegue[]> {
    return apiFetch(`/formation/suivi/delegues${filtresQs(f)}`);
  }
  getSuiviDelegue(delegueId: string): Promise<SuiviDelegueDetail> {
    return apiFetch(`/formation/suivi/delegues/${delegueId}`);
  }
  getReporting(f: FiltresFormation = {}): Promise<ReportingFormation> {
    return apiFetch(`/formation/reporting${filtresQs(f)}`);
  }
  exporterReporting(f: FiltresFormation = {}): Promise<Blob> {
    return apiFetchBlob(`/formation/reporting/export${filtresQs(f)}`);
  }
  getRelances(f: FiltresFormation = {}): Promise<RelanceFormation[]> {
    return apiFetch(`/formation/relances${qs({ formationId: f.formationId, managerId: f.managerId, region: f.region })}`);
  }
  async relancer(affectationIds: string[], message?: string): Promise<number> {
    const res = await apiFetch<{ envoyees: number }>('/formation/relances', json('POST', { affectationIds, message }));
    return res.envoyees;
  }
  getCorrections(): Promise<TentativeResume[]> {
    return apiFetch('/formation/corrections');
  }
  getTentative(id: string): Promise<ResultatTentative> {
    return apiFetch(`/formation/tentatives/${id}`);
  }
  corriger(
    id: string,
    notes: { questionId: string; points: number; commentaire?: string }[],
    publierResultat?: boolean,
  ): Promise<ResultatTentative> {
    return apiFetch(`/formation/tentatives/${id}/correction`, json('POST', { notes, publierResultat }));
  }
  publierResultat(id: string): Promise<ResultatTentative> {
    return apiFetch(`/formation/tentatives/${id}/publier-resultat`, { method: 'POST' });
  }

  // ─── Espace apprenant ───────────────────────────────────────────────────────
  getMonEspace(): Promise<EspaceApprenant> {
    return apiFetch('/formation/mon-espace/tableau');
  }
  getMesAffectations(f: FiltresMesAffectations = {}): Promise<Affectation[]> {
    return apiFetch(
      `/formation/mon-espace/affectations${qs({
        statut: f.statut,
        nature: f.nature,
        obligatoire: f.obligatoire === undefined ? undefined : String(f.obligatoire),
      })}`,
    );
  }
  getParcours(affectationId: string): Promise<Parcours> {
    return apiFetch(`/formation/mon-espace/affectations/${affectationId}`);
  }
  consulterLecon(affectationId: string, leconId: string): Promise<Parcours> {
    return apiFetch(`/formation/mon-espace/affectations/${affectationId}/lecons/${leconId}/consulter`, {
      method: 'POST',
    });
  }
  getFichierLeconApprenant(affectationId: string, leconId: string): Promise<Blob> {
    return apiFetchBlob(`/formation/mon-espace/affectations/${affectationId}/lecons/${leconId}/fichier`);
  }
  demarrerTentative(affectationId: string, evaluationId: string): Promise<TentativePassage> {
    return apiFetch(`/formation/mon-espace/affectations/${affectationId}/evaluations/${evaluationId}/tentatives`, {
      method: 'POST',
    });
  }
  getPassage(tentativeId: string): Promise<TentativePassage> {
    return apiFetch(`/formation/mon-espace/tentatives/${tentativeId}`);
  }
  enregistrerReponses(tentativeId: string, reponses: ReponseQuestion[]): Promise<TentativePassage> {
    return apiFetch(`/formation/mon-espace/tentatives/${tentativeId}/reponses`, json('PUT', { reponses }));
  }
  soumettre(tentativeId: string, reponses: ReponseQuestion[]): Promise<ResultatTentative> {
    return apiFetch(`/formation/mon-espace/tentatives/${tentativeId}/soumettre`, json('POST', { reponses }));
  }
  getResultat(tentativeId: string): Promise<ResultatTentative> {
    return apiFetch(`/formation/mon-espace/tentatives/${tentativeId}/resultat`);
  }
  getMonHistorique(): Promise<TentativeResume[]> {
    return apiFetch('/formation/mon-espace/historique');
  }

  // ─── Notifications et paramètres ────────────────────────────────────────────
  getNotifications(): Promise<NotificationFormation[]> {
    return apiFetch('/formation/notifications');
  }
  marquerNotificationLue(id: string): Promise<NotificationFormation> {
    return apiFetch(`/formation/notifications/${id}/lue`, { method: 'PUT' });
  }
  async marquerToutesLues(): Promise<void> {
    await apiFetch<void>('/formation/notifications/lues', { method: 'PUT' });
  }
  getParametres(): Promise<ParametresFormation> {
    return apiFetch('/formation/parametres');
  }
  updateParametres(data: ParametresFormation): Promise<ParametresFormation> {
    return apiFetch('/formation/parametres', json('PUT', data));
  }
}
