import type { SupportService } from '@/services/api/SupportService';
import type { MetriquePresentation, ParametresApp, SupportCommercial } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import {
  metriques as mockMetriques,
  parametresApp as mockParams,
  supports as mockSupports,
} from './data';

const supports: SupportCommercial[] = deepClone(mockSupports);
const metriques: MetriquePresentation[] = deepClone(mockMetriques);
let parametres: ParametresApp = deepClone(mockParams);

export class SupportServiceMock implements SupportService {
  async getAll(): Promise<SupportCommercial[]> {
    await delay();
    return supports.filter((s) => s.actif);
  }

  async getById(id: string): Promise<SupportCommercial> {
    await delay();
    return supports.find((s) => s.id === id) ?? notFound('SupportCommercial', id);
  }

  async create(data: Omit<SupportCommercial, 'id'>): Promise<SupportCommercial> {
    await delay();
    const support: SupportCommercial = { ...data, id: generateId('support') };
    supports.push(support);
    return support;
  }

  async update(id: string, data: Partial<SupportCommercial>): Promise<SupportCommercial> {
    await delay();
    const idx = supports.findIndex((s) => s.id === id);
    if (idx === -1) notFound('SupportCommercial', id);
    supports[idx] = { ...supports[idx], ...data };
    return supports[idx];
  }

  async delete(id: string): Promise<void> {
    await delay();
    const idx = supports.findIndex((s) => s.id === id);
    if (idx === -1) notFound('SupportCommercial', id);
    // Soft delete
    supports[idx].actif = false;
  }

  /** Mock : pas de vrai PDF stocké, on simule juste l'incrément de version/taille. */
  async uploaderFichier(id: string, fichier: File): Promise<SupportCommercial> {
    await delay();
    const idx = supports.findIndex((s) => s.id === id);
    if (idx === -1) notFound('SupportCommercial', id);
    supports[idx] = {
      ...supports[idx],
      version: supports[idx].version + 1,
      tailleFichier: fichier.size,
      nombreSlides: Math.min(30, Math.max(1, Math.round(fichier.size / 50000))),
    };
    return supports[idx];
  }

  async getFichier(): Promise<Blob> {
    await delay();
    throw new Error('Aperçu PDF non disponible en mode démo (mocks).');
  }

  async getParametres(): Promise<ParametresApp> {
    await delay(100);
    return { ...parametres };
  }

  async updateParametres(params: Partial<ParametresApp>): Promise<ParametresApp> {
    await delay();
    parametres = { ...parametres, ...params };
    return { ...parametres };
  }

  async enregistrerMetrique(
    data: Omit<MetriquePresentation, 'id'>,
  ): Promise<MetriquePresentation> {
    await delay();
    const metrique: MetriquePresentation = { ...data, id: generateId('metrique') };
    metriques.push(metrique);
    return metrique;
  }

  async getMetriqueByRdv(rdvId: string): Promise<MetriquePresentation | null> {
    await delay();
    return metriques.find((m) => m.rdvId === rdvId) ?? null;
  }
}
