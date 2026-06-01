'use client';

import { Stack, Group, Text, Textarea } from '@mantine/core';
import { BotField, BotMessages } from '@/types';
import { TICKET_SYSTEM_VARS, VarButtons } from './TicketVarChips';

interface Props {
  configMessages: BotMessages;
  setConfigMessages: React.Dispatch<React.SetStateAction<BotMessages>>;
  trackFocus: (key: keyof BotMessages) => (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  insertVar: (varStr: string) => void;
  textTicketFields: BotField[];
}

export function VerFlowPanel({ configMessages, setConfigMessages, trackFocus, insertVar, textTicketFields }: Props) {
  const sampleTicketVars: Record<string, string> = {
    index: '1',
    ticketNumber: 'TKT-00000',
    estado: 'SOLICITUD_RECIBIDA',
    fecha: '8/5/2026',
    ...textTicketFields.reduce<Record<string, string>>((acc, f) => {
      const leafKey = f.key.split('.').pop() || f.key;
      acc[leafKey] = `[${f.label}]`;
      return acc;
    }, {}),
  };
  const ticketListPreview =
    'Tus tickets:\n\n' +
    configMessages.ticketListItemTemplate.replace(/\{(\w+)\}/g, (_, k) => sampleTicketVars[k] ?? `{${k}}`);

  return (
    <Stack gap="md" mb="lg">
      <Stack gap={4}>
        <Text size="sm" fw={600}>Plantilla de cada ticket en el listado</Text>
        <Text size="xs" c="dimmed">
          Usa las variables de abajo para personalizar cómo aparece cada ticket.
        </Text>
        <Stack
          gap={4}
          p="sm"
          style={{
            background: 'var(--mantine-color-blue-0)',
            borderRadius: 6,
            border: '1px solid var(--mantine-color-blue-2)',
          }}
        >
          <Text size="xs" fw={700} c="blue.7">Variables del sistema — haz clic para insertar en el cursor:</Text>
          <Group gap={4}><VarButtons vars={TICKET_SYSTEM_VARS} color="teal" onInsert={insertVar} /></Group>
          <Text size="xs" fw={700} c="blue.7">Campos del ticket:</Text>
          <Group gap={4}>
            <VarButtons
              vars={textTicketFields.map((f) => ({ key: f.key.split('.').pop() || f.key, label: f.label }))}
              color="blue"
              onInsert={insertVar}
            />
          </Group>
        </Stack>
        <Textarea
          value={configMessages.ticketListItemTemplate}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, ticketListItemTemplate: e.target.value }))}
          onFocus={trackFocus('ticketListItemTemplate')}
          autosize minRows={3}
          description="Plantilla para cada ítem de la lista de tickets"
        />
      </Stack>

      <Stack gap={4} c="dark">
        <Text size="sm" fw={600}>Vista previa</Text>
        <Text
          component="pre"
          size="xs"
          p="sm"
          style={{
            background: 'var(--mantine-color-gray-0)',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 6,
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
          }}
        >
          {ticketListPreview}
        </Text>
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Mensaje: sin tickets registrados</Text>
        <Textarea
          value={configMessages.noTickets}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, noTickets: e.target.value }))}
          onFocus={trackFocus('noTickets')}
          autosize minRows={2}
        />
      </Stack>
    </Stack>
  );
}
