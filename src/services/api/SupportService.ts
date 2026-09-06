import type {
  MetriquePresentation,
  MetriquePresentationLigne,
  ParametresApp,
  SlideMoyenne,
  SupportCommercial,
  SyntheseDeleguePresentation,
  SyntheseSupportPresentation,
  TendanceConformitePresentation,
} from '@/types';

export interface MetriquesPresentationFiltre {
  delegueId?: string;
  supportId?: string;
  dateDebut?: string; // YYYY-MM-DD
  dateFin?: string; // YYYY-MM-DD
}

export interface SupportService {
  getAll(): Promise<SupportCommercial[]>;
  getById(id: string): Promise<SupportCommercial>;
  /** `version`/`tailleFichier` sont attribués par le backend (voir uploaderFichier), jamais fournis à la création. */
  create(data: Omit<SupportCommercial, 'id' | 'version' | 'tailleFichier'>): Promise<SupportCommercial>;
  update(id: string, data: Partial<SupportCommercial>): Promise<SupportCommercial>;
  delete(id: string): Promise<void>;
  /** Upload multipart du fichier (PDF uniquement) — le backend recalcule `nombreSlides` (pages réelles) et incrémente `version`. */
  uploaderFichier(id: string, fichier: File): Promise<SupportCommercial>;
  /** Récupère le PDF du support (authentifié) pour un rendu local (pdf.js) — ex. mode présentation. */
  getFichier(id: string): Promise<Blob>;

  getParametres(): Promise<ParametresApp>;
  updateParametres(params: Partial<ParametresApp>): Promise<ParametresApp>;

  enregistrerMetrique(metrique: Omit<MetriquePresentation, 'id'>): Promise<MetriquePresentation>;
  getMetriqueByRdv(rdvId: string): Promise<MetriquePresentation | null>;

  /** Journal détaillé des présentations, le plus récent en premier — scopé par rôle côté backend. */
  listerMetriques(filtre?: MetriquesPresentationFiltre): Promise<MetriquePresentationLigne[]>;
  /** Une ligne par délégué visible, y compris ceux sans aucune présentation sur la période. */
  getSyntheseParDelegue(
    filtre?: Omit<MetriquesPresentationFiltre, 'delegueId'>,
  ): Promise<SyntheseDeleguePresentation[]>;
  /** Une ligne par support présenté, triée par taux de conformité croissant (les plus fragiles d'abord). */
  getSyntheseParSupport(
    filtre?: Omit<MetriquesPresentationFiltre, 'supportId'>,
  ): Promise<SyntheseSupportPresentation[]>;
  /** Temps moyen passé sur chaque slide d'un support, toutes présentations visibles confondues. */
  getSlidesMoyens(supportId: string): Promise<SlideMoyenne[]>;
  /** Taux de conformité semaine par semaine sur les 12 dernières semaines. */
  getTendanceConformite(delegueId?: string): Promise<TendanceConformitePresentation[]>;
}
