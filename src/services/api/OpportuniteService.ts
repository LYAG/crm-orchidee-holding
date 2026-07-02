import type { Devis, FiltresOpportunite, NoteOpportunite, Opportunite, OpportuniteEtape } from '@/types';

export interface OpportuniteService {
  getAll(filtres?: FiltresOpportunite): Promise<Opportunite[]>;
  getById(id: string): Promise<Opportunite>;
  create(data: Omit<Opportunite, 'id' | 'dateCreation' | 'dateDerniereMaj' | 'devis' | 'notes'>): Promise<Opportunite>;
  update(id: string, data: Partial<Opportunite>): Promise<Opportunite>;

  changerEtape(id: string, etape: OpportuniteEtape): Promise<Opportunite>;
  marquerGagnee(id: string): Promise<Opportunite>;
  marquerPerdue(id: string, motif: string): Promise<Opportunite>;

  ajouterNote(id: string, note: Omit<NoteOpportunite, 'id' | 'date'>): Promise<Opportunite>;
  ajouterDevis(id: string, devis: Omit<Devis, 'id' | 'opportuniteId'>): Promise<Opportunite>;
  mettreAJourDevis(opportuniteId: string, devisId: string, data: Partial<Devis>): Promise<Opportunite>;
}
