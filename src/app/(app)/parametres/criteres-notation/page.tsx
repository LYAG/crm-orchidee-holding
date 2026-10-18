import { RoleGuard } from '@/features/auth/RoleGuard';
import { CriteresNotationPage } from '@/features/notation/CriteresNotationPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <CriteresNotationPage />
    </RoleGuard>
  );
}
