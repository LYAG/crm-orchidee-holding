import { AuthGuard } from '@/features/auth/AuthGuard';
import { AppLayout } from '@/components/AppLayout';
import { ZoneFilterProvider } from '@/components/ZoneFilterContext';

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ZoneFilterProvider>
        <AppLayout>{children}</AppLayout>
      </ZoneFilterProvider>
    </AuthGuard>
  );
}
