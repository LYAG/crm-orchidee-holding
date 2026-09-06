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
import { ApiError, apiFetch, apiFetchBlob, qs } from './httpClient';

export class SupportServiceReal implements SupportService {
  async getAll(): Promise<SupportCommercial[]> {
    return apiFetch<SupportCommercial[]>('/supports');
  }

  async getById(id: string): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>(`/supports/${id}`);
  }

  async create(data: Omit<SupportCommercial, 'id' | 'version' | 'tailleFichier'>): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>('/supports', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id: string, data: Partial<SupportCommercial>): Promise<SupportCommercial> {
    return apiFetch<SupportCommercial>(`/supports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  /** Soft delete côté serveur (actif=false) — comportement déjà géré par le backend. */
  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/supports/${id}`, { method: 'DELETE' });
  }

  async uploaderFichier(id: string, fichier: File): Promise<SupportCommercial> {
    const formData = new FormData();
    formData.append('file', fichier);
    return apiFetch<SupportCommercial>(`/supports/${id}/fichier`, { method: 'POST', body: formData });
  }

  async getFichier(id: string): Promise<Blob> {
    return apiFetchBlob(`/supports/${id}/fichier`);
  }

  async getParametres(): Promise<ParametresApp> {
    return apiFetch<ParametresApp>('/parametres');
  }

  async updateParametres(params: Partial<ParametresApp>): Promise<ParametresApp> {
    return apiFetch<ParametresApp>('/parametres', { method: 'PUT', body: JSON.stringify(params) });
  }

  async enregistrerMetrique(data: Omit<MetriquePresentation, 'id'>): Promise<MetriquePresentation> {
    return apiFetch<MetriquePresentation>('/metriques-presentation', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMetriqueByRdv(rdvId: string): Promise<MetriquePresentation | null> {
    try {
      return await apiFetch<MetriquePresentation>(`/metriques-presentation/rdv/${rdvId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }

  async listerMetriques(filtre?: MetriquesPresentationFiltre): Promise<MetriquePresentationLigne[]> {
    const query = qs({
      delegueId: filtre?.delegueId,
      supportId: filtre?.supportId,
      dateDebut: filtre?.dateDebut,
      dateFin: filtre?.dateFin,
    });
    return apiFetch<MetriquePresentationLigne[]>(`/metriques-presentation${query}`);
  }

  async getSyntheseParDelegue(
    filtre?: Omit<MetriquesPresentationFiltre, 'delegueId'>,
  ): Promise<SyntheseDeleguePresentation[]> {
    const query = qs({ supportId: filtre?.supportId, dateDebut: filtre?.dateDebut, dateFin: filtre?.dateFin });
    return apiFetch<SyntheseDeleguePresentation[]>(`/metriques-presentation/synthese-delegues${query}`);
  }

  async getSyntheseParSupport(
    filtre?: Omit<MetriquesPresentationFiltre, 'supportId'>,
  ): Promise<SyntheseSupportPresentation[]> {
    const query = qs({ delegueId: filtre?.delegueId, dateDebut: filtre?.dateDebut, dateFin: filtre?.dateFin });
    return apiFetch<SyntheseSupportPresentation[]>(`/metriques-presentation/synthese-supports${query}`);
  }

  async getSlidesMoyens(supportId: string): Promise<SlideMoyenne[]> {
    return apiFetch<SlideMoyenne[]>(`/metriques-presentation/support/${supportId}/slides-moyens`);
  }

  async getTendanceConformite(delegueId?: string): Promise<TendanceConformitePresentation[]> {
    return apiFetch<TendanceConformitePresentation[]>(`/metriques-presentation/tendance${qs({ delegueId })}`);
  }
}
