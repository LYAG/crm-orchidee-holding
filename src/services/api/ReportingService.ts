import type { KpiAdmin, KpiDelegue, KpiManager, PeriodeRapport, ProgressionConversion } from '@/types';

export interface ReportingService {
  getKpiDelegue(delegueId: string, periode?: PeriodeRapport): Promise<KpiDelegue>;
  getKpiManager(managerId: string, periode?: PeriodeRapport): Promise<KpiManager>;
  getKpiAdmin(periode?: PeriodeRapport): Promise<KpiAdmin>;
  exporterCsv(filtres?: { zoneId?: string; delegueId?: string; periode?: PeriodeRapport }): Promise<string>;
  /** Jauge de conversion T1 → ST par délégué pour le mois donné, scopée par rôle (voir backend). */
  getProgressionConversions(annee: number, mois: number): Promise<ProgressionConversion[]>;
}
