'use client';

import { Stack, Group, Text, Tooltip, ActionIcon } from '@mantine/core';
import { BotField, Ticket } from '@/types';
import { PhotoFieldAccordion } from './PhotoFieldAccordion';
import { AdminFieldEditor } from './AdminFieldEditor';
import { getNestedFieldValue } from '../_constants';

interface Props {
  ticket: Ticket;
  configFields: BotField[];
  expandedFields: Record<string, boolean>;
  toggleField: (key: string) => void;
  deletingPhoto: { fieldKey: string; idx: number } | null;
  uploadingField: string | null;
  updatingFieldKey: string | null;
  onDeletePhoto: (fieldKey: string, idx: number) => void;
  onUploadPhotos: (fieldKey: string, files: File[]) => void;
  onUpdateExtraField: (fieldKey: string, value: string) => Promise<void>;
  onRequestImprovement: (fieldKey: string, fieldLabel: string) => void;
}

export function TicketFields({
  ticket, configFields,
  expandedFields, toggleField,
  deletingPhoto, uploadingField, updatingFieldKey,
  onDeletePhoto, onUploadPhotos, onUpdateExtraField, onRequestImprovement,
}: Props) {
  const extraFields = ticket.extraFields || {};
  const isTicketClosed = ticket.status === 'ARCHIVADO' || ticket.status === 'FINALIZADO';

  return (
    <Stack gap="md" mb="xl">
      {configFields.map((field) => {
        const isMediaField = field.type === 'photo' || field.type === 'video';
        const isAdminField = field.source === 'admin' && !isMediaField;
        const value = getNestedFieldValue(extraFields, field.key) as string | string[] | undefined;

        if (isMediaField) {
          return (
            <PhotoFieldAccordion
              key={field.key}
              field={field}
              photos={Array.isArray(value) ? value : []}
              mediaKind={field.type === 'video' ? 'video' : 'photo'}
              expanded={!!expandedFields[field.key]}
              onToggle={() => toggleField(field.key)}
              onDelete={onDeletePhoto}
              onUpload={onUploadPhotos}
              uploadingField={uploadingField}
              deletingPhoto={deletingPhoto}
            />
          );
        }

        if (isAdminField) {
          return (
            <AdminFieldEditor
              key={field.key}
              field={field}
              value={value}
              saving={updatingFieldKey === field.key}
              onSave={onUpdateExtraField}
            />
          );
        }

        const display = typeof value === 'string'
          ? (value === 'true' ? 'Sí' : value === 'false' ? 'No' : value)
          : '—';

        return (
          <Group key={field.key} justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap' }}>{field.label}:</Text>
              <Text style={{ wordBreak: 'break-word' }}>{display}</Text>
            </Group>
            <Tooltip
              label={isTicketClosed
                ? 'No se pueden enviar mensajes en tickets Archivados o Finalizados'
                : 'Solicitar actualización al usuario'}
              withArrow
            >
              <ActionIcon
                variant="filled" color="orange" size="sm"
                style={{ flexShrink: 0 }}
                disabled={isTicketClosed}
                onClick={() => !isTicketClosed && onRequestImprovement(field.key, field.label)}
              >✎</ActionIcon>
            </Tooltip>
          </Group>
        );
      })}

      {configFields.length === 0 && (
        <Text size="sm" c="dimmed">
          No hay campos configurados. Ve a Info Tickets → Campos ticket para agregar campos.
        </Text>
      )}
    </Stack>
  );
}
