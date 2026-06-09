import { BotField, Ticket, TicketStatus } from '@/types';
import { STATUS_LABELS, getNestedFieldValue } from './_constants';

interface TimelineEntry {
  status: TicketStatus;
  timestamp?: number;
  scheduledDate?: number | string;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString('es-CO');
}

function renderFieldRow(field: BotField, value: string | string[] | undefined): string {
  const isMedia = field.type === 'photo' || field.type === 'video';

  if (isMedia) {
    const urls = Array.isArray(value) ? value : [];
    if (urls.length === 0) {
      return `<div class="field"><div class="label">${esc(field.label)}</div><div class="value muted">Sin archivos</div></div>`;
    }
    if (field.type === 'video') {
      const links = urls
        .map((u, i) => `<a href="${esc(u)}">Video ${i + 1}</a>`)
        .join(' · ');
      return `<div class="field"><div class="label">${esc(field.label)}</div><div class="value">${links}</div></div>`;
    }
    const imgs = urls
      .map((u, i) => `<figure><img src="${esc(u)}" alt="${esc(field.label)} ${i + 1}"/><figcaption>Foto ${i + 1}</figcaption></figure>`)
      .join('');
    return `<div class="field photos"><div class="label">${esc(field.label)} (${urls.length})</div><div class="gallery">${imgs}</div></div>`;
  }

  let display: string;
  if (typeof value === 'string') {
    display = value === 'true' ? 'Sí' : value === 'false' ? 'No' : value;
  } else if (Array.isArray(value)) {
    display = value.join(', ');
  } else {
    display = '—';
  }
  if (display === '' || display === undefined) display = '—';

  return `<div class="field"><div class="label">${esc(field.label)}</div><div class="value">${esc(display)}</div></div>`;
}

interface BuildArgs {
  ticket: Ticket;
  configFields: BotField[];
  hostName: string | null;
  timeline: TimelineEntry[];
}

function buildReportHtml({ ticket, configFields, hostName, timeline }: BuildArgs): string {
  const extraFields = ticket.extraFields || {};
  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status;

  const fieldsHtml = configFields
    .filter((f) => f.source !== 'auto')
    .map((f) =>
      renderFieldRow(f, getNestedFieldValue(extraFields, f.key) as string | string[] | undefined),
    )
    .join('');

  const timelineHtml = timeline.length
    ? timeline
        .map((e) => {
          const sched = e.scheduledDate ? ` · Programado: ${esc(formatDate(e.scheduledDate))}` : '';
          return `<li><strong>${esc(STATUS_LABELS[e.status] ?? e.status)}</strong> — ${esc(formatDate(e.timestamp))}${sched}</li>`;
        })
        .join('')
    : '<li class="muted">Sin registros.</li>';

  const observationsHtml = (ticket.observations || []).length
    ? ticket.observations!
        .map(
          (o) =>
            `<li><span class="muted">${esc(formatDate(o.timestamp))} (${esc(o.role)})</span><br/>${esc(o.text)}</li>`,
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe ticket ${esc(ticket.ticketNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #0ca678; color: #fff; font-size: 13px; font-weight: 700; }
  .meta { color: #555; font-size: 13px; margin: 8px 0 24px; }
  .meta div { margin: 2px 0; }
  h2 { font-size: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; margin: 28px 0 12px; }
  .field { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .field.photos { display: block; }
  .label { font-weight: 700; min-width: 200px; }
  .value { flex: 1; word-break: break-word; }
  .muted { color: #999; }
  .gallery { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
  figure { margin: 0; width: 220px; }
  figure img { width: 220px; height: 165px; object-fit: cover; border: 1px solid #ddd; border-radius: 6px; }
  figcaption { font-size: 11px; color: #777; text-align: center; margin-top: 4px; }
  ul { margin: 0; padding-left: 18px; font-size: 14px; }
  li { margin: 6px 0; }
  a { color: #1971c2; }
  @media print {
    body { padding: 0; }
    figure, .field.photos { break-inside: avoid; }
    h2 { break-after: avoid; }
  }
</style>
</head>
<body>
  <h1>Informe del ticket ${esc(ticket.ticketNumber)}</h1>
  <span class="status">${esc(statusLabel)}</span>
  <div class="meta">
    <div><strong>Reportado por:</strong> ${esc(hostName || ticket.reporter?.name || ticket.reporter?.phone || '—')}</div>
    <div><strong>Teléfono:</strong> ${esc(ticket.reporter?.phone || '—')}</div>
    <div><strong>Fecha de creación:</strong> ${esc(formatDate(ticket.timestamps?.createdAt))}</div>
    <div><strong>Última actualización:</strong> ${esc(formatDate(ticket.timestamps?.updatedAt))}</div>
    <div><strong>Generado:</strong> ${esc(new Date().toLocaleString('es-CO'))}</div>
  </div>

  <h2>Información del ticket</h2>
  ${fieldsHtml || '<div class="muted">No hay campos.</div>'}

  ${observationsHtml ? `<h2>Observaciones</h2><ul>${observationsHtml}</ul>` : ''}

  <h2>Historial de estados</h2>
  <ul>${timelineHtml}</ul>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}

export function downloadTicketReport(args: BuildArgs): void {
  const html = buildReportHtml(args);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite las ventanas emergentes para descargar el informe.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
