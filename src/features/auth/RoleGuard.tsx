'use client';

import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || !roles.includes(user.role as UserRole)) {
    return (
      <Result
        status="403"
        title="Accès refusé"
        subTitle={`Cette page est réservée aux rôles : ${roles.join(', ')}.`}
        extra={
          <Button type="primary" onClick={() => router.back()}>
            Retour
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
