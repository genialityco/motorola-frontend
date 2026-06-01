import * as XLSX from 'xlsx';
import { BotField } from '@/types';

export function downloadImportTemplate(configFields: BotField[]) {
  const importableFields = configFields.filter((f) => f.type !== 'photo' && f.type !== 'video');

  const headers: string[] = ['Teléfono Reportante', 'Reportado Por', 'Estado'];
  const example: Record<string, string> = {
    'Teléfono Reportante': '3001234567',
    'Reportado Por': 'Juan Pérez',
    'Estado': 'SOLICITUD_RECIBIDA',
  };

  for (const f of importableFields) {
    const col = f.label || f.key;
    headers.push(col);
    if (f.type === 'list' && f.options && f.options.length > 0) {
      example[col] = f.options[0];
    } else if (f.type === 'numeric') {
      example[col] = '0';
    } else if (f.type === 'boolean') {
      example[col] = 'true';
    } else {
      example[col] = '';
    }
  }

  const ws = XLSX.utils.json_to_sheet([example], { header: headers });

  const wsInstr = XLSX.utils.aoa_to_sheet([
    ['INSTRUCCIONES DE IMPORTACIÓN'],
    [''],
    ['Columnas obligatorias:', 'Teléfono Reportante'],
    ['Estados válidos:', 'SOLICITUD_RECIBIDA, APROBACION_PIEZAS, EN_MONTAJE, ENLACE_PUBLICADO, PRODUCCION_PREVIA, PRODUCCION_POSTERIOR, FINALIZADO, ARCHIVADO'],
    ['Teléfono:', 'Número colombiano de 10 dígitos (ej: 3001234567) o con código de país (ej: 573001234567)'],
    [''],
    ...importableFields
      .filter((f) => f.type === 'list' && f.options && f.options.length > 0)
      .map((f) => [`Opciones para "${f.label || f.key}":`, f.options!.join(', ')]),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');
  XLSX.writeFile(wb, 'plantilla_importar_tickets.xlsx');
}
