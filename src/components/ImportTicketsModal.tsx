'use client';

import { useRef, useState } from 'react';
import { Modal, Button, Group, Stack, Text, Alert, Divider } from '@mantine/core';
import { BotField } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { downloadImportTemplate } from './_importTickets/downloadTemplate';
import { ImportResultsView } from './_importTickets/ImportResultsView';
import { ImportResult } from './_importTickets/types';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
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

  return (
    <Modal opened={opened} onClose={handleClose} title="Importar Tickets desde Excel" size="xl" centered>
      <Stack>
        <Stack gap={4}>
          <Text size="sm" fw={600}>1. Descarga la plantilla</Text>
          <Text size="xs" c="dimmed">
            La plantilla incluye todas las columnas necesarias con un ejemplo. Los campos de
            foto/video se omiten en la importación.
          </Text>
          <Button variant="light" color="blue" size="sm" w="fit-content" onClick={() => downloadImportTemplate(configFields)}>
            Descargar Plantilla (.xlsx)
          </Button>
        </Stack>

        <Divider />

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

        {error && <Alert color="red" title="Error">{error}</Alert>}
        {result && <ImportResultsView result={result} />}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={handleClose}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button onClick={handleImport} loading={loading} disabled={!file} color="green">
              Importar
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
