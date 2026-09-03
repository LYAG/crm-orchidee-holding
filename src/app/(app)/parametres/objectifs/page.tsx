import { RoleGuard } from '@/features/auth/RoleGuard';
import { ObjectifsConversionPage } from '@/features/parametres/ObjectifsConversionPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <ObjectifsConversionPage />
    </RoleGuard>
  );
}
