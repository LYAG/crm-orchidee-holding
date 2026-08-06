import type { Centre, GesteMarketing, JoursConsultation, PotentielCas, Specialite } from '@/types';
import { JourSemaine, ModeJoursConsultation, TypeCas, UniteCas } from '@/types';

/* ── Normalisation générique de texte ───────────────────────────────────── */

const REGEX_DIACRITIQUES = new RegExp('[̀-ͯ]', 'g');

export function normaliserTexte(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(REGEX_DIACRITIQUES, '') // supprime les accents (é → e, è → e, ...)
    .toUpperCase()
    .replace(/[.,;:'’-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distance de Levenshtein simple, pour le rapprochement flou. */
function distanceLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
    }
  }
  return d[m][n];
}

export interface CorrespondanceCentre {
  centre?: Centre;
  distance: number;
}

/** Rapprochement flou : normalisation exacte d'abord, puis distance de Levenshtein tolérante. */
export function rapprocherCentre(nomBrut: string, zoneId: string, centres: Centre[]): CorrespondanceCentre {
  const cible = normaliserTexte(nomBrut);
  const candidatsZone = centres.filter((c) => c.zoneId === zoneId);

  const exact = candidatsZone.find((c) => normaliserTexte(c.nom) === cible);
  if (exact) return { centre: exact, distance: 0 };

  let meilleur: Centre | undefined;
  let meilleureDistance = Infinity;
  for (const c of candidatsZone) {
    const d = distanceLevenshtein(cible, normaliserTexte(c.nom));
    if (d < meilleureDistance) {
      meilleureDistance = d;
      meilleur = c;
    }
  }
  // Tolérance : courte distance relative à la longueur du nom.
  if (meilleur && meilleureDistance <= Math.max(2, Math.floor(cible.length * 0.2))) {
    return { centre: meilleur, distance: meilleureDistance };
  }
  return { distance: Infinity };
}

/* ── Spécialités ──────────────────────────────────────────────────────────── */

const SYNONYMES_SPECIALITE: Record<string, string> = {
  CPON: 'CPN',
  PEDIATRE: 'PEDIATRIE',
  SALL_ACC: 'SA',
  IDS: 'IDE',
};

export interface ResultatSpecialites {
  specialiteIds: string[];
  inconnues: string[];
}

export function mapperSpecialites(brut: string, referentiel: Specialite[]): ResultatSpecialites {
  const tokens = brut
    .split(/[/,;]/)
    .map((t) => normaliserTexte(t).replace(/\s+/g, '_'))
    .filter(Boolean)
    .map((t) => SYNONYMES_SPECIALITE[t] ?? t);

  const specialiteIds: string[] = [];
  const inconnues: string[] = [];
  for (const token of tokens) {
    const match = referentiel.find((s) => s.code.toUpperCase() === token);
    if (match) {
      if (!specialiteIds.includes(match.id)) specialiteIds.push(match.id);
    } else if (!inconnues.includes(token)) {
      inconnues.push(token);
    }
  }
  return { specialiteIds, inconnues };
}

/* ── Gestes marketing (colonne ACTION) ──────────────────────────────────── */

const SYNONYMES_GESTE: Record<string, string> = {
  'KIT BB': 'KIT BEBE',
  'PETIT DUJ': 'PETIT DEJEUNER',
  'PETIT DEJ': 'PETIT DEJEUNER',
  SOUPIERRE: 'SOUPIERE',
  'SOUPIERE GRISTAL': 'SOUPIERE',
  'SOUPIERE CRISTAL': 'SOUPIERE',
  'PAQUET EAU': "PAQUET D'EAU",
};

export interface ResultatGestes {
  gesteIds: string[];
  inconnus: string[];
}

export function mapperGestes(brut: string, referentiel: GesteMarketing[]): ResultatGestes {
  const tokens = brut
    .split(/[/,;]/)
    .map((t) => normaliserTexte(t))
    .filter(Boolean)
    .map((t) => SYNONYMES_GESTE[t] ?? t);

  const gesteIds: string[] = [];
  const inconnus: string[] = [];
  for (const token of tokens) {
    const match = referentiel.find((g) => normaliserTexte(g.libelle) === token);
    if (match) {
      if (!gesteIds.includes(match.id)) gesteIds.push(match.id);
    } else if (!inconnus.includes(token)) {
      inconnus.push(token);
    }
  }
  return { gesteIds, inconnus };
}

/* ── Potentiel de cas (colonne NBRE DE CAS) ─────────────────────────────── */

function uniteDepuis(texte: string): UniteCas | null {
  if (/JOUR|\bJRS?\b/i.test(texte)) return UniteCas.JOUR;
  if (/SEM/i.test(texte)) return UniteCas.SEMAINE;
  if (/MOIS/i.test(texte)) return UniteCas.MOIS;
  return null;
}

function typeCasDepuis(texte: string): TypeCas {
  if (/ACCOUCH/i.test(texte)) return TypeCas.ACCOUCHEMENT;
  if (/CONSULT/i.test(texte)) return TypeCas.CONSULTATION;
  return TypeCas.CAS;
}

export function parserPotentielCas(brut: string): PotentielCas | null {
  const t = brut.trim();
  if (!t) return null;

  const unite = uniteDepuis(t);
  if (!unite) return null;
  const typeCas = typeCasDepuis(t);
  const estMinimum = /^MIN\b/i.test(t.trim());

  // "2 A 3 CAS / JOUR", "2 accouch / jour"
  const plage = t.match(/(\d+)\s*(?:A|À|-|–|—)\s*(\d+)/i);
  if (plage) {
    return { min: Number(plage[1]), max: Number(plage[2]), unite, typeCas };
  }

  // "MIN 4 CAS / SEM"
  const unique = t.match(/(\d+)/);
  if (unique) {
    return { min: Number(unique[1]), unite, typeCas, estMinimum: estMinimum || undefined };
  }

  return null;
}

