'use client';

import { Table, Group, Text, Badge, ActionIcon, Tooltip, Popover, Checkbox, Stack, Button } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { SystemFieldConfig, BotSettings, ComplianceLevel, Ticket } from '@/types';
import { SortIcon } from './SortIcon';
import {
  ALL_STATUSES, STATUS_LABELS,
  COMPLIANCE_COLORS, COMPLIANCE_LABELS, getComplianceLevel,
} from '../../_constants';

interface HeaderProps {
  sysField: SystemFieldConfig;
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  filterEstados: string[];
  setFilterEstados: (v: string[]) => void;
  filterAlerta: ComplianceLevel[];
  setFilterAlerta: (v: ComplianceLevel[]) => void;
  dateFilterActive: boolean;
  onOpenDateFilter: () => void;
  withPageReset: <T,>(fn: (v: T) => void) => (v: T) => void;
}

export function renderSystemHeader(p: HeaderProps) {
  const { sysField: sf, sortCol, sortDir, onSort } = p;
  switch (sf.key) {
    case 'ticketNumber':
      return (
        <Table.Th key={sf.key}>
          <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => onSort('ticketNumber')}>
            <Text size="sm" fw={600}>Ticket #</Text>
            <SortIcon sortCol={sortCol} sortDir={sortDir} col="ticketNumber" />
          </Group>
        </Table.Th>
      );
    case 'createdAt':
      return (
        <Table.Th key={sf.key}>
          <Group gap={4} wrap="nowrap">
            <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => onSort('createdAt')}>
              <Text size="sm" fw={600}>Creación</Text>
              <SortIcon sortCol={sortCol} sortDir={sortDir} col="createdAt" />
            </Group>
            <Tooltip label={p.dateFilterActive ? 'Filtro activo' : 'Filtrar por fecha'} withArrow>
              <ActionIcon size="xs" variant="subtle" color={p.dateFilterActive ? 'blue' : 'gray'} onClick={p.onOpenDateFilter}>
                <IconFilter size={13} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Th>
      );
    case 'estado':
      return (
        <Table.Th key={sf.key}>
          <Group gap={4} wrap="nowrap">
            <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => onSort('estado')}>
              <Text size="sm" fw={600}>Estado</Text>
              <SortIcon sortCol={sortCol} sortDir={sortDir} col="estado" />
            </Group>
            <Popover withArrow shadow="md" position="bottom-start" withinPortal>
              <Popover.Target>
                <ActionIcon size="xs" variant="subtle" color={p.filterEstados.length > 0 ? 'blue' : 'gray'}>
                  <IconFilter size={13} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="xs" fw={700} mb="xs">Estado</Text>
                <Checkbox.Group value={p.filterEstados} onChange={p.withPageReset(p.setFilterEstados)}>
                  <Stack gap={6}>
                    {ALL_STATUSES.map((s) => <Checkbox key={s} value={s} label={STATUS_LABELS[s] ?? s} size="xs" />)}
                  </Stack>
                </Checkbox.Group>
                {p.filterEstados.length > 0 && (
                  <Button size="xs" variant="subtle" color="red" mt="xs" onClick={() => p.setFilterEstados([])}>
                    Limpiar
                  </Button>
                )}
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Table.Th>
      );
    case 'alertaCumplimiento':
      return (
        <Table.Th key={sf.key}>
          <Group gap={4} wrap="nowrap">
            <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => onSort('alertaCumplimiento')}>
              <Text size="sm" fw={600}>Alerta</Text>
              <SortIcon sortCol={sortCol} sortDir={sortDir} col="alertaCumplimiento" />
            </Group>
            <Popover withArrow shadow="md" position="bottom-start" withinPortal>
              <Popover.Target>
                <ActionIcon size="xs" variant="subtle" color={p.filterAlerta.length > 0 ? 'blue' : 'gray'}>
                  <IconFilter size={13} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="xs" fw={700} mb="xs">Alerta de cumplimiento</Text>
                <Checkbox.Group value={p.filterAlerta} onChange={(v) => p.setFilterAlerta(v as ComplianceLevel[])}>
                  <Stack gap={6}>
                    {(['A_TIEMPO', 'ATENCION_PRIORITARIA', 'FUERA_DE_TIEMPO'] as ComplianceLevel[]).map((level) => (
                      <Checkbox key={level} value={level} label={COMPLIANCE_LABELS[level]} size="xs" />
                    ))}
                  </Stack>
                </Checkbox.Group>
                {p.filterAlerta.length > 0 && (
                  <Button size="xs" variant="subtle" color="red" mt="xs" onClick={() => p.setFilterAlerta([])}>
                    Limpiar
                  </Button>
                )}
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Table.Th>
      );
    case 'reporter':
      return <Table.Th key={sf.key}><Text size="sm" fw={600}>Reportado Por</Text></Table.Th>;
    default:
      return null;
  }
}

interface CellProps {
  sysField: SystemFieldConfig;
  ticket: Ticket;
  configSettings: BotSettings;
  hostsMap: Map<string, string>;
}

export function renderSystemCell({ sysField: sf, ticket, configSettings, hostsMap }: CellProps) {
  switch (sf.key) {
    case 'ticketNumber':
      return <Table.Td key={sf.key} fw={500}>{ticket.ticketNumber}</Table.Td>;
    case 'createdAt':
      return (
        <Table.Td key={sf.key}>
          {ticket.timestamps?.createdAt
            ? new Date(ticket.timestamps.createdAt).toLocaleDateString('es-CO')
            : 'Fecha N/A'}
        </Table.Td>
      );
    case 'estado':
      return (
        <Table.Td key={sf.key}>
          <Text size="sm" fw={500}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </Text>
        </Table.Td>
      );
    case 'alertaCumplimiento': {
      const level = getComplianceLevel(ticket.timestamps?.createdAt, configSettings);
      return (
        <Table.Td key={sf.key}>
          <Badge size="sm" color={COMPLIANCE_COLORS[level]}>{COMPLIANCE_LABELS[level]}</Badge>
        </Table.Td>
      );
    }
    case 'reporter':
      return (
        <Table.Td key={sf.key}>
          {hostsMap.get(ticket.reporter?.phone) || ticket.reporter?.name || ticket.reporter?.phone}
        </Table.Td>
      );
    default:
      return null;
  }
}
