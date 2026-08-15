import type {
  CreateUtilisateurDto,
  CreateUtilisateurResult,
  UpdateUtilisateurDto,
  UtilisateurService,
} from '@/services/api/UtilisateurService';
import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import { apiFetch } from './httpClient';

interface MotDePasseGenereResponse {
  motDePasseGenere: string;
}

export class UtilisateurServiceReal implements UtilisateurService {
  async getAll(): Promise<Utilisateur[]> {
    return apiFetch<Utilisateur[]>('/utilisateurs');
  }

  async getById(id: string): Promise<Utilisateur> {
    return apiFetch<Utilisateur>(`/utilisateurs/${id}`);
  }

  async getByRole(role: UserRole): Promise<Utilisateur[]> {
    const tous = await this.getAll();
    return tous.filter((u) => u.role === role);
  }

  async getDeleguesByManager(managerId: string): Promise<Utilisateur[]> {
    return apiFetch<Utilisateur[]>(`/managers/${managerId}/delegues`);
  }

  async create(data: CreateUtilisateurDto): Promise<CreateUtilisateurResult> {
    return apiFetch<CreateUtilisateurResult>('/utilisateurs', { method: 'POST', body: JSON.stringify(data) });
  }

  async update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur> {
    return apiFetch<Utilisateur>(`/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/utilisateurs/${id}`, { method: 'DELETE' });
  }

  async regenererMotDePasse(id: string): Promise<string> {
    const { motDePasseGenere } = await apiFetch<MotDePasseGenereResponse>(
      `/utilisateurs/${id}/regenerer-mot-de-passe`,
      { method: 'POST' },
    );
    return motDePasseGenere;
  }
}

