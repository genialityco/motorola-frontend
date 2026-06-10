import { apiClient } from './api.client';

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'gestor';
  setupKey: string;
}

export interface RegisterResult {
  uid: string;
  email: string;
  role: 'admin' | 'gestor';
}

export const registerService = {
  // requiresAuth = false: la protección la da `setupKey`, no la sesión.
  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResult>('/api/register', payload, false),
};
