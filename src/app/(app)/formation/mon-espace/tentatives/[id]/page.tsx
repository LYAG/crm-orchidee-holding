import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { PassageTentativePage } from '@/features/formation/PassageTentativePage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_ESPACE">
      <PassageTentativePage />
    </PermissionGuard>
  );
}
