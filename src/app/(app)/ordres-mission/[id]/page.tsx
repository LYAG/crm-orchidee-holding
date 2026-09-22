import { OrdreMissionDetailPage } from '@/features/missions/OrdreMissionDetailPage';
import { RoleGuard } from '@/features/auth/RoleGuard';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <OrdreMissionDetailPage />
    </RoleGuard>
  );
}
