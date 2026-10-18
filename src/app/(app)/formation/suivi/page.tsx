import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { SuiviDeleguesPage } from '@/features/formation/SuiviDeleguesPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_SUIVI">
      <SuiviDeleguesPage />
    </PermissionGuard>
  );
}
