'use client';

import { Title, Group, Button, Stack } from '@mantine/core';
import { TicketStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS, STATUS_OPTION_ROWS } from '../_constants';

/** Ancho fijo para que todos los botones midan igual; cabe el label más largo
 *  ("Requerimiento realizado") sin truncarse. */
const BUTTON_WIDTH = 190;

interface Props {
  currentStatus: TicketStatus;
  loadingStatus: TicketStatus | null;
  onChange: (status: TicketStatus) => void;
}

export function StatusChanger({ currentStatus, loadingStatus, onChange }: Props) {
  return (
    <>
      <Title order={4} mb="xs">Cambiar Estado</Title>
      <Stack gap="sm" mb="xl">
        {STATUS_OPTION_ROWS.map((row, i) => (
          <Group key={i} gap="sm" wrap="wrap">
            {row.map((status) => (
              <Button
                key={status}
                onClick={() => onChange(status)}
                loading={loadingStatus === status}
                disabled={currentStatus === status || loadingStatus !== null}
                color={currentStatus === status ? 'gray' : STATUS_COLORS[status] || 'dark'}
                variant={currentStatus === status ? 'filled' : 'outline'}
                size="sm"
                w={BUTTON_WIDTH}
                px={4}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </Group>
        ))}
      </Stack>
    </>
  );
}
