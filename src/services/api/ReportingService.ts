import type { KpiAdmin, KpiDelegue, KpiManager, PeriodeRapport } from '@/types';

export interface ReportingService {
  getKpiDelegue(delegueId: string, periode?: PeriodeRapport): Promise<KpiDelegue>;
  getKpiManager(managerId: string, periode?: PeriodeRapport): Promise<KpiManager>;
  getKpiAdmin(periode?: PeriodeRapport): Promise<KpiAdmin>;
  exporterCsv(filtres?: { zoneId?: string; delegueId?: string; periode?: PeriodeRapport }): Promise<string>;
}
