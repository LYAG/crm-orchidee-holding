import type { MetriquesPresentationFiltre, SupportService } from '@/services/api/SupportService';
import type {
  MetriquePresentation,
  MetriquePresentationLigne,
  ParametresApp,
  SlideMoyenne,
  SupportCommercial,
  SyntheseDeleguePresentation,
  SyntheseSupportPresentation,
  TendanceConformitePresentation,
} from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import {
  metriques as mockMetriques,
  parametresApp as mockParams,
  rendezvous,
  supports as mockSupports,
  utilisateurs,
} from './data';
import { professionnels } from './professionnelsData';

const supports: SupportCommercial[] = deepClone(mockSupports);
const metriques: MetriquePresentation[] = deepClone(mockMetriques);
let parametres: ParametresApp = deepClone(mockParams);

function delegueIdDeMetrique(m: MetriquePresentation): string | undefined {
  return rendezvous.find((r) => r.id === m.rdvId)?.delegueId;
}

function correspond(m: MetriquePresentation, filtre?: MetriquesPresentationFiltre): boolean {
  if (filtre?.delegueId && delegueIdDeMetrique(m) !== filtre.delegueId) return false;
  if (filtre?.supportId && m.supportId !== filtre.supportId) return false;
  const date = m.datePresentation.slice(0, 10);
  if (filtre?.dateDebut && date < filtre.dateDebut) return false;
  if (filtre?.dateFin && date > filtre.dateFin) return false;
  return true;
}

function versLigne(m: MetriquePresentation): MetriquePresentationLigne {
  const rdv = rendezvous.find((r) => r.id === m.rdvId);
  const delegue = rdv ? utilisateurs.find((u) => u.id === rdv.delegueId) : undefined;
  const pro = rdv ? professionnels.find((p) => p.id === rdv.professionnelId) : undefined;
  const support = supports.find((s) => s.id === m.supportId);
  return {
    id: m.id,
    rdvId: m.rdvId ?? '',
    delegueId: rdv?.delegueId ?? '',
    nomDelegue: delegue ? `${delegue.prenom} ${delegue.nom}` : '—',
    supportId: m.supportId,
    titreSupport: support?.titre ?? '—',
    professionnelId: rdv?.professionnelId ?? '',
    nomProfessionnel: pro ? `${pro.prenom ?? ''} ${pro.nom}`.trim() : '—',
    datePresentation: m.datePresentation,
    dureeTotal: m.dureeTotal,
    dureeMinimaleAttendue: m.dureeMinimaleAttendue,
    conforme: m.conforme,
    slides: m.slides,
  };
}

function lundiDeLaSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

function numeroSemaineIso(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jourSemaine = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jourSemaine);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - debutAnnee.getTime()) / 86400000 + 1) / 7);
}

export class SupportServiceMock implements SupportService {
  async getAll(): Promise<SupportCommercial[]> {
    await delay();
    return supports.filter((s) => s.actif);
  }

  async getById(id: string): Promise<SupportCommercial> {
    await delay();
    return supports.find((s) => s.id === id) ?? notFound('SupportCommercial', id);
  }

  async create(data: Omit<SupportCommercial, 'id' | 'version' | 'tailleFichier'>): Promise<SupportCommercial> {
    await delay();
    const support: SupportCommercial = { ...data, id: generateId('support'), version: 1 };
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
