import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';

export type CreateUtilisateurDto = Omit<Utilisateur, 'id'>;
export type UpdateUtilisateurDto = Partial<Omit<Utilisateur, 'id'>>;

export interface UtilisateurService {
  getAll(): Promise<Utilisateur[]>;
  getById(id: string): Promise<Utilisateur>;
  getByRole(role: UserRole): Promise<Utilisateur[]>;
  getDeleguesByManager(managerId: string): Promise<Utilisateur[]>;
  create(data: CreateUtilisateurDto): Promise<Utilisateur>;
  update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur>;
  delete(id: string): Promise<void>;
}
