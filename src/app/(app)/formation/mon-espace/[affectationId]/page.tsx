import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { ParcoursApprenantPage } from '@/features/formation/ParcoursApprenantPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_ESPACE">
      <ParcoursApprenantPage />
    </PermissionGuard>
  );
}
