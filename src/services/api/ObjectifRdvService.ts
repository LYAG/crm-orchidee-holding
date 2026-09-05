import type { ObjectifRdvAnnee } from '@/types';

export interface ObjectifRdvService {
  /** Objectif de RDV d'un délégué pour l'année donnée (valeur par défaut + éventuels overrides mensuels). */
  getAnnee(delegueId: string, annee: number): Promise<ObjectifRdvAnnee>;
  /** Upsert : `mois` = null pour fixer la valeur par défaut de toute l'année, 1-12 pour un mois précis. */
  definir(delegueId: string, annee: number, mois: number | null, objectifNbRdv: number): Promise<ObjectifRdvAnnee>;
  /** Supprime l'override d'un mois précis (il retombe alors sur la valeur par défaut de l'année). */
  reinitialiserMois(delegueId: string, annee: number, mois: number): Promise<ObjectifRdvAnnee>;
}
