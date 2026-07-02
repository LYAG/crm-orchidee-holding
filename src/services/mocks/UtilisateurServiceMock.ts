import type { UtilisateurService } from '@/services/api/UtilisateurService';
import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import { utilisateurs } from './data';
import { delay, notFound } from './_utils';

export class UtilisateurServiceMock implements UtilisateurService {
  async getAll(): Promise<Utilisateur[]> {
    await delay();
    return [...utilisateurs];
  }

  async getById(id: string): Promise<Utilisateur> {
    await delay();
    return utilisateurs.find((u) => u.id === id) ?? notFound('Utilisateur', id);
  }

  async getByRole(role: UserRole): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs.filter((u) => u.role === role);
  }

  async getDeleguesByManager(managerId: string): Promise<Utilisateur[]> {
    await delay();
    const manager = utilisateurs.find((u) => u.id === managerId);
    if (!manager?.delegueIds) return [];
    return utilisateurs.filter((u) => manager.delegueIds!.includes(u.id));
  }
}
