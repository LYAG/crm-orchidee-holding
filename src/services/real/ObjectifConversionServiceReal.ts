import type { ObjectifConversionService } from '@/services/api/ObjectifConversionService';
import type { ObjectifAnnee } from '@/types';
import { apiFetch, qs } from './httpClient';

export class ObjectifConversionServiceReal implements ObjectifConversionService {
  async getAnnee(annee: number): Promise<ObjectifAnnee> {
    return apiFetch<ObjectifAnnee>(`/objectifs-conversion${qs({ annee })}`);
  }

  async definir(annee: number, mois: number | null, objectifNbConversions: number): Promise<ObjectifAnnee> {
    return apiFetch<ObjectifAnnee>('/objectifs-conversion', {
      method: 'PUT',
      body: JSON.stringify({ annee, mois, objectifNbConversions }),
    });
  }

  async reinitialiserMois(annee: number, mois: number): Promise<ObjectifAnnee> {
    return apiFetch<ObjectifAnnee>(`/objectifs-conversion/${annee}/${mois}`, { method: 'DELETE' });
  }
}
