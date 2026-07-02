import type { Utilisateur, Zone } from '@/types';

export interface ZoneService {
  getAll(): Promise<Zone[]>;
  getById(id: string): Promise<Zone>;
  getDeleguesByZone(zoneId: string): Promise<Utilisateur[]>;
}
