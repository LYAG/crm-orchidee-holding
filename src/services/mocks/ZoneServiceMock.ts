import type { ZoneService } from '@/services/api/ZoneService';
import type { Utilisateur, Zone } from '@/types';
import { UserRole } from '@/lib/constants';
import { utilisateurs, zones } from './data';
import { delay, notFound } from './_utils';

export class ZoneServiceMock implements ZoneService {
  async getAll(): Promise<Zone[]> {
    await delay();
    return [...zones];
  }

  async getById(id: string): Promise<Zone> {
    await delay();
    return zones.find((z) => z.id === id) ?? notFound('Zone', id);
  }

  async getDeleguesByZone(zoneId: string): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs.filter(
      (u) => u.role === UserRole.DELEGUE && u.zoneIds?.includes(zoneId),
    );
  }
}
