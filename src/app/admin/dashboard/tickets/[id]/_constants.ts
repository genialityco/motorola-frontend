import { TicketStatus } from '@/types';

export const STATUS_COLORS: Record<TicketStatus, string> = {
  SOLICITUD_RECIBIDA: 'gray',
  APROBACION_PIEZAS: 'orange',
  EN_MONTAJE: 'blue',
  ENLACE_PUBLICADO: 'cyan',
  PRODUCCION_PREVIA: 'grape',
  PRODUCCION_POSTERIOR: 'teal',
  FINALIZADO: 'green',
  ARCHIVADO: '',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  SOLICITUD_RECIBIDA: 'Solicitud recibida',
  APROBACION_PIEZAS: 'Aprobación de piezas',
  EN_MONTAJE: 'En montaje',
  ENLACE_PUBLICADO: 'Enlace publicado',
  PRODUCCION_PREVIA: 'Producción previa',
  PRODUCCION_POSTERIOR: 'Producción posterior',
  FINALIZADO: 'Finalizado',
  ARCHIVADO: 'Archivado',
};

export const STATUS_OPTIONS: TicketStatus[] = [
  'SOLICITUD_RECIBIDA', 'APROBACION_PIEZAS', 'EN_MONTAJE',
  'ENLACE_PUBLICADO', 'PRODUCCION_PREVIA', 'PRODUCCION_POSTERIOR', 'FINALIZADO',
];

export function getNestedFieldValue(obj: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}
