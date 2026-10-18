import { RoleGuard } from '@/features/auth/RoleGuard';
import { AffectationsPage } from '@/features/formation/AffectationsPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <AffectationsPage />
    </RoleGuard>
  );
}
