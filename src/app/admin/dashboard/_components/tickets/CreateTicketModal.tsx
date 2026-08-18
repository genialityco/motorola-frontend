'use client';

import { useMemo, useState } from 'react';
import {
  Modal, Stack, Group, Text, Button, TextInput, Textarea, Select, Alert, Divider,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { BotField } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

interface Props {
  opened: boolean;
  onClose: () => void;
  configFields: BotField[];
}

/** Etiqueta que se usa para el campo "OTRO" de las listas con texto libre. */
const OTHER_OPTION = 'OTRO';

/**
 * Alta manual de un ticket desde el panel (solo administradores). Pide
 * únicamente los campos obligatorios: el resto se completa después desde el
 * detalle del ticket, igual que con los tickets que llegan por WhatsApp.
 */
export function CreateTicketModal({ opened, onClose, configFields }: Props) {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [otherDrafts, setOtherDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo obligatorios y capturables por formulario: las fotos y los vídeos se
  // suben desde el detalle, y los campos `auto` los genera el sistema.
  const fields = useMemo(
    () => configFields
      .filter((f) => f.required && f.source !== 'auto' && f.type !== 'photo' && f.type !== 'video')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [configFields],
  );

  const reporterEmail = user?.email ?? '';

  const resolveValue = (field: BotField) => {
    const raw = values[field.key] ?? '';
    if (field.type === 'list' && field.allowOther && raw === OTHER_OPTION) {
      return (otherDrafts[field.key] ?? '').trim();
    }
    return raw.trim();
  };

  const missing = fields.filter((f) => !resolveValue(f));

  const reset = () => {
    setValues({});
    setOtherDrafts({});
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (missing.length > 0) {
      setError(`Faltan campos obligatorios: ${missing.map((f) => f.label || f.key).join(', ')}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const extraFields: Record<string, string> = {};
      fields.forEach((f) => { extraFields[f.key] = resolveValue(f); });

      const { ticketNumber } = await ticketsService.createTicket({ extraFields });
      showToast({
        type: 'success',
        title: 'Ticket creado',
        message: `El ticket ${ticketNumber} quedó registrado a tu nombre. Completa el resto de la información desde su detalle.`,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el ticket.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: BotField) => {
    const label = field.label || field.key;
    const placeholder = field.placeholder || field.question || `Completa ${label}`;
    const value = values[field.key] ?? '';
    const set = (val: string) => setValues((prev) => ({ ...prev, [field.key]: val }));

    if (field.type === 'list' && field.options && field.options.length > 0) {
      const data = field.options.map((opt) => ({ value: opt, label: opt }));
      if (field.allowOther) {
        data.push({ value: OTHER_OPTION, label: field.otherLabel || 'Otro (escribir)' });
      }
      return (
        <Stack gap={6} key={field.key}>
          <Select
            label={label}
            withAsterisk
            value={value || null}
            onChange={(val) => set(val || '')}
            data={data}
            placeholder={placeholder}
            allowDeselect
          />
          {field.allowOther && value === OTHER_OPTION && (
            <TextInput
              placeholder={`Escribe el valor de ${label}`}
              value={otherDrafts[field.key] ?? ''}
              onChange={(e) => setOtherDrafts((prev) => ({ ...prev, [field.key]: e.currentTarget.value }))}
            />
          )}
        </Stack>
      );
    }

    if (field.type === 'boolean') {
      return (
        <Select
          key={field.key}
          label={label}
          withAsterisk
          value={value || null}
          onChange={(val) => set(val || '')}
          data={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
          placeholder={placeholder}
          allowDeselect
        />
      );
    }

    if (field.type === 'numeric' || field.type === 'date') {
      return (
        <TextInput
          key={field.key}
          label={label}
          withAsterisk
          type={field.type === 'numeric' ? 'number' : 'date'}
          value={value}
          onChange={(e) => set(e.currentTarget.value)}
          placeholder={placeholder}
        />
      );
    }

    return (
      <Textarea
        key={field.key}
        label={label}
        withAsterisk
        value={value}
        onChange={(e) => set(e.currentTarget.value)}
        placeholder={placeholder}
        autosize
        minRows={2}
      />
    );
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Crear ticket" size="lg" centered>
      <Stack gap="md">
        <Alert color="blue" icon={<IconInfoCircle size={16} />}>
          <Text size="sm">
            Este ticket se registra a tu nombre: quedará <b>reportado por {reporterEmail || 'tu usuario'}</b> y
            sus notificaciones se enviarán por correo, no por WhatsApp.
          </Text>
        </Alert>

        {fields.length === 0 ? (
          <Text size="sm" c="dimmed">
            No hay campos obligatorios configurados. El ticket se creará vacío y podrás completarlo desde su detalle.
          </Text>
        ) : (
          <Stack gap="sm">{fields.map(renderField)}</Stack>
        )}

        {error && <Alert color="red" title="No se pudo crear">{error}</Alert>}

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} disabled={missing.length > 0}>
            Crear ticket
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
