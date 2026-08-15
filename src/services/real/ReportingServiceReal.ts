import type { ReportingService } from '@/services/api/ReportingService';
import type { KpiAdmin, KpiDelegue, KpiManager, PeriodeRapport } from '@/types';
import { apiFetch, apiFetchText, qs } from './httpClient';

/** `periode` n'est pas encore exploité côté backend (aucun des 3 endpoints KPI ne l'accepte) — ignoré, comme dans le mock. */
export class ReportingServiceReal implements ReportingService {
  async getKpiDelegue(delegueId: string, _periode?: PeriodeRapport): Promise<KpiDelegue> {
    return apiFetch<KpiDelegue>(`/reporting/kpi-delegue/${delegueId}`);
  }

  async getKpiManager(managerId: string, _periode?: PeriodeRapport): Promise<KpiManager> {
    return apiFetch<KpiManager>(`/reporting/kpi-manager/${managerId}`);
  }

  async getKpiAdmin(_periode?: PeriodeRapport): Promise<KpiAdmin> {
    return apiFetch<KpiAdmin>('/reporting/kpi-admin');
  }

  async exporterCsv(filtres?: { zoneId?: string; delegueId?: string; periode?: PeriodeRapport }): Promise<string> {
    const query = qs({ zoneId: filtres?.zoneId, delegueId: filtres?.delegueId });
    return apiFetchText(`/reporting/export-csv${query}`);
  }
}
