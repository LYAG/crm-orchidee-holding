import type { RdvService } from '@/services/api/RdvService';
import type { FiltresRdv, RendezVous } from '@/types';
import { apiFetch, qs } from './httpClient';

/** `LocalDateTime` côté backend n'accepte pas le suffixe 'Z' des ISO strings produites par dayjs().toISOString(). */
function versLocalDateTime(iso: string): string {
  return iso.endsWith('Z') ? iso.slice(0, -1) : iso;
}

/**
 * ⚠️ Écart backend connu : il n'existe pas de PUT générique pour modifier un RDV déjà
 * planifié (date/heure, durée, support) — seuls `/annuler` et `/statut` existent.
 * `update()` échoue donc explicitement tant que l'endpoint manquant n'est pas ajouté
 * (voir RdvDrawerForm.tsx, qui l'utilise pour l'édition d'un RDV planifié).
 */
export class RdvServiceReal implements RdvService {
  async getAll(filtres?: FiltresRdv): Promise<RendezVous[]> {
    const query = qs({
      delegueId: filtres?.delegueId,
      professionnelId: filtres?.professionnelId,
      statut: filtres?.statut,
      dateDebut: filtres?.dateDebut ? versLocalDateTime(filtres.dateDebut) : undefined,
      dateFin: filtres?.dateFin ? versLocalDateTime(filtres.dateFin) : undefined,
    });
    return apiFetch<RendezVous[]>(`/rendez-vous${query}`);
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
