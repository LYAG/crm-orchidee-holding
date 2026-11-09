import { RoleGuard } from '@/features/auth/RoleGuard';
import { ParametresMailPage } from '@/features/messagerie/ParametresMailPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <ParametresMailPage />
    </RoleGuard>
  );
}
