import type { AuthService } from '@/services/api/AuthService';
import type { Utilisateur } from '@/types';
import { mockCredentials, utilisateurs } from './data';
import { delay } from './_utils';

const SESSION_KEY = 'crm_mock_user';

export class AuthServiceMock implements AuthService {
  async login(email: string, password: string): Promise<Utilisateur> {
    await delay();
    const expectedPassword = mockCredentials[email];
    if (!expectedPassword || expectedPassword !== password) {
      throw new Error('Email ou mot de passe incorrect.');
    }
    const user = utilisateurs.find((u) => u.email === email);
    if (!user) throw new Error('Utilisateur introuvable.');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    return user;
  }

  async logout(): Promise<void> {
    await delay(100);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async getCurrentUser(): Promise<Utilisateur | null> {
    await delay(100);
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Utilisateur;
    } catch {
      return null;
    }
  }
}
