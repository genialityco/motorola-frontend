'use client';

import { Table, Stack, Text, Badge, Select, Switch, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { BotField, FieldType, FieldSource } from '@/types';
import { TYPE_LABELS, TYPE_COLORS } from '../../../_constants';

interface Props {
  configFields: BotField[];
  setConfigFields: React.Dispatch<React.SetStateAction<BotField[]>>;
  moveField: (idx: number, dir: 'up' | 'down') => void;
  openEditField: (idx: number) => void;
  deleteField: (idx: number) => void;
}

export function CustomFieldsTable({ configFields, setConfigFields, moveField, openEditField, deleteField }: Props) {
  const updateField = (idx: number, patch: Partial<BotField>) => {
    const updated = [...configFields];
    updated[idx] = { ...updated[idx], ...patch };
    setConfigFields(updated);
  };

  return (
    <Table withTableBorder withColumnBorders mb="lg" style={{ tableLayout: 'fixed' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Etiqueta</Table.Th>
          <Table.Th style={{ width: 110 }}>Tipo</Table.Th>
          <Table.Th style={{ width: 130 }}>Origen</Table.Th>
          <Table.Th style={{ width: 85 }}>Requerido</Table.Th>
          <Table.Th style={{ width: 90 }}>Normalizar</Table.Th>
          <Table.Th style={{ width: 90 }}>Visible</Table.Th>
          <Table.Th style={{ width: 70 }}>Excel</Table.Th>
          <Table.Th style={{ width: 70 }}>Orden</Table.Th>
          <Table.Th style={{ width: 60 }}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {configFields.map((field, idx) => (
          <Table.Tr key={field.key}>
            <Table.Td>
              <Stack gap={2}>
                <Text size="sm" fw={500}>{field.label}</Text>
                <Text size="xs" c="dimmed">
                  {field.source === 'admin'
                    ? `Placeholder: ${field.placeholder || field.question || 'Sin placeholder'}`
                    : `Pregunta: ${field.question || 'Sin pregunta'}`}
                </Text>
                {field.type === 'list' && field.options && field.options.length > 0 && (
                  <Text size="xs" c="dimmed">{field.options.join(', ')}</Text>
                )}
              </Stack>
            </Table.Td>
            <Table.Td>
              <Badge size="xs" color={TYPE_COLORS[field.type as FieldType] || 'gray'}>
                {TYPE_LABELS[field.type as FieldType] || field.type}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Select
                value={field.source ?? 'bot'}
                onChange={(val) => { if (val) updateField(idx, { source: val as FieldSource }); }}
                data={[{ value: 'bot', label: 'Chat (Bot)' }, { value: 'admin', label: 'Panel Admin' }]}
                size="xs"
                allowDeselect={false}
              />
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              <Switch size="xs" checked={field.required ?? false}
                onChange={(e) => updateField(idx, { required: e.currentTarget.checked })} />
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              <Switch size="xs" checked={field.normalize} disabled={field.type !== 'string'}
                onChange={(e) => updateField(idx, { normalize: e.currentTarget.checked })} />
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              <Switch size="xs" checked={field.visible ?? true}
                onChange={(e) => updateField(idx, { visible: e.currentTarget.checked })} />
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              <Switch size="xs" checked={field.excel ?? false}
                disabled={field.type === 'photo' || field.type === 'video'}
                onChange={(e) => updateField(idx, { excel: e.currentTarget.checked })} />
            </Table.Td>
            <Table.Td>
              <Group gap={2} wrap="nowrap">
                <Tooltip label="Subir" withArrow>
                  <ActionIcon size="xs" variant="subtle" onClick={() => moveField(idx, 'up')} disabled={idx === 0}>↑</ActionIcon>
                </Tooltip>
                <Tooltip label="Bajar" withArrow>
                  <ActionIcon size="xs" variant="subtle" onClick={() => moveField(idx, 'down')} disabled={idx === configFields.length - 1}>↓</ActionIcon>
                </Tooltip>
              </Group>
            </Table.Td>
            <Table.Td>
              <Group gap={4}>
                <Tooltip label="Editar" withArrow>
                  <ActionIcon size="xs" color="blue" variant="subtle" onClick={() => openEditField(idx)}>
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Eliminar campo" withArrow>
                  <ActionIcon size="xs" color="red" variant="subtle" onClick={() => deleteField(idx)}>✕</ActionIcon>
                </Tooltip>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
        {configFields.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={9} ta="center" c="dimmed" py="md">
              No hay campos configurables. Agrega uno con el botón de arriba.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
