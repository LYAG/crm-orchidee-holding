import type {
  DoublonAction,
  DoublonDetecte,
  FiltresProspect,
  ImportResult,
  Prospect,
} from '@/types';

export interface ProspectService {
  getAll(filtres?: FiltresProspect): Promise<Prospect[]>;
  getById(id: string): Promise<Prospect>;
  create(data: Omit<Prospect, 'id' | 'dateCreation' | 'aEuRdv'>): Promise<Prospect>;
  update(id: string, data: Partial<Prospect>): Promise<Prospect>;
  delete(id: string): Promise<void>;

  attribuerAuDelegue(prospectId: string, delegueId: string): Promise<Prospect>;
  sAutoAttribuer(prospectId: string, delegueId: string): Promise<Prospect>;

  simulerImportExcel(fileName: string): Promise<ImportResult>;
  getDoublons(): Promise<DoublonDetecte[]>;
  validerDoublon(doublonId: string, action: DoublonAction): Promise<void>;
}
