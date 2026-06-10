'use client';

import { Title, Group, Button } from '@mantine/core';
import { TicketStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS, STATUS_OPTIONS } from '../_constants';

interface Props {
  currentStatus: TicketStatus;
  loadingStatus: TicketStatus | null;
  onChange: (status: TicketStatus) => void;
}

export function StatusChanger({ currentStatus, loadingStatus, onChange }: Props) {
  return (
    <>
      <Title order={4} mb="xs">Cambiar Estado</Title>
      <Group gap="sm" mb="xl" wrap="wrap">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            onClick={() => onChange(status)}
            loading={loadingStatus === status}
            disabled={currentStatus === status || loadingStatus !== null}
            color={currentStatus === status ? 'gray' : STATUS_COLORS[status] || 'dark'}
            variant={currentStatus === status ? 'filled' : 'outline'}
            size="sm"
          >
            {STATUS_LABELS[status]}
          </Button>
        ))}
      </Group>
    </>
  );
}
