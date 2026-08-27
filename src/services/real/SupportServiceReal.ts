import type { SupportService } from '@/services/api/SupportService';
import type { MetriquePresentation, ParametresApp, SupportCommercial } from '@/types';
import { ApiError, apiFetch, apiFetchBlob } from './httpClient';

export class SupportServiceReal implements SupportService {
  async getAll(): Promise<SupportCommercial[]> {
    return apiFetch<SupportCommercial[]>('/supports');
  }

  async getById(id: string): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>(`/supports/${id}`);
  }

  async create(data: Omit<SupportCommercial, 'id'>): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>('/supports', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id: string, data: Partial<SupportCommercial>): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>(`/supports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  /** Soft delete côté serveur (actif=false) — comportement déjà géré par le backend. */
  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/supports/${id}`, { method: 'DELETE' });
  }

  async getParametres(): Promise<ParametresApp> {
    return apiFetch<ParametresApp>('/parametres');
  }

  async updateParametres(params: Partial<ParametresApp>): Promise<ParametresApp> {
    return apiFetch<ParametresApp>('/parametres', { method: 'PUT', body: JSON.stringify(params) });
  }

  async enregistrerMetrique(data: Omit<MetriquePresentation, 'id'>): Promise<MetriquePresentation> {
    return apiFetch<MetriquePresentation>('/metriques-presentation', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMetriqueByRdv(rdvId: string): Promise<MetriquePresentation | null> {
    try {
      return await apiFetch<MetriquePresentation>(`/metriques-presentation/rdv/${rdvId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }
}
