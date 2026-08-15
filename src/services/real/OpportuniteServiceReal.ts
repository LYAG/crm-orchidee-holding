import type { OpportuniteService } from '@/services/api/OpportuniteService';
import type { Devis, FiltresOpportunite, NoteOpportunite, Opportunite, OpportuniteEtape } from '@/types';
import type { PageResponse } from '@/types/pagination';
import { apiFetch, qs } from './httpClient';

export class OpportuniteServiceReal implements OpportuniteService {
  /** Pas de filtres côté serveur pour cette liste — réappliqués côté client (identique au comportement du mock, zoneId non filtré). */
  async getAll(filtres?: FiltresOpportunite): Promise<Opportunite[]> {
    let result = await apiFetch<Opportunite[]>('/opportunites');
    if (filtres?.etape) result = result.filter((o) => o.etape === filtres.etape);
    if (filtres?.delegueId) result = result.filter((o) => o.delegueId === filtres.delegueId);
    return result;
  }

  async getAllPagine(
    filtres: FiltresOpportunite | undefined,
    page: number,
    pageSize: number,
  ): Promise<PageResponse<Opportunite>> {
    const query = qs({ etape: filtres?.etape, delegueId: filtres?.delegueId, page, size: pageSize });
    return apiFetch<PageResponse<Opportunite>>(`/opportunites/page${query}`);
  }

  async getById(id: string): Promise<Opportunite> {
    return apiFetch<Opportunite>(`/opportunites/${id}`);
  }

  async create(
    data: Omit<Opportunite, 'id' | 'dateCreation' | 'dateDerniereMaj' | 'devis' | 'notes'>,
  ): Promise<Opportunite> {
    return apiFetch<Opportunite>('/opportunites', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id: string, data: Partial<Opportunite>): Promise<Opportunite> {
    return apiFetch<Opportunite>(`/opportunites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async changerEtape(id: string, etape: OpportuniteEtape): Promise<Opportunite> {
    return apiFetch<Opportunite>(`/opportunites/${id}/etape`, { method: 'PATCH', body: JSON.stringify({ etape }) });
  }

  async marquerGagnee(id: string): Promise<Opportunite> {
    return apiFetch<Opportunite>(`/opportunites/${id}/marquer-gagnee`, { method: 'POST' });
  }

  async marquerPerdue(id: string, motif: string): Promise<Opportunite> {
    return apiFetch<Opportunite>(`/opportunites/${id}/marquer-perdue`, {
      method: 'POST',
      body: JSON.stringify({ motif }),
    });
  }

  /** L'endpoint ne renvoie que la note créée — on recharge l'opportunité complète pour respecter le contrat de l'interface. */
  async ajouterNote(id: string, note: Omit<NoteOpportunite, 'id' | 'date'>): Promise<Opportunite> {
    await apiFetch<NoteOpportunite>(`/opportunites/${id}/notes`, { method: 'POST', body: JSON.stringify(note) });
    return this.getById(id);
  }

  /** Idem : l'endpoint ne renvoie que le devis créé. */
  async ajouterDevis(id: string, devis: Omit<Devis, 'id' | 'opportuniteId'>): Promise<Opportunite> {
    await apiFetch<Devis>(`/opportunites/${id}/devis`, { method: 'POST', body: JSON.stringify(devis) });
    return this.getById(id);
  }

  /** Idem : l'endpoint ne renvoie que le devis mis à jour. */
  async mettreAJourDevis(opportuniteId: string, devisId: string, data: Partial<Devis>): Promise<Opportunite> {
    await apiFetch<Devis>(`/opportunites/${opportuniteId}/devis/${devisId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this.getById(opportuniteId);
  }
}
