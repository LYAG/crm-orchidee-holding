import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { ResultatApprenantPage } from '@/features/formation/ResultatApprenantPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_ESPACE">
      <ResultatApprenantPage />
    </PermissionGuard>
  );
}
