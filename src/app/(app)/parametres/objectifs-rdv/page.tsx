import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { ObjectifsRdvPage } from '@/features/parametres/ObjectifsRdvPage';

/** Accès piloté par la matrice Rôles & permissions (module OBJECTIFS_RDV), comme côté backend. */
export default function Page() {
  return (
    <PermissionGuard code="OBJECTIFS_RDV">
      <ObjectifsRdvPage />
    </PermissionGuard>
  );
}
