import { RoleGuard } from '@/features/auth/RoleGuard';
import { ReportingPage } from '@/features/reporting/ReportingPage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.MANAGER, UserRole.ADMIN]}>
      <ReportingPage />
    </RoleGuard>
  );
}
