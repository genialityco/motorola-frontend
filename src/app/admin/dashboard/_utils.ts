import { Ticket, BotField, BotSettings } from '@/types';
import * as XLSX from 'xlsx';
import { STATUS_LABELS, COMPLIANCE_EXCEL, getComplianceLevel } from './_constants';

export function getFieldValue(ticket: Ticket, key: string): string {
  const extraFields = (ticket.extraFields ?? {}) as Record<string, unknown>;
  const parts = key.split('.');

  let val: unknown = extraFields;
  for (const part of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[part];
    else { val = undefined; break; }
  }
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');

  val = ticket;
  for (const part of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[part];
    else return '';
  }
  return typeof val === 'string' ? val : '';
}

export function exportTicketsToExcel(
  tickets: Ticket[],
  configFields: BotField[],
  configSettings: BotSettings,
  hostsMap: Map<string, string>,
) {
  const data = tickets.filter((t) => t.status !== 'ARCHIVADO').map((t) => {
    const row: Record<string, unknown> = {
      'Ticket #': t.ticketNumber,
      'Estado': STATUS_LABELS[t.status] ?? t.status,
    };
    configFields.filter((f) => f.excel === true).forEach((f) => {
      row[f.label || f.key] = getFieldValue(t, f.key) || '';
    });
    const level = getComplianceLevel(t.timestamps?.createdAt, configSettings);
    Object.assign(row, {
      'Alerta de cumplimiento': t.status === 'FINALIZADO' ? '' : COMPLIANCE_EXCEL[level],
      'Reportado Por': hostsMap.get(t.reporter?.phone) || t.reporter?.name || '',
      'Teléfono Reportante': t.reporter?.phone || '',
      'Fecha Creación': t.timestamps?.createdAt ? new Date(t.timestamps.createdAt).toLocaleString('es-CO') : '',
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
  XLSX.writeFile(wb, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
}
