'use client';

import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';

/** /formation : espace apprenant pour un délégué, tableau de bord pour un manager ou un admin. */
export function FormationAccueil() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user) return;
    router.replace(user.role === UserRole.DELEGUE ? '/formation/mon-espace' : '/formation/tableau-de-bord');
  }, [user, router]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
      <Spin />
    </div>
  );
}
