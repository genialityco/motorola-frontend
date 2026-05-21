import { TicketStatus } from '@/types';
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

export const ticketsService = {
  transition: (ticketId: string, newStatus: TicketStatus, comments = 'Transición desde el Dashboard Web', scheduledDate?: string) =>
    apiClient.post(`/api/tickets/${ticketId}/transition`, { newStatus, comments, ...(scheduledDate ? { scheduledDate } : {}) }),

  deletePhoto: (ticketId: string, fieldKey: string, idx: number) =>
    apiClient.delete(`/api/tickets/${ticketId}/photos/${fieldKey}/${idx}`),

  uploadPhoto: (ticketId: string, fieldKey: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm(`/api/tickets/${ticketId}/photos/${fieldKey}`, formData);
  },

  updateExtraField: (ticketId: string, fieldKey: string, value: string) =>
    apiClient.patch(`/api/tickets/${ticketId}/extra/${fieldKey}`, { value }),

  importTickets: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<ImportResult>('/api/tickets/import', formData);
  },
};
