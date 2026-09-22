import type {
  CreateReferentielMissionDto,
  OrdreMissionService,
  UpdateReferentielMissionDto,
} from '@/services/api/OrdreMissionService';
import type {
  FiltresOrdreMission,
  HistoriqueOrdreMission,
  KpiOrdresMission,
  MoyenTransport,
  OrdreMission,
  TypeMission,
} from '@/types';
import type { PageResponse } from '@/types/pagination';
import { apiFetch, apiFetchBlob, qs } from './httpClient';

function filtresQuery(filtres: FiltresOrdreMission) {
  return {
    delegueId: filtres.delegueId,
    zoneId: filtres.zoneId,
    statut: filtres.statut,
    dateDebut: filtres.dateDebut,
    dateFin: filtres.dateFin,
  };
}

export class OrdreMissionServiceReal implements OrdreMissionService {
  async getPagine(
    filtres: FiltresOrdreMission,
    page: number,
    pageSize: number,
  ): Promise<PageResponse<OrdreMission>> {
    const query = qs({ ...filtresQuery(filtres), page, size: pageSize });
    return apiFetch<PageResponse<OrdreMission>>(`/ordres-mission${query}`);
  }

  async getById(id: string): Promise<OrdreMission> {
    return apiFetch<OrdreMission>(`/ordres-mission/${id}`);
  }

  async getHistorique(id: string): Promise<HistoriqueOrdreMission[]> {
    return apiFetch<HistoriqueOrdreMission[]>(`/ordres-mission/${id}/historique`);
  }

  async getKpis(filtres: Omit<FiltresOrdreMission, 'statut'>): Promise<KpiOrdresMission> {
    return apiFetch<KpiOrdresMission>(`/ordres-mission/kpis${qs(filtresQuery(filtres))}`);
  }

  async valider(id: string, commentaire?: string): Promise<OrdreMission> {
    return apiFetch<OrdreMission>(`/ordres-mission/${id}/valider`, {
      method: 'POST',
      body: JSON.stringify({ commentaire }),
    });
  }

  async rejeter(id: string, motif: string): Promise<OrdreMission> {
    return apiFetch<OrdreMission>(`/ordres-mission/${id}/rejeter`, {
      method: 'POST',
      body: JSON.stringify({ motif }),
    });
  }

  async demanderModification(id: string, commentaire: string): Promise<OrdreMission> {
    return apiFetch<OrdreMission>(`/ordres-mission/${id}/demander-modification`, {
      method: 'POST',
      body: JSON.stringify({ commentaire }),
    });
  }

  async telechargerPieceJointe(id: string, pieceJointeId: string): Promise<Blob> {
    return apiFetchBlob(`/ordres-mission/${id}/pieces-jointes/${pieceJointeId}`);
  }

  async getTypesMission(): Promise<TypeMission[]> {
    return apiFetch<TypeMission[]>('/types-mission');
  }

  async createTypeMission(data: CreateReferentielMissionDto): Promise<TypeMission> {
    return apiFetch<TypeMission>('/types-mission', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTypeMission(id: string, data: UpdateReferentielMissionDto): Promise<TypeMission> {
    return apiFetch<TypeMission>(`/types-mission/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTypeMission(id: string): Promise<void> {
    await apiFetch<void>(`/types-mission/${id}`, { method: 'DELETE' });
  }

  async getMoyensTransport(): Promise<MoyenTransport[]> {
    return apiFetch<MoyenTransport[]>('/moyens-transport');
  }

  async createMoyenTransport(data: CreateReferentielMissionDto): Promise<MoyenTransport> {
    return apiFetch<MoyenTransport>('/moyens-transport', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateMoyenTransport(id: string, data: UpdateReferentielMissionDto): Promise<MoyenTransport> {
    return apiFetch<MoyenTransport>(`/moyens-transport/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMoyenTransport(id: string): Promise<void> {
    await apiFetch<void>(`/moyens-transport/${id}`, { method: 'DELETE' });
  }
}
