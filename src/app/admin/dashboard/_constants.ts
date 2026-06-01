import { ComplianceLevel, FieldType, BotSettings } from '@/types';

export const TYPE_LABELS: Record<FieldType, string> = {
  string: 'Texto',
  numeric: 'Número',
  date: 'Fecha',
  photo: 'Foto(s)/Video(s)',
  video: 'Video(s)',
  boolean: 'Booleano',
  list: 'Lista',
};

export const TYPE_COLORS: Record<FieldType, string> = {
  string: 'blue',
  numeric: 'orange',
  date: 'violet',
  photo: 'pink',
  video: 'grape',
  boolean: 'cyan',
  list: 'lime',
};

export const SOURCE_LABELS: Record<string, string> = {
  bot: 'Chat (Bot)',
  admin: 'Panel Admin',
  auto: 'Automático',
};

export const SOURCE_COLORS: Record<string, string> = {
  bot: 'teal',
  admin: 'indigo',
  auto: 'gray',
};

export const STATUS_COLORS: Record<string, string> = {
  SOLICITUD_RECIBIDA: 'red',
  APROBACION_PIEZAS: 'orange',
  EN_MONTAJE: 'blue',
  ENLACE_PUBLICADO: 'cyan',
  PRODUCCION_PREVIA: 'grape',
  PRODUCCION_POSTERIOR: 'teal',
  FINALIZADO: 'green',
  ARCHIVADO: 'gray',
};

export const STATUS_LABELS: Record<string, string> = {
  SOLICITUD_RECIBIDA: 'Solicitud recibida',
  APROBACION_PIEZAS: 'Aprobación de piezas',
  EN_MONTAJE: 'En montaje',
  ENLACE_PUBLICADO: 'Enlace publicado',
  PRODUCCION_PREVIA: 'Producción previa',
  PRODUCCION_POSTERIOR: 'Producción posterior',
  FINALIZADO: 'Finalizado',
  ARCHIVADO: 'Archivado',
};

export const ALL_STATUSES = [
  'SOLICITUD_RECIBIDA', 'APROBACION_PIEZAS', 'EN_MONTAJE',
  'ENLACE_PUBLICADO', 'PRODUCCION_PREVIA', 'PRODUCCION_POSTERIOR',
];

export const ACTIVE_TICKET_STATUSES = new Set([
  'SOLICITUD_RECIBIDA', 'APROBACION_PIEZAS', 'EN_MONTAJE',
  'ENLACE_PUBLICADO', 'PRODUCCION_PREVIA', 'PRODUCCION_POSTERIOR',
]);

export const COMPLIANCE_COLORS: Record<ComplianceLevel, string> = {
  A_TIEMPO: 'green',
  ATENCION_PRIORITARIA: 'yellow',
  FUERA_DE_TIEMPO: 'red',
};

export const COMPLIANCE_LABELS: Record<ComplianceLevel, string> = {
  A_TIEMPO: 'A tiempo',
  ATENCION_PRIORITARIA: 'Atención prioritaria',
  FUERA_DE_TIEMPO: 'Fuera de tiempo',
};

export const COMPLIANCE_EXCEL: Record<ComplianceLevel, string> = {
  A_TIEMPO: '🟢 A tiempo',
  ATENCION_PRIORITARIA: '🟡 Atención prioritaria',
  FUERA_DE_TIEMPO: '🔴 Fuera de tiempo',
};

export function getComplianceLevel(createdAt: number | undefined, settings: BotSettings): ComplianceLevel {
  if (!createdAt) return 'A_TIEMPO';
  const days = Math.floor((Date.now() - createdAt) / 86_400_000);
  const aTiempoMax = settings.compliance?.aTiempoMaxDias ?? 7;
  const atencionMax = settings.compliance?.atencionPrioritariaMaxDias ?? 14;
  if (days <= aTiempoMax) return 'A_TIEMPO';
  if (days <= atencionMax) return 'ATENCION_PRIORITARIA';
  return 'FUERA_DE_TIEMPO';
}
