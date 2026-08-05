import type {
  CreateCentreDto,
  CreateGesteMarketingDto,
  CreateGesteRealiseDto,
  CreateProfessionnelDto,
  CreateSpecialiteDto,
  ProfessionnelService,
  StatistiquesGestes,
  UpdateCentreDto,
  UpdateGesteMarketingDto,
  UpdateProfessionnelDto,
  UpdateSpecialiteDto,
} from '@/services/api/ProfessionnelService';
import { UserRole } from '@/lib/constants';
import type {
  Centre,
  DemandeValidation,
  FiltresProfessionnel,
  GesteMarketing,
  GesteRealise,
  JourTournee,
  ProfessionnelSante,
  Specialite,
} from '@/types';
import { StatutDemandeValidation, StatutProfessionnel } from '@/types';
import { deepClone, delay, generateId, notFound } from './_utils';
import {
  centres as mockCentres,
  gestesMarketing as mockGestesMarketing,
  gestesRealises as mockGestesRealises,
  joursTournee as mockJoursTournee,
  professionnels as mockProfessionnels,
  specialites as mockSpecialites,
} from './professionnelsData';

const centres: Centre[] = deepClone(mockCentres);
const specialites: Specialite[] = deepClone(mockSpecialites);
const gestesMarketing: GesteMarketing[] = deepClone(mockGestesMarketing);
const professionnels: ProfessionnelSante[] = deepClone(mockProfessionnels);
const gestesRealises: GesteRealise[] = deepClone(mockGestesRealises);
const joursTournee: JourTournee[] = deepClone(mockJoursTournee);
const demandesValidation: DemandeValidation[] = [];

