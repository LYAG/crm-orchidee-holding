import type { QualificationService } from '@/services/api/QualificationService';
import type { QualificationRDV } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import { qualifications as mockQualifications, rendezvous as mockRdv } from './data';

const qualifications: QualificationRDV[] = deepClone(mockQualifications);

// Import mutable rdv list to update qualifie flag
import { RdvServiceMock } from './RdvServiceMock';
const rdvService = new RdvServiceMock();

export class QualificationServiceMock implements QualificationService {
  async getByRdv(rdvId: string): Promise<QualificationRDV | null> {
    await delay();
    return qualifications.find((q) => q.rdvId === rdvId) ?? null;
  }

  async create(data: Omit<QualificationRDV, 'id'>): Promise<QualificationRDV> {
    await delay();
    const existing = qualifications.find((q) => q.rdvId === data.rdvId);
    if (existing) throw new Error('Ce RDV est déjà qualifié.');
    const qualification: QualificationRDV = { ...data, id: generateId('qual') };
    qualifications.push(qualification);
    // Marquer le RDV comme qualifié
    await rdvService.update(data.rdvId, { qualifie: true });
    return qualification;
  }

  async update(
    id: string,
    data: Partial<QualificationRDV>,
    managerId: string,
  ): Promise<QualificationRDV> {
    await delay();
    const idx = qualifications.findIndex((q) => q.id === id);
    if (idx === -1) notFound('QualificationRDV', id);
    const timestamp = new Date().toISOString();
    qualifications[idx] = {
      ...qualifications[idx],
      ...data,
      modifiePar: managerId,
      dateModification: timestamp,
      logModification: `[${timestamp}] Modifié par manager ${managerId}.`,
    };
    return qualifications[idx];
  }
}
