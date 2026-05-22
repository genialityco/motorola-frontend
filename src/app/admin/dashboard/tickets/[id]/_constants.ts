import { TicketStatus } from '@/types';

export const STATUS_COLORS: Record<TicketStatus, string> = {
  REPORTADO: 'gray',
  EN_PROGRAMACION: 'blue',
  PROGRAMADO: 'cyan',
  REPROGRAMADO: 'orange',
  REPARADO: 'teal',
  FINALIZADO: 'green',
  ARCHIVADO: '',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  REPORTADO: 'Reportado',
  EN_PROGRAMACION: 'En programación',
  PROGRAMADO: 'Programado',
  REPROGRAMADO: 'Reprogramado',
  REPARADO: 'Reparado',
  FINALIZADO: 'Finalizado',
  ARCHIVADO: 'Archivado',
};

export const STATUS_OPTIONS: TicketStatus[] = [
  'REPORTADO', 'EN_PROGRAMACION', 'PROGRAMADO', 'REPROGRAMADO', 'REPARADO', 'FINALIZADO',
];

export function getNestedFieldValue(obj: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}
