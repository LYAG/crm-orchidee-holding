import type { CritereNotation, NotationMois, TypeCritereNotation } from '@/types';

export interface CritereNotationDto {
  libelle: string;
  description?: string | null;
  type: TypeCritereNotation;
  poids: number;
  actif?: boolean;
  ordre?: number;
}

export interface EnregistrerNotationDto {
  delegueId: string;
  annee: number;
  mois: number;
  /** critereId (critères MANUEL actifs) → note /20. */
  notes: Record<string, number>;
  commentaire?: string | null;
}

export interface NotationService {
  getCriteres(): Promise<CritereNotation[]>;
  createCritere(data: CritereNotationDto): Promise<CritereNotation>;
  updateCritere(id: string, data: CritereNotationDto): Promise<CritereNotation>;
  deleteCritere(id: string): Promise<void>;
  /** Notations de l'année (mois à venir exclus), scopées au rôle ; delegueId pour filtrer. */
  getNotations(annee: number, delegueId?: string): Promise<NotationMois[]>;
  /** Crée ou remplace l'évaluation d'un délégué pour un mois (manager de son équipe ou admin). */
  enregistrerNotation(data: EnregistrerNotationDto): Promise<NotationMois>;
}
