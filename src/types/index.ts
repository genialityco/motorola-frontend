export type Role = 'admin' | 'host' | 'client' | 'workshop' | 'transporter';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export type TicketStatus =
  | 'REPORTADO'
  | 'REVISION'
  | 'EN_REPARACION'
  | 'REPARADO'
  | 'ENTREGADO'
  | 'FINALIZADO'
  | 'ARCHIVADO';

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
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus?: TicketStatus;
  newStatus: TicketStatus;
  changedBy?: { uid?: string; role?: string };
  comments?: string;
  timestamp: number;
}

export type FieldType = 'string' | 'numeric' | 'date' | 'photo' | 'video' | 'boolean' | 'list';
export type FieldSource = 'bot' | 'admin' | 'auto';

export interface BotMessages {
  menu: string;
  ticketCreated: string;
  statusChanged: string;
  reparadoMessage: string;
  noTickets: string;
  invalidField: string;
  cancelled: string;
  goodbye: string;
  viewTicketOptions: string;
}

export interface BotField {
  key: string;
  label: string;
  question: string;
  order: number;
  normalize: boolean;
  type: FieldType;
  source: FieldSource;
  required: boolean;
  visible?: boolean;
  excel?: boolean;
  options?: string[];
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
