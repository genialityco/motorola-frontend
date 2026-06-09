'use client';

import { Stack, Group, Text, Badge, Textarea } from '@mantine/core';
import { BotField, BotMessages } from '@/types';
import { TicketVarChips } from './TicketVarChips';

interface Props {
  configMessages: BotMessages;
  setConfigMessages: React.Dispatch<React.SetStateAction<BotMessages>>;
  trackFocus: (key: keyof BotMessages) => (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  insertVar: (varStr: string) => void;
  textTicketFields: BotField[];
}

export function EstadosFlowPanel({ configMessages, setConfigMessages, trackFocus, insertVar, textTicketFields }: Props) {
  return (
    <>
      <TicketVarChips textTicketFields={textTicketFields} onInsert={insertVar} />
      <Stack gap="md" mb="lg">
        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Text size="sm" fw={600}>Cambio de estado</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{prevStatus}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{newStatus}'}</Badge>
          </Group>
          <Text size="xs" c="dimmed">+ Variables del ticket de arriba.</Text>
          <Textarea
            value={configMessages.statusChanged}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, statusChanged: e.target.value }))}
            onFocus={trackFocus('statusChanged')}
            autosize minRows={2}
          />
        </Stack>

        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Text size="sm" fw={600}>Ticket programado</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="cyan">{'{scheduledDate}'}</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Se envía cuando el estado pasa a PROGRAMADO. {'{scheduledDate}'} es la fecha y hora elegidas por el admin (formato es-CO).
          </Text>
          <Textarea
            value={configMessages.programadoMessage}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, programadoMessage: e.target.value }))}
            onFocus={trackFocus('programadoMessage')}
            autosize minRows={2}
          />
        </Stack>

        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Text size="sm" fw={600}>Ticket reprogramado</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="cyan">{'{scheduledDate}'}</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Se envía cuando el estado pasa a REPROGRAMADO. {'{scheduledDate}'} es la nueva fecha y hora.
          </Text>
          <Textarea
            value={configMessages.reprogramadoMessage}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, reprogramadoMessage: e.target.value }))}
            onFocus={trackFocus('reprogramadoMessage')}
            autosize minRows={2}
          />
        </Stack>

        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Text size="sm" fw={600}>Ticket reparado (con fotos de reparación)</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{description}'}</Badge>
          </Group>
          <Text size="xs" c="dimmed">+ Variables del ticket de arriba.</Text>
          <Textarea
            value={configMessages.reparadoMessage}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, reparadoMessage: e.target.value }))}
            onFocus={trackFocus('reparadoMessage')}
            autosize minRows={2}
          />
        </Stack>
      </Stack>
    </>
  );
}
