'use client';

import { useRef, useState } from 'react';
import {
  Modal, Button, Group, Stack, Text, Table, Badge,
  Alert, Progress, Divider,
} from '@mantine/core';
import * as XLSX from 'xlsx';
import { BotField } from '@/types';
import { ticketsService } from '@/services/tickets.service';

interface ImportedTicket {
  fila: number;
  ticketNumber: string;
  telefono: string;
}

interface FailedRow {
  fila: number;
  razon: string;
}

interface ImportResult {
  created: ImportedTicket[];
  failed: FailedRow[];
}

interface Props {
  opened: boolean;
  onClose: () => void;
  configFields: BotField[];
}

export function ImportTicketsModal({ opened, onClose, configFields }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importableFields = configFields.filter(
    (f) => f.type !== 'photo' && f.type !== 'video',
  );

  const downloadTemplate = () => {
    const headers: string[] = ['Teléfono Reportante', 'Reportado Por', 'Estado'];
    const example: Record<string, string> = {
      'Teléfono Reportante': '3001234567',
      'Reportado Por': 'Juan Pérez',
      'Estado': 'REPORTADO',
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

    // Add a "Instrucciones" row as a comment row before the data — using a second sheet
    const wsInstr = XLSX.utils.aoa_to_sheet([
      ['INSTRUCCIONES DE IMPORTACIÓN'],
      [''],
      ['Columnas obligatorias:', 'Teléfono Reportante'],
      ['Estados válidos:', 'REPORTADO, REVISION, EN_REPARACION, REPARADO, ENTREGADO, FINALIZADO, ARCHIVADO'],
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ticketsService.importTickets(file);
      setResult(res);
    } catch (err) {
      setError((err as Error).message || 'Error al importar.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClose();
  };

  const total = (result?.created.length ?? 0) + (result?.failed.length ?? 0);
  const successPct = total > 0 ? Math.round((result!.created.length / total) * 100) : 0;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Importar Tickets desde Excel"
      size="xl"
      centered
    >
      <Stack>
        {/* Step 1: Template */}
        <Stack gap={4}>
          <Text size="sm" fw={600}>1. Descarga la plantilla</Text>
          <Text size="xs" c="dimmed">
            La plantilla incluye todas las columnas necesarias con un ejemplo. Los campos de
            foto/video se omiten en la importación.
          </Text>
          <Button
            variant="light"
            color="blue"
            size="sm"
            w="fit-content"
            onClick={downloadTemplate}
          >
            Descargar Plantilla (.xlsx)
          </Button>
        </Stack>

        <Divider />

        {/* Step 2: Upload */}
        <Stack gap={4}>
          <Text size="sm" fw={600}>2. Sube el archivo completado</Text>
          <Text size="xs" c="dimmed">Solo se acepta formato .xlsx</Text>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            style={{ fontSize: 13 }}
          />
          {file && (
            <Text size="xs" c="dimmed">
              Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </Text>
          )}
        </Stack>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="xs">
            <Divider />
            <Group gap="xs">
              <Text size="sm" fw={600}>Resultado:</Text>
              <Badge color="green">{result.created.length} creados</Badge>
              <Badge color="red">{result.failed.length} fallidos</Badge>
            </Group>

            {total > 0 && (
              <Progress
                value={successPct}
                color={successPct === 100 ? 'green' : successPct === 0 ? 'red' : 'yellow'}
                size="sm"
              />
            )}

            {result.created.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" fw={600} c="green.7">Tickets creados exitosamente:</Text>
                <Table withTableBorder withColumnBorders fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fila</Table.Th>
                      <Table.Th>Ticket #</Table.Th>
                      <Table.Th>Teléfono</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.created.map((r) => (
                      <Table.Tr key={`${r.fila}-${r.ticketNumber}`}>
                        <Table.Td>{r.fila}</Table.Td>
                        <Table.Td fw={500}>{r.ticketNumber}</Table.Td>
                        <Table.Td>{r.telefono}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}

            {result.failed.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" fw={600} c="red.7">Filas con errores (no creadas):</Text>
                <Table withTableBorder withColumnBorders fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fila Excel</Table.Th>
                      <Table.Th>Razón</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.failed.map((r) => (
                      <Table.Tr key={r.fila}>
                        <Table.Td>{r.fila}</Table.Td>
                        <Table.Td c="red.7">{r.razon}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              loading={loading}
              disabled={!file}
              color="green"
            >
              Importar
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
