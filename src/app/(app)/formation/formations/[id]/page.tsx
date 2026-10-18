import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { FormationEditeurPage } from '@/features/formation/FormationEditeurPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_CONCEPTION">
      <FormationEditeurPage />
    </PermissionGuard>
  );
}
