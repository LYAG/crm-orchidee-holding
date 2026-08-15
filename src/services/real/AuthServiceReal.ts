import type { AuthService } from '@/services/api/AuthService';
import type { Utilisateur } from '@/types';
import { apiFetch, clearToken, getStoredUser, setStoredUser, setToken } from './httpClient';

interface LoginResponse {
  token: string;
  utilisateur: Utilisateur;
}

export class AuthServiceReal implements AuthService {
  async login(email: string, password: string): Promise<Utilisateur> {
    const { token, utilisateur } = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    setStoredUser(utilisateur);
    return utilisateur;
  }

  async logout(): Promise<void> {
    // JWT stateless — pas d'endpoint serveur, on efface simplement le token local.
    clearToken();
  }

  async getCurrentUser(): Promise<Utilisateur | null> {
    return getStoredUser<Utilisateur>();
  }
}
