import { apiClient } from './api.client';

export interface AssignmentRule {
  fieldKey: string;
  fieldValues: string[];
}

export interface GestorUser {
  uid: string;
  email: string;
  name: string;
  role: 'gestor';
  assignmentRules: AssignmentRule[];
  active: boolean;
  createdAt: number;
}

export interface CreateGestorDto {
  email: string;
  name: string;
  password: string;
  assignmentRules?: AssignmentRule[];
}

export interface UpdateGestorDto {
  name?: string;
  assignmentRules?: AssignmentRule[];
  active?: boolean;
}

/**
 * Preferencias de interfaz del usuario autenticado. `ticketColumns` solo guarda
 * las columnas que el usuario cambió respecto al valor por defecto de la
 * configuración de campos.
 */
export interface UserPreferences {
  ticketColumns: Record<string, boolean>;
}

export const usersService = {
  createGestor: (dto: CreateGestorDto) =>
    apiClient.post<GestorUser>('/api/users', dto),

  listUsers: () =>
    apiClient.get<GestorUser[]>('/api/users'),

  getUser: (uid: string) =>
    apiClient.get<GestorUser>(`/api/users/${uid}`),

  updateUser: (uid: string, dto: UpdateGestorDto) =>
    apiClient.patch<{ success: boolean }>(`/api/users/${uid}`, dto),

  deleteUser: (uid: string) =>
    apiClient.delete<{ success: boolean }>(`/api/users/${uid}`),

  recomputeAssignments: () =>
    apiClient.post<{ updated: number }>('/api/users/recompute-assignments'),

  getMyPreferences: () =>
    apiClient.get<UserPreferences>('/api/users/me/preferences'),

  updateMyPreferences: (prefs: Partial<UserPreferences>) =>
    apiClient.patch<UserPreferences>('/api/users/me/preferences', prefs),

  promoteAdmin: (setupKey: string) =>
    apiClient.post<{ success: boolean; message: string }>('/api/users/promote-admin', { setupKey }),
};
