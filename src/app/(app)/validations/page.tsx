import { ValidationsPage } from '@/features/professionnels/ValidationsPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <ValidationsPage />
    </RoleGuard>
  );
}
