'use client';

import { Table, Text, Group, Button, Tooltip, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { Host, Ticket } from '@/types';

interface Props {
  hosts: Host[];
  tickets: Ticket[];
  onOpenTickets: (host: Host) => void;
  onOpenEdit: (host: Host) => void;
}

export function HostsTable({ hosts, tickets, onOpenTickets, onOpenEdit }: Props) {
  const getHostTickets = (telefono: string) => tickets.filter((t) => t.reporter?.phone === telefono);

  return (
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
                  <Button size="xs" variant="light" onClick={() => onOpenTickets(host)} disabled={hostTickets.length === 0}>
                    Ver Tickets ({hostTickets.length})
                  </Button>
                  <Tooltip label="Editar nombre" withArrow>
                    <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onOpenEdit(host)}>
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
  );
}
