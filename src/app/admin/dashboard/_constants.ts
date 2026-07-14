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
  REPORTADO: 'red',
  EN_PROGRAMACION: 'blue',
  PROGRAMADO: 'cyan',
  REPROGRAMADO: 'orange',
  REPARADO: 'teal',
  STANDBY: 'yellow',
  CANCELADO: 'dark',
  FINALIZADO: 'green',
  ARCHIVADO: 'gray',
};

export const STATUS_LABELS: Record<string, string> = {
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

export const ALL_STATUSES = ['REPORTADO', 'EN_PROGRAMACION', 'PROGRAMADO', 'REPROGRAMADO', 'REPARADO', 'STANDBY'];

export const ACTIVE_TICKET_STATUSES = new Set([
  'REPORTADO', 'EN_PROGRAMACION', 'PROGRAMADO', 'REPROGRAMADO', 'REPARADO', 'STANDBY',
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

interface ComplianceTimestamps {
  createdAt?: number;
  finalizedAt?: number;
  /** Ms acumulados en STANDBY en periodos ya cerrados. */
  pausedMs?: number;
  /** Instante en que entró al STANDBY actual (presente solo mientras sigue en standby). */
  standByAt?: number;
}

export function getComplianceLevel(
  timestamps: ComplianceTimestamps | undefined,
  settings: BotSettings,
): ComplianceLevel {
  const createdAt = timestamps?.createdAt;
  if (!createdAt) return 'A_TIEMPO';
  const now = Date.now();
  // Ticket finalizado: el semáforo se congela en el instante de finalización.
  const end = timestamps?.finalizedAt ?? now;
  // El tiempo en STANDBY no cuenta: se descuentan los periodos ya cerrados
  // (`pausedMs`) y, si sigue en standby, también el periodo en curso.
  let elapsed = end - createdAt - (timestamps?.pausedMs ?? 0);
  if (timestamps?.standByAt) elapsed -= now - timestamps.standByAt;
  const days = Math.floor(Math.max(0, elapsed) / 86_400_000);
  const aTiempoMax = settings.compliance?.aTiempoMaxDias ?? 7;
  const atencionMax = settings.compliance?.atencionPrioritariaMaxDias ?? 14;
  if (days <= aTiempoMax) return 'A_TIEMPO';
  if (days <= atencionMax) return 'ATENCION_PRIORITARIA';
  return 'FUERA_DE_TIEMPO';
}
