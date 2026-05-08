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
  ciudad?: string;
  canal?: string;
  point: {
    id: string;
    name: string;
  };
  reporter: {
    phone: string;
    name: string;
  };
  novelty: {
    type: string;
    description: string;
  };
  status: TicketStatus;
  actors: {
    workshopId?: string;
    transporterId?: string;
  };
  budget: {
    estimatedValue?: number;
    approved?: boolean;
  };
  photos: {
    evidence: string[];
    repair: string[];
    delivery: string[];
  };
  timestamps: {
    createdAt: number;
    updatedAt: number;
  };
  observations?: string;
  extraFields?: Record<string, string>;
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus?: TicketStatus;
  newStatus: TicketStatus;
  changedBy?: { uid?: string; role?: string };
  comments?: string;
  timestamp: number;
}

export type FieldType = 'string' | 'numeric' | 'date' | 'photo' | 'video';
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
