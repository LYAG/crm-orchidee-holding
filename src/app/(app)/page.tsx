'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import { DashboardAdmin } from '@/features/reporting/DashboardAdmin';
import { DashboardDelegue } from '@/features/reporting/DashboardDelegue';
import { DashboardManager } from '@/features/reporting/DashboardManager';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === UserRole.DELEGUE) return <DashboardDelegue user={user} />;
  if (user.role === UserRole.MANAGER) return <DashboardManager user={user} />;
  return <DashboardAdmin user={user} />;
}
