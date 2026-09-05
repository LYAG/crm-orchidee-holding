'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';

/** Redirige vers la première page de Paramètres accessible au rôle courant — nécessaire
 * depuis que ce menu n'est plus réservé aux seuls admins (voir ObjectifsRdvPage, manager). */
export default function Page() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(user.role === UserRole.MANAGER ? '/parametres/objectifs-rdv' : '/parametres/presentation');
  }, [user, router]);

  return null;
}
