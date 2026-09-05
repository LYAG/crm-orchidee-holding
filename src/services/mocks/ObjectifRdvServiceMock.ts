import type { ObjectifRdvService } from '@/services/api/ObjectifRdvService';
import type { ObjectifMois, ObjectifRdvAnnee } from '@/types';
import { delay } from './_utils';

/** delegueId -> annee -> mois (0 = valeur par défaut de l'année, 1-12 = override) -> valeur. */
const valeurs = new Map<string, Map<number, Map<number, number>>>();

/** Utilisé par ReportingServiceMock (jauge de RDV) — évite de dupliquer l'état en mémoire. */
export function getObjectifEffectifRdvMock(delegueId: string, annee: number, mois: number): number {
  const parAnnee = valeurs.get(delegueId)?.get(annee);
  return parAnnee?.get(mois) ?? parAnnee?.get(0) ?? 0;
}

function construireAnnee(delegueId: string, annee: number): ObjectifRdvAnnee {
  const parMois = valeurs.get(delegueId)?.get(annee);
  const valeurParDefaut = parMois?.get(0) ?? null;
  const mois: ObjectifMois[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const specifique = parMois?.get(m) ?? null;
    return { mois: m, valeurSpecifique: specifique, valeurEffective: specifique ?? valeurParDefaut ?? 0 };
  });
  return { delegueId, annee, valeurParDefaut, mois };
}

export class ObjectifRdvServiceMock implements ObjectifRdvService {
  async getAnnee(delegueId: string, annee: number): Promise<ObjectifRdvAnnee> {
    await delay();
    return construireAnnee(delegueId, annee);
  }

  async definir(delegueId: string, annee: number, mois: number | null, objectifNbRdv: number): Promise<ObjectifRdvAnnee> {
    await delay();
    const cle = mois ?? 0;
    const parAnnee = valeurs.get(delegueId) ?? new Map<number, Map<number, number>>();
    const parMois = parAnnee.get(annee) ?? new Map<number, number>();
    parMois.set(cle, objectifNbRdv);
    parAnnee.set(annee, parMois);
    valeurs.set(delegueId, parAnnee);
    return construireAnnee(delegueId, annee);
  }

  async reinitialiserMois(delegueId: string, annee: number, mois: number): Promise<ObjectifRdvAnnee> {
    await delay();
    valeurs.get(delegueId)?.get(annee)?.delete(mois);
    return construireAnnee(delegueId, annee);
  }
}
