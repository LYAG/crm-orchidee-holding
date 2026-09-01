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
   * normalisation (étape 2) si des demandes ont été approuvées entre-temps.
   */
  specialitesRef: Specialite[];
  gestesRef: GesteMarketing[];
  /** Code (normalisé) -> id, pour les spécialités créées PENDANT ce lot — même principe que
   * centresCreesParNom : une seule création (et une seule demande informative) par code, même
   * si plusieurs lignes le référencent ; chaque professionnel concerné reçoit l'id directement. */
  specialitesCreesParCode: Record<string, string>;
  /** Idem pour les gestes marketing (libellé en minuscules -> id). */
  gestesCreesParLibelle: Record<string, string>;
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
    specialitesCreesParCode: {},
    gestesCreesParLibelle: {},
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

/**
 * Résout les codes de spécialité d'une ligne en ids réels — comme pour le centre, un code
 * inconnu est créé directement dans le référentiel (une seule fois par code sur tout le lot)
 * plutôt que laissé de côté derrière une demande de validation qui ne rattache jamais rien.
 */
async function resoudreSpecialites(ligne: ProfessionnelAImporter, ctx: ContexteSoumission): Promise<string[]> {
  const { specialiteIds, inconnues } = mapperSpecialites(ligne.specialiteBrut, ctx.specialitesRef);
  const ids = [...specialiteIds];
  for (const code of inconnues) {
    let id = ctx.specialitesCreesParCode[code];
    if (!id) {
      const specialite = await creerOuRecupererSpecialite(code, ctx);
      id = specialite.id;
      ctx.specialitesCreesParCode[code] = id;
      ctx.specialitesRef = [...ctx.specialitesRef, specialite];
    }
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function creerOuRecupererSpecialite(code: string, ctx: ContexteSoumission): Promise<Specialite> {
  try {
    const specialite = await professionnelService.createSpecialite({ code, libelle: code, actif: true });
    await professionnelService.creerDemandeValidation({
      type: TypeDemandeValidation.NOUVELLE_SPECIALITE,
      delegueId: ctx.delegueId,
      libelle: `Nouvelle spécialité créée à l'import : "${code}"`,
      donnees: { code, libelle: code, actif: true },
    });
    ctx.resultat.demandesValidation++;
    return specialite;
  } catch {
    // Course avec un autre import ayant créé ce même code entre-temps : on le récupère au lieu d'échouer.
    const existante = (await professionnelService.getSpecialites()).find((s) => s.code.toUpperCase() === code);
    if (!existante) throw new Error(`Impossible de créer ou retrouver la spécialité "${code}".`);
    return existante;
  }
}

/**
 * Même principe que resoudreSpecialites pour les gestes marketing (colonne ACTION) — alimente
 * le référentiel à l'import ; aucun rattachement au professionnel n'existe pour les gestes
 * (ce ne sont pas un attribut de la fiche, contrairement aux spécialités).
 */
async function resoudreGestes(ligne: ProfessionnelAImporter, ctx: ContexteSoumission): Promise<void> {
  const { inconnus } = mapperGestes(ligne.actionBrut, ctx.gestesRef);
  for (const libelleBrut of inconnus) {
    const clef = libelleBrut.toLowerCase();
    if (ctx.gestesCreesParLibelle[clef]) continue;
    try {
      const geste = await professionnelService.createGesteMarketing({ libelle: libelleBrut, actif: true });
      ctx.gestesCreesParLibelle[clef] = geste.id;
      ctx.gestesRef = [...ctx.gestesRef, geste];
      await professionnelService.creerDemandeValidation({
        type: TypeDemandeValidation.NOUVEAU_GESTE,
        delegueId: ctx.delegueId,
        libelle: `Nouveau geste créé à l'import : "${libelleBrut}"`,
        donnees: { libelle: libelleBrut, actif: true },
      });
      ctx.resultat.demandesValidation++;
    } catch {
      const existant = (await professionnelService.getGestesMarketing()).find(
        (g) => g.libelle.trim().toLowerCase() === clef,
      );
      if (existant) {
        ctx.gestesCreesParLibelle[clef] = existant.id;
        ctx.gestesRef = [...ctx.gestesRef, existant];
      }
    }
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

  // Comme pour le centre ci-dessus : les codes inconnus sont créés directement dans le
  // référentiel (une seule fois par code sur tout le lot), pas laissés de côté derrière une
  // demande de validation qui ne rattacherait jamais rien au professionnel.
  const specialiteIds = await resoudreSpecialites(ligne, ctx);
  await resoudreGestes(ligne, ctx);

  if (ligne.statut === 'DOUBLON') {
    if (ligne.actionDoublon === 'IGNORER' || !ligne.actionDoublon) {
      resultat.ignorees++;
      return;
    }
    if (ligne.actionDoublon === 'REMPLACER' && ligne.doublonProfessionnelId) {
      const dto = await construireDto(ligne, delegueId, specialiteIds);
      if (dto) {
        await professionnelService.updateProfessionnel(ligne.doublonProfessionnelId, dto);
        resultat.miseAJour++;
      }
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
      return;
    }
  }

  const dto = await construireDto(ligne, delegueId, specialiteIds);
  if (dto) {
    await professionnelService.importerProfessionnel(dto);
    resultat.creees++;
  } else {
    resultat.ignorees++;
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
