import type { ProspectService } from '@/services/api/ProspectService';
import {
  DoublonAction,
  FiltresProspect,
  ImportResult,
  Prospect,
  ProspectStatut,
} from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import { doublons as mockDoublons, prospects as mockProspects } from './data';
import type { DoublonDetecte } from '@/types';

// Copies mutables en mémoire
const prospects: Prospect[] = deepClone(mockProspects);
const doublons: DoublonDetecte[] = deepClone(mockDoublons);

export class ProspectServiceMock implements ProspectService {
  async getAll(filtres?: FiltresProspect): Promise<Prospect[]> {
    await delay();
    let result = [...prospects];
    if (filtres?.zoneId) result = result.filter((p) => p.zoneId === filtres.zoneId);
    if (filtres?.statut) result = result.filter((p) => p.statut === filtres.statut);
    if (filtres?.delegueId) result = result.filter((p) => p.delegueId === filtres.delegueId);
    if (filtres?.recherche) {
      const q = filtres.recherche.toLowerCase();
      result = result.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.entreprise.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q),
      );
    }
    return result;
  }

  async getById(id: string): Promise<Prospect> {
    await delay();
    return prospects.find((p) => p.id === id) ?? notFound('Prospect', id);
  }

  async create(data: Omit<Prospect, 'id' | 'dateCreation' | 'aEuRdv'>): Promise<Prospect> {
    await delay();
    const prospect: Prospect = {
      ...data,
      id: generateId('prospect'),
      dateCreation: new Date().toISOString().split('T')[0],
      aEuRdv: false,
    };
    prospects.push(prospect);
    return prospect;
  }

  async update(id: string, data: Partial<Prospect>): Promise<Prospect> {
    await delay();
    const idx = prospects.findIndex((p) => p.id === id);
    if (idx === -1) notFound('Prospect', id);
    prospects[idx] = { ...prospects[idx], ...data };
    return prospects[idx];
  }

  async delete(id: string): Promise<void> {
    await delay();
    const idx = prospects.findIndex((p) => p.id === id);
    if (idx === -1) notFound('Prospect', id);
    prospects.splice(idx, 1);
  }

  async attribuerAuDelegue(prospectId: string, delegueId: string): Promise<Prospect> {
    await delay();
    const idx = prospects.findIndex((p) => p.id === prospectId);
    if (idx === -1) notFound('Prospect', prospectId);
    prospects[idx] = {
      ...prospects[idx],
      delegueId,
      statut: ProspectStatut.AFFECTE,
    };
    return prospects[idx];
  }

  async sAutoAttribuer(prospectId: string, delegueId: string): Promise<Prospect> {
    return this.attribuerAuDelegue(prospectId, delegueId);
  }

  async simulerImportExcel(_fileName: string): Promise<ImportResult> {
    await delay(600);
    return {
      totalLignes: 20,
      lignesValides: 17,
      doublons: [deepClone(mockDoublons[0])],
      erreurs: [
        { ligne: 8, message: 'Email invalide : not-an-email' },
        { ligne: 14, message: 'Zone inconnue : Zone Inconnue' },
      ],
    };
  }

  async getDoublons(): Promise<DoublonDetecte[]> {
    await delay();
    return doublons.filter((d) => d.statut === DoublonAction.EN_ATTENTE);
  }

  async validerDoublon(doublonId: string, action: DoublonAction): Promise<void> {
    await delay();
    const doublon = doublons.find((d) => d.id === doublonId);
    if (!doublon) notFound('Doublon', doublonId);
    doublon.statut = action;

    if (action === DoublonAction.FUSIONNE) {
      const idx = prospects.findIndex((p) => p.id === doublon.prospectExistant.id);
      if (idx !== -1) {
        prospects[idx] = { ...prospects[idx], ...doublon.nouvelleEntree };
      }
    } else if (action === DoublonAction.INTEGRE) {
      prospects.push({
        ...doublon.nouvelleEntree,
        id: generateId('prospect'),
        dateCreation: new Date().toISOString().split('T')[0],
        aEuRdv: false,
        statut: ProspectStatut.PNA,
      } as Prospect);
    }
  }
}
