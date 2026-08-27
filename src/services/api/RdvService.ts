import type { FiltresRdv, RendezVous } from '@/types';

export interface RdvService {
  getAll(filtres?: FiltresRdv): Promise<RendezVous[]>;
  getById(id: string): Promise<RendezVous>;
  create(
    data: Omit<RendezVous, 'id' | 'dateCreation' | 'qualifie' | 'statut'> & { forcer?: boolean },
  ): Promise<RendezVous>;
  /** `forcer` (ADMIN/MANAGER uniquement) : outrepasse le blocage sur les jours de consultation du professionnel. */
  update(id: string, data: Partial<RendezVous> & { forcer?: boolean }): Promise<RendezVous>;
  annuler(id: string, motif: string): Promise<RendezVous>;

  getByDelegue(delegueId: string, filtres?: FiltresRdv): Promise<RendezVous[]>;
  getByProfessionnel(professionnelId: string): Promise<RendezVous[]>;
}
