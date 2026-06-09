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
  };
  extraFields?: Record<string, string | string[]>;
  assignedGestorIds?: string[];
  observations?: TicketObservation[];
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus?: TicketStatus;
  newStatus: TicketStatus;
  changedBy?: { uid?: string; role?: string };
  comments?: string;
  timestamp: number;
  scheduledDate?: string;
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
}

export interface StandardField {
  key: string;
  label: string;
  type: FieldType;
  source: FieldSource;
  required: boolean;
}

export type EmailEvent = 'created' | 'statusChanged';

export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'gestor';
  events: Record<EmailEvent, boolean>;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailConfig {
  notifyAssignedGestores: boolean;
  recipients: EmailRecipient[];
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
