'use client';

import { useCallback, useMemo, useState } from 'react';
import { Group, Title, Button, Tabs, Badge, Select, Text, Pagination, Menu } from '@mantine/core';
import {
  IconChevronDown, IconFileImport, IconFileSpreadsheet, IconPlus, IconReportAnalytics,
} from '@tabler/icons-react';
import { Ticket, BotField, BotSettings, SystemFieldConfig, Host } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { useColumnPrefs } from '@/hooks/useColumnPrefs';
import { useTicketsFilter } from '../../_hooks/useTicketsFilter';
import { ACTIVE_TICKET_STATUSES } from '../../_constants';
import { exportTicketsToExcel, getFieldValue } from '../../_utils';
import { generateTicketsReport } from '../../_reportSummary';
import { TicketsTable, TicketColumn } from './TicketsTable';
import { ColumnsMenu, ColumnOption } from './ColumnsMenu';
import { CreateTicketModal } from './CreateTicketModal';
import { DateFilterModal } from './DateFilterModal';
import { DeleteTicketModal } from './DeleteTicketModal';
import { ImportTicketsModal } from '@/components/ImportTicketsModal';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

interface Props {
  isAdmin: boolean;
  tickets: Ticket[];
  hosts: Host[];
  configFields: BotField[];
  systemFields: SystemFieldConfig[];
  configSettings: BotSettings;
}

