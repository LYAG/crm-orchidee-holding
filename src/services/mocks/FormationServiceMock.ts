import { UserRole } from '@/lib/constants';
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
import type { Utilisateur } from '@/types';
import type {
  ActionHistorique,
  Affectation,
  AffectationDetail,
  AffichageCorrections,
  ApercuAffectation,
  CategorieFormation,
  CibleAffectation,
  DroitsFormation,
  EspaceApprenant,
  EvaluationDetail,
  EvaluationParcours,
  EvaluationResume,
  ExigenceSeuil,
  FiltresFormation,
  FormationDetail,
  FormationResume,
  HistoriqueFormation,
  Lecon,
  ModuleParcours,
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
  StatFormation,
  StatModule,
  StatQuestion,
  StatutAffectation,
  StatutEtape,
  StatutPublication,
  StatutTentative,
  SuiviDelegue,
  SuiviDelegueDetail,
  TableauBordFormation,
  TentativePassage,
  TentativeResume,
  TypeEvaluation,
  TypeNotificationFormation,
} from '@/types/formation';
import { utilisateurs, zones } from './data';
import { delay, generateId } from './_utils';

// Réplique en mémoire des règles du backend (package formation de api_crm : RegleProgression,
// CorrecteurEvaluation, AccesFormation, ScopeService) pour développer le web sans serveur.

// ─── Stockage ─────────────────────────────────────────────────────────────────

interface FormationS {
  id: string;
  titre: string;
  description: string | null;
  objectifs: string | null;
  categorie: CategorieFormation;
  niveau: NiveauFormation;
  dureeEstimeeMinutes: number | null;
  couverture: Blob | null;
  seuilReussite: number;
  tentativesMax: number | null;
  delaiEntreTentativesHeures: number;
  tentativeApresEchec: boolean;
  exigenceSeuil: ExigenceSeuil;
  progressionSequentielle: boolean;
  echeance: string | null;
  statut: StatutPublication;
  version: number;
  formationRacineId: string;
  globale: boolean;
  createurId: string;
  dateCreation: string;
  dateModification: string;
  datePublication: string | null;
  dateArchivage: string | null;
}
interface ModuleS {
  id: string;
  formationId: string;
  titre: string;
  description: string | null;
  ordre: number;
  obligatoire: boolean;
}
interface LeconS extends Omit<Lecon, 'aFichier'> {
  fichier: Blob | null;
}
interface EvaluationS {
  id: string;
  formationId: string | null;
  moduleId: string | null;
  type: TypeEvaluation;
  titre: string;
  consignes: string | null;
  dureeMinutes: number | null;
  seuilReussite: number | null;
  tentativesMax: number | null;
  delaiEntreTentativesHeures: number | null;
  tentativeApresEchec: boolean | null;
  publicationResultats: PublicationResultats;
  affichageCorrections: AffichageCorrections;
  obligatoire: boolean;
  ordre: number;
  statut: StatutPublication;
  version: number;
  evaluationRacineId: string;
  globale: boolean;
  createurId: string;
  dateCreation: string;
  dateModification: string;
  datePublication: string | null;
  dateArchivage: string | null;
}
type QuestionS = Question;
interface AffectationS {
  id: string;
  formationId: string | null;
  evaluationId: string | null;
  delegueId: string;
  assigneParId: string;
  cibleType: CibleAffectation;
  cibleLibelle: string;
  dateDebut: string;
  dateLimite: string | null;
  obligatoire: boolean;
  priorite: PrioriteAffectation;
  tentativesMax: number | null;
  seuilReussite: number | null;
  tentativesSupplementaires: number;
  statut: StatutAffectation;
  score: number | null;
  dateAffectation: string;
  datePremiereActivite: string | null;
  dateDerniereActivite: string | null;
  dateFin: string | null;
}
interface Snapshot {
  evaluationId: string;
  titre: string;
  consignes: string | null;
  type: TypeEvaluation;
  dureeMinutes: number | null;
  seuil: number;
  publicationResultats: PublicationResultats;
  affichageCorrections: AffichageCorrections;
  questions: Question[];
}
interface ReponseS {
  questionId: string;
  propositionIds: string[];
  texte: string | null;
  pointsObtenus: number | null;
  correcte: boolean | null;
  corrigee: boolean;
  commentaire: string | null;
}
interface TentativeS {
  id: string;
  affectationId: string;
  evaluationId: string;
  delegueId: string;
  numero: number;
  statut: StatutTentative;
  dateDebut: string;
  dateExpiration: string | null;
  dateSoumission: string | null;
  dateCorrection: string | null;
  correcteurId: string | null;
  pointsObtenus: number | null;
  pointsMax: number;
  score: number | null;
  seuilApplique: number;
  resultatPublie: boolean;
  snapshot: Snapshot;
  reponses: ReponseS[];
}
interface ProgressionS {
  affectationId: string;
  leconId: string;
  date: string;
}

