'use client';

import { Stack, Group, Text, Badge, Progress, Divider, Table } from '@mantine/core';
import { ImportResult } from './types';

interface Props {
  result: ImportResult;
}

export function ImportResultsView({ result }: Props) {
  const total = result.created.length + result.failed.length;
  const successPct = total > 0 ? Math.round((result.created.length / total) * 100) : 0;

  return (
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
  );
}
