'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/constants';
import { roleService } from '@/services';
import type { PermissionModule } from '@/types';

/** Partagé entre tous les composants : évite un fetch par module/par page, et permet une
 * invalidation immédiate quand l'admin édite la matrice (voir invalidatePermissionModulesCache). */
let cache: Promise<PermissionModule[]> | null = null;
const abonnes = new Set<() => void>();

function loadPermissionModules(): Promise<PermissionModule[]> {
  if (!cache) {
    cache = roleService.getPermissionModules().catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}

/** À appeler après toute création/modification/suppression d'un module de permission
 * (voir RolesPermissionsPage) : les composants montés (menu, gardes, boutons) rechargent la matrice. */
export function invalidatePermissionModulesCache(): void {
  cache = null;
  abonnes.forEach((notifier) => notifier());
}

/** Vrai si le rôle a un accès (complet ou partiel) au module portant ce `code`. Fail-closed. */
export function aLaPermission(modules: PermissionModule[], code: string, role: UserRole): boolean {
  const access = modules.find((m) => m.code === code)?.access[role];
  return access === 'full' || access === 'partial';
}

/**
 * Matrice des permissions (Paramètres > Rôles & permissions), rechargée à chaque invalidation.
 * `null` tant qu'elle n'est pas chargée ; `[]` si le chargement échoue (fail-closed).
 */
export function usePermissionModules(): PermissionModule[] | null {
  const { user } = useAuth();
  const [modules, setModules] = useState<PermissionModule[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const notifier = () => setVersion((v) => v + 1);
    abonnes.add(notifier);
    return () => {
      abonnes.delete(notifier);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    loadPermissionModules()
      .then((liste) => {
        if (!cancelled) setModules(liste);
      })
      .catch(() => {
        if (!cancelled) setModules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, version]);

  return user ? modules : [];
}

/**
 * Accès configurable depuis Paramètres > Rôles & permissions pour un module au `code` métier
 * donné. Appliquées aussi côté backend (PermissionChecker) : OBJECTIFS_CONVERSION, OBJECTIFS_RDV,
 * DRAG_DROP_CLASSIFICATION, MODIFICATION_QUALIFICATION. EDITION_FICHE_PROFESSIONNEL n'est appliqué
 * qu'ici (le PUT backend reste ouvert aux délégués pour le mobile et les disponibilités).
 *
 * `loading` est vrai tant que la matrice n'a pas fini de charger ; `allowed` reste alors `false`
 * (fail-closed) — jamais `true` par défaut sur une règle de sécurité.
 */
export function usePermissionState(code: string): { loading: boolean; allowed: boolean } {
  const { user } = useAuth();
  const modules = usePermissionModules();
  if (!user || modules === null) return { loading: Boolean(user), allowed: false };
  return { loading: false, allowed: aLaPermission(modules, code, user.role as UserRole) };
}

/** Raccourci booléen de usePermissionState (fail-closed pendant le chargement). */
export function usePermission(code: string): boolean {
  return usePermissionState(code).allowed;
}
