'use client';

import { Modal, Stack, Text, Group, TextInput, Button } from '@mantine/core';
import { TicketStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../_constants';

interface Props {
  status: TicketStatus | null;
  onClose: () => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  error: string | null;
  loading: boolean;
  onConfirm: () => void;
}

export function ScheduledDateModal({
  status, onClose, date, setDate, time, setTime, error, loading, onConfirm,
}: Props) {
  return (
    <Modal
      opened={!!status}
      onClose={onClose}
      title={`Programar ticket — ${status ? STATUS_LABELS[status] : ''}`}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Para cambiar el ticket a <strong>{status ? STATUS_LABELS[status] : ''}</strong>{' '}
          debes indicar la fecha de atención programada.
        </Text>
        <Group grow>
          <TextInput
            type="date" label="Fecha programada" required
            value={date} onChange={(e) => setDate(e.currentTarget.value)}
            error={error}
          />
          <TextInput
            type="time" label="Hora programada (24 h)" required
            lang="en-GB"
            value={time} onChange={(e) => setTime(e.currentTarget.value)}
          />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button
            color={status ? STATUS_COLORS[status] || 'dark' : 'dark'}
            loading={loading}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
