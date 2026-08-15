import type { CreateZoneDto, UpdateZoneDto, ZoneService } from '@/services/api/ZoneService';
import { UserRole } from '@/lib/constants';
import type { Utilisateur, Zone } from '@/types';
import { apiFetch } from './httpClient';

export class ZoneServiceReal implements ZoneService {
  async getAll(): Promise<Zone[]> {
    return apiFetch<Zone[]>('/zones');
  }

  async getById(id: string): Promise<Zone> {
    return apiFetch<Zone>(`/zones/${id}`);
  }

  /** Pas d'endpoint dédié côté backend (méthode non utilisée par les pages actuelles) — recalculé depuis /utilisateurs (réservé ADMIN). */
  async getDeleguesByZone(zoneId: string): Promise<Utilisateur[]> {
    const utilisateurs = await apiFetch<Utilisateur[]>('/utilisateurs');
    return utilisateurs.filter((u) => u.role === UserRole.DELEGUE && u.zoneIds?.includes(zoneId));
  }

  async create(data: CreateZoneDto): Promise<Zone> {
    return apiFetch<Zone>('/zones', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id: string, data: UpdateZoneDto): Promise<Zone> {
    return apiFetch<Zone>(`/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/zones/${id}`, { method: 'DELETE' });
  }
}
