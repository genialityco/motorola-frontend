import { BotMessages, BotField, SystemFieldConfig } from '@/types';
import { apiClient } from './api.client';

export const configService = {
  saveMessages: (messages: BotMessages) =>
    apiClient.patch('/api/config/messages', messages),

  saveFields: (fields: BotField[], systemFields?: SystemFieldConfig[]) =>
    apiClient.patch('/api/config/fields', { fields, ...(systemFields ? { systemFields } : {}) }),
};
