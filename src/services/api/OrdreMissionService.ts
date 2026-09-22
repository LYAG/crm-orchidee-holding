import type {
  FiltresOrdreMission,
  HistoriqueOrdreMission,
  KpiOrdresMission,
  MoyenTransport,
  OrdreMission,
  ReferentielMission,
  TypeMission,
} from '@/types';
import type { PageResponse } from '@/types/pagination';

export type CreateReferentielMissionDto = Omit<ReferentielMission, 'id'>;
export type UpdateReferentielMissionDto = Partial<Omit<ReferentielMission, 'id'>>;

/**
 * Le périmètre (MANAGER = son équipe, ADMIN = tout) est appliqué côté serveur à partir du
 * token : les filtres ne font que restreindre ce périmètre, jamais l'élargir.
 */
export interface OrdreMissionService {
  getPagine(filtres: FiltresOrdreMission, page: number, pageSize: number): Promise<PageResponse<OrdreMission>>;
  getById(id: string): Promise<OrdreMission>;
  getHistorique(id: string): Promise<HistoriqueOrdreMission[]>;
  getKpis(filtres: Omit<FiltresOrdreMission, 'statut'>): Promise<KpiOrdresMission>;

  /** Transitions autorisées uniquement depuis SOUMIS. */
  valider(id: string, commentaire?: string): Promise<OrdreMission>;
  rejeter(id: string, motif: string): Promise<OrdreMission>;
  demanderModification(id: string, commentaire: string): Promise<OrdreMission>;

  telechargerPieceJointe(id: string, pieceJointeId: string): Promise<Blob>;

  getTypesMission(): Promise<TypeMission[]>;
  createTypeMission(data: CreateReferentielMissionDto): Promise<TypeMission>;
  updateTypeMission(id: string, data: UpdateReferentielMissionDto): Promise<TypeMission>;
  deleteTypeMission(id: string): Promise<void>;

  getMoyensTransport(): Promise<MoyenTransport[]>;
  createMoyenTransport(data: CreateReferentielMissionDto): Promise<MoyenTransport>;
  updateMoyenTransport(id: string, data: UpdateReferentielMissionDto): Promise<MoyenTransport>;
  deleteMoyenTransport(id: string): Promise<void>;
}
