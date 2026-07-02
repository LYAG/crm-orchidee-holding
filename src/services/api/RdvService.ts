import type { FiltresRdv, RendezVous } from '@/types';

export interface RdvService {
  getAll(filtres?: FiltresRdv): Promise<RendezVous[]>;
  getById(id: string): Promise<RendezVous>;
  create(
    data: Omit<RendezVous, 'id' | 'dateCreation' | 'qualifie' | 'statut'>,
  ): Promise<RendezVous>;
  update(id: string, data: Partial<RendezVous>): Promise<RendezVous>;
  annuler(id: string, motif: string): Promise<RendezVous>;

  getByDelegue(delegueId: string, filtres?: FiltresRdv): Promise<RendezVous[]>;
  getByProspect(prospectId: string): Promise<RendezVous[]>;
}
