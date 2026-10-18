import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { StatistiquesFormationPage } from '@/features/formation/StatistiquesFormationPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_SUIVI">
      <StatistiquesFormationPage />
    </PermissionGuard>
  );
}
