import type { MetriquePresentation, ParametresApp, SupportCommercial } from '@/types';

export interface SupportService {
  getAll(): Promise<SupportCommercial[]>;
  getById(id: string): Promise<SupportCommercial>;
  create(data: Omit<SupportCommercial, 'id'>): Promise<SupportCommercial>;
  update(id: string, data: Partial<SupportCommercial>): Promise<SupportCommercial>;
  delete(id: string): Promise<void>;

  getParametres(): Promise<ParametresApp>;
  updateParametres(params: Partial<ParametresApp>): Promise<ParametresApp>;

  enregistrerMetrique(metrique: Omit<MetriquePresentation, 'id'>): Promise<MetriquePresentation>;
  getMetriqueByRdv(rdvId: string): Promise<MetriquePresentation | null>;
}
