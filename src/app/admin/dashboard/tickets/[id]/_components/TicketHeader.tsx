'use client';

import { Group, Title, Badge, Alert, Stack, Text } from '@mantine/core';
import { Ticket } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../_constants';

interface Props {
  ticket: Ticket;
  hostName: string | null;
  errorStatus: string | null;
  onClearError: () => void;
}

export function TicketHeader({ ticket, hostName, errorStatus, onClearError }: Props) {
  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Ticket: {ticket.ticketNumber}</Title>
        <Badge size="xl" color={STATUS_COLORS[ticket.status] || 'gray'}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      </Group>

      {errorStatus && (
        <Alert color="red" title="Error" mb="md" withCloseButton onClose={onClearError}>
          {errorStatus}
        </Alert>
      )}

      <Stack gap="xs" mb="xl" bg="gray.0" p="md" style={{ borderRadius: '8px' }}>
        <Group>
          <Text fw={700} size="sm" c="dimmed">Reportado Por:</Text>
          <Text c="dark">{hostName || ticket.reporter?.name || ticket.reporter?.phone || '—'}</Text>
        </Group>
        <Group>
          <Text fw={700} size="sm" c="dimmed">Fecha de creación:</Text>
          <Text c="dark">
            {ticket.timestamps?.createdAt
              ? new Date(ticket.timestamps.createdAt).toLocaleString('es-CO')
              : '—'}
          </Text>
        </Group>
      </Stack>
    </>
  );
}
