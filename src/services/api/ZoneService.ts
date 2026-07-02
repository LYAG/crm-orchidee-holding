import type { Utilisateur, Zone } from '@/types';

export type CreateZoneDto = Omit<Zone, 'id'>;
export type UpdateZoneDto = Partial<Omit<Zone, 'id'>>;

export interface ZoneService {
  getAll(): Promise<Zone[]>;
  getById(id: string): Promise<Zone>;
  getDeleguesByZone(zoneId: string): Promise<Utilisateur[]>;
  create(data: CreateZoneDto): Promise<Zone>;
  update(id: string, data: UpdateZoneDto): Promise<Zone>;
  delete(id: string): Promise<void>;
}
