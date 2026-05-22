'use client';

import { Modal, Table, Badge, Button } from '@mantine/core';
import Link from 'next/link';
import { BotField, Host, Ticket } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../../_constants';
import { getFieldValue } from '../../_utils';

interface Props {
  opened: boolean;
  onClose: () => void;
  host: Host | null;
  tickets: Ticket[];
  visibleFields: BotField[];
}

export function HostTicketsModal({ opened, onClose, host, tickets, visibleFields }: Props) {
  if (!host) return null;
  const hostTickets = tickets.filter((t) => t.reporter?.phone === host.telefono);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Tickets de ${host.nombre} (${host.telefono})`}
      size="xl"
      centered
    >
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
              <Table.Td>
                <Badge size="sm" color={STATUS_COLORS[t.status] || 'gray'}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </Badge>
              </Table.Td>
              {visibleFields.map((f) => (
                <Table.Td key={f.key}>{getFieldValue(t, f.key) || '—'}</Table.Td>
              ))}
              <Table.Td>{t.timestamps?.createdAt ? new Date(t.timestamps.createdAt).toLocaleDateString('es-CO') : '—'}</Table.Td>
              <Table.Td>
                <Button component={Link} href={`/admin/dashboard/tickets/${t.id}`} size="xs" variant="subtle" onClick={onClose}>
                  Ver
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}
