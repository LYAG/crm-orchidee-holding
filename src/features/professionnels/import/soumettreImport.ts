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
}

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

export async function soumettreImport(
  lignes: ProfessionnelAImporter[],
  delegueId: string,
): Promise<ResultatSoumission> {
  const resultat: ResultatSoumission = { creees: 0, miseAJour: 0, ignorees: 0, demandesValidation: 0 };
  const centresACreerVus = new Set<string>();
  const planningParJour = new Map<JourTourneeKey, Set<string>>();

  for (const ligne of lignes) {
    if (ligne.jourTournee && ligne.jourTournee !== JourSemaine.DIM && ligne.centreId) {
      const jourTournee = ligne.jourTournee as JourTourneeKey;
      if (!planningParJour.has(jourTournee)) planningParJour.set(jourTournee, new Set());
      planningParJour.get(jourTournee)!.add(ligne.centreId);
    }

    // Centre manquant : une seule demande par nom de centre, le professionnel attend la validation.
    if (ligne.centreACreer) {
      const clef = ligne.centreBrut.trim().toUpperCase();
      if (!centresACreerVus.has(clef)) {
        centresACreerVus.add(clef);
        await professionnelService.creerDemandeValidation({
          type: TypeDemandeValidation.NOUVEAU_CENTRE,
          delegueId,
          libelle: `Nouveau centre proposé : "${ligne.centreBrut}"`,
          donnees: { nom: ligne.centreBrut, actif: true },
        });
        resultat.demandesValidation++;
      }
      resultat.ignorees++;
      continue;
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
        continue;
      }
      if (ligne.actionDoublon === 'REMPLACER' && ligne.doublonProfessionnelId) {
        const dto = await construireDto(ligne, delegueId);
        if (dto) {
          await professionnelService.updateProfessionnel(ligne.doublonProfessionnelId, dto);
          resultat.miseAJour++;
        }
        continue;
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
        continue;
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

  const planningsExistants: JourTournee[] = await professionnelService.getJourneesTournee(delegueId);
  for (const [jour, centreIds] of planningParJour.entries()) {
    const existant = planningsExistants.find((p) => p.jour === jour);
    const fusion = new Set([...(existant?.centreIds ?? []), ...centreIds]);
    await professionnelService.saveJourTournee({ delegueId, jour, centreIds: [...fusion] });
  }

  return resultat;
}
