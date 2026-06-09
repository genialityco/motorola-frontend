import { Ticket, BotField, BotSettings, ComplianceLevel } from '@/types';
import {
  STATUS_LABELS,
  COMPLIANCE_LABELS,
  COMPLIANCE_COLORS,
  STATUS_COLORS,
  getComplianceLevel,
} from './_constants';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}

function formatDate(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString('es-CO');
}

const SUBTAB_LABELS: Record<string, string> = {
  activos: 'Tickets activos',
  archivados: 'Archivados',
  finalizados: 'Finalizados',
};

const MANTINE_HEX: Record<string, string> = {
  red: '#fa5252',
  blue: '#228be6',
  cyan: '#15aabf',
  orange: '#fd7e14',
  teal: '#12b886',
  green: '#40c057',
  gray: '#868e96',
  yellow: '#fab005',
};

export interface ReportFilters {
  subTab: string | null;
  fieldFilters: Record<string, string[]>;
  estados: string[];
  alerta: ComplianceLevel[];
  fechaFrom: string;
  fechaTo: string;
}

function buildFilterChips(filters: ReportFilters, configFields: BotField[]): string {
  const chips: string[] = [];

  if (filters.subTab) {
    chips.push(`<span class="chip">Vista: ${esc(SUBTAB_LABELS[filters.subTab] ?? filters.subTab)}</span>`);
  }
  if (filters.estados.length) {
    const labels = filters.estados.map((s) => STATUS_LABELS[s] ?? s).join(', ');
    chips.push(`<span class="chip">Estado: ${esc(labels)}</span>`);
  }
  if (filters.alerta.length) {
    const labels = filters.alerta.map((a) => COMPLIANCE_LABELS[a] ?? a).join(', ');
    chips.push(`<span class="chip">Cumplimiento: ${esc(labels)}</span>`);
  }
  for (const [key, vals] of Object.entries(filters.fieldFilters)) {
    if (!vals.length) continue;
    const label = configFields.find((f) => f.key === key)?.label ?? key;
    chips.push(`<span class="chip">${esc(label)}: ${esc(vals.join(', '))}</span>`);
  }
  if (filters.fechaFrom || filters.fechaTo) {
    const desde = filters.fechaFrom ? `desde ${filters.fechaFrom}` : '';
    const hasta = filters.fechaTo ? `hasta ${filters.fechaTo}` : '';
    chips.push(`<span class="chip">Fecha: ${esc([desde, hasta].filter(Boolean).join(' '))}</span>`);
  }

  if (!chips.length) return '<span class="muted">Sin filtros — todos los tickets de la vista.</span>';
  return chips.join(' ');
}

function buildStatRows(
  items: { label: string; count: number; color: string }[],
  total: number,
): string {
  return items
    .map((i) => {
      const pct = total ? Math.round((i.count / total) * 100) : 0;
      const hex = MANTINE_HEX[i.color] ?? '#868e96';
      return `<tr>
        <td><span class="dot" style="background:${hex}"></span>${esc(i.label)}</td>
        <td class="num">${i.count}</td>
        <td class="num muted">${pct}%</td>
      </tr>`;
    })
    .join('');
}

function renderFieldRow(field: BotField, raw: unknown): string {
  const isMedia = field.type === 'photo' || field.type === 'video';

  if (isMedia) {
    const urls = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
    if (urls.length === 0) {
      return `<div class="field"><div class="flabel">${esc(field.label)}</div><div class="fvalue muted">Sin archivos</div></div>`;
    }
    if (field.type === 'video') {
      const links = urls.map((u, i) => `<a href="${esc(u)}">Video ${i + 1}</a>`).join(' · ');
      return `<div class="field"><div class="flabel">${esc(field.label)}</div><div class="fvalue">${links}</div></div>`;
    }
    const imgs = urls
      .map((u, i) => `<figure><img src="${esc(u)}" alt="${esc(field.label)} ${i + 1}"/><figcaption>Foto ${i + 1}</figcaption></figure>`)
      .join('');
    return `<div class="field photos"><div class="flabel">${esc(field.label)} (${urls.length})</div><div class="gallery">${imgs}</div></div>`;
  }

  let display: string;
  if (typeof raw === 'string') {
    display = raw === 'true' ? 'Sí' : raw === 'false' ? 'No' : raw;
  } else if (Array.isArray(raw)) {
    display = raw.join(', ');
  } else if (typeof raw === 'number') {
    display = String(raw);
  } else {
    display = '';
  }
  if (display === '') display = '—';

  return `<div class="field"><div class="flabel">${esc(field.label)}</div><div class="fvalue">${esc(display)}</div></div>`;
}

