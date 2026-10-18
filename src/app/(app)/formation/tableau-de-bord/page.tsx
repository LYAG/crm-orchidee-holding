import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { TableauBordFormationPage } from '@/features/formation/TableauBordFormationPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_SUIVI">
      <TableauBordFormationPage />
    </PermissionGuard>
  );
}
