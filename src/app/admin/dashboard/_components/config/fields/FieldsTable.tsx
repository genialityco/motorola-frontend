'use client';

import { Table, Stack, Text, Badge, Select, Switch, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { BotField, FieldType, FieldSource } from '@/types';
import { MergedField } from '@/hooks/useBotConfig';
import { TYPE_LABELS, TYPE_COLORS } from '../../../_constants';

interface Props {
  mergedFields: MergedField[];
  moveMergedField: (key: string, dir: 'up' | 'down') => void;
  updateConfigField: (index: number, patch: Partial<BotField>) => void;
  openEditField: (idx: number) => void;
  deleteField: (idx: number) => void;
}

const DASH = <Text size="xs" c="dimmed" ta="center">—</Text>;

export function FieldsTable({
  mergedFields, moveMergedField, updateConfigField, openEditField, deleteField,
}: Props) {
  return (
    <Table withTableBorder withColumnBorders mb="lg" style={{ tableLayout: 'fixed' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Campo</Table.Th>
          <Table.Th style={{ width: 110 }}>Tipo</Table.Th>
          <Table.Th style={{ width: 130 }}>Origen</Table.Th>
          <Table.Th style={{ width: 85 }}>Requerido</Table.Th>
          <Table.Th style={{ width: 90 }}>Normalizar</Table.Th>
          <Table.Th style={{ width: 70 }}>Excel</Table.Th>
          <Table.Th style={{ width: 70 }}>Orden</Table.Th>
          <Table.Th style={{ width: 60 }}></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {mergedFields.map((row, idx) => {
          const orderControls = (
            <Group gap={2} wrap="nowrap" justify="center">
              <Tooltip label="Subir" withArrow>
                <ActionIcon size="xs" variant="subtle" onClick={() => moveMergedField(row.key, 'up')} disabled={idx === 0}>↑</ActionIcon>
              </Tooltip>
              <Tooltip label="Bajar" withArrow>
                <ActionIcon size="xs" variant="subtle" onClick={() => moveMergedField(row.key, 'down')} disabled={idx === mergedFields.length - 1}>↓</ActionIcon>
              </Tooltip>
            </Group>
          );

          if (row.kind === 'system') {
            const sf = row.system;
            return (
              <Table.Tr key={row.key}>
                <Table.Td>
                  <Stack gap={2}>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" fw={500}>{sf.label}</Text>
                      <Badge size="xs" variant="light" color="gray">Sistema</Badge>
                    </Group>
                    <Text size="xs" c="dimmed">Columna fija del sistema</Text>
                  </Stack>
                </Table.Td>
                <Table.Td>{DASH}</Table.Td>
                <Table.Td>{DASH}</Table.Td>
                <Table.Td>{DASH}</Table.Td>
                <Table.Td>{DASH}</Table.Td>
                <Table.Td>{DASH}</Table.Td>
                <Table.Td>{orderControls}</Table.Td>
                <Table.Td>{DASH}</Table.Td>
              </Table.Tr>
            );
          }

          const field = row.field;
          const index = row.index;
          return (
            <Table.Tr key={row.key}>
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
                  onChange={(val) => { if (val) updateConfigField(index, { source: val as FieldSource }); }}
                  data={[{ value: 'bot', label: 'Chat (Bot)' }, { value: 'admin', label: 'Panel Admin' }]}
                  size="xs"
                  allowDeselect={false}
                />
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Switch size="xs" checked={field.required ?? false}
                  onChange={(e) => updateConfigField(index, { required: e.currentTarget.checked })} />
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Switch size="xs" checked={field.normalize} disabled={field.type !== 'string'}
                  onChange={(e) => updateConfigField(index, { normalize: e.currentTarget.checked })} />
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Switch size="xs" checked={field.excel ?? false}
                  disabled={field.type === 'photo' || field.type === 'video'}
                  onChange={(e) => updateConfigField(index, { excel: e.currentTarget.checked })} />
              </Table.Td>
              <Table.Td>{orderControls}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <Tooltip label="Editar" withArrow>
                    <ActionIcon size="xs" color="blue" variant="subtle" onClick={() => openEditField(index)}>
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Eliminar campo" withArrow>
                    <ActionIcon size="xs" color="red" variant="subtle" onClick={() => deleteField(index)}>✕</ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
        {mergedFields.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={8} ta="center" c="dimmed" py="md">
              No hay campos configurados.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
