import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { CatalogueFormationPage } from '@/features/formation/CatalogueFormationPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_CONCEPTION">
      <CatalogueFormationPage />
    </PermissionGuard>
  );
}
