import { RoleGuard } from '@/features/auth/RoleGuard';
import { AffectationDetailPage } from '@/features/formation/AffectationDetailPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <AffectationDetailPage />
    </RoleGuard>
  );
}
