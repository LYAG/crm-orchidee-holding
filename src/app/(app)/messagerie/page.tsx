import { RoleGuard } from '@/features/auth/RoleGuard';
import { MessageriePage } from '@/features/messagerie/MessageriePage';
import { UserRole } from '@/lib/constants';

export default function Page() {
  return (
    <RoleGuard roles={[UserRole.ADMIN]}>
      <MessageriePage />
    </RoleGuard>
  );
}
