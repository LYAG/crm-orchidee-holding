import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { ObjectifsConversionPage } from '@/features/parametres/ObjectifsConversionPage';

/** Accès piloté par la matrice Rôles & permissions (module OBJECTIFS_CONVERSION), comme côté backend. */
export default function Page() {
  return (
    <PermissionGuard code="OBJECTIFS_CONVERSION">
      <ObjectifsConversionPage />
    </PermissionGuard>
  );
}
