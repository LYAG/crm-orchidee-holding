import type {
  CreatePermissionModuleDto,
  RoleService,
  UpdatePermissionModuleDto,
  UpdateRoleDto,
} from '@/services/api/RoleService';
import type { UserRole } from '@/lib/constants';
import type { PermissionModule, RoleDefinition } from '@/types';
import { apiFetch } from './httpClient';

export class RoleServiceReal implements RoleService {
  async getRoles(): Promise<RoleDefinition[]> {
    return apiFetch<RoleDefinition[]>('/roles');
  }

  async updateRole(key: UserRole, data: UpdateRoleDto): Promise<RoleDefinition> {
    return apiFetch<RoleDefinition>(`/roles/${key}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getPermissionModules(): Promise<PermissionModule[]> {
    return apiFetch<PermissionModule[]>('/permissions');
  }

  async createPermissionModule(data: CreatePermissionModuleDto): Promise<PermissionModule> {
    return apiFetch<PermissionModule>('/permissions', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePermissionModule(id: string, data: UpdatePermissionModuleDto): Promise<PermissionModule> {
    return apiFetch<PermissionModule>(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deletePermissionModule(id: string): Promise<void> {
    await apiFetch<void>(`/permissions/${id}`, { method: 'DELETE' });
  }
}
