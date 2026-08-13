import type { CreateProfessionnelDto } from '@/services/api/ProfessionnelService';
import { professionnelService } from '@/services';
import { JourSemaine, ModeJoursConsultation, StatutProfessionnel, TypeDemandeValidation } from '@/types';
import type { JourTournee, JourTourneeKey, JoursConsultation } from '@/types';
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

async function construireDto(ligne: ProfessionnelAImporter, delegueId: string): Promise<CreateProfessionnelDto | null> {
  if (!ligne.centreId) return null;
  return {
    nom: ligne.nom,
    telephones: ligne.telephones,
    centreId: ligne.centreId,
    specialiteIds: ligne.specialiteIds,
    joursConsultation: joursConsultationFinal(ligne),
    potentielCas: ligne.potentielCas ?? undefined,
    delegueId,
    observations: observationsFinales(ligne),
    actif: true,
    statut: StatutProfessionnel.T3,
  };
}

interface ContexteSoumission {
  delegueId: string;
  zoneId: string;
  resultat: ResultatSoumission;
  centresCreesParNom: Map<string, string>;
  planningParJour: Map<JourTourneeKey, Set<string>>;
}

async function traiterLigne(ligne: ProfessionnelAImporter, ctx: ContexteSoumission): Promise<void> {
  const { delegueId, zoneId, resultat, centresCreesParNom, planningParJour } = ctx;

  // Centre inconnu : on le crée directement dans la zone du délégué pour ne pas
  // bloquer l'import, tout en gardant une trace (demande de validation informative).
  if (ligne.centreACreer && !ligne.centreId) {
    const clef = ligne.centreBrut.trim().toUpperCase();
    let centreId = centresCreesParNom.get(clef);
    if (!centreId) {
      const centre = await professionnelService.createCentre({ nom: ligne.centreBrut.trim(), zoneId, actif: true });
      centreId = centre.id;
      centresCreesParNom.set(clef, centreId);
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
    if (!planningParJour.has(jourTournee)) planningParJour.set(jourTournee, new Set());
    planningParJour.get(jourTournee)!.add(ligne.centreId);
  }

  for (const code of ligne.specialitesInconnues) {
    await professionnelService.creerDemandeValidation({
      type: TypeDemandeValidation.NOUVELLE_SPECIALITE,
      delegueId,
      libelle: `Nouvelle spécialité proposée : "${code}" (ligne ${ligne.ligneExcel})`,
      donnees: { code, libelle: code, actif: true },
    });
    resultat.demandesValidation++;
  }
  for (const geste of ligne.gestesInconnus) {
    await professionnelService.creerDemandeValidation({
      type: TypeDemandeValidation.NOUVEAU_GESTE,
      delegueId,
      libelle: `Nouveau geste proposé : "${geste}" (ligne ${ligne.ligneExcel})`,
      donnees: { libelle: geste, actif: true },
    });
    resultat.demandesValidation++;
  }

  if (ligne.statut === 'DOUBLON') {
    if (ligne.actionDoublon === 'IGNORER' || !ligne.actionDoublon) {
      resultat.ignorees++;
      return;
    }
    if (ligne.actionDoublon === 'REMPLACER' && ligne.doublonProfessionnelId) {
      const dto = await construireDto(ligne, delegueId);
      if (dto) {
        await professionnelService.updateProfessionnel(ligne.doublonProfessionnelId, dto);
        resultat.miseAJour++;
      }
      return;
    }
    if (ligne.actionDoublon === 'CREER_QUAND_MEME') {
      const dto = await construireDto(ligne, delegueId);
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

  const dto = await construireDto(ligne, delegueId);
  if (dto) {
    await professionnelService.importerProfessionnel(dto);
    resultat.creees++;
  } else {
    resultat.ignorees++;
  }
}

export async function soumettreImport(
  lignes: ProfessionnelAImporter[],
  delegueId: string,
  zoneId: string,
  onProgress?: ProgressionSoumission,
): Promise<ResultatSoumission> {
  const ctx: ContexteSoumission = {
    delegueId,
    zoneId,
    resultat: { creees: 0, miseAJour: 0, ignorees: 0, demandesValidation: 0, centresCrees: 0 },
    // Un seul centre créé par nom rencontré dans le lot, réutilisé pour les lignes suivantes.
    centresCreesParNom: new Map<string, string>(),
    planningParJour: new Map<JourTourneeKey, Set<string>>(),
  };

  let traitees = 0;
  for (const ligne of lignes) {
    await traiterLigne(ligne, ctx);
    traitees++;
    onProgress?.(traitees, lignes.length);
  }

  const planningsExistants: JourTournee[] = await professionnelService.getJourneesTournee(delegueId);
  for (const [jour, centreIds] of ctx.planningParJour.entries()) {
    const existant = planningsExistants.find((p) => p.jour === jour);
    const fusion = new Set([...(existant?.centreIds ?? []), ...centreIds]);
    await professionnelService.saveJourTournee({ delegueId, jour, centreIds: [...fusion] });
  }

  return ctx.resultat;
}
