export const UserRole = {
  DELEGUE: 'DELEGUE',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  DELEGUE: 'Délégué',
  MANAGER: 'Manager',
  ADMIN: 'Administrateur',
};