function renderTicketDetail(
  t: Ticket,
  fields: BotField[],
  configSettings: BotSettings,
  hostsMap: Map<string, string>,
): string {
  const extraFields = t.extraFields || {};
  const statusLabel = STATUS_LABELS[t.status] ?? t.status;
  const statusHex = MANTINE_HEX[STATUS_COLORS[t.status] ?? 'gray'] ?? '#868e96';

  const level = getComplianceLevel(t.timestamps?.createdAt, configSettings);
  const complianceText = t.status === 'FINALIZADO' || t.status === 'ARCHIVADO' ? '—' : COMPLIANCE_LABELS[level];

  const fieldsHtml = fields
    .map((f) => renderFieldRow(f, getNested(extraFields, f.key)))
    .join('');

  const observationsHtml = (t.observations || []).length
    ? `<div class="obs"><div class="flabel">Observaciones</div><ul>${t.observations!
        .map((o) => `<li><span class="muted">${esc(formatDate(o.timestamp))} (${esc(o.role)})</span><br/>${esc(o.text)}</li>`)
        .join('')}</ul></div>`
    : '';

  return `<section class="ticket">
    <div class="thead">
      <h3>Ticket #${esc(t.ticketNumber)}</h3>
      <span class="status" style="background:${statusHex}">${esc(statusLabel)}</span>
    </div>
    <div class="tmeta">
      <span><strong>Reportado por:</strong> ${esc(hostsMap.get(t.reporter?.phone) || t.reporter?.name || '—')}</span>
      <span><strong>Teléfono:</strong> ${esc(t.reporter?.phone || '—')}</span>
      <span><strong>Creación:</strong> ${esc(formatDate(t.timestamps?.createdAt))}</span>
      <span><strong>Actualización:</strong> ${esc(formatDate(t.timestamps?.updatedAt))}</span>
      <span><strong>Cumplimiento:</strong> ${esc(complianceText)}</span>
    </div>
    ${fieldsHtml || '<div class="muted" style="font-size:13px">Sin campos.</div>'}
    ${observationsHtml}
  </section>`;
}

interface BuildArgs {
  tickets: Ticket[];
  configFields: BotField[];
  configSettings: BotSettings;
  hostsMap: Map<string, string>;
  filters: ReportFilters;
}

