import type { PurgeResult, PurgeService, PurgeableTable } from '@/services/api/PurgeService';
import { apiFetch } from './httpClient';

export class PurgeServiceReal implements PurgeService {
  async getTablesPurgeables(): Promise<PurgeableTable[]> {
    return apiFetch<PurgeableTable[]>('/admin/purge/tables');
  }

  async purger(tables: string[], confirmation: string): Promise<PurgeResult> {
    return apiFetch<PurgeResult>('/admin/purge', { method: 'POST', body: JSON.stringify({ tables, confirmation }) });
  }
}
