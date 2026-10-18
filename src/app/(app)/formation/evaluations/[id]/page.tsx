import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { EvaluationEditeurPage } from '@/features/formation/EvaluationEditeurPage';

export default function Page() {
  return (
    <PermissionGuard code="FORMATION_CONCEPTION">
      <EvaluationEditeurPage />
    </PermissionGuard>
  );
}
