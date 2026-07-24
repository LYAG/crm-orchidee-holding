import { RoleGuard } from '@/features/auth/RoleGuard';
import { RolesPermissionsPage } from '@/features/parametres/RolesPermissionsPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <RolesPermissionsPage />
    </RoleGuard>
  );
}