export function TicketsTab({
  isAdmin, tickets, hosts, configFields, systemFields, configSettings,
}: Props) {
  const filter = useTicketsFilter(tickets, configSettings);
  const { showToast } = useAppToast();
  const { user } = useAuth();
  const { columnOverrides, setColumnVisible, resetColumns } = useColumnPrefs(user?.uid);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // Eliminar es irreversible: solo admins y solo sobre archivados/cancelados.
  const canDelete = isAdmin && filter.ticketSubTab === 'archivados';

  const handleDelete = async (ticket: Ticket) => {
    try {
      const { filesDeleted } = await ticketsService.deleteTicket(ticket.id);
      const archivos = filesDeleted === 1 ? '1 archivo' : `${filesDeleted} archivos`;
      showToast({
        type: 'success',
        title: 'Ticket eliminado',
        message: `El ticket #${ticket.ticketNumber} y ${archivos} fueron eliminados definitivamente.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el ticket.';
      showToast({ type: 'error', title: 'Error', message: msg });
    }
  };

  // Todas las columnas posibles (sistema + personalizadas) en el orden unificado
  // configurado. La visibilidad por defecto viene de la configuración y cada
  // usuario la ajusta a su gusto desde el menú "Columnas".
  const allColumns = useMemo<TicketColumn[]>(() => {
    const sysCols = systemFields
      .map((sf) => ({ kind: 'system' as const, key: sf.key, order: sf.order ?? 0, sys: sf }));
    const customCols = configFields
      .map((f) => ({ kind: 'custom' as const, key: f.key, order: f.order ?? 0, field: f }));
    return [...sysCols, ...customCols].sort((a, b) => a.order - b.order);
  }, [systemFields, configFields]);

  const isColumnVisible = useCallback((col: TicketColumn) => {
    const override = columnOverrides[col.key];
    if (typeof override === 'boolean') return override;
    return col.kind === 'system' ? col.sys.visible !== false : col.field.visible !== false;
  }, [columnOverrides]);

  const columnOptions = useMemo<ColumnOption[]>(
    () => allColumns.map((col) => ({
      key: col.key,
      label: col.kind === 'system' ? col.sys.label : (col.field.label || col.field.key),
      visible: isColumnVisible(col),
    })),
    [allColumns, isColumnVisible],
  );

  // La alerta de cumplimiento solo tiene sentido sobre tickets activos.
  const columns = useMemo(
    () => allColumns.filter(
      (col) => isColumnVisible(col)
        && (col.key !== 'alertaCumplimiento' || filter.ticketSubTab === 'activos'),
    ),
    [allColumns, isColumnVisible, filter.ticketSubTab],
  );

  const hostsMap = useMemo(() => {
    const m = new Map<string, string>();
    hosts.forEach((h) => m.set(h.telefono, h.nombre));
    return m;
  }, [hosts]);

  const uniqueFieldValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const field of configFields) {
      map[field.key] = [...new Set(tickets.map((t) => getFieldValue(t, field.key)).filter(Boolean))].sort();
    }
    return map;
  }, [tickets, configFields]);

  const handleExport = () =>
    exportTicketsToExcel(tickets, configFields, configSettings, hostsMap);

  const handleReport = () => generateTicketsReport({
    tickets: filter.sorted,
    configFields,
    configSettings,
    hostsMap,
    filters: {
      subTab: filter.ticketSubTab,
      fieldFilters: filter.filterFields,
      estados: filter.filterEstados,
      alerta: filter.filterAlerta,
      fechaFrom: filter.filterFechaFrom,
      fechaTo: filter.filterFechaTo,
    },
  });

  return (
    <>
      <Title order={2} mb="sm">Gestor de Tickets</Title>

      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap">
          {isAdmin && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              leftSection={<IconPlus size={16} />}
              color="blue"
            >
              Crear Ticket
            </Button>
          )}

          <Menu shadow="md" width={210} position="bottom-start" withinPortal>
            <Menu.Target>
              <Button variant="light" color="gray" px={10} aria-label="Importar o exportar">
                <IconChevronDown size={16} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Acciones</Menu.Label>
              {isAdmin && (
                <Menu.Item
                  leftSection={<IconFileImport size={15} />}
                  onClick={() => setImportModalOpen(true)}
                >
                  Importar Tickets
                </Menu.Item>
              )}
              <Menu.Item leftSection={<IconFileSpreadsheet size={15} />} onClick={handleExport}>
                Exportar Tickets
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Button
          onClick={handleReport}
          leftSection={<IconReportAnalytics size={16} />}
          variant="light"
          color="grape"
        >
          Generar Informe
        </Button>
      </Group>

      <Group justify="space-between" align="flex-end" mb="lg" wrap="wrap" gap="sm">
        <Tabs value={filter.ticketSubTab} onChange={(v) => { filter.setTicketSubTab(v); filter.setPage(1); }}>
          <Tabs.List>
            <Tabs.Tab value="activos">
              Tickets
              <Badge size="xs" ml={6} color="blue" variant="light">
                {tickets.filter((t) => ACTIVE_TICKET_STATUSES.has(t.status)).length}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="archivados">
              Archivados y cancelados
              <Badge size="xs" ml={6} color="gray" variant="light">
                {tickets.filter((t) => ['ARCHIVADO', 'CANCELADO'].includes(t.status)).length}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="finalizados">
              Finalizados
              <Badge size="xs" ml={6} color="green" variant="light">
                {tickets.filter((t) => t.status === 'FINALIZADO').length}
              </Badge>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <ColumnsMenu
          options={columnOptions}
          onToggle={setColumnVisible}
          onReset={resetColumns}
        />
      </Group>

      <TicketsTable
        filter={filter}
        columns={columns}
        uniqueFieldValues={uniqueFieldValues}
        configSettings={configSettings}
        hostsMap={hostsMap}
        onOpenDateFilter={() => setDateModalOpen(true)}
        onDelete={canDelete ? setDeletingTicket : undefined}
      />

      <Group justify="space-between" mt="lg" align="center" wrap="wrap" gap="sm">
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed">
            {filter.sorted.length === 0
              ? 'Sin tickets'
              : `Mostrando ${filter.startIdx}–${filter.endIdx} de ${filter.sorted.length} ticket${filter.sorted.length !== 1 ? 's' : ''}`}
          </Text>
          <Select
            value={filter.pageSize}
            onChange={(val) => { if (val) { filter.setPageSize(val); filter.setPage(1); } }}
            data={['5', '10', '20', '50']}
            size="xs"
            w={72}
            allowDeselect={false}
          />
          <Text size="sm" c="dimmed">por página</Text>
        </Group>
        <Pagination total={filter.totalPages} value={filter.page} onChange={filter.setPage} size="sm" />
      </Group>

      <DateFilterModal
        opened={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        from={filter.filterFechaFrom}
        to={filter.filterFechaTo}
        onFromChange={filter.setFilterFechaFrom}
        onToChange={filter.setFilterFechaTo}
        onClear={() => { filter.setFilterFechaFrom(''); filter.setFilterFechaTo(''); filter.setPage(1); }}
        onApply={() => { filter.setPage(1); setDateModalOpen(false); }}
      />

      <DeleteTicketModal
        ticket={deletingTicket}
        onClose={() => setDeletingTicket(null)}
        onConfirm={handleDelete}
      />

      <ImportTicketsModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        configFields={configFields}
      />

      <CreateTicketModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        configFields={configFields}
      />
    </>
  );
}
