import { BotMessages, BotField } from '@/types';
import { apiClient } from './api.client';

export const configService = {
  saveMessages: (messages: BotMessages) =>
    apiClient.patch('/api/config/messages', messages),

  saveFields: (fields: BotField[]) =>
    apiClient.patch('/api/config/fields', { fields }),
};
