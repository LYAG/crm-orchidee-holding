'use client';

import { Result } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getMenuRoutes } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionModules } from '@/hooks/usePermission';
import type { UserRole } from '@/lib/constants';

/** Redirige vers la première page de Paramètres accessible au rôle courant — mêmes règles que
 * le menu (rôles en dur + matrice Rôles & permissions pour les pages Objectifs). */
export default function Page() {
  const { user } = useAuth();
  const modules = usePermissionModules();
  const router = useRouter();

  const premiere =
    user && modules
      ? getMenuRoutes(user.role as UserRole, modules).routes.find((r) => r.path === '/parametres')?.routes?.[0]?.path
      : undefined;

  useEffect(() => {
    if (premiere) router.replace(premiere);
  }, [premiere, router]);

  if (user && modules && !premiere) {
    return <Result status="403" title="Accès refusé" subTitle="Aucune page de paramètres n'est accessible à votre rôle." />;
  }

  return null;
}
