import type {
  CreatePermissionModuleDto,
  RoleService,
  UpdatePermissionModuleDto,
  UpdateRoleDto,
} from '@/services/api/RoleService';
import type { UserRole } from '@/lib/constants';
import type { PermissionModule, RoleDefinition } from '@/types';
import { permissionModules, roleDefinitions } from './data';
import { delay, generateId, notFound } from './_utils';

export class RoleServiceMock implements RoleService {
  async getRoles(): Promise<RoleDefinition[]> {
    await delay();
    return roleDefinitions.map((r) => ({ ...r }));
  }

  async updateRole(key: UserRole, data: UpdateRoleDto): Promise<RoleDefinition> {
    await delay();
    const idx = roleDefinitions.findIndex((r) => r.key === key);
    if (idx < 0) notFound('Rôle', key);
    roleDefinitions[idx] = { ...roleDefinitions[idx], ...data };
    return { ...roleDefinitions[idx] };
  }

  async getPermissionModules(): Promise<PermissionModule[]> {
    await delay();
    return permissionModules.map((p) => ({ ...p, access: { ...p.access }, labels: { ...p.labels } }));
  }

  async createPermissionModule(data: CreatePermissionModuleDto): Promise<PermissionModule> {
    await delay();
    const newModule: PermissionModule = { ...data, id: generateId('perm') };
    permissionModules.push(newModule);
    return { ...newModule };
  }

  async updatePermissionModule(id: string, data: UpdatePermissionModuleDto): Promise<PermissionModule> {
    await delay();
    const idx = permissionModules.findIndex((p) => p.id === id);
    if (idx < 0) notFound('Module de permission', id);
    permissionModules[idx] = { ...permissionModules[idx], ...data };
    return { ...permissionModules[idx] };
  }

  async deletePermissionModule(id: string): Promise<void> {
    await delay();
    const idx = permissionModules.findIndex((p) => p.id === id);
    if (idx < 0) notFound('Module de permission', id);
    permissionModules.splice(idx, 1);
  }
}
