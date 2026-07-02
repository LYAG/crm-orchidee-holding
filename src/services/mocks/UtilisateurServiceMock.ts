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

  async getDeleguesByManager(managerId: string): Promise<Utilisateur[]> {
    await delay();
    const manager = utilisateurs.find((u) => u.id === managerId);
    if (!manager?.delegueIds) return [];
    return utilisateurs
      .filter((u) => manager.delegueIds!.includes(u.id))
      .map((u) => ({ ...u }));
  }

  async create(data: CreateUtilisateurDto): Promise<Utilisateur> {
    await delay();
    if (utilisateurs.find((u) => u.email === data.email)) {
      throw new Error('Un utilisateur avec cet e-mail existe déjà.');
    }
    const newUser: Utilisateur = { ...data, id: generateId('user') };
    utilisateurs.push(newUser);

    // Mettre à jour delegueIds du manager
    if (data.role === 'DELEGUE' && data.managerId) {
      const mgr = utilisateurs.find((u) => u.id === data.managerId);
      if (mgr) mgr.delegueIds = [...(mgr.delegueIds ?? []), newUser.id];
    }
    // Mettre à jour managerId des délégués assignés
    if (data.role === 'MANAGER' && data.delegueIds?.length) {
      data.delegueIds.forEach((did) => {
        const del = utilisateurs.find((u) => u.id === did);
        if (del) del.managerId = newUser.id;
      });
    }

    return { ...newUser };
  }

  async update(id: string, data: UpdateUtilisateurDto): Promise<Utilisateur> {
    await delay();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx < 0) notFound('Utilisateur', id);
    const old = utilisateurs[idx];

    // Gestion du changement de manager pour un DELEGUE
    if ('managerId' in data && data.managerId !== old.managerId) {
      if (old.managerId) {
        const oldMgr = utilisateurs.find((u) => u.id === old.managerId);
        if (oldMgr) oldMgr.delegueIds = oldMgr.delegueIds?.filter((did) => did !== id);
      }
      if (data.managerId) {
        const newMgr = utilisateurs.find((u) => u.id === data.managerId);
        if (newMgr && !newMgr.delegueIds?.includes(id)) {
          newMgr.delegueIds = [...(newMgr.delegueIds ?? []), id];
        }
      }
    }

    // Gestion des délégués d'un manager
    if ('delegueIds' in data && data.delegueIds) {
      const oldIds = old.delegueIds ?? [];
      const newIds = data.delegueIds;
      // Retirer managerId des anciens délégués non reconduits
      oldIds.filter((did) => !newIds.includes(did)).forEach((did) => {
        const del = utilisateurs.find((u) => u.id === did);
        if (del && del.managerId === id) del.managerId = undefined;
      });
      // Ajouter managerId aux nouveaux délégués
      newIds.filter((did) => !oldIds.includes(did)).forEach((did) => {
        const del = utilisateurs.find((u) => u.id === did);
        if (del) del.managerId = id;
      });
    }

    utilisateurs[idx] = { ...old, ...data };
    return { ...utilisateurs[idx] };
  }

  async delete(id: string): Promise<void> {
    await delay();
    const idx = utilisateurs.findIndex((u) => u.id === id);
    if (idx < 0) notFound('Utilisateur', id);
    const user = utilisateurs[idx];

    // Nettoyer les références
    if (user.managerId) {
      const mgr = utilisateurs.find((u) => u.id === user.managerId);
      if (mgr) mgr.delegueIds = mgr.delegueIds?.filter((did) => did !== id);
    }
    if (user.delegueIds) {
      user.delegueIds.forEach((did) => {
        const del = utilisateurs.find((u) => u.id === did);
        if (del) del.managerId = undefined;
      });
    }

    utilisateurs.splice(idx, 1);
  }
}
