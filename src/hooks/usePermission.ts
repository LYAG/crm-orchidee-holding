'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { roleService } from '@/services';
import type { PermissionModule } from '@/types';

/** Partagé entre tous les composants : évite un fetch par module/par page, et permet une
 * invalidation immédiate quand l'admin édite la matrice (voir invalidatePermissionModulesCache). */
let cache: Promise<PermissionModule[]> | null = null;

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
 * (voir RolesPermissionsPage) pour que les vérifications déjà montées se remettent à jour. */
export function invalidatePermissionModulesCache(): void {
  cache = null;
}

/**
 * Accès configurable depuis Paramètres > Rôles & permissions pour un module au `code` métier
 * donné (voir PermissionChecker côté backend — seule une liste restreinte de règles y est
 * branchée : OBJECTIFS_CONVERSION, OBJECTIFS_RDV, DRAG_DROP_CLASSIFICATION,
 * MODIFICATION_QUALIFICATION, EDITION_FICHE_PROFESSIONNEL).
 *
 * Fail-closed : renvoie `false` tant que la matrice n'a pas fini de charger, ou si aucun module
 * ne porte ce code (mal configuré) — jamais `true` par défaut sur une règle de sécurité.
 */
export function usePermission(code: string): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setHasAccess(false);
      return;
    }
    loadPermissionModules()
      .then((modules) => {
        if (cancelled) return;
        const module = modules.find((m) => m.code === code);
        const access = module?.access[user.role as UserRole];
        setHasAccess(access === 'full' || access === 'partial');
      })
      .catch(() => setHasAccess(false));
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  return hasAccess;
}
