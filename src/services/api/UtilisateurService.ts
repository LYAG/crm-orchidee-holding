import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import type { PageResponse } from '@/types/pagination';

export type CreateUtilisateurDto = Omit<Utilisateur, 'id'>;
export type UpdateUtilisateurDto = Partial<Omit<Utilisateur, 'id'>>;

export interface CreateUtilisateurResult {
  utilisateur: Utilisateur;
  motDePasseGenere: string;
}

export interface UtilisateurService {
  getAll(): Promise<Utilisateur[]>;
  getAllPagine(role: UserRole | undefined, page: number, pageSize: number): Promise<PageResponse<Utilisateur>>;
  getById(id: string): Promise<Utilisateur>;
  getByRole(role: UserRole): Promise<Utilisateur[]>;
  getDeleguesByManager(managerId: string): Promise<Utilisateur[]>;
  create(data: CreateUtilisateurDto): Promise<CreateUtilisateurResult>;
  update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur>;
  delete(id: string): Promise<void>;
  /** Régénère un nouveau mot de passe temporaire pour un utilisateur existant. */
  regenererMotDePasse(id: string): Promise<string>;
}
