import { CentresPage } from '@/features/referentiels/CentresPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <CentresPage />
    </RoleGuard>
  );
}
