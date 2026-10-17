'use client';

import { Button, Result, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { usePermissionState } from '@/hooks/usePermission';

interface PermissionGuardProps {
  /** `code` du module de la matrice Rôles & permissions (ex. OBJECTIFS_RDV). */
  code: string;
  children: React.ReactNode;
}

/** Équivalent de RoleGuard piloté par la matrice configurable plutôt que par une liste de rôles en dur. */
export function PermissionGuard({ code, children }: PermissionGuardProps) {
  const { loading, allowed } = usePermissionState(code);
  const router = useRouter();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin />
      </div>
    );
  }

  if (!allowed) {
    return (
      <Result
        status="403"
        title="Accès refusé"
        subTitle="Votre rôle n'a pas accès à cette page (voir Paramètres > Rôles & permissions)."
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
