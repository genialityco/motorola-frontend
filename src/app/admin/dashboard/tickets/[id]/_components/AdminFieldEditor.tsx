'use client';

import { useEffect, useState } from 'react';
import { Paper, Stack, Group, Text, Select, TextInput, Textarea, Button } from '@mantine/core';
import { BotField } from '@/types';
import { FECHA_FORMAT_LABEL, datetimeLocalToFecha, fechaToDatetimeLocal, isValidFecha } from '../../../_constants';

interface Props {
  field: BotField;
  value: string | string[] | undefined;
  onSave: (fieldKey: string, value: string) => Promise<void>;
  saving: boolean;
}

const normalize = (raw: string | string[] | undefined) => {
  if (Array.isArray(raw)) return raw.join(', ');
  return typeof raw === 'string' ? raw : '';
};

export function AdminFieldEditor({ field, value, onSave, saving }: Props) {
  const [draft, setDraft] = useState(normalize(value));

  useEffect(() => { setDraft(normalize(value)); }, [value, field.key]);

  const hasValue = normalize(value).trim().length > 0;
  const placeholder = field.placeholder || field.question || `Completa ${field.label}`;

  const handleSave = async () => {
    const next = draft.trim();
    if (!next) return;
    if (field.type === 'fecha' && !isValidFecha(next)) return;
    await onSave(field.key, next);
  };

  const renderInput = () => {
    if (field.type === 'list' && field.options && field.options.length > 0) {
      return (
        <Select
          value={draft || null}
          onChange={(val) => setDraft(val || '')}
          data={field.options.map((opt) => ({ value: opt, label: opt }))}
          placeholder={placeholder}
          allowDeselect
        />
      );
    }
    if (field.type === 'boolean') {
      return (
        <Select
          value={draft || null}
          onChange={(val) => setDraft(val || '')}
          data={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
          placeholder={placeholder}
          allowDeselect
        />
      );
    }
    if (field.type === 'fecha') {
      return (
        <TextInput
          type="datetime-local"
          value={fechaToDatetimeLocal(draft)}
          onChange={(e) => setDraft(datetimeLocalToFecha(e.currentTarget.value))}
          description={`Se guardará como ${FECHA_FORMAT_LABEL}`}
        />
      );
    }
    if (field.type === 'numeric' || field.type === 'date') {
      return (
        <TextInput
          type={field.type === 'numeric' ? 'number' : 'date'}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder={placeholder}
        />
      );
    }
    return (
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        placeholder={placeholder}
        autosize minRows={2}
      />
    );
  };

  const canSubmit = draft.trim().length > 0 && (field.type !== 'fecha' || isValidFecha(draft.trim()));

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text fw={700} size="sm">{field.label}</Text>
            <Text size="xs" c="dimmed">
              {hasValue ? 'Ya está lleno. Puedes actualizarlo.' : 'Aún está vacío. Completa el campo.'}
            </Text>
          </div>
        </Group>

        {renderInput()}

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {field.placeholder ? `Ejemplo: ${field.placeholder}` : 'Este campo es editable por el administrador.'}
          </Text>
          <Button size="xs" onClick={handleSave} loading={saving} disabled={!canSubmit}>
            {hasValue ? 'Actualizar campo' : 'Guardar campo'}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
