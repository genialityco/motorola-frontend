'use client';

import { Stack, Button, Text, Collapse, Timeline, Badge } from '@mantine/core';
import { TimelineEntry } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '../_constants';

interface Props {
  timeline: TimelineEntry[];
  /** Última actualización del ticket (timestamps.updatedAt); refleja también
   *  ediciones de campos/fotos, no solo cambios de estado. */
  lastUpdated?: number;
  expanded: boolean;
  onToggle: () => void;
}

// Etiquetas legibles para el rol de quien hizo el cambio.
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  host: 'Reportante',
  client: 'Reportante',
  user: 'Usuario',
};

const roleLabel = (role?: string) => (role ? ROLE_LABELS[role] ?? role : '');

export function StatusHistory({ timeline, lastUpdated, expanded, onToggle }: Props) {
  // Preferimos updatedAt del ticket; si falta, usamos el último evento del
  // timeline (que va de más antiguo a más reciente).
  const lastTs = lastUpdated ?? (timeline.length > 0 ? timeline[timeline.length - 1]?.timestamp : undefined);
  const lastUpdatedLabel = lastTs ? new Date(lastTs).toLocaleString('es-CO') : null;

  return (
    <Stack gap="xs" mb="xl">
      <Button variant="light" fullWidth onClick={onToggle} justify="space-between">
        <Text fw={700}>
          Historial de actividad ({timeline.length})
          {lastUpdatedLabel && (
            <Text span c="dimmed" fw={400}>
              {' · '}Última actualización: {lastUpdatedLabel}
            </Text>
          )}
        </Text>
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
                  entry.kind === 'field' ? (
                    <Badge color="grape">
                      Campo actualizado{entry.fieldLabel ? `: ${entry.fieldLabel}` : ''}
                    </Badge>
                  ) : (
                    <Badge color={STATUS_COLORS[entry.status!] || 'gray'}>
                      {STATUS_LABELS[entry.status!] ?? entry.status}
                    </Badge>
                  )
                }
              >
                {(() => {
                  // Atribución: preferimos el correo de quien lo actualizó;
                  // si no hay, usamos el rol legible.
                  const by = entry.changedBy?.email || roleLabel(entry.changedBy?.role);
                  const when = entry.timestamp ? new Date(entry.timestamp).toLocaleString('es-CO') : '—';
                  return (
                    <Text size="sm" c="dimmed">
                      {entry.kind === 'status' && by ? `Actualizado por ${by} · ` : by ? `${by} · ` : ''}
                      {when}
                    </Text>
                  );
                })()}
                {entry.kind === 'field' && (entry.previousValue !== undefined || entry.newValue !== undefined) && (
                  <Text size="sm">
                    {entry.previousValue ?? '—'} → {entry.newValue ?? '—'}
                  </Text>
                )}
                {entry.comments && <Text size="sm">{entry.comments}</Text>}
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
