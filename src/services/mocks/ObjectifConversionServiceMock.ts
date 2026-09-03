import type { ObjectifConversionService } from '@/services/api/ObjectifConversionService';
import type { ObjectifAnnee, ObjectifMois } from '@/types';
import { delay } from './_utils';

/** annee -> mois (0 = valeur par défaut de l'année, 1-12 = override) -> valeur. */
const valeurs = new Map<number, Map<number, number>>();

/** Utilisé par ReportingServiceMock (jauge de conversion) — évite de dupliquer l'état en mémoire. */
export function getObjectifEffectifMock(annee: number, mois: number): number {
  const parMois = valeurs.get(annee);
  return parMois?.get(mois) ?? parMois?.get(0) ?? 0;
}

function construireAnnee(annee: number): ObjectifAnnee {
  const parMois = valeurs.get(annee);
  const valeurParDefaut = parMois?.get(0) ?? null;
  const mois: ObjectifMois[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const specifique = parMois?.get(m) ?? null;
    return { mois: m, valeurSpecifique: specifique, valeurEffective: specifique ?? valeurParDefaut ?? 0 };
  });
  return { annee, valeurParDefaut, mois };
}

export class ObjectifConversionServiceMock implements ObjectifConversionService {
  async getAnnee(annee: number): Promise<ObjectifAnnee> {
    await delay();
    return construireAnnee(annee);
  }

  async definir(annee: number, mois: number | null, objectifNbConversions: number): Promise<ObjectifAnnee> {
    await delay();
    const cle = mois ?? 0;
    const parMois = valeurs.get(annee) ?? new Map<number, number>();
    parMois.set(cle, objectifNbConversions);
    valeurs.set(annee, parMois);
    return construireAnnee(annee);
  }

  async reinitialiserMois(annee: number, mois: number): Promise<ObjectifAnnee> {
    await delay();
    valeurs.get(annee)?.delete(mois);
    return construireAnnee(annee);
  }
}
