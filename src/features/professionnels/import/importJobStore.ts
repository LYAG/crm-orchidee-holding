'use client';

import { useSyncExternalStore } from 'react';
import {
  finaliserPlanning,
  nouveauContexte,
  rafraichirReferentiels,
  traiterLigne,
  type ContexteSoumission,
  type ResultatSoumission,
} from './soumettreImport';
import type { ProfessionnelAImporter } from './types';

export type StatutJobImport = 'EN_COURS' | 'INTERROMPU' | 'TERMINE' | 'ERREUR';

export interface JobImport {
  delegueId: string;
  delegueNom: string;
  zoneId: string;
  lignes: ProfessionnelAImporter[];
  /** Index de la prochaine ligne à traiter. */
  curseur: number;
  total: number;
  ctx: ContexteSoumission;
  statut: StatutJobImport;
  erreur?: string;
  /** Horodatage de début de la session d'exécution en cours (remis à zéro à chaque reprise). */
  debut: number;
  etaSecondes?: number;
}

const STORAGE_KEY = 'crm_import_job_v1';

let job: JobImport | null = null;
const listeners = new Set<() => void>();

function persister() {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!job || job.statut === 'TERMINE') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    }
  } catch {
    // Stockage indisponible (navigation privée, quota...) — pas bloquant.
  }
}

function notifier() {
  persister();
  listeners.forEach((l) => l());
}

function restaurer(): JobImport | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const restauré = JSON.parse(raw) as JobImport;
    // Rien ne tourne réellement juste après un rechargement de page : on le
    // marque comme interrompu plutôt que de laisser croire qu'il progresse.
    if (restauré.statut === 'EN_COURS') restauré.statut = 'INTERROMPU';
    return restauré;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  job = restaurer();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): JobImport | null {
  return job;
}

async function executer() {
  if (!job) return;
  // `actuel` porte la référence courante : `job` (module-level) est réassigné à chaque étape
  // plutôt que muté en place, sinon useSyncExternalStore (comparaison par Object.is) ne
  // détecte aucun changement et React ne re-render jamais.
  let actuel: JobImport = { ...job, statut: 'EN_COURS', debut: Date.now() };
  job = actuel;
  const curseurDebutSession = actuel.curseur;
  notifier();
  try {
    // Référentiel spécialités/gestes rafraîchi à chaque (re)démarrage — couvre le cas où des
    // demandes ont été approuvées depuis la normalisation, ou pendant une pause de reprise.
    await rafraichirReferentiels(actuel.ctx);
    while (actuel.curseur < actuel.lignes.length) {
      await traiterLigne(actuel.lignes[actuel.curseur], actuel.ctx);

      const curseur = actuel.curseur + 1;
      const traiteesCetteSession = curseur - curseurDebutSession;
      const restantes = actuel.total - curseur;
      const etaSecondes =
        traiteesCetteSession > 0 && restantes > 0
          ? Math.max(0, Math.round(((Date.now() - actuel.debut) / traiteesCetteSession) * restantes / 1000))
          : undefined;

      actuel = { ...actuel, curseur, etaSecondes };
      job = actuel;
      notifier();
    }
    await finaliserPlanning(actuel.ctx);
    actuel = { ...actuel, statut: 'TERMINE', etaSecondes: undefined };
    job = actuel;
    notifier();
  } catch (err) {
    actuel = { ...actuel, statut: 'ERREUR', erreur: err instanceof Error ? err.message : "Erreur lors de l'intégration." };
    job = actuel;
    notifier();
  }
}

/** Démarre un nouvel import. Ignoré si un import est déjà en cours. */
export function demarrerImport(
  lignes: ProfessionnelAImporter[],
  delegueId: string,
  delegueNom: string,
  zoneId: string,
): void {
  if (job && job.statut === 'EN_COURS') return;
  job = {
    delegueId,
    delegueNom,
    zoneId,
    lignes,
    curseur: 0,
    total: lignes.length,
    ctx: nouveauContexte(delegueId, zoneId),
    statut: 'EN_COURS',
    debut: Date.now(),
  };
  notifier();
  void executer();
}

/** Reprend un import interrompu (rechargement de page) ou en erreur, à partir de la ligne où il s'est arrêté. */
export function reprendreImport(): void {
  if (!job || (job.statut !== 'INTERROMPU' && job.statut !== 'ERREUR')) return;
  job = { ...job, erreur: undefined, debut: Date.now() };
  void executer();
}

/** Efface un job terminé ou en erreur pour permettre un nouvel import. */
export function effacerJob(): void {
  if (job && job.statut === 'EN_COURS') return;
  job = null;
  notifier();
}

export function resultatPartiel(j: JobImport): ResultatSoumission {
  return j.ctx.resultat;
}

function getServerSnapshot(): JobImport | null {
  return null;
}

/** Hook réactif : se met à jour dès que l'état du job d'import change, où que soit monté le composant. */
export function useImportJob(): JobImport | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
