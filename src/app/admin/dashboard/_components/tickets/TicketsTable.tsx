'use client';

import { Table, Group, Text, Popover, ActionIcon, Checkbox, Stack, Button, Tooltip } from '@mantine/core';
import { IconFilter, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { BotField, BotSettings, SystemFieldConfig, Ticket } from '@/types';
import { getFieldValue } from '../../_utils';
import { SortIcon } from './SortIcon';
import { renderSystemHeader, renderSystemCell } from './SystemColumns';
import type { useTicketsFilter } from '../../_hooks/useTicketsFilter';

type FilterApi = ReturnType<typeof useTicketsFilter>;

// Columna de la tabla de tickets en orden unificado (sistema + personalizadas).
export type TicketColumn =
  | { kind: 'system'; key: string; order: number; sys: SystemFieldConfig }
  | { kind: 'custom'; key: string; order: number; field: BotField };

interface Props {
  filter: FilterApi;
  columns: TicketColumn[];
  uniqueFieldValues: Record<string, string[]>;
  configSettings: BotSettings;
  hostsMap: Map<string, string>;
  onOpenDateFilter: () => void;
  /** Solo admins en la pestaña de archivados/cancelados pueden eliminar. */
  onDelete?: (ticket: Ticket) => void;
}

export function TicketsTable({
  filter, columns, uniqueFieldValues, configSettings, hostsMap, onOpenDateFilter, onDelete,
}: Props) {
  const totalCols = columns.length + 1;
  const dateFilterActive = !!filter.filterFechaFrom || !!filter.filterFechaTo;

  const renderCustomHeader = (field: BotField) => (
    <Table.Th key={field.key}>
      <Group gap={4} wrap="nowrap">
        <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => filter.handleSort(field.key)}>
          <Text size="sm" fw={600}>{field.label || field.key.charAt(0).toUpperCase() + field.key.slice(1)}</Text>
          <SortIcon sortCol={filter.sortCol} sortDir={filter.sortDir} col={field.key} />
        </Group>
        <Popover withArrow shadow="md" position="bottom-start" withinPortal>
          <Popover.Target>
            <ActionIcon size="xs" variant="subtle" color={(filter.filterFields[field.key]?.length || 0) > 0 ? 'blue' : 'gray'}>
              <IconFilter size={13} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="xs" fw={700} mb="xs">{field.label || field.key}</Text>
            {(uniqueFieldValues[field.key] || []).length === 0 ? (
              <Text size="xs" c="dimmed">Sin datos</Text>
            ) : (
              <Checkbox.Group
                value={filter.filterFields[field.key] || []}
                onChange={(vals) => filter.setFieldFilter(field.key, vals)}
              >
                <Stack gap={6}>
                  {(uniqueFieldValues[field.key] || []).map((v) => (
                    <Checkbox key={v} value={v} label={v} size="xs" />
                  ))}
                </Stack>
              </Checkbox.Group>
            )}
            {(filter.filterFields[field.key]?.length || 0) > 0 && (
              <Button size="xs" variant="subtle" color="red" mt="xs" onClick={() => filter.setFieldFilter(field.key, [])}>
                Limpiar
              </Button>
            )}
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Table.Th>
  );

  return (
    <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) =>
            col.kind === 'system'
              ? renderSystemHeader({
                  sysField: col.sys,
                  sortCol: filter.sortCol, sortDir: filter.sortDir, onSort: filter.handleSort,
                  filterEstados: filter.filterEstados, setFilterEstados: filter.setFilterEstados,
                  filterAlerta: filter.filterAlerta, setFilterAlerta: filter.setFilterAlerta,
                  dateFilterActive, onOpenDateFilter, withPageReset: filter.withPageReset,
                })
              : renderCustomHeader(col.field)
          )}
          <Table.Th><Text size="sm" fw={600}>Acciones</Text></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filter.paginated.map((ticket: Ticket) => (
          <Table.Tr key={ticket.id}>
            {columns.map((col) =>
              col.kind === 'system'
                ? renderSystemCell({ sysField: col.sys, ticket, configSettings, hostsMap })
                : (
                  <Table.Td key={col.key}>{getFieldValue(ticket, col.key) || '—'}</Table.Td>
                )
            )}
            <Table.Td>
              <Group gap="xs" wrap="nowrap">
                <Button component={Link} href={`/admin/dashboard/tickets/${ticket.id}`} size="xs" variant="light">
                  Ver Detalle
                </Button>
                {onDelete && (
                  <Tooltip label="Eliminar ticket" withArrow>
                    <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(ticket)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
        {filter.paginated.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={totalCols} ta="center" c="dimmed">
              No hay tickets para estos filtros.
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
