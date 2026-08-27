import type { MetriquePresentation, ParametresApp, SupportCommercial } from '@/types';

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
}
