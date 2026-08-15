import { RoleGuard } from '@/features/auth/RoleGuard';
import { PurgeDatabasePage } from '@/features/parametres/PurgeDatabasePage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <PurgeDatabasePage />
    </RoleGuard>
  );
}
