import type { QualificationService } from '@/services/api/QualificationService';
import type { FicheMensuelleProfessionnel, QualificationRDV } from '@/types';
import { ApiError, apiFetch, qs } from './httpClient';

export class QualificationServiceReal implements QualificationService {
  async getByRdv(rdvId: string): Promise<QualificationRDV | null> {
    try {
      return await apiFetch<QualificationRDV>(`/qualifications/rdv/${rdvId}`);
    } catch (err) {
      // 404 attendu tant qu'aucune qualification n'existe pour ce RDV — toute autre erreur (panne, réseau) doit remonter.
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }

  async create(data: Omit<QualificationRDV, 'id'>): Promise<QualificationRDV> {
    return apiFetch<QualificationRDV>('/qualifications', { method: 'POST', body: JSON.stringify(data) });
  }

  /** managerId ignoré : le backend trace modifiePar depuis le JWT de l'appelant (rôle MANAGER/ADMIN requis). */
  async update(id: string, data: Partial<QualificationRDV>, _managerId: string): Promise<QualificationRDV> {
    return apiFetch<QualificationRDV>(`/qualifications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getFicheMensuelle(delegueId: string, annee: number, mois: number): Promise<FicheMensuelleProfessionnel[]> {
    return apiFetch<FicheMensuelleProfessionnel[]>(`/qualifications/fiche-mensuelle${qs({ delegueId, annee, mois })}`);
  }
}
