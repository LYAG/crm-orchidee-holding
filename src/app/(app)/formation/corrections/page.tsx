import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { CorrectionsPage } from '@/features/formation/CorrectionsPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_SUIVI">
      <CorrectionsPage />
    </PermissionGuard>
  );
}
