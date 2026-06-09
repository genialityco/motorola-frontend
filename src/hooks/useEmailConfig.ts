'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailConfig, EmailEvent, EmailRecipient, RecipientOption } from '@/types';
import { emailService } from '@/services/email.service';
import { useAppToast } from '@/components/toast-provider';

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  notifyAssignedGestores: true,
  recipients: [],
  templates: {
    created: {
      subject: 'Nuevo ticket creado - {ticketNumber}',
      body:
        'Se ha creado el ticket {ticketNumber}.\n\n' +
        'Reportado por: {reporterName} ({reporterPhone})\n' +
        'Estado: {status}',
    },
    statusChanged: {
      subject: 'Ticket {ticketNumber} - Cambio a {newStatus}',
      body:
        'El estado del ticket {ticketNumber} ha cambiado.\n\n' +
        'Estado anterior: {prevStatus}\n' +
        'Estado nuevo: {newStatus}\n\n' +
        'Reportado por: {reporterName} ({reporterPhone})\n' +
        'Fecha: {date}',
    },
  },
};

export function useEmailConfig() {
  const { showToast } = useAppToast();
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_EMAIL_CONFIG);
  const [options, setOptions] = useState<RecipientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, opts] = await Promise.all([
        emailService.getConfig(),
        emailService.listRecipientOptions(),
      ]);
      setConfig(cfg);
      setOptions(opts);
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la configuración de correo.' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  /** Returns the configured recipient entry for an option, if it exists. */
  const recipientFor = (optionId: string): EmailRecipient | undefined =>
    config.recipients.find((r) => r.id === optionId);

  /** Toggles whether an option receives a given event, creating/removing the recipient entry as needed. */
  const toggleRecipientEvent = (option: RecipientOption, event: EmailEvent) => {
    setConfig((prev) => {
      const existing = prev.recipients.find((r) => r.id === option.id);
      let recipients: EmailRecipient[];
      if (existing) {
        const updated: EmailRecipient = {
          ...existing,
          email: option.email,
          name: option.name,
          type: option.type,
          events: { ...existing.events, [event]: !existing.events[event] },
        };
        // Drop the recipient entirely if it no longer receives any event.
        if (!updated.events.created && !updated.events.statusChanged) {
          recipients = prev.recipients.filter((r) => r.id !== option.id);
        } else {
          recipients = prev.recipients.map((r) => (r.id === option.id ? updated : r));
        }
      } else {
        recipients = [
          ...prev.recipients,
          {
            id: option.id,
            email: option.email,
            name: option.name,
            type: option.type,
            events: { created: event === 'created', statusChanged: event === 'statusChanged' },
          },
        ];
      }
      return { ...prev, recipients };
    });
  };

  const setNotifyAssignedGestores = (value: boolean) =>
    setConfig((prev) => ({ ...prev, notifyAssignedGestores: value }));

  const setTemplate = (event: EmailEvent, field: 'subject' | 'body', value: string) =>
    setConfig((prev) => ({
      ...prev,
      templates: { ...prev.templates, [event]: { ...prev.templates[event], [field]: value } },
    }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await emailService.saveConfig(config);
      setConfig(saved);
      showToast({ type: 'success', title: 'Configuración guardada', message: 'La configuración de correo se actualizó correctamente.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar la configuración.';
      showToast({ type: 'error', title: 'Error al guardar', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return {
    config, setConfig, options, loading, saving,
    recipientFor, toggleRecipientEvent, setNotifyAssignedGestores, setTemplate,
    save, reload: load,
  };
}
