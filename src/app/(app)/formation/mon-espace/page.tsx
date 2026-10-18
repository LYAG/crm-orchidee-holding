import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { EspaceApprenantPage } from '@/features/formation/EspaceApprenantPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_ESPACE">
      <EspaceApprenantPage />
    </PermissionGuard>
  );
}
