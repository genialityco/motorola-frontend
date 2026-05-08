import { ChatMessage } from '@/types';
import { apiClient } from './api.client';

export const whatsappService = {
  getChatHistory: (phone: string) =>
    apiClient.get<{ messages: ChatMessage[] }>(`/api/whatsapp/chat-history/${phone}`, false),

  sendAdminMessage: (to: string, message: string) =>
    apiClient.post('/api/whatsapp/send', { to, message }),

  sendReply: (to: string, text: string) =>
    apiClient.post('/api/whatsapp/send-message', { to, text }, false),

  toggleBot: (phone: string, botEnabled: boolean) =>
    apiClient.post('/api/whatsapp/bot-toggle', { phone, botEnabled }),

  simulate: (phone: string, message?: string, files?: File[]) => {
    const formData = new FormData();
    formData.append('phone', phone);
    if (message) formData.append('message', message);
    files?.forEach((f) => formData.append('files', f));
    return apiClient.postForm('/api/whatsapp/simulate', formData, false);
  },

  requestFieldUpdate: (
    ticketId: string,
    fieldKey: string,
    fieldLabel: string,
    customMessage?: string,
  ) =>
    apiClient.post('/api/whatsapp/request-field-update', {
      ticketId,
      fieldKey,
      fieldLabel,
      customMessage,
    }),
};
