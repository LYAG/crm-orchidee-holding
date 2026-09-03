import type { ObjectifAnnee } from '@/types';

export interface ObjectifConversionService {
  /** Objectif de conversion T1 → ST pour l'année donnée (valeur par défaut + éventuels overrides mensuels). */
  getAnnee(annee: number): Promise<ObjectifAnnee>;
  /** Upsert : `mois` = null pour fixer la valeur par défaut de toute l'année, 1-12 pour un mois précis. */
  definir(annee: number, mois: number | null, objectifNbConversions: number): Promise<ObjectifAnnee>;
  /** Supprime l'override d'un mois précis (il retombe alors sur la valeur par défaut de l'année). */
  reinitialiserMois(annee: number, mois: number): Promise<ObjectifAnnee>;
}
