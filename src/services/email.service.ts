import { EmailConfig, RecipientOption } from '@/types';
import { apiClient } from './api.client';

export const emailService = {
  getConfig: () => apiClient.get<EmailConfig>('/api/email/config'),

  saveConfig: (config: EmailConfig) =>
    apiClient.patch<EmailConfig>('/api/email/config', config),

  listRecipientOptions: () => apiClient.get<RecipientOption[]>('/api/email/recipients'),
};
