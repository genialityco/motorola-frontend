'use client';

import { Stack, Button, Text, Collapse, Timeline, Badge } from '@mantine/core';
import { TicketStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../_constants';

interface TimelineEntry {
  status: TicketStatus;
  timestamp?: number;
  scheduledDate?: number | string;
}

interface Props {
  timeline: TimelineEntry[];
  expanded: boolean;
  onToggle: () => void;
}

export function StatusHistory({ timeline, expanded, onToggle }: Props) {
  return (
    <Stack gap="xs" mb="xl">
      <Button variant="light" fullWidth onClick={onToggle} justify="space-between">
        <Text fw={700}>Historial de Estados ({timeline.length})</Text>
        <Text>{expanded ? '▼' : '▶'}</Text>
      </Button>
      <Collapse expanded={expanded}>
        {timeline.length === 0 ? (
          <Text c="dimmed" size="sm">Sin registros aún.</Text>
        ) : (
          <Timeline active={timeline.length - 1} bulletSize={20} lineWidth={2} mt="xs">
            {timeline.map((entry, idx) => (
              <Timeline.Item
                key={idx}
                title={
                  <Badge color={STATUS_COLORS[entry.status] || 'gray'}>
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </Badge>
                }
              >
                <Text size="sm">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString('es-CO') : '—'}
                </Text>
                {entry.scheduledDate && (() => {
                  const d = new Date(entry.scheduledDate);
                  return !isNaN(d.getTime()) ? (
                    <Text size="xs" c="cyan">
                      Fecha programada: {d.toLocaleString('es-CO')}
                    </Text>
                  ) : null;
                })()}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Collapse>
    </Stack>
  );
}
