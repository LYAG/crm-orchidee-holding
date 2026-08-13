import type { UtilisateurService, CreateUtilisateurDto, UpdateUtilisateurDto } from '@/services/api/UtilisateurService';
import type { UserRole } from '@/lib/constants';
import type { Utilisateur } from '@/types';
import { utilisateurs } from './data';
import { delay, generateId, notFound } from './_utils';

export class UtilisateurServiceMock implements UtilisateurService {
  async getAll(): Promise<Utilisateur[]> {
    await delay();
    return utilisateurs.map((u) => ({ ...u }));
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

  async create(data: CreateUtilisateurDto): Promise<Utilisateur> {
    await delay();
    if (utilisateurs.find((u) => u.email === data.email)) {
      throw new Error('Un utilisateur avec cet e-mail existe déjà.');
    }
    const newUser: Utilisateur = { ...data, id: generateId('user') };
    utilisateurs.push(newUser);
    return { ...newUser };
  }

  async update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur> {
    await delay();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx < 0) notFound('Utilisateur', id);
    utilisateurs[idx] = { ...utilisateurs[idx], ...data };
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

    utilisateurs.splice(idx, 1);
  }
}
