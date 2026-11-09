import type { AuthService, InvitationInfo } from '@/services/api/AuthService';
import type { Utilisateur } from '@/types';
import { mockCredentials, utilisateurs } from './data';
import { delay } from './_utils';
import { annulerInvitationsMock, invitationsMock } from './invitations';

const LIEN_INVALIDE =
  "Ce lien n'est plus valide : il a expiré ou a déjà été utilisé. Demandez un nouveau lien à votre administrateur.";

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

  async getInvitation(jeton: string): Promise<InvitationInfo> {
    await delay();
    const inv = invitationsMock.get(jeton);
    const user = inv && utilisateurs.find((u) => u.email === inv.email);
    if (!inv || !user || inv.utilise || new Date(inv.dateExpiration) < new Date()) {
      throw new Error(LIEN_INVALIDE);
    }
    return { prenom: user.prenom, email: user.email, dateExpiration: inv.dateExpiration };
  }

  async definirMotDePasse(jeton: string, motDePasse: string): Promise<void> {
    const { email } = await this.getInvitation(jeton);
    if (motDePasse.length < 8 || !/\p{L}/u.test(motDePasse) || !/\d/.test(motDePasse)) {
      throw new Error(
        'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.',
      );
    }
    mockCredentials[email] = motDePasse;
    const inv = invitationsMock.get(jeton);
    if (inv) inv.utilise = true;
    annulerInvitationsMock(email);
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
