"use client";

import { useMemo, useState, useRef } from 'react';
import { Ticket, BotField, BotMessages, BotSettings, FieldType, FieldSource, SystemFieldConfig } from '@/types';
import {
  Table, Badge, Group, Title, Paper, Button,
  Popover, Checkbox, Text, Stack, Select,
  Modal, TextInput, NumberInput, ActionIcon, Tooltip, Pagination, Tabs,
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
import { ImportTicketsModal } from '@/components/ImportTicketsModal';

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
const STATUS_COLORS: Record<string, string> = {
  REPORTADO: 'red', REVISION: 'blue', EN_REPARACION: 'yellow',
  REPARADO: 'teal', ENTREGADO: 'green', FINALIZADO: 'green', ARCHIVADO: 'gray',
};
const ALL_STATUSES = ['REPORTADO', 'REVISION', 'EN_REPARACION', 'REPARADO', 'ENTREGADO'];
const ACTIVE_TICKET_STATUSES = new Set(['REPORTADO', 'REVISION', 'EN_REPARACION', 'REPARADO', 'ENTREGADO']);

// ── Utility ────────────────────────────────────────────────────────────────────
function getFieldValue(ticket: Ticket, key: string): string {
  const extraFields = (ticket.extraFields ?? {}) as Record<string, unknown>;
  const parts = key.split('.');

  // Traverse within extraFields first (handles nested objects like novelty.description)
  let val: unknown = extraFields;
  for (const part of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[part];
    else { val = undefined; break; }
  }
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');

  // Fallback: traverse on the whole ticket (for system fields like reporter.phone)
  val = ticket;
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
    configSettings, setConfigSettings,
    savingMessages, savingFields, savingSettings,
    infoTab, setInfoTab,
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldPlaceholder, setNewFieldPlaceholder,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    newFieldOptions, setNewFieldOptions,
    newFieldOptionInput, setNewFieldOptionInput,
    newFieldAllowOther, setNewFieldAllowOther,
    newFieldOtherLabel, setNewFieldOtherLabel,
    editFieldOpen,
    editingFieldIdx,
    editFieldLabel, setEditFieldLabel,
    editFieldQuestion, setEditFieldQuestion,
    editFieldPlaceholder, setEditFieldPlaceholder,
    editFieldOptions, setEditFieldOptions,
    editFieldOptionInput, setEditFieldOptionInput,
    editFieldAllowOther, setEditFieldAllowOther,
    editFieldOtherLabel, setEditFieldOtherLabel,
    saveMessages, saveFields, saveSettings,
    moveField, deleteField,
    openEditField, saveEditField, cancelEditField,
    addField, addListOption, removeListOption,
    addEditListOption, removeEditListOption,
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
  const [msgFlowTab, setMsgFlowTab] = useState<string | null>('menu');
  const [ticketSubTab, setTicketSubTab] = useState<string | null>('activos');
  const [sortCol, setSortCol] = useState<SortCol>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterFields, setFilterFieldsState] = useState<Record<string, string[]>>({});
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterFechaFrom, setFilterFechaFrom] = useState('');
  const [filterFechaTo, setFilterFechaTo] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  // Edición inline de opciones de lista (modal crear)
  const [newOptEditIdx, setNewOptEditIdx] = useState<number | null>(null);
  const [newOptEditValue, setNewOptEditValue] = useState('');
  // Edición inline de opciones de lista (modal editar)
  const [editOptEditIdx, setEditOptEditIdx] = useState<number | null>(null);
  const [editOptEditValue, setEditOptEditValue] = useState('');

  const handleCancelEditField = () => {
    setEditOptEditIdx(null);
    setEditOptEditValue('');
    cancelEditField();
  };

  const handleSaveEditField = () => {
    setEditOptEditIdx(null);
    setEditOptEditValue('');
    saveEditField();
  };

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

  // Ref que apunta al último textarea enfocado y a su clave en configMessages
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTextareaKeyRef = useRef<keyof BotMessages | null>(null);

  const trackFocus = (key: keyof BotMessages) =>
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      activeTextareaRef.current = e.target;
      activeTextareaKeyRef.current = key;
    };

  // Inserta la variable en la posición del cursor del textarea activo
  const insertVar = (varStr: string) => {
    const ta = activeTextareaRef.current;
    const key = activeTextareaKeyRef.current;
    if (!ta || !key) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const newValue = ta.value.slice(0, start) + varStr + ta.value.slice(end);
    setConfigMessages(prev => ({ ...prev, [key]: newValue }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + varStr.length, start + varStr.length);
    });
  };

  const textTicketFields = configFields.filter(f => f.type !== 'photo' && f.type !== 'video');

  // Botones de variables del sistema para el template del item de ticket
  const TICKET_SYSTEM_VARS: { key: string; label: string }[] = [
    { key: 'index', label: 'Nº' },
    { key: 'ticketNumber', label: 'Nº Ticket' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ];

  const renderVarButtons = (vars: { key: string; label: string }[], color: string) =>
    vars.map(({ key, label }) => {
      const varStr = `{${key}}`;
      return (
        <Tooltip key={key} label={varStr} withArrow>
          <Button
            size="xs"
            variant="light"
            color={color}
            onClick={() => insertVar(varStr)}
          >
            {label}
          </Button>
        </Tooltip>
      );
    });

  // Panel de variables para usar en los tabs de mensajes admin / estados
  const ticketVarChips = (
    <Stack gap={4} mb="md" p="sm" style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 6, border: '1px solid var(--mantine-color-blue-2)' }}>
      <Text size="xs" fw={700} c="blue.7">Variables del ticket — haz clic en una variable para insertarla donde está el cursor:</Text>
      <Group gap={4}>
        {renderVarButtons(
          textTicketFields.map(f => ({
            key: f.key.split('.').pop() || f.key,
            label: f.label,
          })),
          'blue',
        )}
      </Group>
    </Stack>
  );

  // Preview en vivo usando el template configurado con valores de ejemplo
  const sampleTicketVars: Record<string, string> = {
    index: '1',
    ticketNumber: 'TKT-00000',
    estado: 'REPORTADO',
    fecha: '8/5/2026',
    ...textTicketFields.reduce<Record<string, string>>((acc, f) => {
      const leafKey = f.key.split('.').pop() || f.key;
      acc[leafKey] = `[${f.label}]`;
      return acc;
    }, {}),
  };
  const ticketListPreview = 'Tus tickets:\n\n' +
    configMessages.ticketListItemTemplate.replace(/\{(\w+)\}/g, (_, k) => sampleTicketVars[k] ?? `{${k}}`);

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
            <Group gap="xs">
              <Button onClick={() => setImportModalOpen(true)} variant="light" color="blue">
                Importar Tickets
              </Button>
              <Button onClick={exportToExcel} variant="light" color="green">
                Exportar Tickets
              </Button>
            </Group>
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
                Organiza los mensajes del bot por flujo. Las variables en {'{llaves}'} se reemplazan automáticamente.
              </Text>
              <Tabs value={msgFlowTab} onChange={setMsgFlowTab} variant="pills">
                <Tabs.List mb="md">
                  <Tabs.Tab value="menu">Menú</Tabs.Tab>
                  <Tabs.Tab value="ver">Ver Tickets</Tabs.Tab>
                  <Tabs.Tab value="acciones">Crear / Editar / Eliminar</Tabs.Tab>
                  <Tabs.Tab value="admin">Mensajes Admin</Tabs.Tab>
                  <Tabs.Tab value="estados">Cambios de Estado</Tabs.Tab>
                </Tabs.List>

                {/* ── Menú ── */}
                <Tabs.Panel value="menu">
                  <Stack gap="md" mb="lg">
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Palabra para volver al menú</Text>
                        <Badge size="xs" variant="outline" color="blue">En mayúsculas</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        El usuario escribe esta palabra en cualquier flujo para volver al menú principal.
                      </Text>
                      <TextInput
                        value={configMessages.backToMenuKeyword}
                        onChange={(e) => { const v = e.target.value.toUpperCase(); setConfigMessages((prev) => ({ ...prev, backToMenuKeyword: v })); }}
                        placeholder="INICIO"
                        style={{ maxWidth: 200 }}
                      />
                    </Stack>
                    <Divider />
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Mensaje del menú principal</Text>
                      <Textarea
                        value={configMessages.menu}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, menu: v })); }}
                        onFocus={trackFocus('menu')}
                        autosize minRows={3}
                      />
                    </Stack>

                    <Divider my="xs" label="Expiración de sesión por inactividad" labelPosition="center" />

                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Horas de inactividad para expirar sesión</Text>
                      <Text size="xs" c="dimmed">
                        Si el usuario deja de responder durante este tiempo en medio de un flujo (crear o editar), la sesión se reinicia automáticamente.
                      </Text>
                      <NumberInput
                        value={configSettings.sessionTimeoutHours}
                        onChange={(v) => setConfigSettings((prev: BotSettings) => ({ ...prev, sessionTimeoutHours: Number(v) || 24 }))}
                        min={1} max={168} step={1} suffix=" horas"
                        w={160}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Mensaje al expirar sesión de creación</Text>
                      <Text size="xs" c="dimmed">Se envía cuando el usuario dejó un ticket a medio crear.</Text>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge>
                      </Group>
                      <Textarea
                        value={configMessages.sessionExpiredCreate}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, sessionExpiredCreate: v })); }}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Mensaje al expirar sesión de edición</Text>
                      <Text size="xs" c="dimmed">Se envía cuando el usuario dejó un ticket a medio editar.</Text>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge>
                      </Group>
                      <Textarea
                        value={configMessages.sessionExpiredEdit}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, sessionExpiredEdit: v })); }}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Mensaje al expirar sesión (genérico)</Text>
                      <Text size="xs" c="dimmed">Se envía cuando el usuario estaba en otro estado intermedio.</Text>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge>
                      </Group>
                      <Textarea
                        value={configMessages.sessionExpiredGeneric}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, sessionExpiredGeneric: v })); }}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Button
                      onClick={async () => { await saveSettings(); await saveMessages(); }}
                      loading={savingSettings || savingMessages}
                      size="sm" w="fit-content"
                    >
                      Guardar expiración de sesión
                    </Button>
                  </Stack>
                </Tabs.Panel>

                {/* ── Ver Tickets ── */}
                <Tabs.Panel value="ver">
                  <Stack gap="md" mb="lg">
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Plantilla de cada ticket en el listado</Text>
                      <Text size="xs" c="dimmed">
                        Usa las variables de abajo para personalizar cómo aparece cada ticket.
                      </Text>
                      <Stack gap={4} p="sm" style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 6, border: '1px solid var(--mantine-color-blue-2)' }}>
                        <Text size="xs" fw={700} c="blue.7">Variables del sistema — haz clic para insertar en el cursor:</Text>
                        <Group gap={4}>
                          {renderVarButtons(TICKET_SYSTEM_VARS, 'teal')}
                        </Group>
                        <Text size="xs" fw={700} c="blue.7">Campos del ticket:</Text>
                        <Group gap={4}>
                          {renderVarButtons(
                            textTicketFields.map(f => ({ key: f.key.split('.').pop() || f.key, label: f.label })),
                            'blue',
                          )}
                        </Group>
                      </Stack>
                      <Textarea
                        value={configMessages.ticketListItemTemplate}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, ticketListItemTemplate: v })); }}
                        onFocus={trackFocus('ticketListItemTemplate')}
                        autosize minRows={3}
                        description="Plantilla para cada ítem de la lista de tickets"
                      />
                    </Stack>
                    <Stack gap={4} c={"dark"}>
                      <Text size="sm" fw={600}>Vista previa</Text>
                      <Text
                        component="pre"
                        size="xs"
                        p="sm"
                        style={{ background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                      >
                        {ticketListPreview}
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Mensaje: sin tickets registrados</Text>
                      <Textarea
                        value={configMessages.noTickets}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, noTickets: v })); }}
                        onFocus={trackFocus('noTickets')}
                        autosize minRows={2}
                      />
                    </Stack>
                  </Stack>
                </Tabs.Panel>

                {/* ── Crear / Editar / Eliminar ── */}
                <Tabs.Panel value="acciones">
                  <Stack gap="md" mb="lg" c={"dark"}>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Vista previa — lista con selección</Text>
                      <Text size="xs" c="dimmed">
                        Formato mostrado en las opciones 3 (editar), 4 (eliminar) y 5 (finalizar).
                      </Text>
                      <Text
                        component="pre"
                        size="xs"
                        p="sm"
                        style={{ background: 'var(--mantine-color-gray-0)', border: '1px solid var(--mantine-color-gray-3)', borderRadius: 6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                      >
                        {ticketListPreview + '\n\n' + configMessages.ticketSelectPrompt.replace('{action}', '(acción)')}
                      </Text>
                    </Stack>
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Mensaje de selección de ticket</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{action}'}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {'{action}'} se reemplaza por "editar", "eliminar" o "finalizar" según la opción elegida.
                      </Text>
                      <Textarea
                        value={configMessages.ticketSelectPrompt}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, ticketSelectPrompt: v })); }}
                        onFocus={trackFocus('ticketSelectPrompt')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Divider />
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Ticket creado / editado</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{action}'}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {'{action}'} se reemplaza por "creado" al crear un ticket, o "editado" al actualizar un campo.
                      </Text>
                      {ticketVarChips}
                      <Textarea
                        value={configMessages.ticketCreated}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, ticketCreated: v })); }}
                        onFocus={trackFocus('ticketCreated')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Ticket eliminado</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                      </Group>
                      {ticketVarChips}
                      <Textarea
                        value={configMessages.ticketDeleted}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, ticketDeleted: v })); }}
                        onFocus={trackFocus('ticketDeleted')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Campo inválido (respuesta vacía)</Text>
                      <Textarea
                        value={configMessages.invalidField}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, invalidField: v })); }}
                        onFocus={trackFocus('invalidField')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Operación cancelada</Text>
                      <Textarea
                        value={configMessages.cancelled}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, cancelled: v })); }}
                        onFocus={trackFocus('cancelled')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Despedida</Text>
                      <Textarea
                        value={configMessages.goodbye}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, goodbye: v })); }}
                        onFocus={trackFocus('goodbye')}
                        autosize minRows={2}
                      />
                    </Stack>
                  </Stack>
                </Tabs.Panel>

                {/* ── Mensajes Admin ── */}
                <Tabs.Panel value="admin">
                  {ticketVarChips}
                  <Stack gap="md" mb="lg">
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Solicitud de actualización de campo (admin → usuario)</Text>
                      <Text size="xs" c="dimmed">
                        Se envía cuando el admin solicita al usuario actualizar un campo del ticket.
                      </Text>
                      <Group gap={4}>
                        <Text size="xs" c="dimmed">Variables fijas:</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{fieldLabel}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Text size="xs" c="dimmed">+ variables del ticket de arriba.</Text>
                      </Group>
                      <Textarea
                        value={configMessages.adminRequestUpdate}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, adminRequestUpdate: v })); }}
                        onFocus={trackFocus('adminRequestUpdate')}
                        autosize minRows={3}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Solicitud de re-adjuntar evidencias (admin elimina foto)</Text>
                      <Text size="xs" c="dimmed">
                        Se envía al usuario cuando el admin elimina una foto de un campo del ticket.
                      </Text>
                      <Group gap={4}>
                        <Text size="xs" c="dimmed">Variables fijas:</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{fieldLabel}'}</Badge>
                      </Group>
                      <Textarea
                        value={configMessages.deletePhotoRequest}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, deletePhotoRequest: v })); }}
                        onFocus={trackFocus('deletePhotoRequest')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" fw={600}>Selección de campo a editar (bot → usuario)</Text>
                      <Text size="xs" c="dimmed">
                        Se envía cuando el usuario selecciona un ticket para editar y debe elegir qué campo modificar.
                      </Text>
                      <Group gap={4}>
                        <Text size="xs" c="dimmed">Variables fijas:</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{fieldList}'}</Badge>
                        <Text size="xs" c="dimmed">+ variables del ticket de arriba.</Text>
                      </Group>
                      <Textarea
                        value={configMessages.editFieldPrompt}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, editFieldPrompt: v })); }}
                        onFocus={trackFocus('editFieldPrompt')}
                        autosize minRows={3}
                      />
                    </Stack>

                  </Stack>
                </Tabs.Panel>

                {/* ── Cambios de Estado ── */}
                <Tabs.Panel value="estados">
                  {ticketVarChips}
                  <Stack gap="md" mb="lg">
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Cambio de estado</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{prevStatus}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{newStatus}'}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">+ Variables del ticket de arriba.</Text>
                      <Textarea
                        value={configMessages.statusChanged}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, statusChanged: v })); }}
                        onFocus={trackFocus('statusChanged')}
                        autosize minRows={2}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={600}>Ticket reparado (con fotos de reparación)</Text>
                        <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
                        <Badge size="xs" variant="outline" color="gray">{'{description}'}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">+ Variables del ticket de arriba.</Text>
                      <Textarea
                        value={configMessages.reparadoMessage}
                        onChange={(e) => { const v = e.target.value; setConfigMessages((prev) => ({ ...prev, reparadoMessage: v })); }}
                        onFocus={trackFocus('reparadoMessage')}
                        autosize minRows={2}
                      />
                    </Stack>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
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
            label={newFieldSource === 'admin' ? 'Placeholder (ejemplo para el admin)' : 'Pregunta (pregunta del bot)'}
            placeholder={newFieldSource === 'admin' ? 'ej: Ingrese el número de serie del equipo' : 'ej: ¿Cuál es el número de serie del equipo?'}
            value={newFieldSource === 'admin' ? newFieldPlaceholder : newFieldQuestion}
            onChange={(e) => {
              if (newFieldSource === 'admin') setNewFieldPlaceholder(e.currentTarget.value);
              else setNewFieldQuestion(e.currentTarget.value);
            }}
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
                      style={{ background: 'var(--mantine-color-dark)', borderRadius: 4 }}>
                      <Text size="xs" c="dimmed" fw={600} style={{ minWidth: 20 }}>{i + 1}.</Text>
                      {newOptEditIdx === i ? (
                        <TextInput
                          size="xs"
                          value={newOptEditValue}
                          onChange={(e) => setNewOptEditValue(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newOptEditValue.trim()) {
                              setNewFieldOptions(prev => prev.map((o, j) => j === i ? newOptEditValue.trim() : o));
                              setNewOptEditIdx(null);
                            }
                            if (e.key === 'Escape') setNewOptEditIdx(null);
                          }}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                      ) : (
                        <Text size="xs" style={{ flex: 1 }}>{opt}</Text>
                      )}
                      {newOptEditIdx === i ? (
                        <ActionIcon size="xs" color="green" variant="subtle"
                          onClick={() => { if (newOptEditValue.trim()) { setNewFieldOptions(prev => prev.map((o, j) => j === i ? newOptEditValue.trim() : o)); setNewOptEditIdx(null); } }}>
                          ✓
                        </ActionIcon>
                      ) : (
                        <ActionIcon size="xs" color="blue" variant="subtle"
                          onClick={() => { setNewOptEditIdx(i); setNewOptEditValue(opt); }}>
                          ✎
                        </ActionIcon>
                      )}
                      <ActionIcon size="xs" color="red" variant="subtle" onClick={() => { removeListOption(i); if (newOptEditIdx === i) setNewOptEditIdx(null); }}>
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="xs" c="dimmed">Aún no hay opciones. Agrega al menos una.</Text>
              )}
              <Checkbox
                label="Permitir opción OTRO"
                size="xs"
                checked={newFieldAllowOther}
                onChange={(e) => setNewFieldAllowOther(e.currentTarget.checked)}
              />
              {newFieldAllowOther && (
                <TextInput
                  label="Mensaje para OTRO"
                  description="Pregunta que el bot le hará al usuario cuando elija OTRO"
                  placeholder="ej: Por favor describe tu respuesta"
                  size="xs"
                  value={newFieldOtherLabel}
                  onChange={(e) => setNewFieldOtherLabel(e.currentTarget.value)}
                />
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
                  (newFieldSource === 'admin' ? !newFieldPlaceholder.trim() : !newFieldQuestion.trim()) ||
                (newFieldType === 'list' && newFieldOptions.length === 0)
              }
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal: Editar campo ────────────────────────────────────────────── */}
      <Modal opened={editFieldOpen} onClose={handleCancelEditField} title="Editar Campo" size="md" centered>
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
          {editingFieldIdx !== null && configFields[editingFieldIdx]?.source === 'admin' ? (
            <Textarea
              label="Placeholder (ejemplo para el admin)"
              placeholder="Ej: Ingrese el número de serie del equipo"
              value={editFieldPlaceholder}
              onChange={(e) => setEditFieldPlaceholder(e.currentTarget.value)}
              autosize
              minRows={2}
            />
          ) : (
            <Textarea
              label="Pregunta (para bot)"
              placeholder="Pregunta del bot"
              value={editFieldQuestion}
              onChange={(e) => setEditFieldQuestion(e.currentTarget.value)}
              autosize
              minRows={2}
            />
          )}

          {/* Edición de opciones — solo para campos tipo lista */}
          {editingFieldIdx !== null && configFields[editingFieldIdx]?.type === 'list' && (
            <Stack gap="xs">
              <Text size="sm" fw={600}>Opciones de la lista</Text>
              <Group gap="xs">
                <TextInput
                  placeholder="Nueva opción…"
                  value={editFieldOptionInput}
                  onChange={(e) => setEditFieldOptionInput(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditListOption(); } }}
                  style={{ flex: 1 }}
                  size="xs"
                />
                <Button size="xs" variant="light" onClick={addEditListOption} disabled={!editFieldOptionInput.trim()}>
                  Agregar
                </Button>
              </Group>
              {editFieldOptions.length > 0 ? (
                <Stack gap={4}>
                  {editFieldOptions.map((opt, i) => (
                    <Group key={i} gap="xs" justify="space-between" p={6}
                      style={{ background: 'var(--mantine-color-dark)', borderRadius: 4 }}>
                      <Text size="xs" c="dimmed" fw={600} style={{ minWidth: 20 }}>{i + 1}.</Text>
                      {editOptEditIdx === i ? (
                        <TextInput
                          size="xs"
                          value={editOptEditValue}
                          onChange={(e) => setEditOptEditValue(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editOptEditValue.trim()) {
                              setEditFieldOptions(prev => prev.map((o, j) => j === i ? editOptEditValue.trim() : o));
                              setEditOptEditIdx(null);
                            }
                            if (e.key === 'Escape') setEditOptEditIdx(null);
                          }}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                      ) : (
                        <Text size="xs" style={{ flex: 1 }}>{opt}</Text>
                      )}
                      {editOptEditIdx === i ? (
                        <ActionIcon size="xs" color="green" variant="subtle"
                          onClick={() => { if (editOptEditValue.trim()) { setEditFieldOptions(prev => prev.map((o, j) => j === i ? editOptEditValue.trim() : o)); setEditOptEditIdx(null); } }}>
                          ✓
                        </ActionIcon>
                      ) : (
                        <ActionIcon size="xs" color="blue" variant="subtle"
                          onClick={() => { setEditOptEditIdx(i); setEditOptEditValue(opt); }}>
                          ✎
                        </ActionIcon>
                      )}
                      <ActionIcon size="xs" color="red" variant="subtle" onClick={() => { removeEditListOption(i); if (editOptEditIdx === i) setEditOptEditIdx(null); }}>
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="xs" c="dimmed">Sin opciones. Agrega al menos una.</Text>
              )}
              <Checkbox
                label="Permitir opción OTRO"
                size="xs"
                checked={editFieldAllowOther}
                onChange={(e) => setEditFieldAllowOther(e.currentTarget.checked)}
              />
              {editFieldAllowOther && (
                <TextInput
                  label="Mensaje para OTRO"
                  description="Pregunta que el bot le hará al usuario cuando elija OTRO"
                  placeholder="ej: Por favor describe tu respuesta"
                  size="xs"
                  value={editFieldOtherLabel}
                  onChange={(e) => setEditFieldOtherLabel(e.currentTarget.value)}
                />
              )}
            </Stack>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleCancelEditField}>Cancelar</Button>
            <Button
              onClick={handleSaveEditField}
              disabled={
                !editFieldLabel.trim() ||
                (editingFieldIdx !== null && configFields[editingFieldIdx]?.source === 'admin'
                  ? !editFieldPlaceholder.trim()
                  : !editFieldQuestion.trim()) ||
                (editingFieldIdx !== null && configFields[editingFieldIdx]?.type === 'list' && editFieldOptions.length === 0)
              }
            >
              Guardar
            </Button>
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

      {/* ── Modal: Importar tickets ────────────────────────────────────────── */}
      <ImportTicketsModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        configFields={configFields}
      />
    </Paper>
  );
}
