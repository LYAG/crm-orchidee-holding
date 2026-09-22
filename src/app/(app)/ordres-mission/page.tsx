import { OrdresMissionPage } from '@/features/missions/OrdresMissionPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <OrdresMissionPage />
    </RoleGuard>
  );
}
