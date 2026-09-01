import type { CreateProfessionnelDto } from '@/services/api/ProfessionnelService';
import { professionnelService } from '@/services';
import { JourSemaine, ModeJoursConsultation, StatutProfessionnel, TypeDemandeValidation } from '@/types';
import type { GesteMarketing, JourTournee, JourTourneeKey, JoursConsultation, Specialite } from '@/types';
import { mapperGestes, mapperSpecialites } from './normalisation';
import type { ProfessionnelAImporter } from './types';

export interface ResultatSoumission {
  creees: number;
  miseAJour: number;
  ignorees: number;
  demandesValidation: number;
  centresCrees: number;
}

/** Appelé après chaque ligne traitée, pour piloter une barre de progression. */
export type ProgressionSoumission = (lignesTraitees: number, totalLignes: number) => void;

function joursConsultationFinal(ligne: ProfessionnelAImporter): JoursConsultation {
  if (ligne.joursConsultation) return ligne.joursConsultation;
  return {
    mode: ModeJoursConsultation.JOURS_EXPLICITES,
    jours: [],
    commentaire: ligne.jrsConsBrut ? `Non reconnu à l'import : "${ligne.jrsConsBrut}"` : undefined,
  };
}

function observationsFinales(ligne: ProfessionnelAImporter): string | undefined {
  const notes: string[] = [];
  if (ligne.observation) notes.push(ligne.observation);
  if (ligne.nbreDeCasBrut && !ligne.potentielCas) notes.push(`Potentiel non reconnu à l'import : "${ligne.nbreDeCasBrut}"`);
  if (ligne.telephonesInvalides.length > 0) notes.push(`Téléphone(s) invalide(s) : ${ligne.telephonesInvalides.join(', ')}`);
  if (ligne.telephones.length === 0) notes.push('Téléphone à compléter');
  return notes.length > 0 ? notes.join(' — ') : undefined;
}

async function construireDto(
  ligne: ProfessionnelAImporter,
  delegueId: string,
  specialiteIds: string[],
): Promise<CreateProfessionnelDto | null> {
  if (!ligne.centreId) return null;
  return {
    nom: ligne.nom,
    telephones: ligne.telephones,
    centreId: ligne.centreId,
    specialiteIds,
    joursConsultation: joursConsultationFinal(ligne),
    potentielCas: ligne.potentielCas ?? undefined,
    delegueId,
    observations: observationsFinales(ligne),
    actif: true,
    statut: StatutProfessionnel.T3,
  };
}

/**
 * État accumulé pendant l'import — en structures simples (pas de Map/Set) pour
 * rester sérialisable tel quel (persistance de la reprise après rechargement).
 */
export interface ContexteSoumission {
  delegueId: string;
  zoneId: string;
  resultat: ResultatSoumission;
  /** Un seul centre créé par nom rencontré dans le lot, réutilisé pour les lignes suivantes. */
  centresCreesParNom: Record<string, string>;
  /** JourTourneeKey -> liste de centreId (dédupliquée) couverts ce jour-là. */
  planningParJour: Record<string, string[]>;
  /**
   * Référentiels spécialités/gestes, rafraîchis au (re)démarrage de l'exécution (voir
   * rafraichirReferentiels) — plus complets, potentiellement, que le référentiel utilisé à la
   * normalisation (étape 2) si des demandes ont été approuvées entre-temps. Chaque ligne est
   * re-résolue contre cette version fraîche au moment de la soumission, pas contre l'ancienne
   * (ligne.specialiteIds / ligne.specialitesInconnues), pour ne jamais proposer un code déjà connu.
   */
  specialitesRef: Specialite[];
  gestesRef: GesteMarketing[];
}

export function nouveauContexte(delegueId: string, zoneId: string): ContexteSoumission {
  return {
    delegueId,
    zoneId,
    resultat: { creees: 0, miseAJour: 0, ignorees: 0, demandesValidation: 0, centresCrees: 0 },
    centresCreesParNom: {},
    planningParJour: {},
    specialitesRef: [],
    gestesRef: [],
  };
}

/** À appeler avant de (re)lancer le traitement des lignes — voir ContexteSoumission.specialitesRef. */
export async function rafraichirReferentiels(ctx: ContexteSoumission): Promise<void> {
  const [specialites, gestes] = await Promise.all([
    professionnelService.getSpecialites(),
    professionnelService.getGestesMarketing(),
  ]);
  ctx.specialitesRef = specialites;
  ctx.gestesRef = gestes;
}

/** Crée une demande par code non reconnu, rattachée au professionnel concerné quand il est
 * connu — permet, à l'approbation, de relier automatiquement la nouvelle spécialité/le nouveau
 * geste à la fiche d'origine plutôt que de laisser un simple libellé texte sans lien. */
async function proposerCodesInconnus(
  ligne: ProfessionnelAImporter,
  ctx: ContexteSoumission,
  specialitesInconnues: string[],
  gestesInconnus: string[],
  professionnelId: string | undefined,
): Promise<void> {
  const { delegueId, resultat } = ctx;
  for (const code of specialitesInconnues) {
    await professionnelService.creerDemandeValidation({
      type: TypeDemandeValidation.NOUVELLE_SPECIALITE,
      delegueId,
      libelle: `Nouvelle spécialité proposée : "${code}" (ligne ${ligne.ligneExcel})`,
      donnees: { code, libelle: code, actif: true },
      professionnelExistantId: professionnelId,
    });
    resultat.demandesValidation++;
  }
  for (const geste of gestesInconnus) {
    await professionnelService.creerDemandeValidation({
      type: TypeDemandeValidation.NOUVEAU_GESTE,
      delegueId,
      libelle: `Nouveau geste proposé : "${geste}" (ligne ${ligne.ligneExcel})`,
      donnees: { libelle: geste, actif: true },
    });
    resultat.demandesValidation++;
  }
}

