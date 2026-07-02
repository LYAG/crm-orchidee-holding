import type { Utilisateur } from '@/types';

export interface AuthService {
  login(email: string, password: string): Promise<Utilisateur>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Utilisateur | null>;
}
