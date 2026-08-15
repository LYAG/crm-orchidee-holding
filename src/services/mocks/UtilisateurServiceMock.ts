import type {
  UtilisateurService,
  CreateUtilisateurDto,
  CreateUtilisateurResult,
  UpdateUtilisateurDto,
} from '@/services/api/UtilisateurService';
import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import type { PageResponse } from '@/types/pagination';
import { mockCredentials, utilisateurs } from './data';
import { delay, generateId, genererMotDePasse, notFound, paginer } from './_utils';

export class UtilisateurServiceMock implements UtilisateurService {
  async getAll(): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs.map((u) => ({ ...u }));
  }

  async getAllPagine(role: UserRole | undefined, page: number, pageSize: number): Promise<PageResponse<Utilisateur>> {
    await delay();
    const filtres = utilisateurs
      .filter((u) => !role || u.role === role)
      .map((u) => ({ ...u }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
    return paginer(filtres, page, pageSize);
  }

  async getById(id: string): Promise<Utilisateur> {
    await delay();
    return { ...(utilisateurs.find((u) => u.id === id) ?? notFound('Utilisateur', id)) };
  }

  async getByRole(role: UserRole): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs.filter((u) => u.role === role).map((u) => ({ ...u }));
  }

  /** L'équipe d'un manager = les délégués dont au moins une zone est supervisée par ce manager. */
  async getDeleguesByManager(managerId: string): Promise<Utilisateur[]> {
    await delay();
    const manager = utilisateurs.find((u) => u.id === managerId);
    const zoneIds = manager?.zoneIds ?? [];
    if (zoneIds.length === 0) return [];
    return utilisateurs
      .filter((u) => u.role === 'DELEGUE' && u.zoneIds?.some((z) => zoneIds.includes(z)))
      .map((u) => ({ ...u }));
  }

  async create(data: CreateUtilisateurDto): Promise<CreateUtilisateurResult> {
    await delay();
    if (utilisateurs.find((u) => u.email === data.email)) {
      throw new Error('Un utilisateur avec cet e-mail existe déjà.');
    }
    const newUser: Utilisateur = { ...data, id: generateId('user') };
    utilisateurs.push(newUser);
    const motDePasseGenere = genererMotDePasse();
    mockCredentials[newUser.email] = motDePasseGenere;
    return { utilisateur: { ...newUser }, motDePasseGenere };
  }

  async update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur> {
    await delay();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx < 0) notFound('Utilisateur', id);
    const ancienEmail = utilisateurs[idx].email;
    utilisateurs[idx] = { ...utilisateurs[idx], ...data };
    // Le mot de passe est rattaché à l'e-mail : le faire suivre si celui-ci change.
    if (data.email && data.email !== ancienEmail && mockCredentials[ancienEmail]) {
      mockCredentials[data.email] = mockCredentials[ancienEmail];
      delete mockCredentials[ancienEmail];
    }
    return { ...utilisateurs[idx] };
  }

  async delete(id: string): Promise<void> {
    await delay();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx < 0) notFound('Utilisateur', id);

    // Un délégué qui pointait sur ce manager (responsable) perd la référence.
    utilisateurs.forEach((u) => {
      if (u.managerId === id) u.managerId = undefined;
    });

    delete mockCredentials[utilisateurs[idx].email];
    utilisateurs.splice(idx, 1);
  }

  async regenererMotDePasse(id: string): Promise<string> {
    await delay();
    const user = utilisateurs.find((u) => u.id === id);
    if (!user) notFound('Utilisateur', id);
    const motDePasseGenere = genererMotDePasse();
    mockCredentials[user.email] = motDePasseGenere;
    return motDePasseGenere;
  }
}
