import type { Centre, GesteMarketing, ProfessionnelSante, Specialite } from '@/types';
import {
  eclaterNoms,
  eclaterTelephones,
  estJourDeTourneeValide,
  mapperGestes,
  mapperSpecialites,
  normaliserTexte,
  parserJoursConsultation,
  parserPotentielCas,
  rapprocherCentre,
} from './normalisation';
import type { LigneBrute, ProfessionnelAImporter } from './types';

export interface ContexteTransformation {
  zoneId: string;
  centres: Centre[];
  specialites: Specialite[];
  gestes: GesteMarketing[];
  professionnelsExistants: ProfessionnelSante[];
}

export function transformerLignes(lignes: LigneBrute[], ctx: ContexteTransformation): ProfessionnelAImporter[] {
  const resultats: ProfessionnelAImporter[] = [];

  for (const ligne of lignes) {
    const jourTournee = estJourDeTourneeValide(ligne.jour);
    const { centre } = rapprocherCentre(ligne.centre, ctx.zoneId, ctx.centres);
    const { specialiteIds, inconnues: specialitesInconnues } = mapperSpecialites(ligne.specialite, ctx.specialites);
    const { gesteIds, inconnus: gestesInconnus } = mapperGestes(ligne.action, ctx.gestes);
    const potentielCas = parserPotentielCas(ligne.nbreDeCas);
    const joursConsultation = parserJoursConsultation(ligne.jrsCons);

    const noms = eclaterNoms(ligne.nomEtPrenom);
    const telephones = eclaterTelephones(ligne.numero);
    const estMultiPersonnes = noms.length > 1;

    noms.forEach((nom, index) => {
      const telephonesPersonne = estMultiPersonnes
        ? telephones[index]
          ? [telephones[index]]
          : []
        : telephones;

      const doublon = centre
        ? ctx.professionnelsExistants.find(
            (p) => p.centreId === centre.id && normaliserTexte(p.nom) === normaliserTexte(nom),
          )
        : undefined;

      const specialitesManquantes = specialitesInconnues.length > 0;
      const gestesManquants = gestesInconnus.length > 0;
      const casNonParsable = ligne.nbreDeCas.trim() !== '' && !potentielCas;
      const joursNonParsables = ligne.jrsCons.trim() !== '' && !joursConsultation;
      const telInvalides = telephonesPersonne.filter((t) => !t.valide);

      let statut: ProfessionnelAImporter['statut'] = 'PRETE';
      if (doublon) {
        statut = 'DOUBLON';
      } else if (
        !centre ||
        specialitesManquantes ||
        gestesManquants ||
        casNonParsable ||
        joursNonParsables ||
        telInvalides.length > 0 ||
        estMultiPersonnes
      ) {
        statut = 'A_VERIFIER';
      }

      resultats.push({
        cle: `${ligne.ligneExcel}-${index}`,
        ligneExcel: ligne.ligneExcel,
        jourTournee,
        centreBrut: ligne.centre,
        centreId: centre?.id,
        centreACreer: !centre,
        specialiteBrut: ligne.specialite,
        specialiteIds,
        specialitesInconnues,
        nom,
        telephones: telephonesPersonne.filter((t) => t.valide).map((t) => t.valeur),
        telephonesInvalides: telInvalides.map((t) => t.valeur),
        jrsConsBrut: ligne.jrsCons,
        joursConsultation,
        nbreDeCasBrut: ligne.nbreDeCas,
        potentielCas,
        actionBrut: ligne.action,
        gesteIds,
        gestesInconnus,
        observation: ligne.observation || undefined,
        statut,
        doublonProfessionnelId: doublon?.id,
        actionDoublon: doublon ? 'IGNORER' : undefined,
      });
    });
  }

  return resultats;
}
