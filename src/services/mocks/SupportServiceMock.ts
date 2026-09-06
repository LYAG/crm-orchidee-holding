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

  async listerMetriques(filtre?: MetriquesPresentationFiltre): Promise<MetriquePresentationLigne[]> {
    await delay();
    return metriques
      .filter((m) => correspond(m, filtre))
      .map(versLigne)
      .sort((a, b) => b.datePresentation.localeCompare(a.datePresentation));
  }

  async getSyntheseParDelegue(
    filtre?: Omit<MetriquesPresentationFiltre, 'delegueId'>,
  ): Promise<SyntheseDeleguePresentation[]> {
    await delay();
    return utilisateurs
      .filter((u) => u.role === 'DELEGUE')
      .map((u) => {
        const lignes = metriques.filter((m) => delegueIdDeMetrique(m) === u.id && correspond(m, filtre));
        const nb = lignes.length;
        const nbConformes = lignes.filter((m) => m.conforme).length;
        const dureeTotale = lignes.reduce((s, m) => s + m.dureeTotal, 0);
        return {
          delegueId: u.id,
          nomDelegue: `${u.prenom} ${u.nom}`,
          nbPresentations: nb,
          nbConformes,
          nbNonConformes: nb - nbConformes,
          tauxConformite: nb === 0 ? 0 : nbConformes / nb,
          dureeMoyenneSecondes: nb === 0 ? 0 : dureeTotale / nb,
          dureeTotaleSecondes: dureeTotale,
        };
      })
      .sort((a, b) => a.nomDelegue.localeCompare(b.nomDelegue));
  }

  async getSyntheseParSupport(
    filtre?: Omit<MetriquesPresentationFiltre, 'supportId'>,
  ): Promise<SyntheseSupportPresentation[]> {
    await delay();
    const lignes = metriques.filter((m) => correspond(m, filtre));
    const parSupport = new Map<string, MetriquePresentation[]>();
    for (const m of lignes) {
      const arr = parSupport.get(m.supportId) ?? [];
      arr.push(m);
      parSupport.set(m.supportId, arr);
    }
    return Array.from(parSupport.entries())
      .map(([supportId, l]) => {
        const nb = l.length;
        const nbConformes = l.filter((m) => m.conforme).length;
        const dureeTotale = l.reduce((s, m) => s + m.dureeTotal, 0);
        return {
          supportId,
          titreSupport: supports.find((s) => s.id === supportId)?.titre ?? '—',
          nbPresentations: nb,
          tauxConformite: nb === 0 ? 0 : nbConformes / nb,
          dureeMoyenneSecondes: nb === 0 ? 0 : dureeTotale / nb,
        };
      })
      .sort((a, b) => a.tauxConformite - b.tauxConformite);
  }

  async getSlidesMoyens(supportId: string): Promise<SlideMoyenne[]> {
    await delay();
    const lignes = metriques.filter((m) => m.supportId === supportId);
    const parSlide = new Map<number, { titre: string; temps: number[] }>();
    for (const m of lignes) {
      for (const s of m.slides) {
        const entree = parSlide.get(s.slideIndex) ?? { titre: s.titreSlide, temps: [] };
        entree.temps.push(s.tempsPasse);
        parSlide.set(s.slideIndex, entree);
      }
    }
    return Array.from(parSlide.entries())
      .map(([slideIndex, { titre, temps }]) => ({
        slideIndex,
        titreSlide: titre,
        dureeMoyenneSecondes: temps.reduce((a, b) => a + b, 0) / temps.length,
        nbEchantillons: temps.length,
      }))
      .sort((a, b) => a.slideIndex - b.slideIndex);
  }

  async getTendanceConformite(delegueId?: string): Promise<TendanceConformitePresentation[]> {
    await delay();
    const lignes = metriques.filter((m) => !delegueId || delegueIdDeMetrique(m) === delegueId);
    const semaines = 12;
    const lundiCourant = lundiDeLaSemaine(new Date());
    const resultat: TendanceConformitePresentation[] = [];
    for (let i = semaines - 1; i >= 0; i--) {
      const debut = new Date(lundiCourant);
      debut.setDate(debut.getDate() - i * 7);
      const fin = new Date(debut);
      fin.setDate(fin.getDate() + 7);
      const semaine = lignes.filter((m) => {
        const d = new Date(m.datePresentation);
        return d >= debut && d < fin;
      });
      const nb = semaine.length;
      const nbConformes = semaine.filter((m) => m.conforme).length;
      resultat.push({
        semaine: `${debut.getFullYear()}-W${String(numeroSemaineIso(debut)).padStart(2, '0')}`,
        nbPresentations: nb,
        tauxConformite: nb === 0 ? 0 : nbConformes / nb,
      });
    }
    return resultat;
  }
}
