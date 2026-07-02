import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';

export interface UtilisateurService {
  getAll(): Promise<Utilisateur[]>;
  getById(id: string): Promise<Utilisateur>;
  getByRole(role: UserRole): Promise<Utilisateur[]>;
  getDeleguesByManager(managerId: string): Promise<Utilisateur[]>;
}