/* ── Jours de consultation (colonne JRS/CONS) ───────────────────────────── */

// Ordre de la semaine, utilisé pour développer les plages ("LUND-VENDR" → LUN..VEN).
const JOURS_ORDRE = [
  JourSemaine.LUN,
  JourSemaine.MAR,
  JourSemaine.MER,
  JourSemaine.JEU,
  JourSemaine.VEN,
  JourSemaine.SAM,
  JourSemaine.DIM,
];

// Préfixes plutôt que noms exacts : tolère les abréviations et coquilles réelles
// du terrain ("LUND", "MERCR", "JEUND", "VENDR"...).
const JOUR_PREFIXES: [string, JourSemaine][] = [
  ['LUN', JourSemaine.LUN],
  ['MAR', JourSemaine.MAR],
  ['MER', JourSemaine.MER],
  ['JEU', JourSemaine.JEU],
  ['VEN', JourSemaine.VEN],
  ['SAM', JourSemaine.SAM],
  ['DIM', JourSemaine.DIM],
];

function jourDepuisToken(token: string): JourSemaine | null {
  const t = token.trim();
  for (const [prefixe, jour] of JOUR_PREFIXES) {
    if (t.startsWith(prefixe)) return jour;
  }
  return null;
}

function joursDansIntervalle(debut: JourSemaine, fin: JourSemaine): JourSemaine[] {
  const iDebut = JOURS_ORDRE.indexOf(debut);
  const iFin = JOURS_ORDRE.indexOf(fin);
  if (iDebut === -1 || iFin === -1 || iFin < iDebut) return [debut, fin].filter((j, i, arr) => arr.indexOf(j) === i);
  return JOURS_ORDRE.slice(iDebut, iFin + 1);
}

export function parserJoursConsultation(brut: string): JoursConsultation | null {
  const t = brut.trim();
  if (!t) return null;
  const majuscule = t.toUpperCase();

  if (/TOUS\s+LES\s+JOURS/.test(majuscule)) {
    return { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: 6 };
  }

  // "2 FOIS/SEMAINE", "2A3 FOIS/SEMAINE" (on prend la borne haute)
  const frequence = majuscule.match(/(\d+)(?:\s*(?:A|À)\s*(\d+))?\s*FOIS\s*\/?\s*SEM/);
  if (frequence) {
    const freq = Number(frequence[2] ?? frequence[1]);
    return { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: freq };
  }

  // "2/ SEM", "3-4/ SEM" : fréquence implicite (sans le mot "FOIS")
  const frequenceImplicite = majuscule.match(/^(\d+)(?:\s*[-–—]\s*(\d+))?\s*\/\s*SEM/);
  if (frequenceImplicite) {
    const freq = Number(frequenceImplicite[2] ?? frequenceImplicite[1]);
    return { mode: ModeJoursConsultation.FREQUENCE, frequenceParSemaine: freq };
  }

  // Plage "LUNDI - VENDREDI" / "LUND-VENDR" / "MARDI – JEUDI" : deux jours reliés
  // par un seul tiret → on développe l'intervalle complet.
  const partsPlage = majuscule.split(/\s*[–—-]\s*/).map((p) => p.trim()).filter(Boolean);
  if (partsPlage.length === 2) {
    const debut = jourDepuisToken(partsPlage[0]);
    const fin = jourDepuisToken(partsPlage[1]);
    if (debut && fin) {
      return { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours: joursDansIntervalle(debut, fin) };
    }
  }

  // Jours explicites séparés par ; , . / ou espaces
  const tokens = majuscule.split(/[;,./\s]+/).filter(Boolean);
  const jours: JourSemaine[] = [];
  for (const token of tokens) {
    const jour = jourDepuisToken(token);
    if (jour && !jours.includes(jour)) jours.push(jour);
  }
  if (jours.length > 0) {
    return { mode: ModeJoursConsultation.JOURS_EXPLICITES, jours };
  }

  return null;
}

/* ── Noms multiples dans une cellule ─────────────────────────────────────── */

export function eclaterNoms(brut: string): string[] {
  return brut
    .split(/[;,]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0 && !/^etc\.?$/i.test(n));
}

/* ── Téléphones ───────────────────────────────────────────────────────────── */

export interface TelephoneNettoye {
  valeur: string;
  valide: boolean;
}

export function nettoyerTelephone(brut: string): TelephoneNettoye {
  let v = brut.replace(/[^\d]/g, '');
  if (v.startsWith('225')) v = v.slice(3);
  if (!v.startsWith('0') && v.length === 9) v = `0${v}`;
  return { valeur: v, valide: /^0\d{9}$/.test(v) };
}

export function eclaterTelephones(brut: string): TelephoneNettoye[] {
  if (!brut.trim()) return [];
  return brut
    .split(/[;,/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(nettoyerTelephone);
}

/* ── Jour de tournée (colonne JOUR) ─────────────────────────────────────── */

const SECTIONS_PARASITES = /^(RESUME|AUTRES\s*SF|SEMAINE\s*\d+)$/i;

export function estJourDeTourneeValide(brut: string): JourSemaine | null {
  const t = normaliserTexte(brut);
  if (SECTIONS_PARASITES.test(t)) return null;
  return jourDepuisToken(t);
}

export function estLigneParasite(jourBrut: string, nomBrut: string): boolean {
  const jourNormalise = normaliserTexte(jourBrut);
  if (SECTIONS_PARASITES.test(jourNormalise)) return true;
  if (!nomBrut || !nomBrut.trim()) return true;
  if (/^\d+$/.test(nomBrut.trim())) return true;
  return false;
}
