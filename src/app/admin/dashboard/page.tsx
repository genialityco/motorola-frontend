"use client";

import { useMemo, useState } from 'react';
import { Ticket, BotField, FieldType, FieldSource, SystemFieldConfig } from '@/types';
import {
  Table, Badge, Group, Title, Paper, Button,
  Popover, Checkbox, Text, Stack, Select,
  Modal, TextInput, ActionIcon, Tooltip, Pagination, Tabs,
  Textarea, Switch, Divider,
} from '@mantine/core';
import {
  IconArrowUp, IconArrowDown, IconArrowsSort, IconFilter, IconEdit, IconTrash,
} from '@tabler/icons-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useTickets } from '@/hooks/useTickets';
import { useBotConfig } from '@/hooks/useBotConfig';
import { useHosts } from '@/hooks/useHosts';

// ── Display constants ──────────────────────────────────────────────────────────
type SortCol = string;
type SortDir = 'asc' | 'desc';

const TYPE_LABELS: Record<FieldType, string> = {
  string: 'Texto',
  numeric: 'Número',
  date: 'Fecha',
  photo: 'Foto(s)/Video(s)',
  video: 'Video(s)',
  boolean: 'Booleano',
  list: 'Lista',
};
const TYPE_COLORS: Record<FieldType, string> = {
  string: 'blue',
  numeric: 'orange',
  date: 'violet',
  photo: 'pink',
  video: 'grape',
  boolean: 'cyan',
  list: 'lime',
};
const SOURCE_LABELS: Record<string, string> = { bot: 'Chat (Bot)', admin: 'Panel Admin', auto: 'Automático' };
const SOURCE_COLORS: Record<string, string> = { bot: 'teal', admin: 'indigo', auto: 'gray' };
const MESSAGE_META = [
  { key: 'menu' as const, label: 'Menú principal del bot' },
  { key: 'ticketCreated' as const, label: 'Ticket creado exitosamente', hint: '{ticketNumber}' },
  { key: 'statusChanged' as const, label: 'Cambio de estado', hint: '{ticketNumber}, {prevStatus}, {newStatus}' },
  { key: 'reparadoMessage' as const, label: 'Ticket reparado (con fotos de reparación)', hint: '{ticketNumber}, {description}' },
  { key: 'noTickets' as const, label: 'Sin tickets registrados' },
  { key: 'invalidField' as const, label: 'Campo inválido (respuesta vacía)' },
  { key: 'cancelled' as const, label: 'Operación cancelada' },
  { key: 'goodbye' as const, label: 'Despedida' },
  { key: 'viewTicketOptions' as const, label: 'Opciones de ver ticket' },
];
const STATUS_COLORS: Record<string, string> = {
  REPORTADO: 'red', REVISION: 'blue', EN_REPARACION: 'yellow',
  REPARADO: 'teal', ENTREGADO: 'green', FINALIZADO: 'green', ARCHIVADO: 'gray',
};
const ALL_STATUSES = ['REPORTADO', 'REVISION', 'EN_REPARACION', 'REPARADO', 'ENTREGADO'];
const ACTIVE_TICKET_STATUSES = new Set(['REPORTADO', 'REVISION', 'EN_REPARACION', 'REPARADO', 'ENTREGADO']);

// ── Utility ────────────────────────────────────────────────────────────────────
function getFieldValue(ticket: Ticket, key: string): string {
  if (ticket.extraFields?.[key]) return String(ticket.extraFields[key]);
  const parts = key.split('.');
  let val: unknown = ticket;
  for (const part of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[part];
    else return '';
  }
  return typeof val === 'string' ? val : '';
}

