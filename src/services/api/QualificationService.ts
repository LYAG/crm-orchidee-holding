import type { FicheMensuelleProfessionnel, QualificationRDV } from '@/types';

export interface QualificationService {
  getByRdv(rdvId: string): Promise<QualificationRDV | null>;
  create(data: Omit<QualificationRDV, 'id'>): Promise<QualificationRDV>;
  update(id: string, data: Partial<QualificationRDV>, managerId: string): Promise<QualificationRDV>;
  /** Fiche de suivi mensuel (voir fiche papier) — visites qualifiées d'un délégué pour un mois donné, groupées par professionnel. */
  getFicheMensuelle(delegueId: string, annee: number, mois: number): Promise<FicheMensuelleProfessionnel[]>;
}
