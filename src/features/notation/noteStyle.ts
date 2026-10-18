/** Lecture d'une note /20 : couleur et libellé communs au tableau et au détail. */
export function styleNote(note: number | null): { color: string; bg: string } {
  if (note === null) return { color: '#627A74', bg: '#F1F3F2' };
  if (note >= 14) return { color: '#0F6E52', bg: '#E8F2EE' };
  if (note >= 10) return { color: '#1F5FA8', bg: '#EAF1FA' };
  return { color: '#A84A00', bg: '#FCF1E3' };
}

export function formaterNote(note: number | null): string {
  return note === null ? '—' : note.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

export const MOIS_COURTS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
export const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