function buildReportHtml({ tickets, configFields, configSettings, hostsMap, filters }: BuildArgs): string {
  const total = tickets.length;
  const detailFields = configFields.filter((f) => f.source !== 'auto');

  const statusCounts = new Map<string, number>();
  const complianceCounts = new Map<ComplianceLevel, number>();

  for (const t of tickets) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
    if (t.status !== 'FINALIZADO' && t.status !== 'ARCHIVADO') {
      const level = getComplianceLevel(t.timestamps?.createdAt, configSettings);
      complianceCounts.set(level, (complianceCounts.get(level) ?? 0) + 1);
    }
  }

  const statusItems = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      label: STATUS_LABELS[status] ?? status,
      count,
      color: STATUS_COLORS[status] ?? 'gray',
    }));

  const complianceOrder: ComplianceLevel[] = ['A_TIEMPO', 'ATENCION_PRIORITARIA', 'FUERA_DE_TIEMPO'];
  const complianceItems = complianceOrder
    .filter((lvl) => complianceCounts.has(lvl))
    .map((lvl) => ({
      label: COMPLIANCE_LABELS[lvl],
      count: complianceCounts.get(lvl)!,
      color: COMPLIANCE_COLORS[lvl],
    }));
  const complianceTotal = complianceItems.reduce((s, i) => s + i.count, 0);

  const detailsHtml = total
    ? tickets.map((t) => renderTicketDetail(t, detailFields, configSettings, hostsMap)).join('')
    : '<div class="muted" style="text-align:center;padding:24px">No hay tickets para los filtros seleccionados.</div>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Informe de tickets</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 13px; margin: 6px 0 4px; }
  h2 { font-size: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; margin: 28px 0 12px; }
  .filters { margin: 12px 0 4px; }
  .chip { display: inline-block; background: #f1f3f5; border: 1px solid #dee2e6; border-radius: 999px; padding: 3px 10px; font-size: 12px; margin: 0 4px 4px 0; }
  .muted { color: #999; }
  .summary { display: flex; gap: 32px; flex-wrap: wrap; }
  .summary > div { flex: 1; min-width: 260px; }
  .total { font-size: 32px; font-weight: 700; color: #1971c2; }
  table.stats { border-collapse: collapse; width: 100%; font-size: 13px; }
  table.stats td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  .num { text-align: right; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }

  section.ticket { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px 18px; margin: 0 0 16px; }
  .thead { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .thead h3 { font-size: 16px; margin: 0; }
  .status { display: inline-block; padding: 3px 10px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tmeta { display: flex; flex-wrap: wrap; gap: 4px 18px; color: #555; font-size: 12px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
  .field { display: flex; gap: 12px; padding: 5px 0; border-bottom: 1px solid #f6f6f6; font-size: 13px; }
  .field.photos { display: block; }
  .flabel { font-weight: 700; min-width: 190px; }
  .fvalue { flex: 1; word-break: break-word; }
  .gallery { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  figure { margin: 0; width: 180px; }
  figure img { width: 180px; height: 135px; object-fit: cover; border: 1px solid #ddd; border-radius: 6px; }
  figcaption { font-size: 11px; color: #777; text-align: center; margin-top: 4px; }
  .obs { margin-top: 8px; }
  .obs ul { margin: 6px 0 0; padding-left: 18px; font-size: 13px; }
  .obs li { margin: 6px 0; }
  a { color: #1971c2; }

  @media print {
    body { padding: 0; }
    section.ticket { break-inside: avoid; }
    figure, .field.photos { break-inside: avoid; }
    h2 { break-after: avoid; }
  }
</style>
</head>
<body>
  <h1>Informe de tickets</h1>
  <div class="meta"><strong>Generado:</strong> ${esc(new Date().toLocaleString('es-CO'))}</div>
  <div class="meta"><strong>Total de tickets:</strong> ${total}</div>

  <div class="filters">
    <strong style="font-size:13px">Filtros aplicados:</strong><br/>
    <div style="margin-top:6px">${buildFilterChips(filters, configFields)}</div>
  </div>

  <h2>Resumen</h2>
  <div class="summary">
    <div>
      <div class="total">${total}</div>
      <div class="muted" style="font-size:13px">tickets en este informe</div>
    </div>
    <div>
      <strong style="font-size:13px">Por estado</strong>
      <table class="stats">${buildStatRows(statusItems, total) || '<tr><td class="muted">—</td></tr>'}</table>
    </div>
    ${complianceItems.length ? `<div>
      <strong style="font-size:13px">Por cumplimiento (activos)</strong>
      <table class="stats">${buildStatRows(complianceItems, complianceTotal)}</table>
    </div>` : ''}
  </div>

  <h2>Detalle de tickets (${total})</h2>
  ${detailsHtml}

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 500);
    });
  </script>
</body>
</html>`;
}

export function generateTicketsReport(args: BuildArgs): void {
  const html = buildReportHtml(args);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite las ventanas emergentes para generar el informe.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