export default function DashboardPage() {
  // ── Data hooks ───────────────────────────────────────────────────────────────
  const { tickets } = useTickets();
  const {
    configMessages, setConfigMessages,
    configFields, setConfigFields,
    systemFields, setSystemFields,
    savingMessages, savingFields,
    infoTab, setInfoTab,
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    newFieldOptions,
    newFieldOptionInput, setNewFieldOptionInput,
    editFieldOpen,
    editingFieldIdx,
    editFieldLabel, setEditFieldLabel,
    editFieldQuestion, setEditFieldQuestion,
    saveMessages, saveFields,
    moveField, deleteField,
    openEditField, saveEditField, cancelEditField,
    addField, addListOption, removeListOption,
  } = useBotConfig();
  const {
    hosts,
    selectedHost,
    hostTicketsModalOpen, setHostTicketsModalOpen,
    editHostModalOpen, setEditHostModalOpen,
    editingHost,
    editNombre, setEditNombre,
    savingHost,
    openHostTickets,
    openEditHost,
    saveHostNombre,
  } = useHosts();

  // ── Local UI state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string | null>('tickets');
  const [ticketSubTab, setTicketSubTab] = useState<string | null>('activos');
  const [sortCol, setSortCol] = useState<SortCol>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterFields, setFilterFieldsState] = useState<Record<string, string[]>>({});
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterFechaFrom, setFilterFechaFrom] = useState('');
  const [filterFechaTo, setFilterFechaTo] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');

  // ── Computed ─────────────────────────────────────────────────────────────────
  const hostsMap = useMemo(() => {
    const m = new Map<string, string>();
    hosts.forEach((h) => m.set(h.telefono, h.nombre));
    return m;
  }, [hosts]);

  // Map system fields for easy visibility lookup
  const sysFieldMap = useMemo(() => {
    const m: Record<string, SystemFieldConfig> = {};
    systemFields.forEach((f) => { m[f.key] = f; });
    return m;
  }, [systemFields]);

  const visibleFields = useMemo(
    () => configFields.filter((f) => f.visible !== false),
    [configFields],
  );

  const uniqueFieldValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const field of configFields) {
      map[field.key] = [...new Set(tickets.map((t) => getFieldValue(t, field.key)).filter(Boolean))].sort();
    }
    return map;
  }, [tickets, configFields]);

  const withPageReset = (fn: (v: string[]) => void) => (v: string[]) => { fn(v); setPage(1); };

  const setFieldFilter = (key: string, vals: string[]) => {
    setFilterFieldsState((prev) => ({ ...prev, [key]: vals }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketSubTab === 'activos' && !ACTIVE_TICKET_STATUSES.has(t.status)) return false;
      if (ticketSubTab === 'archivados' && t.status !== 'ARCHIVADO') return false;
      if (ticketSubTab === 'finalizados' && t.status !== 'FINALIZADO') return false;
      for (const [key, vals] of Object.entries(filterFields)) {
        if (vals.length && !vals.includes(getFieldValue(t, key))) return false;
      }
      if (filterEstados.length && !filterEstados.includes(t.status)) return false;
      if (filterFechaFrom) {
        const from = new Date(filterFechaFrom).getTime();
        if ((t.timestamps?.createdAt || 0) < from) return false;
      }
      if (filterFechaTo) {
        const to = new Date(filterFechaTo + 'T23:59:59').getTime();
        if ((t.timestamps?.createdAt || 0) > to) return false;
      }
      return true;
    });
  }, [tickets, ticketSubTab, filterFields, filterEstados, filterFechaFrom, filterFechaTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      if (sortCol === 'ticketNumber') { aVal = a.ticketNumber ?? 0; bVal = b.ticketNumber ?? 0; }
      else if (sortCol === 'createdAt') { aVal = a.timestamps?.createdAt ?? 0; bVal = b.timestamps?.createdAt ?? 0; }
      else if (sortCol === 'estado') { aVal = a.status ?? ''; bVal = b.status ?? ''; }
      else { aVal = getFieldValue(a, sortCol); bVal = getFieldValue(b, sortCol); }

      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const pageSizeNum = parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSizeNum));
  const paginated = sorted.slice((page - 1) * pageSizeNum, page * pageSizeNum);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const getHostTickets = (telefono: string) => tickets.filter((t) => t.reporter?.phone === telefono);

  const exportToExcel = () => {
    const data = tickets.map((t) => {
      const row: Record<string, unknown> = { 'Ticket #': t.ticketNumber, 'Estado': t.status };
      configFields.filter((f) => f.excel === true).forEach((f) => { row[f.label || f.key] = getFieldValue(t, f.key) || ''; });
      Object.assign(row, {
        'Reportado Por': hostsMap.get(t.reporter?.phone) || t.reporter?.name || '',
        'Teléfono Reportante': t.reporter?.phone || '',
        'Fecha Creación': t.timestamps?.createdAt ? new Date(t.timestamps.createdAt).toLocaleString('es-CO') : '',
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    XLSX.writeFile(wb, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const dateFilterActive = !!filterFechaFrom || !!filterFechaTo;
  const startIdx = sorted.length === 0 ? 0 : (page - 1) * pageSizeNum + 1;
  const endIdx = Math.min(page * pageSizeNum, sorted.length);

  // Count visible columns for colSpan
  const visibleSysCols = systemFields.filter((f) => f.visible).length;
  const totalCols = visibleSysCols + visibleFields.length + 1; // +1 for Acciones

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <IconArrowsSort size={13} opacity={0.35} />;
    return sortDir === 'asc' ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />;
  }

  return (
    <Paper p="md" shadow="sm" radius="md" withBorder>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="tickets">Tickets</Tabs.Tab>
          <Tabs.Tab value="hosts">Hosts</Tabs.Tab>
          <Tabs.Tab value="config">Info Tickets</Tabs.Tab>
        </Tabs.List>

        {/* ── TAB TICKETS ─────────────────────────────────────────────────── */}
        <Tabs.Panel value="tickets">
          <Group justify="space-between" mb="md">
            <Title order={2}>Gestor de Tickets</Title>
            <Button onClick={exportToExcel} variant="light" color="green">
              Exportar a Excel
            </Button>
          </Group>

          <Tabs value={ticketSubTab} onChange={(v) => { setTicketSubTab(v); setPage(1); }} mb="lg">
            <Tabs.List>
              <Tabs.Tab value="activos">
                Tickets
                <Badge size="xs" ml={6} color="blue" variant="light">
                  {tickets.filter((t) => ACTIVE_TICKET_STATUSES.has(t.status)).length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="archivados">
                Archivados
                <Badge size="xs" ml={6} color="gray" variant="light">
                  {tickets.filter((t) => t.status === 'ARCHIVADO').length}
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

          <Table striped highlightOnHover style={{ tableLayout: 'auto' }}>
            <Table.Thead>
              <Table.Tr>
                {sysFieldMap.ticketNumber?.visible !== false && (
                  <Table.Th>
                    <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('ticketNumber')}>
                      <Text size="sm" fw={600}>Ticket #</Text>
                      <SortIcon col="ticketNumber" />
                    </Group>
                  </Table.Th>
                )}
                {sysFieldMap.createdAt?.visible !== false && (
                  <Table.Th>
                    <Group gap={4} wrap="nowrap">
                      <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                        <Text size="sm" fw={600}>Creación</Text>
                        <SortIcon col="createdAt" />
                      </Group>
                      <Tooltip label={dateFilterActive ? 'Filtro activo' : 'Filtrar por fecha'} withArrow>
                        <ActionIcon size="xs" variant="subtle" color={dateFilterActive ? 'blue' : 'gray'} onClick={() => setDateModalOpen(true)}>
                          <IconFilter size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Th>
                )}
                {sysFieldMap.estado?.visible !== false && (
                  <Table.Th>
                    <Group gap={4} wrap="nowrap">
                      <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('estado')}>
                        <Text size="sm" fw={600}>Estado</Text>
                        <SortIcon col="estado" />
                      </Group>
                      <Popover withArrow shadow="md" position="bottom-start" withinPortal>
                        <Popover.Target>
                          <ActionIcon size="xs" variant="subtle" color={filterEstados.length > 0 ? 'blue' : 'gray'}>
                            <IconFilter size={13} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Text size="xs" fw={700} mb="xs">Estado</Text>
                          <Checkbox.Group value={filterEstados} onChange={withPageReset(setFilterEstados)}>
                            <Stack gap={6}>
                              {ALL_STATUSES.map((s) => <Checkbox key={s} value={s} label={s} size="xs" />)}
                            </Stack>
                          </Checkbox.Group>
                          {filterEstados.length > 0 && (
                            <Button size="xs" variant="subtle" color="red" mt="xs" onClick={() => { setFilterEstados([]); setPage(1); }}>
                              Limpiar
                            </Button>
                          )}
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Table.Th>
                )}
                {visibleFields.map((field) => (
                  <Table.Th key={field.key}>
                    <Group gap={4} wrap="nowrap">
                      <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort(field.key)}>
                        <Text size="sm" fw={600}>{field.label || field.key.charAt(0).toUpperCase() + field.key.slice(1)}</Text>
                        <SortIcon col={field.key} />
                      </Group>
                      <Popover withArrow shadow="md" position="bottom-start" withinPortal>
                        <Popover.Target>
                          <ActionIcon size="xs" variant="subtle" color={(filterFields[field.key]?.length || 0) > 0 ? 'blue' : 'gray'}>
                            <IconFilter size={13} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Text size="xs" fw={700} mb="xs">{field.label || field.key.charAt(0).toUpperCase() + field.key.slice(1)}</Text>
                          {(uniqueFieldValues[field.key] || []).length === 0
                            ? <Text size="xs" c="dimmed">Sin datos</Text>
                            : <Checkbox.Group value={filterFields[field.key] || []} onChange={(vals) => setFieldFilter(field.key, vals)}>
                                <Stack gap={6}>
                                  {(uniqueFieldValues[field.key] || []).map((v) => <Checkbox key={v} value={v} label={v} size="xs" />)}
                                </Stack>
                              </Checkbox.Group>
                          }
                          {(filterFields[field.key]?.length || 0) > 0 && (
                            <Button size="xs" variant="subtle" color="red" mt="xs" onClick={() => setFieldFilter(field.key, [])}>
                              Limpiar
                            </Button>
                          )}
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Table.Th>
                ))}
                {sysFieldMap.reporter?.visible !== false && (
                  <Table.Th><Text size="sm" fw={600}>Reportado Por</Text></Table.Th>
                )}
                <Table.Th><Text size="sm" fw={600}>Acciones</Text></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginated.map((ticket) => (
                <Table.Tr key={ticket.id}>
                  {sysFieldMap.ticketNumber?.visible !== false && (
                    <Table.Td fw={500}>{ticket.ticketNumber}</Table.Td>
                  )}
                  {sysFieldMap.createdAt?.visible !== false && (
                    <Table.Td>
                      {ticket.timestamps?.createdAt
                        ? new Date(ticket.timestamps.createdAt).toLocaleDateString('es-CO')
                        : 'Fecha N/A'}
                    </Table.Td>
                  )}
                  {sysFieldMap.estado?.visible !== false && (
                    <Table.Td>
                      <Badge size="sm" color={STATUS_COLORS[ticket.status] || 'gray'}>{ticket.status}</Badge>
                    </Table.Td>
                  )}
                  {visibleFields.map((field) => (
                    <Table.Td key={field.key}>{getFieldValue(ticket, field.key) || '—'}</Table.Td>
                  ))}
                  {sysFieldMap.reporter?.visible !== false && (
                    <Table.Td>
                      {hostsMap.get(ticket.reporter?.phone) || ticket.reporter?.name || ticket.reporter?.phone}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Button component={Link} href={`/admin/dashboard/tickets/${ticket.id}`} size="xs" variant="light">
                      Ver Detalle
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {paginated.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={totalCols} ta="center" c="dimmed">
                    No hay tickets para estos filtros.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group justify="space-between" mt="lg" align="center" wrap="wrap" gap="sm">
            <Group gap="xs" align="center">
              <Text size="sm" c="dimmed">
                {sorted.length === 0
                  ? 'Sin tickets'
                  : `Mostrando ${startIdx}–${endIdx} de ${sorted.length} ticket${sorted.length !== 1 ? 's' : ''}`}
              </Text>
              <Select
                value={pageSize}
                onChange={(val) => { if (val) { setPageSize(val); setPage(1); } }}
                data={['5', '10', '20', '50']}
                size="xs"
                w={72}
                allowDeselect={false}
              />
              <Text size="sm" c="dimmed">por página</Text>
            </Group>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>

          <Modal opened={dateModalOpen} onClose={() => setDateModalOpen(false)} title="Filtrar por Fecha de Creación" size="sm" centered>
            <Stack>
              <TextInput label="Desde" type="date" value={filterFechaFrom} onChange={(e) => setFilterFechaFrom(e.target.value)} />
              <TextInput label="Hasta" type="date" value={filterFechaTo} onChange={(e) => setFilterFechaTo(e.target.value)} />
              <Group justify="space-between" mt="xs">
                <Button variant="subtle" color="red" size="sm" disabled={!filterFechaFrom && !filterFechaTo}
                  onClick={() => { setFilterFechaFrom(''); setFilterFechaTo(''); setPage(1); }}>
                  Limpiar fechas
                </Button>
                <Button size="sm" onClick={() => { setPage(1); setDateModalOpen(false); }}>Aplicar</Button>
              </Group>
            </Stack>
          </Modal>
        </Tabs.Panel>

        {/* ── TAB HOSTS ───────────────────────────────────────────────────── */}
        <Tabs.Panel value="hosts">
          <Title order={2} mb="xl">Hosts</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th><Text size="sm" fw={600}>Nombre</Text></Table.Th>
                <Table.Th><Text size="sm" fw={600}>Teléfono</Text></Table.Th>
                <Table.Th><Text size="sm" fw={600}>Total Tickets</Text></Table.Th>
                <Table.Th><Text size="sm" fw={600}>Registrado</Text></Table.Th>
                <Table.Th><Text size="sm" fw={600}>Acciones</Text></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hosts.map((host) => {
                const hostTickets = getHostTickets(host.telefono);
                return (
                  <Table.Tr key={host.id}>
                    <Table.Td fw={500}>{host.nombre}</Table.Td>
                    <Table.Td>{host.telefono}</Table.Td>
                    <Table.Td>{hostTickets.length}</Table.Td>
                    <Table.Td>{host.creadoEn ? new Date(host.creadoEn).toLocaleDateString('es-CO') : '—'}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => openHostTickets(host)} disabled={hostTickets.length === 0}>
                          Ver Tickets ({hostTickets.length})
                        </Button>
                        <Tooltip label="Editar nombre" withArrow>
                          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => openEditHost(host)}>
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {hosts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="dimmed">Aún no hay hosts registrados.</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        {/* ── TAB CONFIG ──────────────────────────────────────────────────── */}
        <Tabs.Panel value="config">
          <Title order={2} mb="lg">Configuración del Bot</Title>
          <Tabs value={infoTab} onChange={setInfoTab} variant="outline">
            <Tabs.List mb="lg">
              <Tabs.Tab value="messages">Mensajes</Tabs.Tab>
              <Tabs.Tab value="fields">Campos del Ticket</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="messages">
              <Text size="sm" c="dimmed" mb="md">
                Edita el texto que el bot envía en cada situación. Las variables en {'{llaves}'} se reemplazan automáticamente.
              </Text>
              <Stack gap="md" mb="lg">
                {MESSAGE_META.map(({ key, label, hint }) => (
                  <Stack key={key} gap={4}>
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={600}>{label}</Text>
                      {hint && <Badge size="xs" variant="outline" color="gray">{hint}</Badge>}
                    </Group>
                    <Textarea
                      value={configMessages[key]}
                      onChange={(e) => setConfigMessages((prev) => ({ ...prev, [key]: e.currentTarget.value }))}
                      autosize
                      minRows={2}
                    />
                  </Stack>
                ))}
              </Stack>
              <Button onClick={saveMessages} loading={savingMessages}>Guardar mensajes</Button>
            </Tabs.Panel>

            <Tabs.Panel value="fields">
              {/* ── Campos del sistema ─────────────────────────────────── */}
              <Title order={4} mb={4}>Campos del sistema</Title>
              <Text size="xs" c="dimmed" mb="sm">
                Columnas fijas del sistema. Solo se pueden mostrar u ocultar en la tabla de tickets.
              </Text>
              <Table withTableBorder withColumnBorders mb="xl" style={{ tableLayout: 'fixed' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Campo</Table.Th>
                    <Table.Th style={{ width: 110, textAlign: 'center' }}>Visible en tabla</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {systemFields.map((sf) => (
                    <Table.Tr key={sf.key}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{sf.label}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch
                          size="xs"
                          checked={sf.visible}
                          onChange={(e) =>
                            setSystemFields((prev) =>
                              prev.map((f) => f.key === sf.key ? { ...f, visible: e.currentTarget.checked } : f)
                            )
                          }
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <Divider mb="md" />

              {/* ── Campos ticket ──────────────────────────────────────── */}
              <Group justify="space-between" mb="xs">
                <div>
                  <Title order={4} mb={2}>Campos ticket</Title>
                  <Text size="xs" c="dimmed">Campos personalizados creados por el administrador.</Text>
                </div>
                <Button size="xs" variant="light" onClick={() => setAddFieldOpen(true)}>+ Agregar campo</Button>
              </Group>
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
                          onChange={(val) => {
                            if (!val) return;
                            const updated = [...configFields];
                            updated[idx] = { ...field, source: val as FieldSource };
                            setConfigFields(updated);
                          }}
                          data={[{ value: 'bot', label: 'Chat (Bot)' }, { value: 'admin', label: 'Panel Admin' }]}
                          size="xs"
                          allowDeselect={false}
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch size="xs" checked={field.required ?? false} onChange={(e) => {
                          const updated = [...configFields];
                          updated[idx] = { ...field, required: e.currentTarget.checked };
                          setConfigFields(updated);
                        }} />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch
                          size="xs"
                          checked={field.normalize}
                          disabled={field.type !== 'string'}
                          onChange={(e) => {
                            const updated = [...configFields];
                            updated[idx] = { ...field, normalize: e.currentTarget.checked };
                            setConfigFields(updated);
                          }}
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch size="xs" checked={field.visible ?? true} onChange={(e) => {
                          const updated = [...configFields];
                          updated[idx] = { ...field, visible: e.currentTarget.checked };
                          setConfigFields(updated);
                        }} />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Switch
                          size="xs"
                          checked={field.excel ?? false}
                          disabled={field.type === 'photo' || field.type === 'video'}
                          onChange={(e) => {
                            const updated = [...configFields];
                            updated[idx] = { ...field, excel: e.currentTarget.checked };
                            setConfigFields(updated);
                          }}
                        />
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
              <Button onClick={saveFields} loading={savingFields}>Guardar campos</Button>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>

      {/* ── Modal: Agregar campo ──────────────────────────────────────────────── */}
      <Modal opened={addFieldOpen} onClose={() => setAddFieldOpen(false)} title="Agregar campo" size="md" centered>
        <Stack>
          <TextInput
            label="Clave (identificador)"
            placeholder="ej: numero_serie"
            description="Solo letras, números y guión bajo. No se puede cambiar después."
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.currentTarget.value)}
          />
          <TextInput
            label="Etiqueta (se muestra en tabla)"
            placeholder="ej: Número de Serie"
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.currentTarget.value)}
          />
          <TextInput
            label="Pregunta (pregunta del bot)"
            placeholder="ej: ¿Cuál es el número de serie del equipo?"
            value={newFieldQuestion}
            onChange={(e) => setNewFieldQuestion(e.currentTarget.value)}
          />
          <Select
            label="Tipo de dato"
            value={newFieldType}
            onChange={(val) => {
              if (val) setNewFieldType(val as BotField['type']);
            }}
            data={[
              { value: 'string', label: 'Texto' },
              { value: 'numeric', label: 'Número' },
              { value: 'photo', label: 'Fotos / Videos' },
              { value: 'boolean', label: 'Booleano (Sí / No)' },
              { value: 'list', label: 'Lista de opciones' },
            ]}
            allowDeselect={false}
          />

          {/* Opciones de lista */}
          {newFieldType === 'list' && (
            <Stack gap="xs">
              <Text size="sm" fw={600}>Opciones de la lista</Text>
              <Group gap="xs">
                <TextInput
                  placeholder="Nueva opción…"
                  value={newFieldOptionInput}
                  onChange={(e) => setNewFieldOptionInput(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addListOption(); } }}
                  style={{ flex: 1 }}
                  size="xs"
                />
                <Button size="xs" variant="light" onClick={addListOption} disabled={!newFieldOptionInput.trim()}>
                  Agregar
                </Button>
              </Group>
              {newFieldOptions.length > 0 ? (
                <Stack gap={4}>
                  {newFieldOptions.map((opt, i) => (
                    <Group key={i} gap="xs" justify="space-between" p={6}
                      style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
                      <Text size="xs">{opt}</Text>
                      <ActionIcon size="xs" color="red" variant="subtle" onClick={() => removeListOption(i)}>
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="xs" c="dimmed">Aún no hay opciones. Agrega al menos una.</Text>
              )}
            </Stack>
          )}

          <Select
            label="Origen"
            value={newFieldSource}
            onChange={(val) => { if (val) setNewFieldSource(val as FieldSource); }}
            data={[
              { value: 'bot', label: 'Chat (Bot) — el usuario lo envía por WhatsApp' },
              { value: 'admin', label: 'Panel Admin — lo ingresa el administrador' },
            ]}
            allowDeselect={false}
          />
          <Switch
            label="Campo requerido"
            size="sm"
            checked={newFieldRequired}
            onChange={(e) => setNewFieldRequired(e.currentTarget.checked)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={() => setAddFieldOpen(false)}>Cancelar</Button>
            <Button
              onClick={addField}
              disabled={
                !newFieldKey.trim() ||
                !newFieldLabel.trim() ||
                !newFieldQuestion.trim() ||
                (newFieldType === 'list' && newFieldOptions.length === 0)
              }
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal: Editar campo ────────────────────────────────────────────── */}
      <Modal opened={editFieldOpen} onClose={cancelEditField} title="Editar Campo" size="md" centered>
        <Stack>
          {editingFieldIdx !== null && configFields[editingFieldIdx] && (
            <Stack gap="xs" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <div>
                <Text size="xs" fw={600} c="dimmed">Campo</Text>
                <Badge variant="outline" color="blue" size="sm" mt={4}>{configFields[editingFieldIdx].key}</Badge>
              </div>
              <Group gap="xs" grow>
                <div>
                  <Text size="xs" fw={600} c="dimmed">Tipo de dato</Text>
                  <Badge size="xs" color={TYPE_COLORS[configFields[editingFieldIdx].type as FieldType] || 'gray'} mt={4}>
                    {TYPE_LABELS[configFields[editingFieldIdx].type as FieldType] || configFields[editingFieldIdx].type}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" fw={600} c="dimmed">Origen</Text>
                  <Badge size="xs" color={SOURCE_COLORS[configFields[editingFieldIdx].source] || 'gray'} mt={4}>
                    {SOURCE_LABELS[configFields[editingFieldIdx].source] || configFields[editingFieldIdx].source}
                  </Badge>
                </div>
                <div>
                  <Text size="xs" fw={600} c="dimmed">Requerido</Text>
                  <Badge size="xs" color={configFields[editingFieldIdx].required ? 'red' : 'gray'} mt={4}>
                    {configFields[editingFieldIdx].required ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </Group>
            </Stack>
          )}
          <TextInput
            label="Etiqueta (para tabla)"
            placeholder="Etiqueta para tabla"
            value={editFieldLabel}
            onChange={(e) => setEditFieldLabel(e.currentTarget.value)}
          />
          <Textarea
            label="Pregunta (para bot)"
            placeholder="Pregunta del bot"
            value={editFieldQuestion}
            onChange={(e) => setEditFieldQuestion(e.currentTarget.value)}
            autosize
            minRows={2}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={cancelEditField}>Cancelar</Button>
            <Button onClick={saveEditField} disabled={!editFieldLabel.trim() || !editFieldQuestion.trim()}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal: Tickets del host ────────────────────────────────────────── */}
      <Modal opened={hostTicketsModalOpen} onClose={() => setHostTicketsModalOpen(false)}
        title={selectedHost ? `Tickets de ${selectedHost.nombre} (${selectedHost.telefono})` : ''} size="xl" centered>
        {selectedHost && (() => {
          const hostTickets = getHostTickets(selectedHost.telefono);
          return (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ticket #</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  {visibleFields.map((f) => <Table.Th key={f.key}>{f.label || f.key}</Table.Th>)}
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {hostTickets.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td fw={500}>{t.ticketNumber}</Table.Td>
                    <Table.Td><Badge size="sm" color={STATUS_COLORS[t.status] || 'gray'}>{t.status}</Badge></Table.Td>
                    {visibleFields.map((f) => <Table.Td key={f.key}>{getFieldValue(t, f.key) || '—'}</Table.Td>)}
                    <Table.Td>{t.timestamps?.createdAt ? new Date(t.timestamps.createdAt).toLocaleDateString('es-CO') : '—'}</Table.Td>
                    <Table.Td>
                      <Button component={Link} href={`/admin/dashboard/tickets/${t.id}`} size="xs" variant="subtle"
                        onClick={() => setHostTicketsModalOpen(false)}>Ver</Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          );
        })()}
      </Modal>

      {/* ── Modal: Editar nombre del host ─────────────────────────────────── */}
      <Modal opened={editHostModalOpen} onClose={() => setEditHostModalOpen(false)} title="Editar nombre del host" size="sm" centered>
        <Stack>
          <TextInput label="Nombre" value={editNombre} onChange={(e) => setEditNombre(e.currentTarget.value)} />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={() => setEditHostModalOpen(false)}>Cancelar</Button>
            <Button loading={savingHost} onClick={saveHostNombre} disabled={!editNombre.trim()}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
