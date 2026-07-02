import type { ZoneService, CreateZoneDto, UpdateZoneDto } from '@/services/api/ZoneService';
import type { Utilisateur, Zone } from '@/types';
import { UserRole } from '@/lib/constants';
import { utilisateurs, zones } from './data';
import { delay, generateId, notFound } from './_utils';

export class ZoneServiceMock implements ZoneService {
  async getAll(): Promise<Zone[]> {
    await delay();
    return zones.map((z) => ({ ...z }));
  }

  async getById(id: string): Promise<Zone> {
    await delay();
    return { ...(zones.find((z) => z.id === id) ?? notFound('Zone', id)) };
  }

  async getDeleguesByZone(zoneId: string): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs
      .filter((u) => u.role === UserRole.DELEGUE && u.zoneIds?.includes(zoneId))
      .map((u) => ({ ...u }));
  }

  async create(data: CreateZoneDto): Promise<Zone> {
    await delay();
    const newZone: Zone = { ...data, id: generateId('zone') };
    zones.push(newZone);
    return { ...newZone };
  }

  async update(id: string, data: UpdateZoneDto): Promise<Zone> {
    await delay();
    const idx = zones.findIndex((z) => z.id === id);
    if (idx < 0) notFound('Zone', id);
    zones[idx] = { ...zones[idx], ...data };
    return { ...zones[idx] };
  }

  async delete(id: string): Promise<void> {
    await delay();
    const idx = zones.findIndex((z) => z.id === id);
    if (idx < 0) notFound('Zone', id);
    zones.splice(idx, 1);
    // Retirer cette zone de tous les utilisateurs
    utilisateurs.forEach((u) => {
      if (u.zoneIds?.includes(id)) {
        u.zoneIds = u.zoneIds.filter((zid) => zid !== id);
      }
    });
  }
}
