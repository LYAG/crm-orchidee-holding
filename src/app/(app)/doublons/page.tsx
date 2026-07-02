import { DoublonsPage } from '@/features/prospects/DoublonsPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <DoublonsPage />
    </RoleGuard>
  );
}
