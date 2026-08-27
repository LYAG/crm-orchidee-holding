import {
  JourSemaine,
  ModeJoursConsultation,
  StatutProfessionnel,
  TypeCas,
  UniteCas,
  type JoursConsultation,
  type PotentielCas,
} from '@/types';

export const STATUT_CONFIG: Record<StatutProfessionnel, { color: string; bg: string; label: string }> = {
  [StatutProfessionnel.PNA]: { color: '#E65100', bg: '#FFF3E0', label: 'Non affecté' },
  [StatutProfessionnel.ST]: { color: '#2E7D32', bg: '#E8F5E9', label: 'ST' },
  [StatutProfessionnel.T1]: { color: '#1565C0', bg: '#E3F2FD', label: 'T1' },
  [StatutProfessionnel.T2]: { color: '#6A1B9A', bg: '#F3E5F5', label: 'T2' },
  [StatutProfessionnel.T3]: { color: '#9E9E9E', bg: '#F5F5F5', label: 'T3' },
  [StatutProfessionnel.PERDU]: { color: '#C62828', bg: '#FFEBEE', label: 'Perdu' },
};

export const JOUR_LABELS: Record<JourSemaine, string> = {
  [JourSemaine.LUN]: 'Lun',
  [JourSemaine.MAR]: 'Mar',
  [JourSemaine.MER]: 'Mer',
  [JourSemaine.JEU]: 'Jeu',
  [JourSemaine.VEN]: 'Ven',
  [JourSemaine.SAM]: 'Sam',
  [JourSemaine.DIM]: 'Dim',
};

const UNITE_LABELS: Record<UniteCas, string> = {
  [UniteCas.JOUR]: 'jour',
  [UniteCas.SEMAINE]: 'sem.',
  [UniteCas.MOIS]: 'mois',
};

const TYPE_CAS_LABELS: Record<TypeCas, string> = {
  [TypeCas.CAS]: 'cas',
  [TypeCas.ACCOUCHEMENT]: 'accouch.',
  [TypeCas.CONSULTATION]: 'consult.',
};

export function formatJoursConsultation(jc: JoursConsultation): string {
  if (jc.mode === ModeJoursConsultation.FREQUENCE) {
    return jc.frequenceParSemaine != null ? `${jc.frequenceParSemaine}×/semaine` : jc.commentaire ?? '—';
  }
  if (jc.jours && jc.jours.length > 0) {
    return jc.jours.map((j) => JOUR_LABELS[j]).join(', ');
  }
  return jc.commentaire ?? '—';
}

export function formatPotentielCas(pc?: PotentielCas): string {
  if (!pc) return '—';
  const plage = pc.max != null && pc.max !== pc.min ? `${pc.min}–${pc.max}` : `${pc.estMinimum ? 'min ' : ''}${pc.min}`;
  return `${plage} ${TYPE_CAS_LABELS[pc.typeCas]}/${UNITE_LABELS[pc.unite]}`;
}

/** Jour de la semaine ISO (lundi=1) → JourSemaine */
export function jourSemaineDepuisDate(date: string): JourSemaine {
  const jours = [JourSemaine.DIM, JourSemaine.LUN, JourSemaine.MAR, JourSemaine.MER, JourSemaine.JEU, JourSemaine.VEN, JourSemaine.SAM];
  return jours[new Date(date).getDay()];
}

export function estDisponibleCeJour(jc: JoursConsultation, jour: JourSemaine): boolean {
  if (jc.mode === ModeJoursConsultation.JOURS_EXPLICITES) {
    // Liste vide = donnée non renseignée (jamais "disponible aucun jour") : pas de blocage.
    if (!jc.jours || jc.jours.length === 0) return true;
    return jc.jours.includes(jour);
  }
  // Mode FREQUENCE : pas de jour précis connu, on ne bloque pas.
  return true;
}