export async function traiterLigne(ligne: ProfessionnelAImporter, ctx: ContexteSoumission): Promise<void> {
  const { delegueId, zoneId, resultat, centresCreesParNom, planningParJour } = ctx;

  // Centre inconnu : on le crée directement dans la zone du délégué pour ne pas
  // bloquer l'import, tout en gardant une trace (demande de validation informative).
  if (ligne.centreACreer && !ligne.centreId) {
    const clef = ligne.centreBrut.trim().toUpperCase();
    let centreId = centresCreesParNom[clef];
    if (!centreId) {
      const centre = await professionnelService.createCentre({ nom: ligne.centreBrut.trim(), zoneId, actif: true });
      centreId = centre.id;
      centresCreesParNom[clef] = centreId;
      resultat.centresCrees++;
      await professionnelService.creerDemandeValidation({
        type: TypeDemandeValidation.NOUVEAU_CENTRE,
        delegueId,
        libelle: `Nouveau centre créé à l'import : "${ligne.centreBrut}"`,
        donnees: { nom: ligne.centreBrut, zoneId, actif: true },
      });
    }
    ligne.centreId = centreId;
  }

  if (ligne.jourTournee && ligne.jourTournee !== JourSemaine.DIM && ligne.centreId) {
    const jourTournee = ligne.jourTournee as JourTourneeKey;
    const liste = planningParJour[jourTournee] ?? (planningParJour[jourTournee] = []);
    if (!liste.includes(ligne.centreId)) liste.push(ligne.centreId);
  }

  // Re-résolution contre le référentiel frais (pas celui, potentiellement périmé, figé à la
  // normalisation) : un code approuvé entre-temps est directement rattaché, sans repasser
  // par une nouvelle demande.
  const { specialiteIds, inconnues: specialitesInconnues } = mapperSpecialites(ligne.specialiteBrut, ctx.specialitesRef);
  const { inconnus: gestesInconnus } = mapperGestes(ligne.actionBrut, ctx.gestesRef);

  if (ligne.statut === 'DOUBLON') {
    if (ligne.actionDoublon === 'IGNORER' || !ligne.actionDoublon) {
      // La ligne ne crée pas de fiche, mais représente le même professionnel réel que le
      // doublon détecté : on y rattache donc les codes nouvellement approuvés.
      await proposerCodesInconnus(ligne, ctx, specialitesInconnues, gestesInconnus, ligne.doublonProfessionnelId);
      resultat.ignorees++;
      return;
    }
    if (ligne.actionDoublon === 'REMPLACER' && ligne.doublonProfessionnelId) {
      const dto = await construireDto(ligne, delegueId, specialiteIds);
      if (dto) {
        await professionnelService.updateProfessionnel(ligne.doublonProfessionnelId, dto);
        resultat.miseAJour++;
      }
      await proposerCodesInconnus(ligne, ctx, specialitesInconnues, gestesInconnus, ligne.doublonProfessionnelId);
      return;
    }
    if (ligne.actionDoublon === 'CREER_QUAND_MEME') {
      const dto = await construireDto(ligne, delegueId, specialiteIds);
      if (dto) {
        await professionnelService.creerDemandeValidation({
          type: TypeDemandeValidation.DOUBLON_PROFESSIONNEL,
          delegueId,
          libelle: `Création malgré doublon : "${ligne.nom}" (ligne ${ligne.ligneExcel})`,
          donnees: dto,
          professionnelExistantId: ligne.doublonProfessionnelId,
        });
        resultat.demandesValidation++;
      }
      // La fiche n'existe pas encore (création différée à l'approbation de la demande
      // ci-dessus) : pas d'id à rattacher pour l'instant, la proposition reste informative.
      await proposerCodesInconnus(ligne, ctx, specialitesInconnues, gestesInconnus, undefined);
      return;
    }
  }

  const dto = await construireDto(ligne, delegueId, specialiteIds);
  if (dto) {
    const cree = await professionnelService.importerProfessionnel(dto);
    resultat.creees++;
    await proposerCodesInconnus(ligne, ctx, specialitesInconnues, gestesInconnus, cree.id);
  } else {
    resultat.ignorees++;
    await proposerCodesInconnus(ligne, ctx, specialitesInconnues, gestesInconnus, undefined);
  }
}

export async function finaliserPlanning(ctx: ContexteSoumission): Promise<void> {
  const planningsExistants: JourTournee[] = await professionnelService.getJourneesTournee(ctx.delegueId);
  for (const [jour, centreIds] of Object.entries(ctx.planningParJour)) {
    const existant = planningsExistants.find((p) => p.jour === jour);
    const fusion = new Set([...(existant?.centreIds ?? []), ...centreIds]);
    await professionnelService.saveJourTournee({
      delegueId: ctx.delegueId,
      jour: jour as JourTourneeKey,
      centreIds: [...fusion],
    });
  }
}

/** Import complet, sans suivi de reprise — utilisé par le store de job pour le cas simple. */
export async function soumettreImport(
  lignes: ProfessionnelAImporter[],
  delegueId: string,
  zoneId: string,
  onProgress?: ProgressionSoumission,
): Promise<ResultatSoumission> {
  const ctx = nouveauContexte(delegueId, zoneId);
  await rafraichirReferentiels(ctx);
  let traitees = 0;
  for (const ligne of lignes) {
    await traiterLigne(ligne, ctx);
    traitees++;
    onProgress?.(traitees, lignes.length);
  }
  await finaliserPlanning(ctx);
  return ctx.resultat;
}