const db = {
  formations: [] as FormationS[],
  modules: [] as ModuleS[],
  lecons: [] as LeconS[],
  evaluations: [] as EvaluationS[],
  questions: [] as QuestionS[],
  affectations: [] as AffectationS[],
  progressions: [] as ProgressionS[],
  tentatives: [] as TentativeS[],
  historique: [] as HistoriqueFormation[],
  notifications: [] as (NotificationFormation & { destinataireId: string })[],
  parametres: {
    seuilDefaut: 70,
    seuilMinManager: 50,
    tentativesMaxPlafond: 10,
    joursAlerteEcheance: 3,
    joursInactiviteRelance: 7,
  } as ParametresFormation,
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────

class ErreurMetier extends Error {}
const INTERDIT = "Vous n'avez pas les droits pour effectuer cette action.";

const maintenant = () => new Date().toISOString();
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const ajouterJours = (iso: string, jours: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
};
const arrondi = (n: number) => Math.round(n * 100) / 100;
const copie = <T>(o: T): T => JSON.parse(JSON.stringify(o));
const texte = (s?: string | null) => (s && s.trim() ? s.trim() : null);

function nom(id: string | null | undefined): string {
  if (!id) return '—';
  const u = utilisateurs.find((x) => x.id === id);
  return u ? `${u.prenom} ${u.nom}`.trim() : '—';
}

function utilisateurCourant(): Utilisateur {
  if (typeof sessionStorage !== 'undefined') {
    try {
      const brut = sessionStorage.getItem('crm_mock_user');
      if (brut) return JSON.parse(brut) as Utilisateur;
    } catch {
      // session illisible : traité comme non connecté
    }
  }
  throw new ErreurMetier('Session expirée.');
}

const estAdmin = (u: Utilisateur) => u.role === UserRole.ADMIN;
const estGestion = (u: Utilisateur) => u.role === UserRole.ADMIN || u.role === UserRole.MANAGER;

function exigerGestion(u: Utilisateur) {
  if (!estGestion(u)) throw new ErreurMetier(INTERDIT);
}
function exigerDelegue(u: Utilisateur) {
  if (u.role !== UserRole.DELEGUE) throw new ErreurMetier(INTERDIT);
}

function deleguesVisibles(u: Utilisateur): Utilisateur[] {
  const delegues = utilisateurs.filter((x) => x.role === UserRole.DELEGUE);
  if (u.role === UserRole.ADMIN) return delegues;
  if (u.role === UserRole.MANAGER) return delegues.filter((d) => d.managerId === u.id);
  return delegues.filter((d) => d.id === u.id);
}
const peutVoirDelegue = (u: Utilisateur, delegueId: string) => deleguesVisibles(u).some((d) => d.id === delegueId);

function regions(delegueId: string): string[] {
  const d = utilisateurs.find((x) => x.id === delegueId);
  return [...new Set((d?.zoneIds ?? []).map((z) => zones.find((x) => x.id === z)?.region).filter(Boolean) as string[])].sort();
}
function correspond(delegueId: string, managerId?: string | null, region?: string | null): boolean {
  const d = utilisateurs.find((x) => x.id === delegueId);
  if (!d) return false;
  if (managerId && d.managerId !== managerId) return false;
  return !region || regions(delegueId).some((r) => r.toLowerCase() === region.trim().toLowerCase());
}

function normaliser(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function journal(action: ActionHistorique, auteurId: string, detail: string, ids: { formationId?: string | null; evaluationId?: string | null; affectationId?: string | null }) {
  db.historique.unshift({
    id: generateId('hist'),
    action,
    auteurNom: nom(auteurId),
    dateAction: maintenant(),
    detail,
    formationId: ids.formationId ?? null,
    evaluationId: ids.evaluationId ?? null,
    affectationId: ids.affectationId ?? null,
  });
}

function notifier(destinataireId: string | null | undefined, type: TypeNotificationFormation, titre: string, message: string | null, a: AffectationS | null, tentativeId: string | null = null) {
  if (!destinataireId) return;
  db.notifications.unshift({
    id: generateId('notif'),
    destinataireId,
    type,
    titre,
    message,
    affectationId: a?.id ?? null,
    formationId: a?.formationId ?? null,
    evaluationId: a?.evaluationId ?? null,
    tentativeId,
    dateCreation: maintenant(),
    lue: false,
  });
}

function verifierLimites(seuil: number | null | undefined, tentatives: number | null | undefined, u: Utilisateur) {
  const p = db.parametres;
  if (seuil != null && !estAdmin(u) && seuil < p.seuilMinManager) {
    throw new ErreurMetier(`Le seuil de réussite ne peut pas être inférieur à ${p.seuilMinManager}/100 (limite fixée par l'administrateur).`);
  }
  if (tentatives != null && tentatives > p.tentativesMaxPlafond) {
    throw new ErreurMetier(`Le nombre de tentatives ne peut pas dépasser ${p.tentativesMaxPlafond} (limite fixée par l'administrateur).`);
  }
}

// ─── Droits (AccesFormation) ──────────────────────────────────────────────────

const proprietaire = (u: Utilisateur, createurId: string) => estAdmin(u) || u.id === createurId;
const peutVoirF = (u: Utilisateur, f: FormationS) => estAdmin(u) || f.globale || u.id === f.createurId;
const peutVoirE = (u: Utilisateur, e: EvaluationS) => estAdmin(u) || e.globale || u.id === e.createurId;
const libelleStatut = (s: StatutPublication) => (s === 'BROUILLON' ? 'en brouillon' : s === 'PUBLIEE' ? 'publiée' : 'archivée');

function verifierVisibleF(u: Utilisateur, f: FormationS) {
  if (!peutVoirF(u, f)) throw new ErreurMetier(INTERDIT);
}
function verifierContenuModifiableF(u: Utilisateur, f: FormationS) {
  verifierVisibleF(u, f);
  if (f.statut !== 'BROUILLON') {
    throw new ErreurMetier(`Cette formation est ${libelleStatut(f.statut)} : son contenu n'est plus modifiable. Créez une nouvelle version pour la faire évoluer.`);
  }
}
function verifierProprietaireF(u: Utilisateur, f: FormationS) {
  verifierVisibleF(u, f);
  if (!proprietaire(u, f.createurId)) throw new ErreurMetier("Seul l'administrateur ou le créateur peut effectuer cette action.");
}

function droitsF(u: Utilisateur, f: FormationS, aDesAffectations: boolean): DroitsFormation {
  const brouillon = f.statut === 'BROUILLON';
  const prop = proprietaire(u, f.createurId);
  const visible = peutVoirF(u, f);
  return {
    modifierContenu: visible && brouillon,
    modifierParametres: prop && brouillon,
    publier: prop && brouillon,
    archiver: prop && f.statut === 'PUBLIEE',
    dupliquer: visible,
    supprimer: prop && brouillon && !aDesAffectations,
    affecter: visible && f.statut === 'PUBLIEE' && estGestion(u),
  };
}

function droitsE(u: Utilisateur, e: EvaluationS, parent: FormationS | null, aDesAffectations: boolean): DroitsFormation {
  if (parent) {
    const brouillon = parent.statut === 'BROUILLON';
    const visible = peutVoirF(u, parent);
    return { modifierContenu: visible && brouillon, modifierParametres: visible && brouillon, publier: false, archiver: false, dupliquer: false, supprimer: visible && brouillon, affecter: false };
  }
  const brouillon = e.statut === 'BROUILLON';
  const prop = proprietaire(u, e.createurId);
  const visible = peutVoirE(u, e);
  return {
    modifierContenu: visible && brouillon,
    modifierParametres: prop && brouillon,
    publier: prop && brouillon,
    archiver: prop && e.statut === 'PUBLIEE',
    dupliquer: visible,
    supprimer: prop && brouillon && !aDesAffectations,
    affecter: visible && e.statut === 'PUBLIEE' && estGestion(u),
  };
}

// ─── Accès aux données ────────────────────────────────────────────────────────

function formation(id: string): FormationS {
  const f = db.formations.find((x) => x.id === id);
  if (!f) throw new ErreurMetier(`Formation introuvable : ${id}`);
  return f;
}
function module_(id: string): ModuleS {
  const m = db.modules.find((x) => x.id === id);
  if (!m) throw new ErreurMetier(`Module introuvable : ${id}`);
  return m;
}
function lecon(id: string): LeconS {
  const l = db.lecons.find((x) => x.id === id);
  if (!l) throw new ErreurMetier(`Leçon introuvable : ${id}`);
  return l;
}
function evaluation(id: string): EvaluationS {
  const e = db.evaluations.find((x) => x.id === id);
  if (!e) throw new ErreurMetier(`Évaluation introuvable : ${id}`);
  return e;
}
const modulesDe = (formationId: string) => db.modules.filter((m) => m.formationId === formationId).sort((a, b) => a.ordre - b.ordre);
const leconsDe = (moduleId: string) => db.lecons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.ordre - b.ordre);
const evaluationsDe = (formationId: string) => db.evaluations.filter((e) => e.formationId === formationId).sort((a, b) => a.ordre - b.ordre);
const questionsDe = (evaluationId: string) => db.questions.filter((q) => q.evaluationId === evaluationId).sort((a, b) => a.ordre - b.ordre);
const tentativesDe = (affectationId: string) => db.tentatives.filter((t) => t.affectationId === affectationId).sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

function renumeroter<T extends { ordre: number }>(liste: T[]) {
  liste.sort((a, b) => a.ordre - b.ordre).forEach((x, i) => (x.ordre = i + 1));
}
function reordonner<T extends { id: string; ordre: number }>(liste: T[], ids: string[]) {
  const attendus = new Set(liste.map((x) => x.id));
  if (ids.length !== attendus.size || !ids.every((id) => attendus.has(id))) {
    throw new ErreurMetier('Le nouvel ordre doit reprendre exactement tous les éléments.');
  }
  ids.forEach((id, i) => {
    liste.find((x) => x.id === id)!.ordre = i + 1;
  });
}

// ─── Vues conception ──────────────────────────────────────────────────────────

const leconDto = (l: LeconS): Lecon => {
  const { fichier, ...reste } = l;
  return { ...copie(reste), aFichier: fichier != null };
};

function evaluationResume(u: Utilisateur, e: EvaluationS): EvaluationResume {
  const qs = questionsDe(e.id);
  const parent = e.formationId ? formation(e.formationId) : null;
  const nbAff = e.formationId ? 0 : db.affectations.filter((a) => a.evaluationId === e.id).length;
  return {
    id: e.id,
    formationId: e.formationId,
    moduleId: e.moduleId,
    type: e.type,
    titre: e.titre,
    statut: e.statut,
    version: e.version,
    evaluationRacineId: e.evaluationRacineId,
    nbQuestions: qs.length,
    pointsTotal: qs.reduce((s, q) => s + q.points, 0),
    seuilReussite: e.seuilReussite,
    dureeMinutes: e.dureeMinutes,
    obligatoire: e.obligatoire,
    ordre: e.ordre,
    independante: !e.formationId,
    globale: e.globale,
    createurNom: nom(e.createurId),
    nbAffectations: nbAff,
    dateModification: e.dateModification,
    droits: droitsE(u, e, parent, nbAff > 0),
  };
}

function formationResume(u: Utilisateur, f: FormationS): FormationResume {
  const mods = modulesDe(f.id);
  const nbAff = db.affectations.filter((a) => a.formationId === f.id).length;
  return {
    id: f.id,
    titre: f.titre,
    description: f.description,
    categorie: f.categorie,
    niveau: f.niveau,
    dureeEstimeeMinutes: f.dureeEstimeeMinutes,
    seuilReussite: f.seuilReussite,
    tentativesMax: f.tentativesMax,
    exigenceSeuil: f.exigenceSeuil,
    echeance: f.echeance,
    statut: f.statut,
    version: f.version,
    formationRacineId: f.formationRacineId,
    globale: f.globale,
    createurId: f.createurId,
    createurNom: nom(f.createurId),
    aCouverture: f.couverture != null,
    nbModules: mods.length,
    nbLecons: mods.reduce((s, m) => s + leconsDe(m.id).length, 0),
    nbEvaluations: evaluationsDe(f.id).length,
    nbAffectations: nbAff,
    dateCreation: f.dateCreation,
    dateModification: f.dateModification,
    datePublication: f.datePublication,
    dateArchivage: f.dateArchivage,
    droits: droitsF(u, f, nbAff > 0),
  };
}

function controlesFormation(f: FormationS): string[] {
  const c: string[] = [];
  const mods = modulesDe(f.id);
  const evals = evaluationsDe(f.id);
  if (mods.length === 0) c.push('ajoutez au moins un module');
  for (const m of mods) {
    const ls = leconsDe(m.id);
    if (ls.length === 0) c.push(`le module « ${m.titre} » n'a aucune leçon`);
    for (const l of ls) {
      if (!l.contenu && !l.url && !l.fichier) c.push(`la leçon « ${l.titre} » n'a ni contenu, ni lien, ni fichier`);
    }
    const quiz = evals.some((e) => e.moduleId === m.id && e.obligatoire);
    if (m.obligatoire && !quiz && f.exigenceSeuil !== 'FINALE') {
      c.push(`le seuil étant exigé à chaque module, le module « ${m.titre} » doit avoir un quiz obligatoire`);
    }
  }
  if (!evals.some((e) => e.type === 'EVALUATION_FINALE') && f.exigenceSeuil !== 'MODULES') {
    c.push("le seuil étant exigé à l'évaluation finale, ajoutez une évaluation finale");
  }
  for (const e of evals) if (questionsDe(e.id).length === 0) c.push(`l'évaluation « ${e.titre} » n'a aucune question`);
  return c;
}

function formationDetail(u: Utilisateur, f: FormationS): FormationDetail {
  const evals = evaluationsDe(f.id);
  return {
    resume: formationResume(u, f),
    objectifs: f.objectifs,
    delaiEntreTentativesHeures: f.delaiEntreTentativesHeures,
    tentativeApresEchec: f.tentativeApresEchec,
    progressionSequentielle: f.progressionSequentielle,
    modules: modulesDe(f.id).map((m) => ({
      ...copie(m),
      lecons: leconsDe(m.id).map(leconDto),
      evaluations: evals.filter((e) => e.moduleId === m.id).map((e) => evaluationResume(u, e)),
    })),
    evaluations: evals.filter((e) => !e.moduleId).map((e) => evaluationResume(u, e)),
    versions: db.formations
      .filter((v) => v.formationRacineId === f.formationRacineId && peutVoirF(u, v))
      .sort((a, b) => a.version - b.version)
      .map((v) => ({ id: v.id, version: v.version, statut: v.statut, dateCreation: v.dateCreation, datePublication: v.datePublication })),
    controlesPublication: controlesFormation(f),
  };
}

function seuilEffectifE(e: EvaluationS): number {
  if (e.seuilReussite != null) return e.seuilReussite;
  return e.formationId ? formation(e.formationId).seuilReussite : db.parametres.seuilDefaut;
}

function evaluationDetail(u: Utilisateur, e: EvaluationS): EvaluationDetail {
  const parent = e.formationId ? formation(e.formationId) : null;
  const mod = e.moduleId ? db.modules.find((m) => m.id === e.moduleId) : null;
  const qs = questionsDe(e.id);
  return {
    resume: evaluationResume(u, e),
    consignes: e.consignes,
    tentativesMax: e.tentativesMax,
    delaiEntreTentativesHeures: e.delaiEntreTentativesHeures,
    tentativeApresEchec: e.tentativeApresEchec,
    publicationResultats: e.publicationResultats,
    affichageCorrections: e.affichageCorrections,
    formationTitre: parent?.titre ?? null,
    moduleTitre: mod?.titre ?? null,
    seuilEffectif: seuilEffectifE(e),
    questions: copie(qs),
    versions: (e.formationId ? [e] : db.evaluations.filter((v) => v.evaluationRacineId === e.evaluationRacineId && peutVoirE(u, v)))
      .sort((a, b) => a.version - b.version)
      .map((v) => ({ id: v.id, version: v.version, statut: v.statut, dateCreation: v.dateCreation, datePublication: v.datePublication })),
    controlesPublication: qs.length === 0 ? ['ajoutez au moins une question'] : [],
  };
}

function verifierEvaluationModifiable(u: Utilisateur, e: EvaluationS) {
  if (e.formationId) {
    verifierContenuModifiableF(u, formation(e.formationId));
    return;
  }
  if (!peutVoirE(u, e)) throw new ErreurMetier(INTERDIT);
  if (e.statut !== 'BROUILLON') {
    throw new ErreurMetier(`Cette évaluation est ${libelleStatut(e.statut)} : ses questions ne sont plus modifiables. Créez une nouvelle version pour la faire évoluer.`);
  }
}

// ─── Règles de progression (RegleProgression) ─────────────────────────────────

interface Regles {
  tentativesMax: number | null;
  apresEchec: boolean;
  delaiHeures: number;
  supplementaires: number;
}
interface TInfo {
  id: string;
  statut: StatutTentative;
  score: number | null;
  fin: string | null;
}
interface EvalEtat {
  id: string;
  obligatoire: boolean;
  seuilExige: boolean;
  statut: StatutEtape;
  remplie: boolean;
  enAttente: boolean;
  echecDefinitif: boolean;
  meilleur: number | null;
  infos: TInfo[];
  regles: Regles;
}

function plafond(r: Regles): number | null {
  if (!r.apresEchec) return 1 + r.supplementaires;
  return r.tentativesMax == null ? null : r.tentativesMax + r.supplementaires;
}

function prochaineTentative(r: Regles, infos: TInfo[]): string | null {
  if (r.delaiHeures <= 0) return null;
  const fins = infos.map((i) => i.fin).filter(Boolean) as string[];
  if (fins.length === 0) return null;
  const d = new Date(fins.sort().at(-1)!);
  d.setHours(d.getHours() + r.delaiHeures);
  return d.toISOString();
}

function raisonRefus(r: Regles, infos: TInfo[], repetition: boolean): string | null {
  if (infos.some((i) => i.statut === 'EN_COURS')) return null;
  if (infos.some((i) => i.statut === 'EN_ATTENTE_CORRECTION')) return 'Une tentative est en attente de correction.';
  if (!repetition && infos.some((i) => i.statut === 'REUSSIE')) return 'Évaluation déjà réussie.';
  const p = plafond(r);
  if (p != null && infos.length >= p) {
    return r.apresEchec ? 'Nombre maximal de tentatives atteint.' : "Une nouvelle tentative après un échec n'est pas autorisée.";
  }
  const prochaine = prochaineTentative(r, infos);
  if (prochaine && prochaine > maintenant()) {
    return `Nouvelle tentative possible à partir du ${new Date(prochaine).toLocaleString('fr-FR')}.`;
  }
  return null;
}

function evaluer(id: string, obligatoire: boolean, seuilExige: boolean, regles: Regles, infos: TInfo[]): EvalEtat {
  const reussie = infos.some((t) => t.statut === 'REUSSIE');
  const passee = reussie || infos.some((t) => t.statut === 'ECHOUEE');
  const enAttente = infos.some((t) => t.statut === 'EN_ATTENTE_CORRECTION');
  const enCours = infos.some((t) => t.statut === 'EN_COURS');
  const remplie = seuilExige ? reussie : passee;
  const p = plafond(regles);
  const echecDefinitif = !remplie && !enAttente && !enCours && passee && p != null && infos.length >= p;
  const scores = infos.filter((t) => t.score != null && (t.statut === 'REUSSIE' || t.statut === 'ECHOUEE')).map((t) => t.score!);
  let statut: StatutEtape;
  if (remplie) statut = reussie ? 'REUSSIE' : 'TERMINEE';
  else if (enAttente) statut = 'EN_ATTENTE_CORRECTION';
  else if (echecDefinitif) statut = 'ECHOUEE';
  else if (enCours || passee) statut = 'EN_COURS';
  else statut = 'A_FAIRE';
  return { id, obligatoire, seuilExige, statut, remplie, enAttente: enAttente && !remplie, echecDefinitif, meilleur: scores.length ? Math.max(...scores) : null, infos, regles };
}

const moyenne = (v: (number | null)[]) => {
  const n = v.filter((x): x is number => x != null);
  return n.length ? arrondi(n.reduce((s, x) => s + x, 0) / n.length) : null;
};

function seuilAff(a: AffectationS, e: EvaluationS | null, f: FormationS | null): number {
  if (a.seuilReussite != null) return a.seuilReussite;
  if (e && e.seuilReussite != null) return e.seuilReussite;
  return f ? f.seuilReussite : db.parametres.seuilDefaut;
}

function reglesAff(a: AffectationS, e: EvaluationS, f: FormationS | null): Regles {
  return {
    tentativesMax: a.tentativesMax ?? e.tentativesMax ?? f?.tentativesMax ?? null,
    apresEchec: e.tentativeApresEchec ?? (f ? f.tentativeApresEchec : true),
    delaiHeures: e.delaiEntreTentativesHeures ?? f?.delaiEntreTentativesHeures ?? 0,
    supplementaires: a.tentativesSupplementaires,
  };
}

const seuilExige = (e: EvaluationS, f: FormationS | null) =>
  !f ? true : e.type === 'EVALUATION_FINALE' ? f.exigenceSeuil !== 'MODULES' : f.exigenceSeuil !== 'FINALE';
const repetition = (e: EvaluationS) => !e.obligatoire && e.type !== 'EVALUATION_FINALE';

function info(t: TentativeS, vueApprenant: boolean): TInfo {
  const masque = vueApprenant && (t.statut === 'REUSSIE' || t.statut === 'ECHOUEE') && !t.resultatPublie;
  return { id: t.id, statut: masque ? 'EN_ATTENTE_CORRECTION' : t.statut, score: masque ? null : t.score, fin: t.dateCorrection ?? t.dateSoumission };
}

interface EtatParcours {
  statut: StatutAffectation;
  score: number | null;
  progression: number;
  modules: { id: string; statut: StatutEtape; accessible: boolean; valide: boolean; vues: number; obligatoires: number; total: number; evals: EvalEtat[] }[];
  finale: EvalEtat | null;
  finaleAccessible: boolean;
  autres: EvalEtat[];
  modulesRestants: number;
  conditions: string[];
}

function etat(a: AffectationS, vueApprenant: boolean): EtatParcours {
  const tentatives = tentativesDe(a.id);
  const infosDe = (evalId: string) => tentatives.filter((t) => t.evaluationId === evalId).map((t) => info(t, vueApprenant));
  if (!a.formationId) {
    const e = evaluation(a.evaluationId!);
    const ee = evaluer(e.id, true, true, reglesAff(a, e, null), infosDe(e.id));
    const statut: StatutAffectation = ee.remplie ? 'REUSSIE' : ee.statut === 'ECHOUEE' ? 'ECHOUEE' : ee.statut === 'EN_ATTENTE_CORRECTION' ? 'EN_ATTENTE_CORRECTION' : ee.statut === 'EN_COURS' ? 'EN_COURS' : 'NON_COMMENCEE';
    return {
      statut,
      score: ee.meilleur,
      progression: ee.remplie ? 100 : 0,
      modules: [],
      finale: ee,
      finaleAccessible: true,
      autres: [],
      modulesRestants: 0,
      conditions: ee.remplie ? [] : [ee.enAttente ? 'Correction en attente' : 'Atteindre le seuil de réussite'],
    };
  }
  const f = formation(a.formationId);
  const consultees = new Set(db.progressions.filter((p) => p.affectationId === a.id).map((p) => p.leconId));
  const evals = evaluationsDe(f.id);
  let precedentsValides = true;
  let total = 0;
  let faits = 0;
  let activite = consultees.size > 0;
  let enAttente = false;
  let echec = false;
  const modules: EtatParcours['modules'] = [];
  for (const m of modulesDe(f.id)) {
    const ls = leconsDe(m.id);
    const ees = evals.filter((e) => e.moduleId === m.id).map((e) => evaluer(e.id, e.obligatoire, seuilExige(e, f), reglesAff(a, e, f), infosDe(e.id)));
    const obligatoires = ls.filter((l) => l.obligatoire).length;
    const vuesOblig = ls.filter((l) => l.obligatoire && consultees.has(l.id)).length;
    const vues = ls.filter((l) => consultees.has(l.id)).length;
    const eo = ees.filter((x) => x.obligatoire);
    const leconsOk = vuesOblig === obligatoires;
    const evalsOk = eo.every((x) => x.remplie);
    const valide = leconsOk && evalsOk;
    const accessible = !f.progressionSequentielle || precedentsValides;
    const mAttente = leconsOk && !evalsOk && eo.filter((x) => !x.remplie).every((x) => x.enAttente);
    const mEchec = eo.some((x) => x.echecDefinitif);
    const mActivite = vues > 0 || ees.some((x) => x.infos.length > 0);
    const statut: StatutEtape = valide ? 'VALIDE' : mEchec ? 'ECHOUEE' : mAttente ? 'EN_ATTENTE_CORRECTION' : mActivite ? 'EN_COURS' : accessible ? 'A_FAIRE' : 'VERROUILLE';
    modules.push({ id: m.id, statut, accessible, valide, vues, obligatoires, total: ls.length, evals: ees });
    if (m.obligatoire) {
      total += obligatoires + eo.length;
      faits += vuesOblig + eo.filter((x) => x.remplie).length;
      if (!valide) {
        precedentsValides = false;
        enAttente ||= mAttente;
        echec ||= mEchec;
      }
    }
    activite ||= mActivite;
  }
  const conditions: string[] = [];
  const restants = modulesDe(f.id).filter((m, i) => m.obligatoire && !modules[i].valide).length;
  if (restants > 0) conditions.push(restants === 1 ? '1 module obligatoire à valider' : `${restants} modules obligatoires à valider`);
  const fe = evals.find((e) => !e.moduleId && e.type === 'EVALUATION_FINALE');
  const finale = fe ? evaluer(fe.id, true, seuilExige(fe, f), reglesAff(a, fe, f), infosDe(fe.id)) : null;
  if (finale) {
    total += 1;
    if (finale.remplie) faits += 1;
    else {
      conditions.push(finale.seuilExige ? "Réussir l'évaluation finale" : "Passer l'évaluation finale");
      enAttente ||= finale.enAttente;
      echec ||= finale.echecDefinitif;
    }
    activite ||= finale.infos.length > 0;
  }
  const autres = evals.filter((e) => !e.moduleId && e !== fe).map((e) => evaluer(e.id, false, seuilExige(e, f), reglesAff(a, e, f), infosDe(e.id)));
  const reussie = restants === 0 && (!finale || finale.remplie);
  const statut: StatutAffectation = reussie ? 'REUSSIE' : echec ? 'ECHOUEE' : enAttente ? 'EN_ATTENTE_CORRECTION' : activite ? 'EN_COURS' : 'NON_COMMENCEE';
  if (enAttente && !reussie) conditions.push('Correction en attente');
  const score = finale?.meilleur ?? moyenne(modules.flatMap((m) => m.evals.filter((x) => x.obligatoire).map((x) => x.meilleur)));
  return {
    statut,
    score: finale ? finale.meilleur : score,
    progression: total === 0 ? (reussie ? 100 : 0) : Math.round((faits * 100) / total),
    modules,
    finale,
    finaleAccessible: restants === 0,
    autres,
    modulesRestants: restants,
    conditions,
  };
}

function recalculer(a: AffectationS) {
  if (a.statut === 'ANNULEE') return;
  const avant = a.statut;
  const e = etat(a, false);
  a.statut = e.statut;
  a.score = e.score;
  const terminee = e.statut === 'REUSSIE' || e.statut === 'ECHOUEE';
  a.dateFin = terminee ? (a.dateFin && avant === e.statut ? a.dateFin : maintenant()) : null;
}

function affectationDto(a: AffectationS, vueApprenant: boolean): Affectation {
  const f = a.formationId ? formation(a.formationId) : null;
  const e = a.evaluationId ? evaluation(a.evaluationId) : null;
  const et = a.statut === 'ANNULEE' ? null : etat(a, vueApprenant);
  const statut = et ? et.statut : a.statut;
  const ts = tentativesDe(a.id);
  return {
    id: a.id,
    formationId: a.formationId,
    evaluationId: a.evaluationId,
    titre: f ? f.titre : e!.titre,
    nature: f ? 'FORMATION' : 'EVALUATION',
    categorie: f?.categorie ?? null,
    typeEvaluation: e?.type ?? null,
    version: f ? f.version : e!.version,
    delegueId: a.delegueId,
    delegueNom: nom(a.delegueId),
    assigneParNom: nom(a.assigneParId),
    cibleType: a.cibleType,
    cibleLibelle: a.cibleLibelle,
    dateDebut: a.dateDebut,
    dateLimite: a.dateLimite,
    obligatoire: a.obligatoire,
    priorite: a.priorite,
    tentativesMax: a.tentativesMax ?? (f ? f.tentativesMax : e!.tentativesMax),
    seuilReussite: seuilAff(a, f ? null : e, f),
    tentativesSupplementaires: a.tentativesSupplementaires,
    statut,
    score: et ? et.score : a.score,
    progression: et ? et.progression : 0,
    enRetard: !!a.dateLimite && a.dateLimite < aujourdhui() && statut !== 'REUSSIE' && statut !== 'ANNULEE',
    dateAffectation: a.dateAffectation,
    datePremiereActivite: a.datePremiereActivite,
    dateDerniereActivite: a.dateDerniereActivite,
    dateFin: a.dateFin,
    nbTentatives: ts.length,
    correctionsEnAttente: ts.filter((t) => t.statut === 'EN_ATTENTE_CORRECTION').length,
  };
}

function raisonBlocage(a: AffectationS, e: EvaluationS, f: FormationS | null, accessible: boolean, sinon: string | null): string | null {
  if (a.statut === 'ANNULEE') return 'Affectation annulée.';
  if (a.dateDebut > aujourdhui()) return `Disponible à partir du ${a.dateDebut}.`;
  const statut = f ? f.statut : e.statut;
  if (statut === 'ARCHIVEE') return 'Contenu archivé : consultation des résultats uniquement.';
  if (statut !== 'PUBLIEE') return 'Contenu non publié.';
  return accessible ? null : sinon;
}

function evaluationParcours(a: AffectationS, e: EvaluationS, f: FormationS | null, ee: EvalEtat, accessible: boolean, sinon: string | null): EvaluationParcours {
  const qs = questionsDe(e.id);
  const enCours = ee.infos.find((t) => t.statut === 'EN_COURS')?.id ?? null;
  const raison = raisonBlocage(a, e, f, accessible, sinon) ?? raisonRefus(ee.regles, ee.infos, repetition(e));
  const p = plafond(ee.regles);
  return {
    id: e.id,
    titre: e.titre,
    type: e.type,
    consignes: e.consignes,
    dureeMinutes: e.dureeMinutes,
    obligatoire: ee.obligatoire,
    seuilReussite: seuilAff(a, e, f),
    seuilExige: ee.seuilExige,
    nbQuestions: qs.length,
    pointsTotal: qs.reduce((s, q) => s + q.points, 0),
    statut: !accessible && ee.statut === 'A_FAIRE' ? 'VERROUILLE' : ee.statut,
    tentativesUtilisees: ee.infos.length,
    tentativesMax: p,
    tentativesRestantes: p == null ? null : Math.max(0, p - ee.infos.length),
    peutDemarrer: enCours != null || raison == null,
    raisonBlocage: enCours ? null : raison,
    tentativeEnCoursId: enCours,
    meilleurScore: ee.meilleur,
    prochaineTentativePossible: prochaineTentative(ee.regles, ee.infos),
  };
}

function parcours(a: AffectationS, vueApprenant: boolean): Parcours {
  const et = etat(a, vueApprenant);
  const dto = affectationDto(a, vueApprenant);
  if (!a.formationId) {
    const e = evaluation(a.evaluationId!);
    return {
      affectation: dto,
      description: e.consignes,
      objectifs: null,
      niveau: null,
      dureeEstimeeMinutes: e.dureeMinutes,
      exigenceSeuil: null,
      progressionSequentielle: false,
      modules: [],
      evaluationFinale: evaluationParcours(a, e, null, et.finale!, true, null),
      evaluationFinaleAccessible: true,
      exercices: [],
      modulesRestants: 0,
      conditionsRestantes: et.conditions,
    };
  }
  const f = formation(a.formationId);
  const evals = evaluationsDe(f.id);
  const vues = new Map(db.progressions.filter((p) => p.affectationId === a.id).map((p) => [p.leconId, p.date]));
  const modules: ModuleParcours[] = modulesDe(f.id).map((m, i) => {
    const me = et.modules[i];
    const blocage = me.accessible ? null : "Validez d'abord les modules obligatoires précédents.";
    return {
      id: m.id,
      titre: m.titre,
      description: m.description,
      ordre: m.ordre,
      obligatoire: m.obligatoire,
      statut: me.statut,
      accessible: me.accessible,
      leconsVues: me.vues,
      leconsObligatoires: me.obligatoires,
      leconsTotal: me.total,
      lecons: leconsDe(m.id).map((l) => ({
        id: l.id,
        titre: l.titre,
        type: l.type,
        contenu: l.contenu,
        url: l.url,
        aFichier: l.fichier != null,
        fichierNom: l.fichierNom,
        fichierType: l.fichierType,
        dureeMinutes: l.dureeMinutes,
        ordre: l.ordre,
        obligatoire: l.obligatoire,
        consultee: vues.has(l.id),
        dateConsultation: vues.get(l.id) ?? null,
      })),
      evaluations: evals.filter((e) => e.moduleId === m.id).map((e) => evaluationParcours(a, e, f, me.evals.find((x) => x.id === e.id)!, me.accessible, blocage)),
    };
  });
  const fe = evals.find((e) => !e.moduleId && e.type === 'EVALUATION_FINALE');
  return {
    affectation: dto,
    description: f.description,
    objectifs: f.objectifs,
    niveau: f.niveau,
    dureeEstimeeMinutes: f.dureeEstimeeMinutes,
    exigenceSeuil: f.exigenceSeuil,
    progressionSequentielle: f.progressionSequentielle,
    modules,
    evaluationFinale: fe && et.finale ? evaluationParcours(a, fe, f, et.finale, et.finaleAccessible, "Validez d'abord tous les modules obligatoires.") : null,
    evaluationFinaleAccessible: et.finaleAccessible,
    exercices: evals.filter((e) => !e.moduleId && e !== fe).map((e) => evaluationParcours(a, e, f, et.autres.find((x) => x.id === e.id)!, true, null)),
    modulesRestants: et.modulesRestants,
    conditionsRestantes: et.conditions,
  };
}

// ─── Correction (CorrecteurEvaluation) ────────────────────────────────────────

const manuelle = (q: Question) => q.type === 'MANUELLE' || (q.type === 'REPONSE_COURTE' && q.reponsesAcceptees.length === 0);
const vide = (r?: ReponseS) => !r || (r.propositionIds.length === 0 && !texte(r.texte));

function corrigerQuestion(q: Question, r: ReponseS) {
  if (manuelle(q)) {
    if (vide(r)) Object.assign(r, { pointsObtenus: 0, correcte: false, corrigee: true });
    else Object.assign(r, { pointsObtenus: null, correcte: null, corrigee: false });
    return;
  }
  let ok: boolean;
  if (q.type === 'REPONSE_COURTE') {
    const d = normaliser(r.texte);
    ok = d !== '' && q.reponsesAcceptees.some((x) => normaliser(x) === d);
  } else {
    const attendues = q.propositions.filter((p) => p.correcte).map((p) => p.id).sort();
    const choisies = [...new Set(r.propositionIds)].sort();
    ok = attendues.length > 0 && attendues.join() === choisies.join();
  }
  Object.assign(r, { pointsObtenus: ok ? q.points : 0, correcte: ok, corrigee: true });
}

const scoreSur100 = (obtenus: number, max: number) => (max <= 0 ? 0 : arrondi((obtenus * 100) / max));

function finaliser(t: TentativeS, publier: boolean) {
  t.score = scoreSur100(t.pointsObtenus ?? 0, t.pointsMax);
  t.statut = t.score >= t.seuilApplique ? 'REUSSIE' : 'ECHOUEE';
  t.resultatPublie = t.resultatPublie || publier || t.snapshot.publicationResultats === 'IMMEDIATE';
}

const terminee = (t: TentativeS) => t.statut === 'REUSSIE' || t.statut === 'ECHOUEE';
const expiree = (t: TentativeS) => !!t.dateExpiration && Date.now() > new Date(t.dateExpiration).getTime() + 60_000;

function apresResultat(t: TentativeS, a: AffectationS, soumission: boolean) {
  if (soumission) {
    const d = utilisateurs.find((x) => x.id === t.delegueId);
    const detail = t.statut === 'EN_ATTENTE_CORRECTION' ? 'à corriger' : `${t.score}/100${t.resultatPublie ? '' : ' (résultat à publier)'}`;
    notifier(d?.managerId, 'EVALUATION_TERMINEE', `${nom(t.delegueId)} a terminé « ${t.snapshot.titre} »`, `Tentative ${t.numero} : ${detail}.`, a, t.id);
  }
  if (terminee(t) && t.resultatPublie) {
    const ok = t.statut === 'REUSSIE';
    notifier(t.delegueId, ok ? 'RESULTAT_DISPONIBLE' : 'ECHEC', `${ok ? 'Réussi' : 'Seuil non atteint'} : ${t.snapshot.titre}`, `Score ${t.score}/100 (seuil ${t.seuilApplique}/100).`, a, t.id);
  }
  const dejaValidee = db.notifications.some((n) => n.affectationId === a.id && n.type === 'FORMATION_VALIDEE');
  if (!dejaValidee && etat(a, true).statut === 'REUSSIE') {
    notifier(a.delegueId, 'FORMATION_VALIDEE', `${a.formationId ? 'Formation validée' : 'Exercice réussi'} : ${titreContenu(a)}`, null, a);
  }
}

function soumettreInterne(t: TentativeS, estExpiree: boolean) {
  const qs = t.snapshot.questions;
  if (!estExpiree) {
    const manquantes = qs.filter((q) => q.obligatoire && vide(t.reponses.find((r) => r.questionId === q.id))).map((q) => q.ordre);
    if (manquantes.length) throw new ErreurMetier(`Répondez aux questions obligatoires : ${manquantes.join(', ')}.`);
  }
  let attente = false;
  for (const q of qs) {
    let r = t.reponses.find((x) => x.questionId === q.id);
    if (!r) {
      r = { questionId: q.id, propositionIds: [], texte: null, pointsObtenus: null, correcte: null, corrigee: false, commentaire: null };
      t.reponses.push(r);
    }
    corrigerQuestion(q, r);
    attente ||= !r.corrigee;
  }
  t.dateSoumission = maintenant();
  t.pointsObtenus = arrondi(t.reponses.reduce((s, r) => s + (r.pointsObtenus ?? 0), 0));
  if (attente) t.statut = 'EN_ATTENTE_CORRECTION';
  else finaliser(t, false);
  const a = db.affectations.find((x) => x.id === t.affectationId)!;
  a.dateDerniereActivite = maintenant();
  recalculer(a);
  apresResultat(t, a, true);
}

function correctionsVisibles(t: TentativeS): boolean {
  switch (t.snapshot.affichageCorrections) {
    case 'JAMAIS':
      return false;
    case 'APRES_SOUMISSION':
      return true;
    case 'APRES_REUSSITE':
      return t.statut === 'REUSSIE';
    case 'APRES_DERNIERE_TENTATIVE': {
      if (t.statut === 'REUSSIE') return true;
      const a = db.affectations.find((x) => x.id === t.affectationId)!;
      const e = evaluation(t.evaluationId);
      const p = plafond(reglesAff(a, e, a.formationId ? formation(a.formationId) : null));
      return p != null && tentativesDe(a.id).filter((x) => x.evaluationId === e.id).length >= p;
    }
  }
}

function resultat(t: TentativeS, vueApprenant: boolean): ResultatTentative {
  const fini = terminee(t);
  const visible = fini && (!vueApprenant || t.resultatPublie);
  const corr = !vueApprenant || (visible && correctionsVisibles(t));
  const detail = t.statut !== 'EN_COURS';
  const message =
    t.statut === 'EN_COURS'
      ? 'Tentative en cours.'
      : t.statut === 'EN_ATTENTE_CORRECTION'
        ? 'Résultat en attente de correction.'
        : !visible
          ? 'Résultat disponible après publication par votre manager.'
          : `${t.statut === 'REUSSIE' ? 'Réussi' : 'Seuil non atteint'} : ${t.score}/100 (seuil ${t.seuilApplique}/100).`;
  return {
    id: t.id,
    affectationId: t.affectationId,
    evaluationId: t.evaluationId,
    delegueId: t.delegueId,
    delegueNom: nom(t.delegueId),
    titre: t.snapshot.titre,
    type: t.snapshot.type,
    numero: t.numero,
    statut: !vueApprenant || visible || !fini ? t.statut : 'EN_ATTENTE_CORRECTION',
    dateDebut: t.dateDebut,
    dateSoumission: t.dateSoumission,
    dateCorrection: t.dateCorrection,
    correcteurNom: t.correcteurId ? nom(t.correcteurId) : null,
    resultatPublie: t.resultatPublie,
    resultatVisible: visible || (!vueApprenant && fini),
    correctionsVisibles: corr,
    score: visible || !vueApprenant ? t.score : null,
    pointsObtenus: visible || !vueApprenant ? t.pointsObtenus : null,
    pointsMax: t.pointsMax,
    seuil: t.seuilApplique,
    reussie: visible || (!vueApprenant && fini) ? t.statut === 'REUSSIE' : null,
    message,
    questions: t.snapshot.questions.map((q) => {
      const r = t.reponses.find((x) => x.questionId === q.id);
      const choisies = new Set(r?.propositionIds ?? []);
      return {
        id: q.id,
        type: q.type,
        enonce: q.enonce,
        points: q.points,
        ordre: q.ordre,
        correctionManuelle: manuelle(q),
        propositions: q.propositions.map((p) => ({ id: p.id, libelle: p.libelle, correcte: corr ? p.correcte : null, choisie: choisies.has(p.id) })),
        texteDonne: r?.texte ?? null,
        pointsObtenus: corr && detail && r ? r.pointsObtenus : null,
        correcte: corr && detail && r ? r.correcte : null,
        corrigee: !!r?.corrigee,
        explication: corr ? q.explication : null,
        reponsesAcceptees: corr ? q.reponsesAcceptees : null,
        commentaire: visible || !vueApprenant ? (r?.commentaire ?? null) : null,
      };
    }),
  };
}

function resumeTentative(t: TentativeS, vueApprenant: boolean): TentativeResume {
  const e = db.evaluations.find((x) => x.id === t.evaluationId);
  const f = e?.formationId ? db.formations.find((x) => x.id === e.formationId) : null;
  const visible = !vueApprenant || t.resultatPublie;
  return {
    id: t.id,
    affectationId: t.affectationId,
    evaluationId: t.evaluationId,
    evaluationTitre: e?.titre ?? t.snapshot.titre,
    formationTitre: f?.titre ?? null,
    type: e?.type ?? t.snapshot.type,
    delegueId: t.delegueId,
    delegueNom: nom(t.delegueId),
    numero: t.numero,
    statut: visible || !terminee(t) ? t.statut : 'EN_ATTENTE_CORRECTION',
    dateDebut: t.dateDebut,
    dateSoumission: t.dateSoumission,
    dateCorrection: t.dateCorrection,
    score: visible ? t.score : null,
    seuil: t.seuilApplique,
    resultatPublie: t.resultatPublie,
  };
}

function passage(t: TentativeS): TentativePassage {
  const s = t.snapshot;
  return {
    id: t.id,
    affectationId: t.affectationId,
    evaluationId: t.evaluationId,
    titre: s.titre,
    consignes: s.consignes,
    type: s.type,
    numero: t.numero,
    statut: t.statut,
    dateDebut: t.dateDebut,
    dateExpiration: t.dateExpiration,
    dureeMinutes: s.dureeMinutes,
    pointsMax: t.pointsMax,
    seuil: t.seuilApplique,
    questions: s.questions.map((q) => ({ id: q.id, type: q.type, enonce: q.enonce, points: q.points, ordre: q.ordre, obligatoire: q.obligatoire, propositions: q.propositions.map((p) => ({ id: p.id, libelle: p.libelle })) })),
    reponses: t.reponses.map((r) => ({ questionId: r.questionId, propositionIds: [...r.propositionIds], texte: r.texte })),
  };
}

function sansDestinataire(n: NotificationFormation & { destinataireId: string }): NotificationFormation {
  const { destinataireId, ...reste } = n;
  void destinataireId;
  return reste;
}

function titreContenu(a: AffectationS): string {
  return a.formationId ? formation(a.formationId).titre : evaluation(a.evaluationId!).titre;
}

// ─── Opérations internes (utilisées aussi par le jeu de données initial) ──────

const ops = {
  creerFormation(u: Utilisateur, d: FormationDto): FormationS {
    exigerGestion(u);
    verifierLimites(d.seuilReussite, d.tentativesMax, u);
    const id = generateId('form');
    const f: FormationS = {
      id,
      titre: d.titre.trim(),
      description: texte(d.description),
      objectifs: texte(d.objectifs),
      categorie: d.categorie,
      niveau: d.niveau,
      dureeEstimeeMinutes: d.dureeEstimeeMinutes ?? null,
      couverture: null,
      seuilReussite: d.seuilReussite,
      tentativesMax: d.tentativesMax ?? null,
      delaiEntreTentativesHeures: d.delaiEntreTentativesHeures ?? 0,
      tentativeApresEchec: d.tentativeApresEchec ?? true,
      exigenceSeuil: d.exigenceSeuil,
      progressionSequentielle: d.progressionSequentielle ?? true,
      echeance: d.echeance ?? null,
      statut: 'BROUILLON',
      version: 1,
      formationRacineId: id,
      globale: estAdmin(u),
      createurId: u.id,
      dateCreation: maintenant(),
      dateModification: maintenant(),
      datePublication: null,
      dateArchivage: null,
    };
    db.formations.push(f);
    journal('CREATION', u.id, `Création de « ${f.titre} »`, { formationId: f.id });
    return f;
  },
  contenuModifie(u: Utilisateur, f: FormationS, detail: string) {
    f.dateModification = maintenant();
    journal('CONTENU_MODIFIE', u.id, detail, { formationId: f.id });
  },
  ajouterModule(u: Utilisateur, formationId: string, d: ModuleDto): ModuleS {
    exigerGestion(u);
    const f = formation(formationId);
    verifierContenuModifiableF(u, f);
    const m: ModuleS = { id: generateId('mod'), formationId, titre: d.titre.trim(), description: texte(d.description), ordre: modulesDe(formationId).length + 1, obligatoire: d.obligatoire ?? true };
    db.modules.push(m);
    ops.contenuModifie(u, f, `Module « ${m.titre} » ajouté`);
    return m;
  },
  ajouterLecon(u: Utilisateur, moduleId: string, d: LeconFormDto): LeconS {
    exigerGestion(u);
    const m = module_(moduleId);
    const f = formation(m.formationId);
    verifierContenuModifiableF(u, f);
    verifierLecon(d);
    const l: LeconS = { id: generateId('lec'), moduleId, titre: d.titre.trim(), type: d.type, contenu: texte(d.contenu), url: texte(d.url), fichier: null, fichierNom: null, fichierType: null, fichierTaille: null, dureeMinutes: d.dureeMinutes ?? null, ordre: leconsDe(moduleId).length + 1, obligatoire: d.obligatoire ?? true };
    db.lecons.push(l);
    ops.contenuModifie(u, f, `Leçon « ${l.titre} » ajoutée au module « ${m.titre} »`);
    return l;
  },
  creerEvaluation(u: Utilisateur, d: EvaluationDto): EvaluationS {
    exigerGestion(u);
    verifierLimites(d.seuilReussite, d.tentativesMax, u);
    let formationId = d.formationId ?? null;
    let parent: FormationS | null = null;
    if (d.moduleId) {
      const m = module_(d.moduleId);
      if (formationId && formationId !== m.formationId) throw new ErreurMetier("Le module n'appartient pas à cette formation.");
      formationId = m.formationId;
      if (d.type === 'EVALUATION_FINALE') throw new ErreurMetier("L'évaluation finale se rattache à la formation, pas à un module.");
    }
    if (formationId) {
      parent = formation(formationId);
      verifierContenuModifiableF(u, parent);
      if (d.type === 'EVALUATION_FINALE' && evaluationsDe(formationId).some((x) => x.type === 'EVALUATION_FINALE')) {
        throw new ErreurMetier('Cette formation a déjà une évaluation finale.');
      }
    }
    const soeurs = d.moduleId ? db.evaluations.filter((x) => x.moduleId === d.moduleId) : formationId ? evaluationsDe(formationId).filter((x) => !x.moduleId) : [];
    const id = generateId('eval');
    const e: EvaluationS = {
      id,
      formationId,
      moduleId: d.moduleId ?? null,
      type: d.type,
      titre: d.titre.trim(),
      consignes: texte(d.consignes),
      dureeMinutes: d.dureeMinutes ?? null,
      seuilReussite: d.seuilReussite ?? null,
      tentativesMax: d.tentativesMax ?? null,
      delaiEntreTentativesHeures: d.delaiEntreTentativesHeures ?? null,
      tentativeApresEchec: d.tentativeApresEchec ?? null,
      publicationResultats: d.publicationResultats ?? 'IMMEDIATE',
      affichageCorrections: d.affichageCorrections ?? 'APRES_SOUMISSION',
      obligatoire: formationId && !d.moduleId ? d.type === 'EVALUATION_FINALE' : (d.obligatoire ?? true),
      ordre: soeurs.length + 1,
      statut: 'BROUILLON',
      version: 1,
      evaluationRacineId: id,
      globale: parent ? parent.globale : estAdmin(u),
      createurId: u.id,
      dateCreation: maintenant(),
      dateModification: maintenant(),
      datePublication: null,
      dateArchivage: null,
    };
    db.evaluations.push(e);
    journal('CREATION', u.id, `« ${e.titre} » créé(e)`, { formationId, evaluationId: e.id });
    return e;
  },
  ajouterQuestion(u: Utilisateur, evaluationId: string, d: QuestionDto): Question {
    exigerGestion(u);
    const e = evaluation(evaluationId);
    verifierEvaluationModifiable(u, e);
    const q: Question = { id: generateId('q'), evaluationId, type: d.type, enonce: '', points: 0, explication: null, reponsesAcceptees: [], ordre: questionsDe(evaluationId).length + 1, obligatoire: true, propositions: [] };
    appliquerQuestion(q, d);
    db.questions.push(q);
    e.dateModification = maintenant();
    return q;
  },
  publierFormation(u: Utilisateur, id: string): FormationS {
    exigerGestion(u);
    const f = formation(id);
    verifierProprietaireF(u, f);
    if (f.statut !== 'BROUILLON') throw new ErreurMetier('Seul un brouillon peut être publié.');
    const c = controlesFormation(f);
    if (c.length) throw new ErreurMetier(`Publication impossible : ${c.join(' ; ')}`);
    for (const v of db.formations.filter((x) => x.formationRacineId === f.formationRacineId && x.id !== id && x.statut === 'PUBLIEE')) {
      archiverF(v);
      journal('ARCHIVAGE', u.id, `Remplacée par la version ${f.version}`, { formationId: v.id });
    }
    f.statut = 'PUBLIEE';
    f.datePublication = maintenant();
    f.dateModification = maintenant();
    evaluationsDe(f.id).forEach((e) => {
      e.statut = 'PUBLIEE';
      e.datePublication = maintenant();
    });
    journal('PUBLICATION', u.id, `Version ${f.version} publiée`, { formationId: f.id });
    return f;
  },
  publierEvaluation(u: Utilisateur, id: string): EvaluationS {
    exigerGestion(u);
    const e = evaluation(id);
    if (e.formationId) throw new ErreurMetier('Cette évaluation suit le cycle de vie de sa formation.');
    if (!proprietaire(u, e.createurId)) throw new ErreurMetier("Seul l'administrateur ou le créateur peut effectuer cette action.");
    if (e.statut !== 'BROUILLON') throw new ErreurMetier('Seul un brouillon peut être publié.');
    if (questionsDe(id).length === 0) throw new ErreurMetier('Publication impossible : ajoutez au moins une question');
    for (const v of db.evaluations.filter((x) => x.evaluationRacineId === e.evaluationRacineId && x.id !== id && x.statut === 'PUBLIEE')) {
      v.statut = 'ARCHIVEE';
      v.dateArchivage = maintenant();
    }
    e.statut = 'PUBLIEE';
    e.datePublication = maintenant();
    journal('PUBLICATION', u.id, `Version ${e.version} publiée`, { evaluationId: e.id });
    return e;
  },
  resoudre(u: Utilisateur, d: AffectationDto) {
    exigerGestion(u);
    if (!d.formationId === !d.evaluationId) throw new ErreurMetier('Choisissez une formation ou un exercice à affecter.');
    let titre: string;
    let f: FormationS | null = null;
    let e: EvaluationS | null = null;
    if (d.formationId) {
      f = formation(d.formationId);
      verifierVisibleF(u, f);
      if (f.statut !== 'PUBLIEE') throw new ErreurMetier('Seule une formation publiée peut être affectée.');
      titre = f.titre;
    } else {
      e = evaluation(d.evaluationId!);
      if (e.formationId) throw new ErreurMetier("Un quiz de formation s'affecte avec sa formation.");
      if (!peutVoirE(u, e)) throw new ErreurMetier(INTERDIT);
      if (e.statut !== 'PUBLIEE') throw new ErreurMetier('Seul un exercice publié peut être affecté.');
      titre = e.titre;
    }
    verifierLimites(d.seuilReussite, d.tentativesMax, u);
    const debut = d.dateDebut || aujourdhui();
    if (d.dateLimite && d.dateLimite < debut) throw new ErreurMetier('La date limite doit être postérieure à la date de début.');
    const visibles = deleguesVisibles(u);
    let delegues: Utilisateur[];
    let libelle: string;
    switch (d.cibleType) {
      case 'DELEGUES': {
        if (!d.delegueIds?.length) throw new ErreurMetier('Sélectionnez au moins un délégué.');
        if (!d.delegueIds.every((id) => visibles.some((v) => v.id === id))) throw new ErreurMetier(INTERDIT);
        delegues = visibles.filter((v) => d.delegueIds!.includes(v.id));
        libelle = delegues.length === 1 ? nom(delegues[0].id) : `${delegues.length} délégués sélectionnés`;
        break;
      }
      case 'EQUIPE': {
        const managerId = d.managerId ?? (u.role === UserRole.MANAGER ? u.id : null);
        if (!managerId) throw new ErreurMetier("Choisissez l'équipe (manager) à cibler.");
        if (u.role === UserRole.MANAGER && managerId !== u.id) throw new ErreurMetier(INTERDIT);
        delegues = visibles.filter((v) => v.managerId === managerId);
        libelle = `Équipe de ${nom(managerId)}`;
        break;
      }
      case 'REGION': {
        if (!d.region?.trim()) throw new ErreurMetier('Choisissez la région à cibler.');
        delegues = visibles.filter((v) => correspond(v.id, null, d.region));
        libelle = `Région ${d.region.trim()}`;
        break;
      }
      default:
        delegues = visibles;
        libelle = estAdmin(u) ? 'Tous les délégués' : 'Toute mon équipe';
    }
    if (delegues.length === 0) throw new ErreurMetier('Aucun délégué ne correspond à ce ciblage.');
    const deja = new Set(db.affectations.filter((a) => a.statut !== 'ANNULEE' && (f ? a.formationId === f.id : a.evaluationId === e!.id)).map((a) => a.delegueId));
    const avertissements: string[] = [];
    const nbDeja = delegues.filter((x) => deja.has(x.id)).length;
    if (nbDeja) avertissements.push(`${nbDeja} délégué(s) déjà affecté(s) seront ignorés.`);
    if (f?.echeance && d.dateLimite && d.dateLimite > f.echeance) avertissements.push(`La date limite dépasse l'échéance de la formation (${f.echeance}).`);
    if (d.dateLimite && d.dateLimite < aujourdhui()) avertissements.push('La date limite est déjà passée : les affectations seront immédiatement en retard.');
    return { titre, f, e, libelle, delegues, deja, avertissements, debut };
  },
  affecter(u: Utilisateur, d: AffectationDto): AffectationS[] {
    const r = ops.resoudre(u, d);
    const limite = d.dateLimite ?? r.f?.echeance ?? null;
    const creees: AffectationS[] = [];
    for (const del of r.delegues) {
      if (r.deja.has(del.id)) continue;
      const a: AffectationS = {
        id: generateId('aff'),
        formationId: r.f?.id ?? null,
        evaluationId: r.e?.id ?? null,
        delegueId: del.id,
        assigneParId: u.id,
        cibleType: d.cibleType,
        cibleLibelle: r.libelle,
        dateDebut: r.debut,
        dateLimite: limite,
        obligatoire: d.obligatoire ?? true,
        priorite: d.priorite ?? 'NORMALE',
        tentativesMax: d.tentativesMax ?? null,
        seuilReussite: d.seuilReussite ?? null,
        tentativesSupplementaires: 0,
        statut: 'NON_COMMENCEE',
        score: null,
        dateAffectation: maintenant(),
        datePremiereActivite: null,
        dateDerniereActivite: null,
        dateFin: null,
      };
      db.affectations.push(a);
      creees.push(a);
      notifier(del.id, r.f ? 'NOUVELLE_FORMATION' : 'NOUVEL_EXERCICE', `${r.f ? 'Nouvelle formation' : 'Nouvel exercice'} : ${r.titre}`, `${a.obligatoire ? 'Obligatoire' : 'Facultatif'}${limite ? `, à terminer avant le ${limite}` : ''}.`, a);
    }
    if (creees.length) journal('AFFECTATION', u.id, `${creees.length} affectation(s) — ${r.libelle}`, { formationId: r.f?.id, evaluationId: r.e?.id });
    return creees;
  },
  consulter(u: Utilisateur, affectationId: string, leconId: string) {
    const a = affectationDuDelegue(u, affectationId);
    if (!a.formationId) throw new ErreurMetier(`Leçon introuvable : ${leconId}`);
    const l = lecon(leconId);
    const p = parcours(a, true);
    const m = p.modules.find((x) => x.id === l.moduleId);
    if (!m) throw new ErreurMetier(`Leçon introuvable : ${leconId}`);
    if (a.dateDebut > aujourdhui()) throw new ErreurMetier(`Cette formation est disponible à partir du ${a.dateDebut}.`);
    if (!m.accessible) throw new ErreurMetier("Validez d'abord les modules obligatoires précédents.");
    if (!db.progressions.some((x) => x.affectationId === a.id && x.leconId === leconId)) {
      db.progressions.push({ affectationId: a.id, leconId, date: maintenant() });
    }
    a.datePremiereActivite ??= maintenant();
    a.dateDerniereActivite = maintenant();
    recalculer(a);
    return a;
  },
  demarrer(u: Utilisateur, affectationId: string, evaluationId: string): TentativeS {
    const a = affectationDuDelegue(u, affectationId);
    tentativesDe(a.id).filter((t) => t.statut === 'EN_COURS' && expiree(t)).forEach((t) => soumettreInterne(t, true));
    const e = evaluation(evaluationId);
    if (a.formationId ? e.formationId !== a.formationId : a.evaluationId !== e.id) throw new ErreurMetier(`Évaluation introuvable : ${evaluationId}`);
    const enCours = tentativesDe(a.id).find((t) => t.evaluationId === e.id && t.statut === 'EN_COURS');
    if (enCours) return enCours;
    const p = parcours(a, true);
    const toutes = [...p.modules.flatMap((m) => m.evaluations), ...(p.evaluationFinale ? [p.evaluationFinale] : []), ...p.exercices];
    const ep = toutes.find((x) => x.id === e.id)!;
    if (!ep.peutDemarrer) throw new ErreurMetier(ep.raisonBlocage ?? 'Évaluation indisponible.');
    const f = a.formationId ? formation(a.formationId) : null;
    const seuil = seuilAff(a, e, f);
    const questions = copie(questionsDe(e.id));
    const t: TentativeS = {
      id: generateId('tent'),
      affectationId: a.id,
      evaluationId: e.id,
      delegueId: u.id,
      numero: tentativesDe(a.id).filter((x) => x.evaluationId === e.id).length + 1,
      statut: 'EN_COURS',
      dateDebut: maintenant(),
      dateExpiration: e.dureeMinutes ? new Date(Date.now() + e.dureeMinutes * 60_000).toISOString() : null,
      dateSoumission: null,
      dateCorrection: null,
      correcteurId: null,
      pointsObtenus: null,
      pointsMax: questions.reduce((s, q) => s + q.points, 0),
      score: null,
      seuilApplique: seuil,
      resultatPublie: false,
      snapshot: { evaluationId: e.id, titre: e.titre, consignes: e.consignes, type: e.type, dureeMinutes: e.dureeMinutes, seuil, publicationResultats: e.publicationResultats, affichageCorrections: e.affichageCorrections, questions },
      reponses: [],
    };
    db.tentatives.push(t);
    a.datePremiereActivite ??= maintenant();
    a.dateDerniereActivite = maintenant();
    recalculer(a);
    return t;
  },
  enregistrer(t: TentativeS, reponses: ReponseQuestion[]) {
    for (const r of reponses) {
      const q = t.snapshot.questions.find((x) => x.id === r.questionId);
      if (!q) throw new ErreurMetier(`Question inconnue dans cette évaluation : ${r.questionId}`);
      const sel = [...new Set(r.propositionIds ?? [])];
      if (!sel.every((id) => q.propositions.some((p) => p.id === id))) throw new ErreurMetier(`Proposition inconnue pour la question ${q.ordre}.`);
      if ((q.type === 'QCM_UNIQUE' || q.type === 'VRAI_FAUX') && sel.length > 1) throw new ErreurMetier(`Une seule réponse est attendue à la question ${q.ordre}.`);
      let rep = t.reponses.find((x) => x.questionId === q.id);
      if (!rep) {
        rep = { questionId: q.id, propositionIds: [], texte: null, pointsObtenus: null, correcte: null, corrigee: false, commentaire: null };
        t.reponses.push(rep);
      }
      rep.propositionIds = sel;
      rep.texte = texte(r.texte);
    }
  },
  corriger(u: Utilisateur, id: string, notes: { questionId: string; points: number; commentaire?: string }[], publier?: boolean): TentativeS {
    const t = tentativeVisible(u, id);
    if (t.statut !== 'EN_ATTENTE_CORRECTION') throw new ErreurMetier("Cette tentative n'attend pas de correction.");
    for (const n of notes) {
      const q = t.snapshot.questions.find((x) => x.id === n.questionId);
      const r = t.reponses.find((x) => x.questionId === n.questionId);
      if (!q || !r || !manuelle(q)) throw new ErreurMetier(`Question non concernée par la correction manuelle : ${n.questionId}`);
      if (n.points < 0 || n.points > q.points) throw new ErreurMetier(`La question ${q.ordre} est notée sur ${q.points} point(s) au maximum.`);
      Object.assign(r, { pointsObtenus: n.points, correcte: n.points === q.points, corrigee: true, commentaire: texte(n.commentaire) });
    }
    const restantes = t.snapshot.questions.filter((q) => !t.reponses.find((r) => r.questionId === q.id)?.corrigee).map((q) => q.ordre);
    if (restantes.length) throw new ErreurMetier(`Corrigez toutes les questions en attente : ${restantes.join(', ')}.`);
    t.pointsObtenus = arrondi(t.reponses.reduce((s, r) => s + (r.pointsObtenus ?? 0), 0));
    t.correcteurId = u.id;
    t.dateCorrection = maintenant();
    finaliser(t, !!publier);
    const a = db.affectations.find((x) => x.id === t.affectationId)!;
    recalculer(a);
    journal('CORRECTION', u.id, `Tentative ${t.numero} de « ${t.snapshot.titre} » corrigée : ${t.score}/100`, { formationId: a.formationId, evaluationId: t.evaluationId, affectationId: a.id });
    notifier(t.delegueId, 'CORRECTION_TERMINEE', `Correction terminée : ${t.snapshot.titre}`, t.resultatPublie ? null : 'Le résultat sera publié prochainement.', a, t.id);
    apresResultat(t, a, false);
    return t;
  },
};

function verifierLecon(d: LeconFormDto) {
  if (d.type === 'TEXTE' && !texte(d.contenu)) throw new ErreurMetier('Une leçon texte doit avoir un contenu.');
  if (d.type === 'LIEN' && !texte(d.url)) throw new ErreurMetier('Une leçon de type lien doit avoir une adresse.');
  if (texte(d.url) && !/^https?:\/\/.+/i.test(d.url!.trim())) throw new ErreurMetier('Le lien doit commencer par http:// ou https://.');
}

function appliquerQuestion(q: Question, d: QuestionDto) {
  let props = d.propositions ?? [];
  const correctes = props.filter((p) => p.correcte).length;
  const acceptees = (d.reponsesAcceptees ?? []).map((s) => s.trim()).filter(Boolean);
  switch (d.type) {
    case 'QCM_UNIQUE':
      if (props.length < 2) throw new ErreurMetier('Un QCM doit proposer au moins deux réponses.');
      if (correctes !== 1) throw new ErreurMetier('Un QCM à réponse unique doit avoir exactement une bonne réponse.');
      break;
    case 'QCM_MULTIPLE':
      if (props.length < 2) throw new ErreurMetier('Un QCM doit proposer au moins deux réponses.');
      if (correctes < 1) throw new ErreurMetier('Indiquez au moins une bonne réponse.');
      break;
    case 'VRAI_FAUX':
      if (props.length === 0) props = [{ libelle: 'Vrai', correcte: true }, { libelle: 'Faux', correcte: false }];
      else if (props.length !== 2 || correctes !== 1) throw new ErreurMetier('Une question vrai/faux a deux propositions dont une seule est correcte.');
      break;
    case 'REPONSE_COURTE':
      if (acceptees.length === 0) throw new ErreurMetier('Indiquez au moins une réponse acceptée (ou choisissez la correction manuelle).');
      props = [];
      break;
    case 'MANUELLE':
      props = [];
  }
  if (!d.enonce?.trim()) throw new ErreurMetier("L'énoncé est obligatoire.");
  if (!(d.points > 0)) throw new ErreurMetier('Le nombre de points doit être positif.');
  q.type = d.type;
  q.enonce = d.enonce.trim();
  q.points = d.points;
  q.explication = texte(d.explication);
  q.reponsesAcceptees = d.type === 'REPONSE_COURTE' ? acceptees : [];
  q.obligatoire = d.obligatoire ?? true;
  q.propositions = props.map((p, i) => ({ id: generateId('prop'), libelle: p.libelle.trim(), correcte: p.correcte, ordre: i + 1 }));
}

function archiverF(f: FormationS) {
  f.statut = 'ARCHIVEE';
  f.dateArchivage = maintenant();
  f.dateModification = maintenant();
  evaluationsDe(f.id).forEach((e) => {
    e.statut = 'ARCHIVEE';
    e.dateArchivage = maintenant();
  });
}

function copierEvaluation(source: EvaluationS, formationId: string | null, moduleId: string | null, createurId: string, globale: boolean, racineId: string | null, version: number): EvaluationS {
  const id = generateId('eval');
  const e: EvaluationS = { ...copie(source), id, formationId, moduleId, statut: 'BROUILLON', version, evaluationRacineId: racineId ?? id, globale, createurId, dateCreation: maintenant(), dateModification: maintenant(), datePublication: null, dateArchivage: null };
  db.evaluations.push(e);
  for (const q of questionsDe(source.id)) {
    db.questions.push({ ...copie(q), id: generateId('q'), evaluationId: id, propositions: q.propositions.map((p) => ({ ...p, id: generateId('prop') })) });
  }
  return e;
}

function affectationDuDelegue(u: Utilisateur, id: string): AffectationS {
  exigerDelegue(u);
  const a = db.affectations.find((x) => x.id === id);
  if (!a || a.delegueId !== u.id) throw new ErreurMetier(`Affectation introuvable : ${id}`);
  if (a.statut === 'ANNULEE') throw new ErreurMetier('Cette affectation a été annulée.');
  return a;
}

function affectationVisible(u: Utilisateur, id: string): AffectationS {
  exigerGestion(u);
  const a = db.affectations.find((x) => x.id === id);
  if (!a) throw new ErreurMetier(`Affectation introuvable : ${id}`);
  if (!peutVoirDelegue(u, a.delegueId)) throw new ErreurMetier(INTERDIT);
  return a;
}

function tentativeDuDelegue(u: Utilisateur, id: string): TentativeS {
  exigerDelegue(u);
  const t = db.tentatives.find((x) => x.id === id);
  if (!t || t.delegueId !== u.id) throw new ErreurMetier(`Tentative introuvable : ${id}`);
  return t;
}

function tentativeVisible(u: Utilisateur, id: string): TentativeS {
  exigerGestion(u);
  const t = db.tentatives.find((x) => x.id === id);
  if (!t) throw new ErreurMetier(`Tentative introuvable : ${id}`);
  if (!peutVoirDelegue(u, t.delegueId)) throw new ErreurMetier(INTERDIT);
  return t;
}

function affectationsVisibles(u: Utilisateur, f: FiltresFormation = {}): AffectationS[] {
  const delegues = new Set(
    deleguesVisibles(u)
      .filter((d) => correspond(d.id, f.managerId, f.region))
      .filter((d) => !f.delegueId || f.delegueId === d.id)
      .map((d) => d.id),
  );
  return db.affectations.filter(
    (a) =>
      delegues.has(a.delegueId) &&
      (!f.formationId || a.formationId === f.formationId) &&
      (!f.evaluationId || a.evaluationId === f.evaluationId) &&
      (!f.dateDebut || a.dateAffectation.slice(0, 10) >= f.dateDebut) &&
      (!f.dateFin || a.dateAffectation.slice(0, 10) <= f.dateFin),
  );
}

const taux = (n: number, total: number) => (total <= 0 ? 0 : Math.round((n * 1000) / total) / 10);
const estTerminee = (a: Affectation) => a.statut === 'REUSSIE' || a.statut === 'ECHOUEE';

function statsParContenu(affs: AffectationS[], dtos: Map<string, Affectation>): StatFormation[] {
  const groupes = new Map<string, AffectationS[]>();
  affs.forEach((a) => {
    const cle = a.formationId ? `F${a.formationId}` : `E${a.evaluationId}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), a]);
  });
  const stats: StatFormation[] = [];
  for (const groupe of groupes.values()) {
    const ds = groupe.map((a) => dtos.get(a.id)!);
    const commences = ds.filter((a) => a.statut !== 'NON_COMMENCEE').length;
    const termines = ds.filter(estTerminee).length;
    const reussis = ds.filter((a) => a.statut === 'REUSSIE').length;
    const avant: number[] = [];
    groupe
      .filter((a) => dtos.get(a.id)!.statut === 'REUSSIE')
      .forEach((a) => {
        const premieres = new Map<string, number>();
        tentativesDe(a.id)
          .filter((t) => t.statut === 'REUSSIE')
          .forEach((t) => premieres.set(t.evaluationId, Math.min(premieres.get(t.evaluationId) ?? Infinity, t.numero)));
        avant.push(...premieres.values());
      });
    stats.push({
      formationId: groupe[0].formationId,
      evaluationId: groupe[0].evaluationId,
      titre: ds[0].titre,
      version: ds[0].version,
      nature: ds[0].nature,
      affectes: ds.length,
      commences,
      termines,
      reussis,
      echoues: ds.filter((a) => a.statut === 'ECHOUEE').length,
      enRetard: ds.filter((a) => a.enRetard).length,
      tauxParticipation: taux(commences, ds.length),
      tauxCompletion: taux(termines, ds.length),
      tauxReussite: taux(reussis, termines),
      scoreMoyen: moyenne(ds.map((a) => a.score)),
      tentativesMoyennesAvantReussite: moyenne(avant),
    });
  }
  return stats.sort((a, b) => b.affectes - a.affectes);
}

function synthese(d: Utilisateur, ds: Affectation[]): SuiviDelegue {
  const activites = ds.map((a) => a.dateDerniereActivite).filter(Boolean) as string[];
  return {
    delegueId: d.id,
    delegueNom: nom(d.id),
    managerNom: d.managerId ? nom(d.managerId) : null,
    regions: regions(d.id),
    affectees: ds.length,
    commencees: ds.filter((a) => a.statut !== 'NON_COMMENCEE').length,
    terminees: ds.filter(estTerminee).length,
    reussies: ds.filter((a) => a.statut === 'REUSSIE').length,
    echouees: ds.filter((a) => a.statut === 'ECHOUEE').length,
    enRetard: ds.filter((a) => a.enRetard).length,
    correctionsEnAttente: ds.reduce((s, a) => s + a.correctionsEnAttente, 0),
    progressionMoyenne: ds.length ? Math.round(ds.reduce((s, a) => s + a.progression, 0) / ds.length) : 0,
    scoreMoyen: moyenne(ds.map((a) => a.score)),
    nbTentatives: ds.reduce((s, a) => s + a.nbTentatives, 0),
    derniereActivite: activites.sort().at(-1) ?? null,
  };
}

// ─── Jeu de données initial ───────────────────────────────────────────────────

let initialise = false;

function initialiser() {
  if (initialise) return;
  initialise = true;
  const admin = utilisateurs.find((u) => u.role === UserRole.ADMIN)!;
  const manager = utilisateurs.find((u) => u.id === 'manager-1')!;
  const d1 = utilisateurs.find((u) => u.id === 'delegue-1')!;
  const d2 = utilisateurs.find((u) => u.id === 'delegue-2')!;

  const qcm = (enonce: string, bonne: string, mauvaises: string[], points = 10): QuestionDto => ({
    type: 'QCM_UNIQUE',
    enonce,
    points,
    explication: `La bonne réponse est « ${bonne} ».`,
    propositions: [{ libelle: bonne, correcte: true }, ...mauvaises.map((m) => ({ libelle: m, correcte: false }))],
  });

  // Formation publiée, affectée à deux délégués.
  const vente = ops.creerFormation(admin, {
    titre: 'Techniques de vente — les fondamentaux',
    description: "Structurer une visite médicale efficace, de la prise de contact à l'engagement.",
    objectifs: 'Préparer sa visite\nArgumenter avec la méthode CAP\nTraiter les objections',
    categorie: 'TECHNIQUES_VENTE',
    niveau: 'DEBUTANT',
    dureeEstimeeMinutes: 60,
    seuilReussite: 70,
    tentativesMax: 3,
    exigenceSeuil: 'LES_DEUX',
    progressionSequentielle: true,
    echeance: ajouterJours(aujourdhui(), 20),
  });
  const m1 = ops.ajouterModule(admin, vente.id, { titre: 'Préparer sa visite', obligatoire: true });
  const l1 = ops.ajouterLecon(admin, m1.id, { titre: 'Connaître son interlocuteur', type: 'TEXTE', contenu: 'Avant chaque visite, relisez la fiche du professionnel de santé : spécialité, habitudes de prescription, dernières remarques.', dureeMinutes: 10 });
  const l2 = ops.ajouterLecon(admin, m1.id, { titre: 'Fixer un objectif de visite', type: 'TEXTE', contenu: 'Un objectif de visite est précis, mesurable et atteignable : présenter un produit, obtenir un essai, planifier un suivi.', dureeMinutes: 10 });
  const q1 = ops.creerEvaluation(admin, { moduleId: m1.id, type: 'QUIZ_ENTRAINEMENT', titre: 'Quiz — préparer sa visite', obligatoire: true });
  ops.ajouterQuestion(admin, q1.id, qcm('Que relire avant une visite ?', 'La fiche du professionnel', ['Le catalogue complet', 'Rien de particulier']));
  ops.ajouterQuestion(admin, q1.id, { type: 'VRAI_FAUX', enonce: 'Un objectif de visite doit être mesurable.', points: 10, propositions: [{ libelle: 'Vrai', correcte: true }, { libelle: 'Faux', correcte: false }] });
  const m2 = ops.ajouterModule(admin, vente.id, { titre: 'Argumenter et conclure', obligatoire: true });
  ops.ajouterLecon(admin, m2.id, { titre: 'La méthode CAP', type: 'TEXTE', contenu: 'Caractéristique, Avantage, Preuve : chaque argument part du besoin exprimé.', dureeMinutes: 15 });
  ops.ajouterLecon(admin, m2.id, { titre: 'Vidéo : traiter une objection', type: 'LIEN', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', dureeMinutes: 8, obligatoire: false });
  const q2 = ops.creerEvaluation(admin, { moduleId: m2.id, type: 'QUIZ_ENTRAINEMENT', titre: 'Quiz — argumenter', obligatoire: true });
  ops.ajouterQuestion(admin, q2.id, qcm('Que signifie le « P » de CAP ?', 'Preuve', ['Prix', 'Produit']));
  const fin = ops.creerEvaluation(admin, { formationId: vente.id, type: 'EVALUATION_FINALE', titre: 'Évaluation finale — techniques de vente', consignes: 'Répondez à toutes les questions. Seuil de réussite : 70/100.' });
  ops.ajouterQuestion(admin, fin.id, qcm('Première étape d’une visite réussie ?', 'La préparation', ['La conclusion', 'La remise d’échantillons']));
  ops.ajouterQuestion(admin, fin.id, { type: 'QCM_MULTIPLE', enonce: 'Quels éléments composent la méthode CAP ?', points: 10, propositions: [{ libelle: 'Caractéristique', correcte: true }, { libelle: 'Avantage', correcte: true }, { libelle: 'Preuve', correcte: true }, { libelle: 'Promotion', correcte: false }] });
  ops.ajouterQuestion(admin, fin.id, { type: 'MANUELLE', enonce: 'Décrivez comment vous traitez l’objection « votre produit est trop cher ».', points: 20 });
  ops.publierFormation(admin, vente.id);
  ops.affecter(manager, { formationId: vente.id, cibleType: 'DELEGUES', delegueIds: [d1.id, d2.id], obligatoire: true, priorite: 'HAUTE' });

  // Progression de Kouassi N'Guessan : module 1 validé, finale à corriger plus tard.
  const affD1 = db.affectations.find((a) => a.delegueId === d1.id && a.formationId === vente.id)!;
  ops.consulter(d1, affD1.id, l1.id);
  ops.consulter(d1, affD1.id, l2.id);
  const t1 = ops.demarrer(d1, affD1.id, q1.id);
  ops.enregistrer(t1, t1.snapshot.questions.map((q) => ({ questionId: q.id, propositionIds: [q.propositions.find((p) => p.correcte)!.id], texte: null })));
  soumettreInterne(t1, false);
  const affD2 = db.affectations.find((a) => a.delegueId === d2.id && a.formationId === vente.id)!;
  ops.consulter(d2, affD2.id, l1.id);

  // Brouillon de l'admin.
  const reglementation = ops.creerFormation(admin, {
    titre: 'Réglementation pharmaceutique',
    description: 'Cadre légal de la promotion des médicaments.',
    categorie: 'REGLEMENTATION',
    niveau: 'INTERMEDIAIRE',
    seuilReussite: 80,
    tentativesMax: 2,
    exigenceSeuil: 'FINALE',
  });
  ops.ajouterModule(admin, reglementation.id, { titre: 'Le visa de publicité', obligatoire: true });

  // Exercice indépendant du manager, affecté à son équipe.
  const exo = ops.creerEvaluation(manager, { type: 'EXERCICE_REVISION', titre: 'Révision : gamme dermatologie', consignes: 'Exercice de révision avant le cycle de visites.', seuilReussite: 60 });
  ops.ajouterQuestion(manager, exo.id, qcm('Indication principale de la crème barrière ?', 'Protection de la peau', ['Antibiothérapie', 'Antalgie']));
  ops.ajouterQuestion(manager, exo.id, { type: 'REPONSE_COURTE', enonce: 'Citez l’actif apaisant de la gamme.', points: 10, reponsesAcceptees: ['Allantoïne'] });
  ops.publierEvaluation(manager, exo.id);
  ops.affecter(manager, { evaluationId: exo.id, cibleType: 'EQUIPE', obligatoire: false, dateLimite: ajouterJours(aujourdhui(), 2) });
}

function avecDonnees<T>(fn: (u: Utilisateur) => T): Promise<T> {
  return delay().then(() => {
    initialiser();
    return copie(fn(utilisateurCourant())) as T;
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class FormationServiceMock implements FormationService {
  getFormations(f: { statut?: StatutPublication; categorie?: CategorieFormation; q?: string } = {}) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const q = normaliser(f.q);
      return db.formations
        .filter((x) => peutVoirF(u, x) && (!f.statut || x.statut === f.statut) && (!f.categorie || x.categorie === f.categorie) && (!q || normaliser(x.titre).includes(q)))
        .sort((a, b) => b.dateModification.localeCompare(a.dateModification))
        .map((x) => formationResume(u, x));
    });
  }
  getFormation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierVisibleF(u, f);
      return formationDetail(u, f);
    });
  }
  createFormation(data: FormationDto) {
    return avecDonnees((u) => formationDetail(u, ops.creerFormation(u, data)));
  }
  updateFormation(id: string, d: FormationDto) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierProprietaireF(u, f);
      if (f.statut === 'ARCHIVEE') throw new ErreurMetier("Une formation archivée n'est plus modifiable.");
      verifierLimites(d.seuilReussite, d.tentativesMax, u);
      if (f.statut === 'PUBLIEE') {
        const regles =
          f.titre !== d.titre.trim() || f.categorie !== d.categorie || f.niveau !== d.niveau || f.seuilReussite !== d.seuilReussite ||
          f.tentativesMax !== (d.tentativesMax ?? null) || f.delaiEntreTentativesHeures !== (d.delaiEntreTentativesHeures ?? 0) ||
          f.tentativeApresEchec !== (d.tentativeApresEchec ?? true) || f.exigenceSeuil !== d.exigenceSeuil || f.progressionSequentielle !== (d.progressionSequentielle ?? true);
        if (regles) throw new ErreurMetier("Formation publiée : seuls la description, les objectifs, la durée et l'échéance sont modifiables. Créez une nouvelle version pour changer le reste.");
        Object.assign(f, { description: texte(d.description), objectifs: texte(d.objectifs), dureeEstimeeMinutes: d.dureeEstimeeMinutes ?? null, echeance: d.echeance ?? null });
      } else {
        Object.assign(f, {
          titre: d.titre.trim(),
          description: texte(d.description),
          objectifs: texte(d.objectifs),
          categorie: d.categorie,
          niveau: d.niveau,
          dureeEstimeeMinutes: d.dureeEstimeeMinutes ?? null,
          seuilReussite: d.seuilReussite,
          tentativesMax: d.tentativesMax ?? null,
          delaiEntreTentativesHeures: d.delaiEntreTentativesHeures ?? 0,
          tentativeApresEchec: d.tentativeApresEchec ?? true,
          exigenceSeuil: d.exigenceSeuil,
          progressionSequentielle: d.progressionSequentielle ?? true,
          echeance: d.echeance ?? null,
        });
      }
      f.dateModification = maintenant();
      journal('MODIFICATION', u.id, 'Informations générales modifiées', { formationId: f.id });
      return formationDetail(u, f);
    });
  }
  deleteFormation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierProprietaireF(u, f);
      if (f.statut !== 'BROUILLON') throw new ErreurMetier('Seul un brouillon peut être supprimé ; archivez plutôt cette formation.');
      if (db.affectations.some((a) => a.formationId === id)) throw new ErreurMetier('Cette formation a déjà été affectée : elle ne peut plus être supprimée.');
      const mods = modulesDe(id).map((m) => m.id);
      const evals = evaluationsDe(id).map((e) => e.id);
      db.formations = db.formations.filter((x) => x.id !== id);
      db.modules = db.modules.filter((m) => m.formationId !== id);
      db.lecons = db.lecons.filter((l) => !mods.includes(l.moduleId));
      db.evaluations = db.evaluations.filter((e) => e.formationId !== id);
      db.questions = db.questions.filter((q) => !evals.includes(q.evaluationId));
    });
  }
  publierFormation(id: string) {
    return avecDonnees((u) => formationDetail(u, ops.publierFormation(u, id)));
  }
  archiverFormation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierProprietaireF(u, f);
      if (f.statut !== 'PUBLIEE') throw new ErreurMetier('Seule une formation publiée peut être archivée.');
      archiverF(f);
      journal('ARCHIVAGE', u.id, 'Archivée : plus de nouvelle tentative, résultats conservés', { formationId: f.id });
      return formationDetail(u, f);
    });
  }
  dupliquerFormation(id: string, nouvelleVersion: boolean) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const s = formation(id);
      if (nouvelleVersion) {
        verifierProprietaireF(u, s);
        if (db.formations.some((v) => v.formationRacineId === s.formationRacineId && v.statut === 'BROUILLON')) {
          throw new ErreurMetier('Une version brouillon de cette formation existe déjà : modifiez-la.');
        }
      } else verifierVisibleF(u, s);
      const version = nouvelleVersion ? Math.max(...db.formations.filter((v) => v.formationRacineId === s.formationRacineId).map((v) => v.version)) + 1 : 1;
      const nid = generateId('form');
      const c: FormationS = {
        ...s,
        id: nid,
        titre: nouvelleVersion ? s.titre : `${s.titre} (copie)`.slice(0, 200),
        statut: 'BROUILLON',
        version,
        formationRacineId: nouvelleVersion ? s.formationRacineId : nid,
        globale: nouvelleVersion ? s.globale : estAdmin(u),
        createurId: nouvelleVersion ? s.createurId : u.id,
        dateCreation: maintenant(),
        dateModification: maintenant(),
        datePublication: null,
        dateArchivage: null,
      };
      db.formations.push(c);
      const map = new Map<string, string>();
      for (const m of modulesDe(s.id)) {
        const mid = generateId('mod');
        map.set(m.id, mid);
        db.modules.push({ ...m, id: mid, formationId: nid });
        for (const l of leconsDe(m.id)) db.lecons.push({ ...l, id: generateId('lec'), moduleId: mid });
      }
      for (const e of evaluationsDe(s.id)) copierEvaluation(e, nid, e.moduleId ? map.get(e.moduleId)! : null, c.createurId, c.globale, null, 1);
      journal(nouvelleVersion ? 'NOUVELLE_VERSION' : 'DUPLICATION', u.id, `${nouvelleVersion ? `Version ${version} créée depuis la version` : 'Copie de la version'} ${s.version} de « ${s.titre} »`, { formationId: nid });
      return formationDetail(u, c);
    });
  }
  getHistoriqueFormation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierVisibleF(u, f);
      const versions = new Set(db.formations.filter((v) => v.formationRacineId === f.formationRacineId).map((v) => v.id));
      return db.historique.filter((h) => h.formationId && versions.has(h.formationId));
    });
  }
  uploadCouverture(id: string, fichier: File) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(id);
      verifierProprietaireF(u, f);
      if (!fichier.type.startsWith('image/')) throw new ErreurMetier("L'image de couverture doit être une image.");
      f.couverture = fichier;
      return formationDetail(u, f);
    });
  }
  async getCouverture(id: string): Promise<Blob> {
    await delay(50);
    const c = formation(id).couverture;
    if (!c) throw new ErreurMetier('Fichier introuvable : couverture');
    return c;
  }

  addModule(formationId: string, data: ModuleDto) {
    return avecDonnees((u) => {
      ops.ajouterModule(u, formationId, data);
      return formationDetail(u, formation(formationId));
    });
  }
  updateModule(moduleId: string, d: ModuleDto) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const m = module_(moduleId);
      const f = formation(m.formationId);
      verifierContenuModifiableF(u, f);
      Object.assign(m, { titre: d.titre.trim(), description: texte(d.description), obligatoire: d.obligatoire ?? true });
      ops.contenuModifie(u, f, `Module « ${m.titre} » modifié`);
      return formationDetail(u, f);
    });
  }
  deleteModule(moduleId: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const m = module_(moduleId);
      const f = formation(m.formationId);
      verifierContenuModifiableF(u, f);
      const evals = db.evaluations.filter((e) => e.moduleId === moduleId).map((e) => e.id);
      db.modules = db.modules.filter((x) => x.id !== moduleId);
      db.lecons = db.lecons.filter((l) => l.moduleId !== moduleId);
      db.evaluations = db.evaluations.filter((e) => e.moduleId !== moduleId);
      db.questions = db.questions.filter((q) => !evals.includes(q.evaluationId));
      renumeroter(modulesDe(f.id));
      ops.contenuModifie(u, f, `Module « ${m.titre} » supprimé`);
      return formationDetail(u, f);
    });
  }
  reorderModules(formationId: string, ids: string[]) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const f = formation(formationId);
      verifierContenuModifiableF(u, f);
      reordonner(modulesDe(formationId), ids);
      ops.contenuModifie(u, f, 'Modules réordonnés');
      return formationDetail(u, f);
    });
  }
  addLecon(moduleId: string, data: LeconFormDto) {
    return avecDonnees((u) => leconDto(ops.ajouterLecon(u, moduleId, data)));
  }
  updateLecon(leconId: string, d: LeconFormDto) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const l = lecon(leconId);
      const f = formation(module_(l.moduleId).formationId);
      verifierContenuModifiableF(u, f);
      verifierLecon(d);
      Object.assign(l, { titre: d.titre.trim(), type: d.type, contenu: texte(d.contenu), url: texte(d.url), dureeMinutes: d.dureeMinutes ?? null, obligatoire: d.obligatoire ?? true });
      ops.contenuModifie(u, f, `Leçon « ${l.titre} » modifiée`);
      return leconDto(l);
    });
  }
  deleteLecon(leconId: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const l = lecon(leconId);
      const f = formation(module_(l.moduleId).formationId);
      verifierContenuModifiableF(u, f);
      db.lecons = db.lecons.filter((x) => x.id !== leconId);
      renumeroter(leconsDe(l.moduleId));
      ops.contenuModifie(u, f, `Leçon « ${l.titre} » supprimée`);
    });
  }
  reorderLecons(moduleId: string, ids: string[]) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const m = module_(moduleId);
      const f = formation(m.formationId);
      verifierContenuModifiableF(u, f);
      reordonner(leconsDe(moduleId), ids);
      ops.contenuModifie(u, f, `Leçons du module « ${m.titre} » réordonnées`);
      return leconsDe(moduleId).map(leconDto);
    });
  }
  uploadFichierLecon(leconId: string, fichier: File) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const l = lecon(leconId);
      const f = formation(module_(l.moduleId).formationId);
      verifierContenuModifiableF(u, f);
      Object.assign(l, { fichier, fichierNom: fichier.name, fichierType: fichier.type || 'application/octet-stream', fichierTaille: fichier.size });
      ops.contenuModifie(u, f, `Support « ${fichier.name} » ajouté à la leçon « ${l.titre} »`);
      return leconDto(l);
    });
  }
  async getFichierLecon(leconId: string): Promise<Blob> {
    await delay(50);
    const f = lecon(leconId).fichier;
    if (!f) throw new ErreurMetier('Fichier introuvable');
    return f;
  }

  getEvaluationsIndependantes(statut?: StatutPublication) {
    return avecDonnees((u) => {
      exigerGestion(u);
      return db.evaluations
        .filter((e) => !e.formationId && peutVoirE(u, e) && (!statut || e.statut === statut))
        .sort((a, b) => b.dateModification.localeCompare(a.dateModification))
        .map((e) => evaluationResume(u, e));
    });
  }
  getEvaluation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const e = evaluation(id);
      if (e.formationId) verifierVisibleF(u, formation(e.formationId));
      else if (!peutVoirE(u, e)) throw new ErreurMetier(INTERDIT);
      return evaluationDetail(u, e);
    });
  }
  createEvaluation(data: EvaluationDto) {
    return avecDonnees((u) => evaluationDetail(u, ops.creerEvaluation(u, data)));
  }
  updateEvaluation(id: string, d: EvaluationDto) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const e = evaluation(id);
      verifierEvaluationModifiable(u, e);
      if (!e.formationId && !proprietaire(u, e.createurId)) throw new ErreurMetier("Seul l'administrateur ou le créateur peut effectuer cette action.");
      verifierLimites(d.seuilReussite, d.tentativesMax, u);
      if (d.type === 'EVALUATION_FINALE' && e.moduleId) throw new ErreurMetier("L'évaluation finale se rattache à la formation, pas à un module.");
      Object.assign(e, {
        type: d.type,
        titre: d.titre.trim(),
        consignes: texte(d.consignes),
        dureeMinutes: d.dureeMinutes ?? null,
        seuilReussite: d.seuilReussite ?? null,
        tentativesMax: d.tentativesMax ?? null,
        delaiEntreTentativesHeures: d.delaiEntreTentativesHeures ?? null,
        tentativeApresEchec: d.tentativeApresEchec ?? null,
        publicationResultats: d.publicationResultats ?? 'IMMEDIATE',
        affichageCorrections: d.affichageCorrections ?? 'APRES_SOUMISSION',
        obligatoire: e.formationId && !e.moduleId ? d.type === 'EVALUATION_FINALE' : (d.obligatoire ?? true),
        dateModification: maintenant(),
      });
      journal('MODIFICATION', u.id, `Paramètres de « ${e.titre} » modifiés`, { formationId: e.formationId, evaluationId: e.id });
      return evaluationDetail(u, e);
    });
  }
  deleteEvaluation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const e = evaluation(id);
      verifierEvaluationModifiable(u, e);
      if (!e.formationId && db.affectations.some((a) => a.evaluationId === id)) throw new ErreurMetier('Cette évaluation a déjà été affectée : elle ne peut plus être supprimée.');
      db.evaluations = db.evaluations.filter((x) => x.id !== id);
      db.questions = db.questions.filter((q) => q.evaluationId !== id);
    });
  }
  publierEvaluation(id: string) {
    return avecDonnees((u) => evaluationDetail(u, ops.publierEvaluation(u, id)));
  }
  archiverEvaluation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const e = evaluation(id);
      if (e.formationId) throw new ErreurMetier('Cette évaluation suit le cycle de vie de sa formation.');
      if (!proprietaire(u, e.createurId)) throw new ErreurMetier("Seul l'administrateur ou le créateur peut effectuer cette action.");
      if (e.statut !== 'PUBLIEE') throw new ErreurMetier('Seule une évaluation publiée peut être archivée.');
      e.statut = 'ARCHIVEE';
      e.dateArchivage = maintenant();
      journal('ARCHIVAGE', u.id, 'Archivée : plus de nouvelle tentative, résultats conservés', { evaluationId: e.id });
      return evaluationDetail(u, e);
    });
  }
  dupliquerEvaluation(id: string, nouvelleVersion: boolean) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const s = evaluation(id);
      if (s.formationId) throw new ErreurMetier('Cette évaluation suit le cycle de vie de sa formation.');
      if (nouvelleVersion) {
        if (!proprietaire(u, s.createurId)) throw new ErreurMetier("Seul l'administrateur ou le créateur peut effectuer cette action.");
        if (db.evaluations.some((v) => v.evaluationRacineId === s.evaluationRacineId && v.statut === 'BROUILLON')) throw new ErreurMetier('Une version brouillon de cette évaluation existe déjà : modifiez-la.');
      } else if (!peutVoirE(u, s)) throw new ErreurMetier(INTERDIT);
      const version = nouvelleVersion ? Math.max(...db.evaluations.filter((v) => v.evaluationRacineId === s.evaluationRacineId).map((v) => v.version)) + 1 : 1;
      const c = copierEvaluation(s, null, null, nouvelleVersion ? s.createurId : u.id, nouvelleVersion ? s.globale : estAdmin(u), nouvelleVersion ? s.evaluationRacineId : null, version);
      if (!nouvelleVersion) c.titre = `${s.titre} (copie)`.slice(0, 200);
      journal(nouvelleVersion ? 'NOUVELLE_VERSION' : 'DUPLICATION', u.id, `${nouvelleVersion ? `Version ${version} créée depuis la version` : 'Copie de la version'} ${s.version}`, { evaluationId: c.id });
      return evaluationDetail(u, c);
    });
  }
  getHistoriqueEvaluation(id: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const e = evaluation(id);
      const ids = new Set(e.formationId ? [e.id] : db.evaluations.filter((v) => v.evaluationRacineId === e.evaluationRacineId).map((v) => v.id));
      return db.historique.filter((h) => h.evaluationId && ids.has(h.evaluationId));
    });
  }
  addQuestion(evaluationId: string, data: QuestionDto) {
    return avecDonnees((u) => ops.ajouterQuestion(u, evaluationId, data));
  }
  updateQuestion(questionId: string, data: QuestionDto) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const q = db.questions.find((x) => x.id === questionId);
      if (!q) throw new ErreurMetier(`Question introuvable : ${questionId}`);
      verifierEvaluationModifiable(u, evaluation(q.evaluationId));
      appliquerQuestion(q, data);
      return q;
    });
  }
  deleteQuestion(questionId: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const q = db.questions.find((x) => x.id === questionId);
      if (!q) throw new ErreurMetier(`Question introuvable : ${questionId}`);
      verifierEvaluationModifiable(u, evaluation(q.evaluationId));
      db.questions = db.questions.filter((x) => x.id !== questionId);
      renumeroter(questionsDe(q.evaluationId));
    });
  }
  reorderQuestions(evaluationId: string, ids: string[]) {
    return avecDonnees((u) => {
      exigerGestion(u);
      verifierEvaluationModifiable(u, evaluation(evaluationId));
      reordonner(questionsDe(evaluationId), ids);
      return questionsDe(evaluationId);
    });
  }

  apercuAffectation(data: AffectationDto) {
    return avecDonnees((u): ApercuAffectation => {
      const r = ops.resoudre(u, data);
      const delegues = r.delegues.map((d) => ({ id: d.id, nom: nom(d.id), email: d.email, managerNom: d.managerId ? nom(d.managerId) : null, regions: regions(d.id), dejaAffecte: r.deja.has(d.id) }));
      const deja = delegues.filter((d) => d.dejaAffecte).length;
      return { titre: r.titre, cibleLibelle: r.libelle, total: delegues.length, nouveaux: delegues.length - deja, dejaAffectes: deja, delegues, avertissements: r.avertissements };
    });
  }
  affecter(data: AffectationDto) {
    return avecDonnees((u): ResultatAffectation => {
      const total = ops.resoudre(u, data).delegues.length;
      const creees = ops.affecter(u, data);
      return { creees: creees.length, ignorees: total - creees.length, affectations: creees.map((a) => affectationDto(a, false)) };
    });
  }
  getAffectations(f: FiltresFormation & { statut?: StatutAffectation } = {}) {
    return avecDonnees((u) => {
      exigerGestion(u);
      return affectationsVisibles(u, f)
        .map((a) => affectationDto(a, false))
        .filter((a) => !f.statut || a.statut === f.statut)
        .sort((a, b) => b.dateAffectation.localeCompare(a.dateAffectation));
    });
  }
  getAffectation(id: string) {
    return avecDonnees((u): AffectationDetail => {
      const a = affectationVisible(u, id);
      return { parcours: parcours(a, false), tentatives: tentativesDe(a.id).map((t) => resumeTentative(t, false)) };
    });
  }
  reouvrirAffectation(id: string, d: ReouvertureDto) {
    return avecDonnees((u): AffectationDetail => {
      const a = affectationVisible(u, id);
      if (a.statut === 'ANNULEE') throw new ErreurMetier('Cette affectation est annulée.');
      if (a.statut === 'REUSSIE') throw new ErreurMetier("Le délégué a déjà réussi : aucune nouvelle tentative n'est nécessaire.");
      if (d.tentativesSupplementaires === 0 && !d.nouvelleDateLimite) throw new ErreurMetier('Accordez au moins une tentative ou une nouvelle date limite.');
      if (!estAdmin(u) && a.tentativesSupplementaires + d.tentativesSupplementaires > db.parametres.tentativesMaxPlafond) {
        throw new ErreurMetier(`Au plus ${db.parametres.tentativesMaxPlafond} tentatives supplémentaires au total.`);
      }
      a.tentativesSupplementaires += d.tentativesSupplementaires;
      if (d.nouvelleDateLimite) a.dateLimite = d.nouvelleDateLimite;
      recalculer(a);
      const detail = [d.tentativesSupplementaires ? `${d.tentativesSupplementaires} tentative(s) supplémentaire(s)` : '', d.nouvelleDateLimite ? `nouvelle date limite : ${d.nouvelleDateLimite}` : ''].filter(Boolean).join(', ');
      notifier(a.delegueId, 'NOUVELLE_TENTATIVE_AUTORISEE', `Nouvelle chance : ${titreContenu(a)}`, detail + (d.message?.trim() ? `\n${d.message.trim()}` : ''), a);
      journal('REOUVERTURE', u.id, `${nom(a.delegueId)} : ${detail}`, { formationId: a.formationId, evaluationId: a.evaluationId, affectationId: a.id });
      return { parcours: parcours(a, false), tentatives: tentativesDe(a.id).map((t) => resumeTentative(t, false)) };
    });
  }
  annulerAffectation(id: string) {
    return avecDonnees((u) => {
      const a = affectationVisible(u, id);
      if (a.statut === 'ANNULEE') return;
      a.statut = 'ANNULEE';
      journal('ANNULATION_AFFECTATION', u.id, nom(a.delegueId), { formationId: a.formationId, evaluationId: a.evaluationId, affectationId: a.id });
    });
  }

  getTableauDeBord(f: FiltresFormation = {}) {
    return avecDonnees((u): TableauBordFormation => {
      exigerGestion(u);
      const affs = affectationsVisibles(u, f).filter((a) => a.statut !== 'ANNULEE');
      const dtos = new Map(affs.map((a) => [a.id, affectationDto(a, false)]));
      const ds = [...dtos.values()];
      const formations = db.formations.filter((x) => peutVoirF(u, x) && (!f.dateDebut || x.dateCreation.slice(0, 10) >= f.dateDebut) && (!f.dateFin || x.dateCreation.slice(0, 10) <= f.dateFin));
      const tentatives = affs.flatMap((a) => tentativesDe(a.id));
      const repartition: Partial<Record<StatutAffectation, number>> = {};
      (['NON_COMMENCEE', 'EN_COURS', 'EN_ATTENTE_CORRECTION', 'REUSSIE', 'ECHOUEE'] as StatutAffectation[]).forEach((s) => (repartition[s] = ds.filter((a) => a.statut === s).length));
      const termines = ds.filter(estTerminee).length;
      return {
        formationsCreees: formations.length,
        formationsBrouillon: formations.filter((x) => x.statut === 'BROUILLON').length,
        formationsPubliees: formations.filter((x) => x.statut === 'PUBLIEE').length,
        formationsArchivees: formations.filter((x) => x.statut === 'ARCHIVEE').length,
        evaluationsIndependantes: db.evaluations.filter((e) => !e.formationId && peutVoirE(u, e) && e.statut !== 'ARCHIVEE').length,
        affectations: ds.length,
        deleguesAffectes: new Set(ds.map((a) => a.delegueId)).size,
        deleguesAyantCommence: new Set(ds.filter((a) => a.statut !== 'NON_COMMENCEE').map((a) => a.delegueId)).size,
        deleguesAyantTermine: new Set(ds.filter(estTerminee).map((a) => a.delegueId)).size,
        tauxCompletion: taux(termines, ds.length),
        tauxReussite: taux(ds.filter((a) => a.statut === 'REUSSIE').length, termines),
        scoreMoyen: moyenne(ds.map((a) => a.score)),
        affectationsEnRetard: ds.filter((a) => a.enRetard).length,
        deleguesEnEchec: new Set(ds.filter((a) => a.statut === 'ECHOUEE').map((a) => a.delegueId)).size,
        correctionsEnAttente: tentatives.filter((t) => t.statut === 'EN_ATTENTE_CORRECTION').length,
        repartitionStatuts: repartition,
        parFormation: statsParContenu(affs, dtos),
        dernieresTentatives: tentatives
          .filter((t) => t.dateSoumission)
          .sort((a, b) => b.dateSoumission!.localeCompare(a.dateSoumission!))
          .slice(0, 10)
          .map((t) => resumeTentative(t, false)),
      };
    });
  }
  getSuiviDelegues(f: FiltresFormation = {}) {
    return avecDonnees((u) => {
      exigerGestion(u);
      const ds = affectationsVisibles(u, f).filter((a) => a.statut !== 'ANNULEE').map((a) => affectationDto(a, false));
      const filtreContenu = !!(f.formationId || f.evaluationId || f.dateDebut || f.dateFin);
      return deleguesVisibles(u)
        .filter((d) => correspond(d.id, f.managerId, f.region) && (!f.delegueId || f.delegueId === d.id))
        .filter((d) => !filtreContenu || ds.some((a) => a.delegueId === d.id))
        .map((d) => synthese(d, ds.filter((a) => a.delegueId === d.id)))
        .sort((a, b) => a.delegueNom.localeCompare(b.delegueNom));
    });
  }
  getSuiviDelegue(delegueId: string) {
    return avecDonnees((u): SuiviDelegueDetail => {
      exigerGestion(u);
      if (!peutVoirDelegue(u, delegueId)) throw new ErreurMetier(INTERDIT);
      const d = utilisateurs.find((x) => x.id === delegueId)!;
      const affs = db.affectations.filter((a) => a.delegueId === delegueId).sort((a, b) => b.dateAffectation.localeCompare(a.dateAffectation));
      const dtos = affs.map((a) => affectationDto(a, false));
      return {
        synthese: synthese(d, dtos.filter((a) => a.statut !== 'ANNULEE')),
        affectations: dtos,
        tentatives: affs.flatMap((a) => tentativesDe(a.id)).sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)).map((t) => resumeTentative(t, false)),
      };
    });
  }
  getReporting(f: FiltresFormation = {}) {
    return avecDonnees((u): ReportingFormation => {
      exigerGestion(u);
      const affs = affectationsVisibles(u, f).filter((a) => a.statut !== 'ANNULEE');
      const dtos = new Map(affs.map((a) => [a.id, affectationDto(a, false)]));
      const parContenu = statsParContenu(affs, dtos);
      const compteurs = new Map<string, { t: number; r: number; e: number; b: number; scores: number[] }>();
      for (const a of affs) {
        if (a.formationId) {
          const et = etat(a, false);
          et.modules.forEach((m) => {
            const c = compteurs.get(m.id) ?? { t: 0, r: 0, e: 0, b: 0, scores: [] };
            if (m.statut === 'ECHOUEE') c.b++;
            compteurs.set(m.id, c);
          });
        }
        for (const t of tentativesDe(a.id)) {
          const e = db.evaluations.find((x) => x.id === t.evaluationId);
          if (!e?.moduleId || !terminee(t)) continue;
          const c = compteurs.get(e.moduleId) ?? { t: 0, r: 0, e: 0, b: 0, scores: [] };
          c.t++;
          if (t.statut === 'REUSSIE') c.r++;
          else c.e++;
          c.scores.push(t.score ?? 0);
          compteurs.set(e.moduleId, c);
        }
      }
      const parModule: StatModule[] = [...compteurs.entries()]
        .filter(([id]) => db.modules.some((m) => m.id === id))
        .map(([id, c]) => {
          const m = module_(id);
          const fo = formation(m.formationId);
          return { moduleId: id, moduleTitre: m.titre, formationId: fo.id, formationTitre: fo.titre, tentatives: c.t, reussites: c.r, echecs: c.e, tauxReussite: taux(c.r, c.t), scoreMoyen: moyenne(c.scores), deleguesBloques: c.b };
        });
      const stats = new Map<string, { q: Question; titre: string; n: number; e: number }>();
      affs.flatMap((a) => tentativesDe(a.id)).filter(terminee).forEach((t) => {
        for (const r of t.reponses) {
          const q = t.snapshot.questions.find((x) => x.id === r.questionId);
          if (!q || r.pointsObtenus == null) continue;
          const s = stats.get(q.id) ?? { q, titre: t.snapshot.titre, n: 0, e: 0 };
          s.n++;
          if (r.pointsObtenus < q.points) s.e++;
          stats.set(q.id, s);
        }
      });
      const questions: StatQuestion[] = [...stats.values()]
        .filter((s) => s.e > 0)
        .map((s) => ({ questionId: s.q.id, enonce: s.q.enonce, evaluationTitre: s.titre, type: s.q.type, reponses: s.n, echecs: s.e, tauxEchec: taux(s.e, s.n) }))
        .sort((a, b) => b.tauxEchec - a.tauxEchec || b.echecs - a.echecs)
        .slice(0, 10);
      return {
        parFormation: parContenu,
        parModule,
        questionsLesPlusEchouees: questions,
        modulesLesPlusDifficiles: parModule.filter((m) => m.tentatives > 0).sort((a, b) => a.tauxReussite - b.tauxReussite || b.echecs - a.echecs).slice(0, 5),
        obligatoiresNonTerminees: [...dtos.values()]
          .filter((a) => a.obligatoire && a.statut !== 'REUSSIE')
          .sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || (a.dateLimite ?? '9999').localeCompare(b.dateLimite ?? '9999'))
          .map((a) => ({ affectationId: a.id, delegueId: a.delegueId, delegueNom: a.delegueNom, titre: a.titre, dateLimite: a.dateLimite, statut: a.statut, progression: a.progression, enRetard: a.enRetard })),
        formationsEchues: parContenu.filter((s) => s.enRetard > 0),
      };
    });
  }
  async exporterReporting(f: FiltresFormation = {}): Promise<Blob> {
    const affs = await this.getAffectations(f);
    const lignes = [
      "Délégué;Contenu;Version;Nature;Obligatoire;Date d'affectation;Date limite;Statut;Progression (%);Score /100;Seuil /100;Tentatives;En retard",
      ...affs
        .filter((a) => a.statut !== 'ANNULEE')
        .map((a) => [a.delegueNom, a.titre, a.version, a.nature === 'FORMATION' ? 'Formation' : 'Exercice', a.obligatoire ? 'Oui' : 'Non', a.dateAffectation.slice(0, 10), a.dateLimite ?? '', a.statut, a.progression, a.score == null ? '' : String(a.score).replace('.', ','), a.seuilReussite, a.nbTentatives, a.enRetard ? 'Oui' : 'Non'].join(';')),
    ];
    return new Blob(['﻿' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
  }
  getRelances(f: FiltresFormation = {}) {
    return avecDonnees((u): RelanceFormation[] => {
      exigerGestion(u);
      const p = db.parametres;
      const inactif = new Date(Date.now() - p.joursInactiviteRelance * 86_400_000).toISOString();
      const echeance = ajouterJours(aujourdhui(), p.joursAlerteEcheance);
      const liste: RelanceFormation[] = [];
      for (const a of affectationsVisibles(u, { formationId: f.formationId, managerId: f.managerId, region: f.region }).filter((x) => x.statut !== 'ANNULEE')) {
        const d = affectationDto(a, false);
        if (d.statut === 'REUSSIE') continue;
        const motif = d.enRetard ? 'RETARD' : d.statut === 'ECHOUEE' ? 'ECHEC' : a.dateLimite && a.dateLimite <= echeance ? 'ECHEANCE_PROCHE' : d.statut !== 'EN_ATTENTE_CORRECTION' && a.dateDebut <= aujourdhui() && (a.dateDerniereActivite ?? a.dateAffectation) < inactif ? 'INACTIF' : null;
        if (motif) liste.push({ affectationId: a.id, delegueId: a.delegueId, delegueNom: d.delegueNom, titre: d.titre, motif, dateLimite: a.dateLimite, derniereActivite: a.dateDerniereActivite, statut: d.statut, progression: d.progression });
      }
      return liste.sort((a, b) => a.motif.localeCompare(b.motif) || a.delegueNom.localeCompare(b.delegueNom));
    });
  }
  relancer(affectationIds: string[], message?: string) {
    return avecDonnees((u) => {
      exigerGestion(u);
      let n = 0;
      for (const id of affectationIds) {
        const a = db.affectations.find((x) => x.id === id);
        if (!a || a.statut === 'ANNULEE' || !peutVoirDelegue(u, a.delegueId)) continue;
        notifier(a.delegueId, 'RELANCE', `Rappel de ${nom(u.id)} : ${titreContenu(a)}`, message?.trim() || `Pensez à poursuivre votre formation${a.dateLimite ? ` avant le ${a.dateLimite}` : ''}.`, a);
        n++;
      }
      return n;
    });
  }
  getCorrections() {
    return avecDonnees((u) => {
      exigerGestion(u);
      return db.tentatives
        .filter((t) => (t.statut === 'EN_ATTENTE_CORRECTION' || (terminee(t) && !t.resultatPublie)) && peutVoirDelegue(u, t.delegueId))
        .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
        .map((t) => resumeTentative(t, false));
    });
  }
  getTentative(id: string) {
    return avecDonnees((u) => resultat(tentativeVisible(u, id), false));
  }
  corriger(id: string, notes: { questionId: string; points: number; commentaire?: string }[], publier?: boolean) {
    return avecDonnees((u) => resultat(ops.corriger(u, id, notes, publier), false));
  }
  publierResultat(id: string) {
    return avecDonnees((u) => {
      const t = tentativeVisible(u, id);
      if (!terminee(t)) throw new ErreurMetier("Le résultat n'est pas encore disponible (tentative en cours ou à corriger).");
      if (!t.resultatPublie) {
        t.resultatPublie = true;
        const a = db.affectations.find((x) => x.id === t.affectationId)!;
        journal('PUBLICATION_RESULTAT', u.id, `Résultat de « ${t.snapshot.titre} » publié`, { formationId: a.formationId, evaluationId: t.evaluationId, affectationId: a.id });
        apresResultat(t, a, false);
      }
      return resultat(t, false);
    });
  }

  getMonEspace() {
    return avecDonnees((u): EspaceApprenant => {
      exigerDelegue(u);
      const ds = db.affectations.filter((a) => a.delegueId === u.id && a.statut !== 'ANNULEE').map((a) => affectationDto(a, true));
      const compter = (s: StatutAffectation) => ds.filter((a) => a.statut === s).length;
      return {
        affectees: ds.length,
        obligatoires: ds.filter((a) => a.obligatoire).length,
        nonCommencees: compter('NON_COMMENCEE'),
        enCours: compter('EN_COURS'),
        enAttenteCorrection: compter('EN_ATTENTE_CORRECTION'),
        reussies: compter('REUSSIE'),
        echouees: compter('ECHOUEE'),
        enRetard: ds.filter((a) => a.enRetard).length,
        exercices: ds.filter((a) => a.nature === 'EVALUATION').length,
        scoreMoyen: moyenne(ds.map((a) => a.score)),
        prochainesEcheances: ds.filter((a) => a.dateLimite && !estTerminee(a)).sort((a, b) => a.dateLimite!.localeCompare(b.dateLimite!)).slice(0, 5),
        derniersResultats: db.tentatives.filter((t) => t.delegueId === u.id).sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)).map((t) => resumeTentative(t, true)).filter((t) => t.score != null).slice(0, 5),
        notificationsNonLues: db.notifications.filter((n) => n.destinataireId === u.id && !n.lue).length,
      };
    });
  }
  getMesAffectations(f: FiltresMesAffectations = {}) {
    return avecDonnees((u) => {
      exigerDelegue(u);
      return db.affectations
        .filter((a) => a.delegueId === u.id && a.statut !== 'ANNULEE')
        .sort((a, b) => b.dateAffectation.localeCompare(a.dateAffectation))
        .map((a) => affectationDto(a, true))
        .filter((a) => (!f.statut || a.statut === f.statut) && (!f.nature || a.nature === f.nature) && (f.obligatoire === undefined || a.obligatoire === f.obligatoire));
    });
  }
  getParcours(affectationId: string) {
    return avecDonnees((u) => parcours(affectationDuDelegue(u, affectationId), true));
  }
  consulterLecon(affectationId: string, leconId: string) {
    return avecDonnees((u) => parcours(ops.consulter(u, affectationId, leconId), true));
  }
  async getFichierLeconApprenant(affectationId: string, leconId: string): Promise<Blob> {
    await delay(50);
    affectationDuDelegue(utilisateurCourant(), affectationId);
    const f = lecon(leconId).fichier;
    if (!f) throw new ErreurMetier('Fichier introuvable');
    return f;
  }
  demarrerTentative(affectationId: string, evaluationId: string) {
    return avecDonnees((u) => passage(ops.demarrer(u, affectationId, evaluationId)));
  }
  getPassage(tentativeId: string) {
    return avecDonnees((u) => {
      const t = tentativeDuDelegue(u, tentativeId);
      if (t.statut !== 'EN_COURS') throw new ErreurMetier('Cette tentative est terminée : consultez son résultat.');
      return passage(t);
    });
  }
  enregistrerReponses(tentativeId: string, reponses: ReponseQuestion[]) {
    return avecDonnees((u) => {
      const t = tentativeDuDelegue(u, tentativeId);
      if (t.statut !== 'EN_COURS') throw new ErreurMetier('Cette tentative a déjà été soumise.');
      if (expiree(t)) {
        soumettreInterne(t, true);
        throw new ErreurMetier('Le temps imparti est écoulé : la tentative a été soumise avec vos réponses enregistrées.');
      }
      ops.enregistrer(t, reponses);
      return passage(t);
    });
  }
  soumettre(tentativeId: string, reponses: ReponseQuestion[]) {
    return avecDonnees((u) => {
      const t = tentativeDuDelegue(u, tentativeId);
      if (t.statut !== 'EN_COURS') throw new ErreurMetier('Cette tentative a déjà été soumise.');
      const exp = expiree(t);
      if (!exp) ops.enregistrer(t, reponses);
      soumettreInterne(t, exp);
      return resultat(t, true);
    });
  }
  getResultat(tentativeId: string) {
    return avecDonnees((u) => resultat(tentativeDuDelegue(u, tentativeId), true));
  }
  getMonHistorique() {
    return avecDonnees((u) => {
      exigerDelegue(u);
      return db.tentatives.filter((t) => t.delegueId === u.id).sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)).map((t) => resumeTentative(t, true));
    });
  }

  getNotifications() {
    return avecDonnees((u) => db.notifications.filter((n) => n.destinataireId === u.id).slice(0, 100).map(sansDestinataire));
  }
  marquerNotificationLue(id: string) {
    return avecDonnees((u) => {
      const n = db.notifications.find((x) => x.id === id && x.destinataireId === u.id);
      if (!n) throw new ErreurMetier(`Notification introuvable : ${id}`);
      n.lue = true;
      const reste = sansDestinataire(n);
      return reste;
    });
  }
  marquerToutesLues() {
    return avecDonnees((u) => {
      db.notifications.filter((n) => n.destinataireId === u.id).forEach((n) => (n.lue = true));
    });
  }
  getParametres() {
    return avecDonnees((u) => {
      exigerGestion(u);
      return db.parametres;
    });
  }
  updateParametres(data: ParametresFormation) {
    return avecDonnees((u) => {
      if (!estAdmin(u)) throw new ErreurMetier(INTERDIT);
      if (data.seuilDefaut < data.seuilMinManager) throw new ErreurMetier('Le seuil par défaut ne peut pas être inférieur au seuil minimum des managers.');
      db.parametres = { ...data };
      return db.parametres;
    });
  }
}
