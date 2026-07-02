import { AuthGuard } from '@/features/auth/AuthGuard';
import { AppLayout } from '@/components/AppLayout';

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
