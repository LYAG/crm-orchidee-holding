import type { RdvService } from '@/services/api/RdvService';
import { FiltresRdv, RendezVous, RdvStatut } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import { rendezvous as mockRdv } from './data';

const rendezvous: RendezVous[] = deepClone(mockRdv);

export class RdvServiceMock implements RdvService {
  async getAll(filtres?: FiltresRdv): Promise<RendezVous[]> {
    await delay();
    let result = [...rendezvous];
    if (filtres?.delegueId) result = result.filter((r) => r.delegueId === filtres.delegueId);
    if (filtres?.prospectId) result = result.filter((r) => r.prospectId === filtres.prospectId);
    if (filtres?.statut) result = result.filter((r) => r.statut === filtres.statut);
    if (filtres?.dateDebut) result = result.filter((r) => r.dateHeure >= filtres.dateDebut!);
    if (filtres?.dateFin) result = result.filter((r) => r.dateHeure <= filtres.dateFin!);
    return result;
  }

  async getById(id: string): Promise<RendezVous> {
    await delay();
    return rendezvous.find((r) => r.id === id) ?? notFound('RendezVous', id);
  }

  async create(
    data: Omit<RendezVous, 'id' | 'dateCreation' | 'qualifie' | 'statut'>,
  ): Promise<RendezVous> {
    await delay();
    const rdv: RendezVous = {
      ...data,
      id: generateId('rdv'),
      dateCreation: new Date().toISOString().split('T')[0],
      statut: RdvStatut.PLANIFIE,
      qualifie: false,
    };
    rendezvous.push(rdv);
    return rdv;
  }

  async update(id: string, data: Partial<RendezVous>): Promise<RendezVous> {
    await delay();
    const idx = rendezvous.findIndex((r) => r.id === id);
    if (idx === -1) notFound('RendezVous', id);
    rendezvous[idx] = { ...rendezvous[idx], ...data };
    return rendezvous[idx];
  }

  async annuler(id: string, motif: string): Promise<RendezVous> {
    await delay();
    const idx = rendezvous.findIndex((r) => r.id === id);
    if (idx === -1) notFound('RendezVous', id);
    rendezvous[idx] = {
      ...rendezvous[idx],
      statut: RdvStatut.ANNULE,
      motifAnnulation: motif,
    };
    return rendezvous[idx];
  }

  async getByDelegue(delegueId: string, filtres?: FiltresRdv): Promise<RendezVous[]> {
    return this.getAll({ ...filtres, delegueId });
  }

  async getByProspect(prospectId: string): Promise<RendezVous[]> {
    return this.getAll({ prospectId });
  }
}
