import type { CritereNotationDto, EnregistrerNotationDto, NotationService } from '@/services/api/NotationService';
import type { CritereNotation, NotationMois } from '@/types';
import { apiFetch, qs } from './httpClient';

export class NotationServiceReal implements NotationService {
  async getCriteres(): Promise<CritereNotation[]> {
    return apiFetch<CritereNotation[]>('/criteres-notation');
  }

  async createCritere(data: CritereNotationDto): Promise<CritereNotation> {
    return apiFetch<CritereNotation>('/criteres-notation', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCritere(id: string, data: CritereNotationDto): Promise<CritereNotation> {
    return apiFetch<CritereNotation>(`/criteres-notation/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCritere(id: string): Promise<void> {
    await apiFetch<void>(`/criteres-notation/${id}`, { method: 'DELETE' });
  }

  async getNotations(annee: number, delegueId?: string): Promise<NotationMois[]> {
    return apiFetch<NotationMois[]>(`/notations${qs({ annee, delegueId })}`);
  }

  async enregistrerNotation(data: EnregistrerNotationDto): Promise<NotationMois> {
    return apiFetch<NotationMois>('/notations', { method: 'PUT', body: JSON.stringify(data) });
  }
}
