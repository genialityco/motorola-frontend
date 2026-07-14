import { TicketStatus } from '@/types';

export const STATUS_COLORS: Record<TicketStatus, string> = {
  REPORTADO: 'gray',
  EN_PROGRAMACION: 'blue',
  PROGRAMADO: 'cyan',
  REPROGRAMADO: 'orange',
  REPARADO: 'teal',
  STANDBY: 'yellow',
  CANCELADO: 'red',
  FINALIZADO: 'green',
  ARCHIVADO: '',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  REPORTADO: 'Reportado',
  EN_PROGRAMACION: 'En revisión',
  PROGRAMADO: 'Programado',
  REPROGRAMADO: 'Reprogramado',
  REPARADO: 'Requerimiento realizado',
  STANDBY: 'Stand By',
  CANCELADO: 'Cancelado',
  FINALIZADO: 'Finalizado',
  ARCHIVADO: 'Archivado',
};

export const STATUS_OPTIONS: TicketStatus[] = [
  'REPORTADO', 'EN_PROGRAMACION', 'PROGRAMADO', 'REPROGRAMADO', 'REPARADO', 'STANDBY', 'CANCELADO', 'FINALIZADO',
];

export function getNestedFieldValue(obj: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}
