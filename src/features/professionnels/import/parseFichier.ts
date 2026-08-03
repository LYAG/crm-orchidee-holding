import * as XLSX from 'xlsx';
import { estLigneParasite } from './normalisation';
import type { LigneBrute } from './types';

const COLONNES_ATTENDUES: Record<keyof Omit<LigneBrute, 'ligneExcel'>, string[]> = {
  jour: ['JOUR'],
  centre: ['CENTRE'],
  specialite: ['SPECIALITE', 'SPÉCIALITÉ'],
  nomEtPrenom: ['NOM ET PRENOM', 'NOM ET PRÉNOM', 'NOM PRENOM'],
  numero: ['NUMERO', 'NUMÉRO', 'TELEPHONE', 'TÉLÉPHONE'],
  jrsCons: ['JRS/CONS', 'JRS CONS', 'JOURS CONSULTATION'],
  nbreDeCas: ['NBRE DE CAS', 'NOMBRE DE CAS'],
  action: ['ACTION'],
  observation: ['OBSERVATION', 'OBSERVATIONS'],
};

export async function listerFeuilles(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames;
}

function normaliserEntete(texte: unknown): string {
  return String(texte ?? '').trim().toUpperCase();
}

function trouverIndexColonnes(headerRow: unknown[]): Partial<Record<keyof Omit<LigneBrute, 'ligneExcel'>, number>> {
  const entetes = headerRow.map(normaliserEntete);
  const resultat: Partial<Record<keyof Omit<LigneBrute, 'ligneExcel'>, number>> = {};
  for (const [cle, alias] of Object.entries(COLONNES_ATTENDUES)) {
    const idx = entetes.findIndex((e) => alias.includes(e));
    if (idx >= 0) resultat[cle as keyof Omit<LigneBrute, 'ligneExcel'>] = idx;
  }
  return resultat;
}

export interface ResultatParsing {
  lignes: LigneBrute[];
  lignesIgnorees: number;
  colonnesManquantes: string[];
}

/**
 * Lit une feuille, propage les cellules fusionnées (JOUR, CENTRE) vers le bas,
 * et ignore les sections parasites (RESUME, AUTRES SF, SEMAINE 2, lignes numériques isolées, sans nom).
 */
export async function parserFeuille(file: File, nomFeuille: string): Promise<ResultatParsing> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[nomFeuille];
  if (!sheet) throw new Error(`Feuille "${nomFeuille}" introuvable.`);

  const grille: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (grille.length === 0) return { lignes: [], lignesIgnorees: 0, colonnesManquantes: Object.keys(COLONNES_ATTENDUES) };

  // Cherche la première ligne contenant au moins JOUR + CENTRE (l'entête).
  let indexEntete = 0;
  let colonnes = trouverIndexColonnes(grille[0]);
  for (let i = 0; i < Math.min(grille.length, 5); i++) {
    const test = trouverIndexColonnes(grille[i]);
    if (test.jour != null && test.centre != null) {
      indexEntete = i;
      colonnes = test;
      break;
    }
  }

  const colonnesManquantes = (Object.keys(COLONNES_ATTENDUES) as (keyof typeof COLONNES_ATTENDUES)[]).filter(
    (c) => colonnes[c] == null,
  );

  const lignes: LigneBrute[] = [];
  let lignesIgnorees = 0;
  let dernierJour = '';
  let dernierCentre = '';

  for (let i = indexEntete + 1; i < grille.length; i++) {
    const row = grille[i];
    const val = (cle: keyof typeof colonnes) => {
      const idx = colonnes[cle];
      return idx != null ? String(row[idx] ?? '').trim() : '';
    };

    const jourCell = val('jour');
    const centreCell = val('centre');
    // Propagation des cellules fusionnées : on garde la dernière valeur non vide.
    if (jourCell) dernierJour = jourCell;
    if (centreCell) dernierCentre = centreCell;

    const nomEtPrenom = val('nomEtPrenom');

    if (estLigneParasite(dernierJour, nomEtPrenom)) {
      lignesIgnorees++;
      continue;
    }

    lignes.push({
      ligneExcel: i + 1,
      jour: dernierJour,
      centre: dernierCentre,
      specialite: val('specialite'),
      nomEtPrenom,
      numero: val('numero'),
      jrsCons: val('jrsCons'),
      nbreDeCas: val('nbreDeCas'),
      action: val('action'),
      observation: val('observation'),
    });
  }

  return { lignes, lignesIgnorees, colonnesManquantes };
}
