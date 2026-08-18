import { TicketStatus, RecipientOption } from '@/types';
import { apiClient } from './api.client';

export interface ImportedTicketResult {
  fila: number;
  ticketNumber: string;
  telefono: string;
}

export interface FailedTicketRow {
  fila: number;
  razon: string;
}

export interface ImportResult {
  created: ImportedTicketResult[];
  failed: FailedTicketRow[];
}

export interface CreateTicketPayload {
  /** Valores por clave de campo (soporta notación con puntos: `novelty.type`). */
  extraFields: Record<string, string>;
}

export const ticketsService = {
  /** Alta manual desde el panel. El reportante es el admin autenticado. */
  createTicket: (payload: CreateTicketPayload) =>
    apiClient.post<{ id: string; ticketNumber: string }>('/api/tickets', payload),

  transition: (ticketId: string, newStatus: TicketStatus, comments = '', scheduledDate?: string) =>
    apiClient.post(`/api/tickets/${ticketId}/transition`, { newStatus, comments, ...(scheduledDate ? { scheduledDate } : {}) }),

  deletePhoto: (ticketId: string, fieldKey: string, idx: number) =>
    apiClient.delete(`/api/tickets/${ticketId}/photos/${fieldKey}/${idx}`),

  uploadPhoto: (ticketId: string, fieldKey: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm(`/api/tickets/${ticketId}/photos/${fieldKey}`, formData);
  },

  /** Borrado definitivo: elimina el ticket, su historial y sus archivos en Storage. */
  deleteTicket: (ticketId: string) =>
    apiClient.delete<{ success: boolean; ticketNumber: string; filesDeleted: number }>(
      `/api/tickets/${ticketId}`,
    ),

  updateExtraField: (ticketId: string, fieldKey: string, value: string) =>
    apiClient.patch(`/api/tickets/${ticketId}/extra/${fieldKey}`, { value }),

  importTickets: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<ImportResult>('/api/tickets/import', formData);
  },

  addObservation: (ticketId: string, text: string) =>
    apiClient.post(`/api/tickets/${ticketId}/observations`, { text }),

  listAdmins: () => apiClient.get<RecipientOption[]>('/api/tickets/admins'),

  updateNotifyAdmins: (ticketId: string, emails: string[]) =>
    apiClient.patch(`/api/tickets/${ticketId}/notify-admins`, { emails }),
};
