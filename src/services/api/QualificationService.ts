import type { QualificationRDV } from '@/types';

export interface QualificationService {
  getByRdv(rdvId: string): Promise<QualificationRDV | null>;
  create(data: Omit<QualificationRDV, 'id'>): Promise<QualificationRDV>;
  update(id: string, data: Partial<QualificationRDV>, managerId: string): Promise<QualificationRDV>;
}
