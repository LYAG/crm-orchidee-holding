import { ReferentielMissionPage } from '@/features/missions/ReferentielMissionPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <ReferentielMissionPage referentiel="typesMission" />
    </RoleGuard>
  );
}
