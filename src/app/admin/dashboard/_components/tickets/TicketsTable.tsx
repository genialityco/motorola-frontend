'use client';

import { Table, Group, Text, Popover, ActionIcon, Checkbox, Stack, Button } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import Link from 'next/link';
import { BotField, BotSettings, SystemFieldConfig, Ticket } from '@/types';
import { getFieldValue } from '../../_utils';
import { SortIcon } from './SortIcon';
import { renderSystemHeader, renderSystemCell } from './SystemColumns';
import type { useTicketsFilter } from '../../_hooks/useTicketsFilter';

type FilterApi = ReturnType<typeof useTicketsFilter>;

interface Props {
  filter: FilterApi;
  visibleSysFields: SystemFieldConfig[];
  visibleFields: BotField[];
  uniqueFieldValues: Record<string, string[]>;
  configSettings: BotSettings;
  hostsMap: Map<string, string>;
  onOpenDateFilter: () => void;
}

export function TicketsTable({
  filter, visibleSysFields, visibleFields, uniqueFieldValues, configSettings, hostsMap, onOpenDateFilter,
}: Props) {
  const totalCols = visibleSysFields.length + visibleFields.length + 1;
  const dateFilterActive = !!filter.filterFechaFrom || !!filter.filterFechaTo;

  return (
    <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
      <Table.Thead>
        <Table.Tr>
          {visibleSysFields.map((sf) =>
            renderSystemHeader({
              sysField: sf,
              sortCol: filter.sortCol, sortDir: filter.sortDir, onSort: filter.handleSort,
              filterEstados: filter.filterEstados, setFilterEstados: filter.setFilterEstados,
              filterAlerta: filter.filterAlerta, setFilterAlerta: filter.setFilterAlerta,
              dateFilterActive, onOpenDateFilter, withPageReset: filter.withPageReset,
            })
          )}
          {visibleFields.map((field) => (
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
          ))}
          <Table.Th><Text size="sm" fw={600}>Acciones</Text></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filter.paginated.map((ticket: Ticket) => (
          <Table.Tr key={ticket.id}>
            {visibleSysFields.map((sf) => renderSystemCell({ sysField: sf, ticket, configSettings, hostsMap }))}
            {visibleFields.map((field) => (
              <Table.Td key={field.key}>{getFieldValue(ticket, field.key) || '—'}</Table.Td>
            ))}
            <Table.Td>
              <Button component={Link} href={`/admin/dashboard/tickets/${ticket.id}`} size="xs" variant="light">
                Ver Detalle
              </Button>
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
