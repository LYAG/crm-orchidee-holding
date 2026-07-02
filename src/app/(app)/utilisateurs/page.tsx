import { RoleGuard } from '@/features/auth/RoleGuard';
import { UtilisateursZonesPage } from '@/features/utilisateurs/UtilisateursZonesPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <UtilisateursZonesPage />
    </RoleGuard>
  );
}
