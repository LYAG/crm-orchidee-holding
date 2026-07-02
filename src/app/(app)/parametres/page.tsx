import { RoleGuard } from '@/features/auth/RoleGuard';
import { ParametresPage } from '@/features/parametres/ParametresPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <ParametresPage />
    </RoleGuard>
  );
}
