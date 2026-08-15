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
import type { UserRole } from '@/lib/constants';
import { UserRole as Role } from '@/lib/constants';
import type {
  Centre,
  DemandeValidation,
  FiltresProfessionnel,
  GesteMarketing,
  GesteRealise,
  JourTournee,
  ProfessionnelSante,
  Specialite,
  StatutDemandeValidation,
  TypeDemandeValidation,
} from '@/types';
import type { PageResponse } from '@/types/pagination';
import { apiFetch, qs } from './httpClient';

/** Normalise pour rapprochement flou : majuscules, sans ponctuation, sans espaces multiples (identique à la logique déjà utilisée côté mock). */
function normaliser(texte: string): string {
  return texte
    .toUpperCase()
    .replace(/[.,;:'’-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class ProfessionnelServiceReal implements ProfessionnelService {
  // ── Centres ──────────────────────────────────────────────────────────────

  async getCentres(): Promise<Centre[]> {
    return apiFetch<Centre[]>('/centres');
  }

  async getCentreById(id: string): Promise<Centre> {
    return apiFetch<Centre>(`/centres/${id}`);
  }

  async createCentre(data: CreateCentreDto): Promise<Centre> {
    return apiFetch<Centre>('/centres', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCentre(id: string, data: UpdateCentreDto): Promise<Centre> {
    return apiFetch<Centre>(`/centres/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  /** Pas de DELETE côté backend pour un référentiel potentiellement déjà référencé — désactivation (actif=false). */
  async deleteCentre(id: string): Promise<void> {
    const centre = await this.getCentreById(id);
    await this.updateCentre(id, { ...centre, actif: false });
  }

  /** Pas d'endpoint dédié côté backend — filtrage client sur la liste complète, comme le faisait le mock. */
  async rechercherCentresProches(nom: string, zoneId: string): Promise<Centre[]> {
    const cible = normaliser(nom);
    const centres = await this.getCentres();
    return centres.filter((c) => c.zoneId === zoneId && normaliser(c.nom) === cible);
  }

  // ── Spécialités ──────────────────────────────────────────────────────────

  async getSpecialites(): Promise<Specialite[]> {
    return apiFetch<Specialite[]>('/specialites');
  }

  async createSpecialite(data: CreateSpecialiteDto): Promise<Specialite> {
    return apiFetch<Specialite>('/specialites', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSpecialite(id: string, data: UpdateSpecialiteDto): Promise<Specialite> {
    return apiFetch<Specialite>(`/specialites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  /** Pas de DELETE côté backend — désactivation (actif=false), cohérent avec la garde métier "spécialité encore utilisée". */
  async deleteSpecialite(id: string): Promise<void> {
    const specialite = (await this.getSpecialites()).find((s) => s.id === id);
    if (!specialite) throw new Error(`Spécialité introuvable : ${id}`);
    await this.updateSpecialite(id, { ...specialite, actif: false });
  }

  /** Pas d'endpoint de comptage dédié — dérivé du filtre existant getProfessionnels(specialiteId). */
  async countProfessionnelsActifsParSpecialite(id: string): Promise<number> {
    const professionnels = await this.getProfessionnels({ specialiteId: id });
    return professionnels.filter((p) => p.actif).length;
  }

  // ── Gestes marketing ────────────────────────────────────────────────────

  async getGestesMarketing(): Promise<GesteMarketing[]> {
    return apiFetch<GesteMarketing[]>('/gestes-marketing');
  }

  async createGesteMarketing(data: CreateGesteMarketingDto): Promise<GesteMarketing> {
    return apiFetch<GesteMarketing>('/gestes-marketing', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateGesteMarketing(id: string, data: UpdateGesteMarketingDto): Promise<GesteMarketing> {
    return apiFetch<GesteMarketing>(`/gestes-marketing/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  /** Pas de DELETE côté backend — désactivation (actif=false). */
  async deleteGesteMarketing(id: string): Promise<void> {
    const geste = (await this.getGestesMarketing()).find((g) => g.id === id);
    if (!geste) throw new Error(`Geste marketing introuvable : ${id}`);
    await this.updateGesteMarketing(id, { ...geste, actif: false });
  }

  /** Pas d'endpoint d'agrégation dédié — recalculé côté client depuis les gestes réalisés (comme le mock). */
  async getStatistiquesGestes(): Promise<StatistiquesGestes> {
    const [gestesRealises, gestesMarketing] = await Promise.all([
      this.getGestesRealises(),
      this.getGestesMarketing(),
    ]);

    const moisCourant = new Date().toISOString().slice(0, 7);
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

    return { nbGestesCeMois: gestesCeMois.length, coutTotalFcfaCeMois, topGestes };
  }

  // ── Professionnels de santé ─────────────────────────────────────────────

  async getProfessionnels(filtres?: FiltresProfessionnel): Promise<ProfessionnelSante[]> {
    const query = qs({
      centreId: filtres?.centreId,
      specialiteId: filtres?.specialiteId,
      delegueId: filtres?.delegueId,
      statut: filtres?.statut,
      jourConsultation: filtres?.jourConsultation,
      zoneId: filtres?.zoneId,
      recherche: filtres?.recherche,
    });
    return apiFetch<ProfessionnelSante[]>(`/professionnels${query}`);
  }

  async getProfessionnelsPagine(
    filtres: FiltresProfessionnel | undefined,
    page: number,
    pageSize: number,
  ): Promise<PageResponse<ProfessionnelSante>> {
    const query = qs({
      centreId: filtres?.centreId,
      specialiteId: filtres?.specialiteId,
      delegueId: filtres?.delegueId,
      statut: filtres?.statut,
      jourConsultation: filtres?.jourConsultation,
      zoneId: filtres?.zoneId,
      recherche: filtres?.recherche,
      page,
      size: pageSize,
    });
    return apiFetch<PageResponse<ProfessionnelSante>>(`/professionnels/page${query}`);
  }

  async getProfessionnelById(id: string): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>(`/professionnels/${id}`);
  }

  async getProfessionnelsByDelegue(delegueId: string): Promise<ProfessionnelSante[]> {
    return this.getProfessionnels({ delegueId });
  }

  /** Le périmètre MANAGER/ADMIN est de toute façon appliqué côté serveur (ScopeService) ; DELEGUE filtre explicitement. */
  async getProfessionnelsByRole(role: UserRole, userId: string): Promise<ProfessionnelSante[]> {
    if (role === Role.DELEGUE) return this.getProfessionnels({ delegueId: userId });
    return this.getProfessionnels();
  }

  async createProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>('/professionnels', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProfessionnel(id: string, data: UpdateProfessionnelDto): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>(`/professionnels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteProfessionnel(id: string): Promise<void> {
    await apiFetch<void>(`/professionnels/${id}`, { method: 'DELETE' });
  }

  /**
   * Pas d'endpoint public côté backend : le verrouillage `aDejaEuContact` y est déclenché
   * automatiquement côté serveur quand un RDV passe à REALISE (RdvService.changerStatut),
   * pas à la planification comme le faisait le mock. No-op conservé pour compatibilité
   * avec l'appel existant dans PlanifierRdvModal.tsx.
   */
  async marquerContactEffectue(id: string): Promise<ProfessionnelSante> {
    return this.getProfessionnelById(id);
  }

  async attribuerAuDelegue(professionnelId: string, delegueId: string): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>(`/professionnels/${professionnelId}/attribuer${qs({ delegueId })}`, {
      method: 'POST',
    });
  }

  /** delegueId ignoré : le backend infère toujours le délégué courant depuis le JWT pour l'auto-attribution. */
  async sAutoAttribuer(professionnelId: string, _delegueId: string): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>(`/professionnels/${professionnelId}/auto-attribution`, { method: 'POST' });
  }

  // ── Gestes réalisés ──────────────────────────────────────────────────────

  async getGestesRealises(professionnelId?: string): Promise<GesteRealise[]> {
    return apiFetch<GesteRealise[]>(`/gestes-realises${qs({ professionnelId })}`);
  }

  async enregistrerGeste(data: CreateGesteRealiseDto): Promise<GesteRealise> {
    return apiFetch<GesteRealise>('/gestes-realises', { method: 'POST', body: JSON.stringify(data) });
  }

  // ── Planning de tournée ──────────────────────────────────────────────────

  async getJourneesTournee(delegueId: string): Promise<JourTournee[]> {
    return apiFetch<JourTournee[]>(`/tournees/delegue/${delegueId}`);
  }

  async saveJourTournee(data: Omit<JourTournee, 'id'>): Promise<JourTournee> {
    return apiFetch<JourTournee>('/tournees', { method: 'POST', body: JSON.stringify(data) });
  }

  // ── Import Excel & file de validation ────────────────────────────────────

  async importerProfessionnel(data: CreateProfessionnelDto): Promise<ProfessionnelSante> {
    return apiFetch<ProfessionnelSante>('/professionnels/importer', { method: 'POST', body: JSON.stringify(data) });
  }

  async getDemandesValidation(statut?: StatutDemandeValidation): Promise<DemandeValidation[]> {
    return apiFetch<DemandeValidation[]>(`/demandes-validation${qs({ statut })}`);
  }

  async getDemandesValidationPagine(
    statut: StatutDemandeValidation | undefined,
    type: TypeDemandeValidation | undefined,
    page: number,
    pageSize: number,
  ): Promise<PageResponse<DemandeValidation>> {
    const query = qs({ statut, type, page, size: pageSize });
    return apiFetch<PageResponse<DemandeValidation>>(`/demandes-validation/page${query}`);
  }

  async creerDemandeValidation(
    data: Omit<DemandeValidation, 'id' | 'dateCreation' | 'statut'>,
  ): Promise<DemandeValidation> {
    return apiFetch<DemandeValidation>('/demandes-validation', { method: 'POST', body: JSON.stringify(data) });
  }

  async traiterDemandeValidation(id: string, statut: StatutDemandeValidation): Promise<DemandeValidation> {
    return apiFetch<DemandeValidation>(`/demandes-validation/${id}/traiter`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
  }
}