/** Normalise pour rapprochement flou : majuscules, sans ponctuation, sans espaces multiples. */
function normaliser(texte: string): string {
  return texte
    .toUpperCase()
    .replace(/[.,;:'’-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export class ProfessionnelServiceMock implements ProfessionnelService {
  // ── Centres ──────────────────────────────────────────────────────────────

  async getCentres(): Promise<Centre[]> {
    await delay();
    return [...centres];
  }

  async getCentreById(id: string): Promise<Centre> {
    await delay();
    return centres.find((c) => c.id === id) ?? notFound('Centre', id);
  }

  async createCentre(data: CreateCentreDto): Promise<Centre> {
    await delay();
    const centre: Centre = { ...data, id: generateId('centre'), createdAt: today(), updatedAt: today() };
    centres.push(centre);
    return centre;
  }

  async updateCentre(id: string, data: UpdateCentreDto): Promise<Centre> {
    await delay();
    const idx = centres.findIndex((c) => c.id === id);
    if (idx < 0) notFound('Centre', id);
    centres[idx] = { ...centres[idx], ...data, updatedAt: today() };
    return centres[idx];
  }

  async deleteCentre(id: string): Promise<void> {
    await delay();
    const idx = centres.findIndex((c) => c.id === id);
    if (idx < 0) notFound('Centre', id);
    centres.splice(idx, 1);
  }

  async rechercherCentresProches(nom: string, zoneId: string): Promise<Centre[]> {
    await delay();
    const cible = normaliser(nom);
    return centres.filter((c) => c.zoneId === zoneId && normaliser(c.nom) === cible);
  }

  // ── Spécialités ──────────────────────────────────────────────────────────

  async getSpecialites(): Promise<Specialite[]> {
    await delay();
    return [...specialites];
  }

  async createSpecialite(data: CreateSpecialiteDto): Promise<Specialite> {
    await delay();
    const specialite: Specialite = { ...data, id: generateId('spe') };
    specialites.push(specialite);
    return specialite;
  }

  async updateSpecialite(id: string, data: UpdateSpecialiteDto): Promise<Specialite> {
    await delay();
    const idx = specialites.findIndex((s) => s.id === id);
    if (idx < 0) notFound('Spécialité', id);
    if (data.actif === false) {
      const nbActifs = await this.countProfessionnelsActifsParSpecialite(id);
      if (nbActifs > 0) {
        throw new Error(
          `Impossible de désactiver cette spécialité : ${nbActifs} professionnel(s) actif(s) y sont rattaché(s).`,
        );
      }
    }
    specialites[idx] = { ...specialites[idx], ...data };
    return specialites[idx];
  }

  async deleteSpecialite(id: string): Promise<void> {
    await delay();
    const idx = specialites.findIndex((s) => s.id === id);
    if (idx < 0) notFound('Spécialité', id);
    specialites.splice(idx, 1);
  }

  async countProfessionnelsActifsParSpecialite(id: string): Promise<number> {
    await delay();
    return professionnels.filter((p) => p.actif && p.specialiteIds.includes(id)).length;
  }

  // ── Gestes marketing ────────────────────────────────────────────────────

  async getGestesMarketing(): Promise<GesteMarketing[]> {
    await delay();
    return [...gestesMarketing];
  }

  async createGesteMarketing(data: CreateGesteMarketingDto): Promise<GesteMarketing> {
    await delay();
    const geste: GesteMarketing = { ...data, id: generateId('geste') };
    gestesMarketing.push(geste);
    return geste;
  }

  async updateGesteMarketing(id: string, data: UpdateGesteMarketingDto): Promise<GesteMarketing> {
    await delay();
    const idx = gestesMarketing.findIndex((g) => g.id === id);
    if (idx < 0) notFound('Geste marketing', id);
    gestesMarketing[idx] = { ...gestesMarketing[idx], ...data };
    return gestesMarketing[idx];
  }

  async deleteGesteMarketing(id: string): Promise<void> {
    await delay();
    const idx = gestesMarketing.findIndex((g) => g.id === id);
    if (idx < 0) notFound('Geste marketing', id);
    gestesMarketing.splice(idx, 1);
  }

  async getStatistiquesGestes(): Promise<StatistiquesGestes> {
    await delay();
    const moisCourant = today().slice(0, 7);
    const gestesCeMois = gestesRealises.filter((g) => g.date.slice(0, 7) === moisCourant);
    const coutTotalFcfaCeMois = gestesCeMois.reduce((sum, g) => sum + (g.coutFcfa ?? 0), 0);

    const compteParGeste = new Map<string, number>();
    gestesRealises.forEach((g) => {
      compteParGeste.set(g.gesteMarketingId, (compteParGeste.get(g.gesteMarketingId) ?? 0) + 1);
    });
    const topGestes = [...compteParGeste.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gesteMarketingId, nbFois]) => ({
        gesteMarketingId,
        libelle: gestesMarketing.find((g) => g.id === gesteMarketingId)?.libelle ?? gesteMarketingId,
        nbFois,
      }));

    return {
      nbGestesCeMois: gestesCeMois.length,
      coutTotalFcfaCeMois,
      topGestes,
    };
  }

  // ── Professionnels de santé ─────────────────────────────────────────────

  async getProfessionnels(filtres?: FiltresProfessionnel): Promise<ProfessionnelSante[]> {
    await delay();
    let result = [...professionnels];
    if (filtres?.centreId) result = result.filter((p) => p.centreId === filtres.centreId);
    if (filtres?.specialiteId) result = result.filter((p) => p.specialiteIds.includes(filtres.specialiteId!));
    if (filtres?.delegueId) result = result.filter((p) => p.delegueId === filtres.delegueId);
    if (filtres?.statut) result = result.filter((p) => p.statut === filtres.statut);
    if (filtres?.jourConsultation) {
      result = result.filter((p) => p.joursConsultation.jours?.includes(filtres.jourConsultation!));
    }
    if (filtres?.zoneId) {
      const centreIds = centres.filter((c) => c.zoneId === filtres.zoneId).map((c) => c.id);
      result = result.filter((p) => centreIds.includes(p.centreId));
    }
    if (filtres?.recherche) {
      const q = filtres.recherche.toLowerCase();
      result = result.filter(
        (p) => p.nom.toLowerCase().includes(q) || p.prenom?.toLowerCase().includes(q),
      );
    }
    return result;
  }

  async getProfessionnelById(id: string): Promise<ProfessionnelSante> {
    await delay();
    return professionnels.find((p) => p.id === id) ?? notFound('Professionnel de santé', id);
  }

  async getProfessionnelsByDelegue(delegueId: string): Promise<ProfessionnelSante[]> {
    await delay();
    return professionnels.filter((p) => p.delegueId === delegueId);
  }

  async getProfessionnelsByRole(role: UserRole, userId: string): Promise<ProfessionnelSante[]> {
    await delay();
    if (role === UserRole.DELEGUE) return professionnels.filter((p) => p.delegueId === userId);
    // MANAGER/ADMIN : filtrage par équipe géré côté page (nécessite la liste des délégués de l'équipe)
    return [...professionnels];
  }

  async createProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante> {
    await delay();
    const professionnel: ProfessionnelSante = {
      ...data,
      id: generateId('pro'),
      aDejaEuContact: false,
      dateCreation: today(),
    };
    professionnels.push(professionnel);
    return professionnel;
  }

  async updateProfessionnel(id: string, data: UpdateProfessionnelDto): Promise<ProfessionnelSante> {
    await delay();
    const idx = professionnels.findIndex((p) => p.id === id);
    if (idx < 0) notFound('Professionnel de santé', id);
    professionnels[idx] = { ...professionnels[idx], ...data };
    return professionnels[idx];
  }

  async deleteProfessionnel(id: string): Promise<void> {
    await delay();
    const idx = professionnels.findIndex((p) => p.id === id);
    if (idx < 0) notFound('Professionnel de santé', id);
    professionnels.splice(idx, 1);
  }

  async marquerContactEffectue(id: string): Promise<ProfessionnelSante> {
    await delay();
    const idx = professionnels.findIndex((p) => p.id === id);
    if (idx < 0) notFound('Professionnel de santé', id);
    professionnels[idx] = { ...professionnels[idx], aDejaEuContact: true };
    return professionnels[idx];
  }

  async attribuerAuDelegue(professionnelId: string, delegueId: string): Promise<ProfessionnelSante> {
    await delay();
    const idx = professionnels.findIndex((p) => p.id === professionnelId);
    if (idx < 0) notFound('Professionnel de santé', professionnelId);
    // Classification par défaut à l'attribution : potentiel/prescription inconnus tant que le premier RDV n'a pas eu lieu.
    professionnels[idx] = { ...professionnels[idx], delegueId, statut: StatutProfessionnel.T3 };
    return professionnels[idx];
  }

  async sAutoAttribuer(professionnelId: string, delegueId: string): Promise<ProfessionnelSante> {
    return this.attribuerAuDelegue(professionnelId, delegueId);
  }

  // ── Gestes réalisés ──────────────────────────────────────────────────────

  async getGestesRealises(professionnelId?: string): Promise<GesteRealise[]> {
    await delay();
    return gestesRealises
      .filter((g) => !professionnelId || g.professionnelId === professionnelId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async enregistrerGeste(data: CreateGesteRealiseDto): Promise<GesteRealise> {
    await delay();
    const geste: GesteRealise = { ...data, id: generateId('gr') };
    gestesRealises.push(geste);
    return geste;
  }

  // ── Planning de tournée ──────────────────────────────────────────────────

  async getJourneesTournee(delegueId: string): Promise<JourTournee[]> {
    await delay();
    return joursTournee.filter((j) => j.delegueId === delegueId);
  }

  async saveJourTournee(data: Omit<JourTournee, 'id'>): Promise<JourTournee> {
    await delay();
    const idx = joursTournee.findIndex((j) => j.delegueId === data.delegueId && j.jour === data.jour);
    if (idx >= 0) {
      joursTournee[idx] = { ...joursTournee[idx], ...data };
      return joursTournee[idx];
    }
    const jourTournee: JourTournee = { ...data, id: generateId('tournee') };
    joursTournee.push(jourTournee);
    return jourTournee;
  }

  // ── Import Excel ─────────────────────────────────────────────────────────

  async importerProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante> {
    return this.createProfessionnel(data);
  }

  async getDemandesValidation(statut?: StatutDemandeValidation): Promise<DemandeValidation[]> {
    await delay();
    return demandesValidation
      .filter((d) => !statut || d.statut === statut)
      .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));
  }

  async creerDemandeValidation(
    data: Omit<DemandeValidation, 'id' | 'dateCreation' | 'statut'>,
  ): Promise<DemandeValidation> {
    await delay();
    const demande: DemandeValidation = {
      ...data,
      id: generateId('demande'),
      dateCreation: today(),
      statut: StatutDemandeValidation.EN_ATTENTE,
    };
    demandesValidation.push(demande);
    return demande;
  }

  async traiterDemandeValidation(id: string, statut: StatutDemandeValidation): Promise<DemandeValidation> {
    await delay();
    const idx = demandesValidation.findIndex((d) => d.id === id);
    if (idx < 0) notFound('Demande de validation', id);
    demandesValidation[idx] = { ...demandesValidation[idx], statut };

    if (statut === StatutDemandeValidation.APPROUVEE) {
      const demande = demandesValidation[idx];
      if (demande.type === 'NOUVEAU_CENTRE') {
        await this.createCentre(demande.donnees as unknown as CreateCentreDto);
      } else if (demande.type === 'NOUVELLE_SPECIALITE') {
        await this.createSpecialite(demande.donnees as unknown as CreateSpecialiteDto);
      } else if (demande.type === 'NOUVEAU_GESTE') {
        await this.createGesteMarketing(demande.donnees as unknown as CreateGesteMarketingDto);
      } else if (demande.type === 'DOUBLON_PROFESSIONNEL') {
        await this.createProfessionnel(demande.donnees as unknown as CreateProfessionnelDto);
      }
    }

    return demandesValidation[idx];
  }
}
