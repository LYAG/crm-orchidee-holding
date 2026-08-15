import type { RdvService } from '@/services/api/RdvService';
import type { FiltresRdv, RendezVous } from '@/types';
import { apiFetch } from './httpClient';

/**
 * ⚠️ Écart backend connu : il n'existe côté serveur ni endpoint de filtrage sur
 * GET /api/rendez-vous (le périmètre par rôle est déjà appliqué serveur, mais pas
 * delegueId/professionnelId/statut/dateDebut/dateFin), ni de PUT générique pour
 * modifier un RDV déjà planifié (date/heure, durée, support) — seuls `/annuler`
 * et `/statut` existent. Les filtres sont donc réappliqués côté client ci-dessous,
 * et `update()` échoue explicitement tant que l'endpoint manquant n'est pas ajouté
 * (voir RdvDrawerForm.tsx, qui l'utilise pour l'édition d'un RDV planifié).
 */
export class RdvServiceReal implements RdvService {
  async getAll(filtres?: FiltresRdv): Promise<RendezVous[]> {
    let result = await apiFetch<RendezVous[]>('/rendez-vous');
    if (filtres?.delegueId) result = result.filter((r) => r.delegueId === filtres.delegueId);
    if (filtres?.professionnelId) result = result.filter((r) => r.professionnelId === filtres.professionnelId);
    if (filtres?.statut) result = result.filter((r) => r.statut === filtres.statut);
    if (filtres?.dateDebut) result = result.filter((r) => r.dateHeure >= filtres.dateDebut!);
    if (filtres?.dateFin) result = result.filter((r) => r.dateHeure <= filtres.dateFin!);
    return result;
  }

  async getById(id: string): Promise<RendezVous> {
    return apiFetch<RendezVous>(`/rendez-vous/${id}`);
  }

  async create(data: Omit<RendezVous, 'id' | 'dateCreation' | 'qualifie' | 'statut'>): Promise<RendezVous> {
    return apiFetch<RendezVous>('/rendez-vous', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(_id: string, _data: Partial<RendezVous>): Promise<RendezVous> {
    throw new Error(
      "La modification d'un rendez-vous planifié n'est pas encore disponible : il manque un endpoint PUT /api/rendez-vous/{id} côté backend.",
    );
  }

  async annuler(id: string, motif: string): Promise<RendezVous> {
    return apiFetch<RendezVous>(`/rendez-vous/${id}/annuler`, { method: 'POST', body: JSON.stringify({ motif }) });
  }

  async getByDelegue(delegueId: string, filtres?: FiltresRdv): Promise<RendezVous[]> {
    return this.getAll({ ...filtres, delegueId });
  }

  async getByProfessionnel(professionnelId: string): Promise<RendezVous[]> {
    return this.getAll({ professionnelId });
  }
}
