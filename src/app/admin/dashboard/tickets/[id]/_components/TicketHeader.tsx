'use client';

import { Group, Title, Badge, Alert, Stack, Text, Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { BotField, Ticket, TimelineEntry } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../_constants';
import { downloadTicketReport } from '../_report';

interface Props {
  ticket: Ticket;
  hostName: string | null;
  errorStatus: string | null;
  onClearError: () => void;
  configFields: BotField[];
  timeline: TimelineEntry[];
}

export function TicketHeader({ ticket, hostName, errorStatus, onClearError, configFields, timeline }: Props) {
  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Ticket: {ticket.ticketNumber}</Title>
        <Group gap="sm">
          {ticket.status === 'REPARADO' && (
            <Button
              leftSection={<IconDownload size={16} />}
              color="teal"
              variant="filled"
              onClick={() => downloadTicketReport({ ticket, configFields, hostName, timeline })}
            >
              Descargar informe
            </Button>
          )}
          <Badge size="xl" color={STATUS_COLORS[ticket.status] || 'gray'}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </Badge>
        </Group>
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
