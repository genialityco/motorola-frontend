import { TicketStatus } from '@/types';
import { apiClient } from './api.client';

export const ticketsService = {
  transition: (ticketId: string, newStatus: TicketStatus, comments = 'Transición desde el Dashboard Web') =>
    apiClient.post(`/api/tickets/${ticketId}/transition`, { newStatus, comments }),

  updateObservation: (ticketId: string, observations: string) =>
    apiClient.patch(`/api/tickets/${ticketId}/observation`, { observations }),

  deleteEvidencePhoto: (ticketId: string, idx: number) =>
    apiClient.delete(`/api/tickets/${ticketId}/photos/evidence/${idx}`),

  deleteRepairPhoto: (ticketId: string, idx: number) =>
    apiClient.delete(`/api/tickets/${ticketId}/photos/repair/${idx}`),

  uploadRepairPhoto: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm(`/api/tickets/${ticketId}/photos/repair`, formData);
  },
};
