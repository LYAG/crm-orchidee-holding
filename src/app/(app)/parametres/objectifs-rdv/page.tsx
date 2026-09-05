import { RoleGuard } from '@/features/auth/RoleGuard';
import { ObjectifsRdvPage } from '@/features/parametres/ObjectifsRdvPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.MANAGER]}>
      <ObjectifsRdvPage />
    </RoleGuard>
  );
}
