'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmailConfig, EmailEvent } from '@/types';
import { emailService } from '@/services/email.service';
import { useAppToast } from '@/components/toast-provider';

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await emailService.getConfig();
      setConfig(cfg);
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la configuración de correo.' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

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

  return { config, setConfig, loading, saving, setTemplate, save, reload: load };
}
