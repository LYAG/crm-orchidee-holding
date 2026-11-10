/**
 * Modules activables. Un module désactivé disparaît du menu et des tableaux de bord, et sa page
 * affiche « Module désactivé » ; ses données et le backend restent intacts. Passer à `true` pour
 * le réactiver.
 */
export const FONCTIONNALITES = {
  /** Opportunités commerciales (Kanban, pipeline en €). Désactivé pour l'instant. */
  opportunites: false,
} as const;

export type Fonctionnalite = keyof typeof FONCTIONNALITES;

export function estActive(f: Fonctionnalite): boolean {
  return FONCTIONNALITES[f];
}
