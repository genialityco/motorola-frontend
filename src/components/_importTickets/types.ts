export interface ImportedTicket {
  fila: number;
  ticketNumber: string;
  telefono: string;
}

export interface FailedRow {
  fila: number;
  razon: string;
}

export interface ImportResult {
  created: ImportedTicket[];
  failed: FailedRow[];
}
