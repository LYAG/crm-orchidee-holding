import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import type { PageResponse } from '@/types/pagination';

export type CreateUtilisateurDto = Omit<Utilisateur, 'id'>;
export type UpdateUtilisateurDto = Partial<Omit<Utilisateur, 'id'>>;

/** Envoi d'un lien de création de mot de passe. lien : seulement si l'e-mail n'est pas parti. */
export interface InvitationResultat {
  envoyee: boolean;
  destinataire: string;
  dateExpiration: string;
  lien: string | null;
  message: string;
}

export interface CreateUtilisateurResult {
  utilisateur: Utilisateur;
  /** Toujours null : le nouvel utilisateur choisit son mot de passe avec le lien reçu. */
  motDePasseGenere: string | null;
  invitation: InvitationResultat;
}

export interface UtilisateurService {
  getAll(): Promise<Utilisateur[]>;
  getAllPagine(
    role: UserRole | undefined,
    page: number,
    pageSize: number,
  ): Promise<PageResponse<Utilisateur>>;
  getById(id: string): Promise<Utilisateur>;
  getByRole(role: UserRole): Promise<Utilisateur[]>;
  getDeleguesByManager(managerId: string): Promise<Utilisateur[]>;
  create(data: CreateUtilisateurDto): Promise<CreateUtilisateurResult>;
  update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur>;
  delete(id: string): Promise<void>;
  /** Régénère un nouveau mot de passe temporaire pour un utilisateur existant. */
  regenererMotDePasse(id: string): Promise<string>;
  /** Envoie un nouveau lien de création de mot de passe (les précédents sont annulés). */
  envoyerInvitation(id: string): Promise<InvitationResultat>;
}
