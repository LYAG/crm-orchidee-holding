import type { ObjectifRdvService } from '@/services/api/ObjectifRdvService';
import type { ObjectifRdvAnnee } from '@/types';
import { apiFetch, qs } from './httpClient';

export class ObjectifRdvServiceReal implements ObjectifRdvService {
  async getAnnee(delegueId: string, annee: number): Promise<ObjectifRdvAnnee> {
    return apiFetch<ObjectifRdvAnnee>(`/objectifs-rdv${qs({ delegueId, annee })}`);
  }

  async definir(delegueId: string, annee: number, mois: number | null, objectifNbRdv: number): Promise<ObjectifRdvAnnee> {
    return apiFetch<ObjectifRdvAnnee>('/objectifs-rdv', {
      method: 'PUT',
      body: JSON.stringify({ delegueId, annee, mois, objectifNbRdv }),
    });
  }

  async reinitialiserMois(delegueId: string, annee: number, mois: number): Promise<ObjectifRdvAnnee> {
    return apiFetch<ObjectifRdvAnnee>(`/objectifs-rdv/${delegueId}/${annee}/${mois}`, { method: 'DELETE' });
  }
}
