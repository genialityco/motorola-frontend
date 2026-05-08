import { apiClient } from './api.client';

export const hostsService = {
  updateNombre: (telefono: string, nombre: string) =>
    apiClient.patch(`/api/hosts/${encodeURIComponent(telefono)}`, { nombre }),
};
