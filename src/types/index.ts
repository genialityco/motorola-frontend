export type Role = 'admin' | 'gestor' | 'host' | 'client' | 'workshop' | 'transporter';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export type TicketStatus =
  | 'REPORTADO'
  | 'EN_PROGRAMACION'
  | 'PROGRAMADO'
  | 'REPROGRAMADO'
  | 'REPARADO'
  | 'STANDBY'
  | 'CANCELADO'
  | 'FINALIZADO'
  | 'ARCHIVADO';

export interface TicketObservation {
  uid: string;
  role: string;
  text: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  reporter: {
    phone: string;
    name: string;
  };
  timestamps: {
    createdAt: number;
    updatedAt: number;
    /** Instante en que el ticket pasó a FINALIZADO. Congela el semáforo de cumplimiento. */
    finalizedAt?: number;
    /** Instante en que el ticket entró en STANDBY. Presente solo mientras está en standby; pausa el semáforo. */
    standByAt?: number;
    /** Milisegundos acumulados que el ticket ha pasado en STANDBY en periodos anteriores. Se descuentan del semáforo. */
    pausedMs?: number;
  };
  extraFields?: Record<string, string | string[]>;
  assignedGestorIds?: string[];
  /** Correos de administradores que reciben copia de los correos de este ticket. */
  notifyAdminEmails?: string[];
  observations?: TicketObservation[];
}

export type ActivityHistoryType = 'STATUS_CHANGE' | 'FIELD_UPDATE';

export interface StatusHistoryEntry {
  id: string;
  /** Ausente en registros antiguos: se asume 'STATUS_CHANGE'. */
  type?: ActivityHistoryType;
  previousStatus?: TicketStatus;
  newStatus?: TicketStatus;
  // Solo para type === 'FIELD_UPDATE'
  fieldKey?: string;
  fieldLabel?: string;
  previousValue?: string;
  newValue?: string;
  changedBy?: { uid?: string; role?: string; email?: string };
  comments?: string;
  timestamp: number;
  scheduledDate?: string;
}

/**
 * Entrada del historial de actividad del detalle de ticket. Unifica cambios de
 * estado (`kind: 'status'`) y actualizaciones de campos (`kind: 'field'`).
 */
export interface TimelineEntry {
  kind: 'status' | 'field';
  status?: TicketStatus;
  fieldLabel?: string;
  previousValue?: string;
  newValue?: string;
  timestamp?: number;
  comments?: string;
  changedBy?: { uid?: string; role?: string; email?: string };
  scheduledDate?: number | string;
}

export type ComplianceLevel = 'A_TIEMPO' | 'ATENCION_PRIORITARIA' | 'FUERA_DE_TIEMPO';

export interface ComplianceLimits {
  aTiempoMaxDias: number;
  atencionPrioritariaMaxDias: number;
}

export type FieldType = 'string' | 'numeric' | 'date' | 'photo' | 'video' | 'boolean' | 'list';
export type FieldSource = 'bot' | 'admin' | 'auto';

export interface BotMessages {
  menu: string;
  ticketCreated: string;
  ticketDeleted: string;
  statusChanged: string;
  programadoMessage: string;
  reprogramadoMessage: string;
  reparadoMessage: string;
  noTickets: string;
  invalidField: string;
  cancelled: string;
  goodbye: string;
  viewTicketOptions: string;
  backToMenuKeyword: string;
  adminRequestUpdate: string;
  deletePhotoRequest: string;
  editFieldPrompt: string;
  ticketSelectPrompt: string;
  ticketListItemTemplate: string;
  sessionExpiredCreate: string;
  sessionExpiredEdit: string;
  sessionExpiredGeneric: string;
}

export interface BotSettings {
  sessionTimeoutHours: number;
  compliance?: ComplianceLimits;
}

export interface BotField {
  key: string;
  label: string;
  question?: string;
  placeholder?: string;
  order: number;
  normalize: boolean;
  type: FieldType;
  source: FieldSource;
  required: boolean;
  visible?: boolean;
  excel?: boolean;
  options?: string[];
  allowOther?: boolean;
  otherLabel?: string;
}

export interface SystemFieldConfig {
  key: string;
  label: string;
  visible: boolean;
  // Orden unificado compartido con los BotField (define el orden de columnas
  // en la tabla de tickets). Ausente en documentos guardados antes de unificar.
  order?: number;
}

export interface StandardField {
  key: string;
  label: string;
  type: FieldType;
  source: FieldSource;
  required: boolean;
}

export type EmailEvent = 'created' | 'statusChanged';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailConfig {
  templates: Record<EmailEvent, EmailTemplate>;
}

export interface RecipientOption {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'gestor';
}

export interface Host {
  id: string;
  nombre: string;
  telefono: string;
  creadoEn?: number;
}

export interface SessionMessage {
  from: 'user' | 'bot' | 'admin';
  text?: string;
  photoUrl?: string;
  timestamp: number;
}

export interface ChatSession {
  phone: string;
  state: string;
  messages: SessionMessage[];
  lastMessage?: string;
}

export interface ChatMessage {
  from: 'user' | 'bot' | 'admin';
  text?: string;
  photoUrl?: string;
  timestamp: number;
}
