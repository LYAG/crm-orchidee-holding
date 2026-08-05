import type { OpportuniteService } from '@/services/api/OpportuniteService';
import type { Devis, FiltresOpportunite, NoteOpportunite, Opportunite } from '@/types';
import { OpportuniteEtape, StatutProfessionnel } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import { opportunites as mockOpportunites } from './data';
import { ProfessionnelServiceMock } from './ProfessionnelServiceMock';

const opportunites: Opportunite[] = deepClone(mockOpportunites);
const professionnelService = new ProfessionnelServiceMock();

export class OpportuniteServiceMock implements OpportuniteService {
  async getAll(filtres?: FiltresOpportunite): Promise<Opportunite[]> {
    await delay();
    let result = [...opportunites];
    if (filtres?.etape) result = result.filter((o) => o.etape === filtres.etape);
    if (filtres?.delegueId) result = result.filter((o) => o.delegueId === filtres.delegueId);
    return result;
  }

  async getById(id: string): Promise<Opportunite> {
    await delay();
    return opportunites.find((o) => o.id === id) ?? notFound('Opportunite', id);
  }

  async create(
    data: Omit<Opportunite, 'id' | 'dateCreation' | 'dateDerniereMaj' | 'devis' | 'notes'>,
  ): Promise<Opportunite> {
    await delay();
    const now = new Date().toISOString().split('T')[0];
    const opp: Opportunite = {
      ...data,
      id: generateId('opp'),
      devis: [],
      notes: [],
      dateCreation: now,
      dateDerniereMaj: now,
    };
    opportunites.push(opp);
    return opp;
  }

  async update(id: string, data: Partial<Opportunite>): Promise<Opportunite> {
    await delay();
    const idx = opportunites.findIndex((o) => o.id === id);
    if (idx === -1) notFound('Opportunite', id);
    opportunites[idx] = {
      ...opportunites[idx],
      ...data,
      dateDerniereMaj: new Date().toISOString().split('T')[0],
    };
    return opportunites[idx];
  }

  async changerEtape(id: string, etape: OpportuniteEtape): Promise<Opportunite> {
    return this.update(id, { etape });
  }

  async marquerGagnee(id: string): Promise<Opportunite> {
    await delay();
    const opp = await this.update(id, { etape: OpportuniteEtape.GAGNEE, probabilite: 100 });
    await professionnelService.updateProfessionnel(opp.professionnelId, { statut: StatutProfessionnel.ST });
    return opp;
  }

  async marquerPerdue(id: string, motif: string): Promise<Opportunite> {
    return this.update(id, { etape: OpportuniteEtape.PERDUE, probabilite: 0, motifPerte: motif });
  }

  async ajouterNote(
    id: string,
    note: Omit<NoteOpportunite, 'id' | 'date'>,
  ): Promise<Opportunite> {
    await delay();
    const idx = opportunites.findIndex((o) => o.id === id);
    if (idx === -1) notFound('Opportunite', id);
    const newNote: NoteOpportunite = {
      ...note,
      id: generateId('note'),
      date: new Date().toISOString().split('T')[0],
    };
    opportunites[idx].notes.push(newNote);
    opportunites[idx].dateDerniereMaj = newNote.date;
    return opportunites[idx];
  }

  async ajouterDevis(
    id: string,
    devisData: Omit<Devis, 'id' | 'opportuniteId'>,
  ): Promise<Opportunite> {
    await delay();
    const idx = opportunites.findIndex((o) => o.id === id);
    if (idx === -1) notFound('Opportunite', id);
    const devis: Devis = {
      ...devisData,
      id: generateId('devis'),
      opportuniteId: id,
    };
    opportunites[idx].devis.push(devis);
    opportunites[idx].etape = OpportuniteEtape.DEVIS_ENVOYE;
    opportunites[idx].dateDerniereMaj = new Date().toISOString().split('T')[0];
    return opportunites[idx];
  }

  async mettreAJourDevis(
    opportuniteId: string,
    devisId: string,
    data: Partial<Devis>,
  ): Promise<Opportunite> {
    await delay();
    const idx = opportunites.findIndex((o) => o.id === opportuniteId);
    if (idx === -1) notFound('Opportunite', opportuniteId);
    const devisIdx = opportunites[idx].devis.findIndex((d) => d.id === devisId);
    if (devisIdx === -1) notFound('Devis', devisId);
    opportunites[idx].devis[devisIdx] = { ...opportunites[idx].devis[devisIdx], ...data };
    opportunites[idx].dateDerniereMaj = new Date().toISOString().split('T')[0];
    return opportunites[idx];
  }
}
