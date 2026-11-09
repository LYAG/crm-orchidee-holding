import type { Utilisateur } from '@/types';

/** Page publique de création de mot de passe. */
export interface InvitationInfo {
  prenom: string;
  email: string;
  dateExpiration: string;
}

export interface AuthService {
  /** Destinataire d'un lien de création de mot de passe ; erreur si le lien n'est plus valide. */
  getInvitation(jeton: string): Promise<InvitationInfo>;
  /** Enregistre le mot de passe choisi ; le lien est consommé. */
  definirMotDePasse(jeton: string, motDePasse: string): Promise<void>;
  login(email: string, password: string): Promise<Utilisateur>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Utilisateur | null>;
}
