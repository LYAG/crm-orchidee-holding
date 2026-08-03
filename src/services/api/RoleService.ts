import type { UserRole } from '@/lib/constants';
import type { PermissionModule, RoleDefinition } from '@/types';

export type UpdateRoleDto = Partial<Pick<RoleDefinition, 'label' | 'color' | 'bg' | 'gradientFrom' | 'gradientTo' | 'description'>>;
export type CreatePermissionModuleDto = Omit<PermissionModule, 'id'>;
export type UpdatePermissionModuleDto = Partial<Omit<PermissionModule, 'id'>>;

export interface RoleService {
  getRoles(): Promise<RoleDefinition[]>;
  updateRole(key: UserRole, data: UpdateRoleDto): Promise<RoleDefinition>;
  getPermissionModules(): Promise<PermissionModule[]>;
  createPermissionModule(data: CreatePermissionModuleDto): Promise<PermissionModule>;
  updatePermissionModule(id: string, data: UpdatePermissionModuleDto): Promise<PermissionModule>;
  deletePermissionModule(id: string): Promise<void>;
}
