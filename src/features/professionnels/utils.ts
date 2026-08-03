import {
  JourSemaine,
  ModeJoursConsultation,
  TypeCas,
  UniteCas,
  type JoursConsultation,
  type PotentielCas,
} from '@/types';

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
    return jc.jours?.includes(jour) ?? true;
  }
  // Mode FREQUENCE : pas de jour précis connu, on ne bloque pas.
  return true;
}
