import type { RdvService } from '@/services/api/RdvService';
import type { FiltresRdv, RendezVous } from '@/types';
import { apiFetch, qs } from './httpClient';

/** `LocalDateTime` côté backend n'accepte pas le suffixe 'Z' des ISO strings produites par dayjs().toISOString(). */
function versLocalDateTime(iso: string): string {
  return iso.endsWith('Z') ? iso.slice(0, -1) : iso;
}

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

  /**
   * Le backend attend le body `RendezVousRequest` complet (professionnelId/delegueId
   * inclus, même s'ils ne changent jamais depuis ce formulaire) — on récupère donc le
   * RDV courant pour compléter les champs non fournis par l'appelant.
   */
  async update(id: string, data: Partial<RendezVous>): Promise<RendezVous> {
    const current = await this.getById(id);
    const merged = { ...current, ...data };
    return apiFetch<RendezVous>(`/rendez-vous/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        professionnelId: merged.professionnelId,
        delegueId: merged.delegueId,
        supportId: merged.supportId,
        dateHeure: versLocalDateTime(merged.dateHeure),
        dureeMinutes: merged.dureeMinutes,
        notes: merged.notes,
      }),
    });
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
