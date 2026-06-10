'use client';

import { Stack, Group, Text, Badge, Textarea, Divider } from '@mantine/core';
import { BotField, BotMessages } from '@/types';
import { TicketVarChips } from './TicketVarChips';

interface Props {
  configMessages: BotMessages;
  setConfigMessages: React.Dispatch<React.SetStateAction<BotMessages>>;
  trackFocus: (key: keyof BotMessages) => (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  insertVar: (varStr: string) => void;
  textTicketFields: BotField[];
}

export function AccionesFlowPanel({ configMessages, setConfigMessages, trackFocus, insertVar, textTicketFields }: Props) {
  const sampleVars: Record<string, string> = {
    index: '1', ticketNumber: 'TKT-00000', estado: 'REPORTADO', fecha: '8/5/2026',
    ...textTicketFields.reduce<Record<string, string>>((acc, f) => {
      acc[f.key.split('.').pop() || f.key] = `[${f.label}]`;
      return acc;
    }, {}),
  };
  const ticketListPreview =
    'Tus tickets:\n\n' +
    configMessages.ticketListItemTemplate.replace(/\{(\w+)\}/g, (_, k) => sampleVars[k] ?? `{${k}}`);

  return (
    <Stack gap="md" mb="lg" c="dark">
      <Stack gap={4}>
        <Text size="sm" fw={600}>Vista previa — lista con selección</Text>
        <Text size="xs" c="dimmed">
          Formato mostrado en las opciones 3 (editar), 4 (eliminar) y 5 (finalizar).
        </Text>
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
          {ticketListPreview + '\n\n' + configMessages.ticketSelectPrompt.replace('{action}', '(acción)')}
        </Text>
      </Stack>

      <Stack gap={4}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={600}>Mensaje de selección de ticket</Text>
          <Badge size="xs" variant="outline" color="gray">{'{action}'}</Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {'{action}'} se reemplaza por &quot;editar&quot;, &quot;eliminar&quot; o &quot;finalizar&quot; según la opción elegida.
        </Text>
        <Textarea
          value={configMessages.ticketSelectPrompt}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, ticketSelectPrompt: e.target.value }))}
          onFocus={trackFocus('ticketSelectPrompt')}
          autosize minRows={2}
        />
      </Stack>

      <Divider />

      <Stack gap={4}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={600}>Ticket creado / editado</Text>
          <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
          <Badge size="xs" variant="outline" color="gray">{'{action}'}</Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {'{action}'} se reemplaza por &quot;creado&quot; al crear un ticket, o &quot;editado&quot; al actualizar un campo.
        </Text>
        <TicketVarChips textTicketFields={textTicketFields} onInsert={insertVar} />
        <Textarea
          value={configMessages.ticketCreated}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, ticketCreated: e.target.value }))}
          onFocus={trackFocus('ticketCreated')}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={600}>Ticket eliminado</Text>
          <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
        </Group>
        <TicketVarChips textTicketFields={textTicketFields} onInsert={insertVar} />
        <Textarea
          value={configMessages.ticketDeleted}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, ticketDeleted: e.target.value }))}
          onFocus={trackFocus('ticketDeleted')}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Campo inválido (respuesta vacía)</Text>
        <Textarea
          value={configMessages.invalidField}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, invalidField: e.target.value }))}
          onFocus={trackFocus('invalidField')}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Operación cancelada</Text>
        <Textarea
          value={configMessages.cancelled}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, cancelled: e.target.value }))}
          onFocus={trackFocus('cancelled')}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Despedida</Text>
        <Textarea
          value={configMessages.goodbye}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, goodbye: e.target.value }))}
          onFocus={trackFocus('goodbye')}
          autosize minRows={2}
        />
      </Stack>
    </Stack>
  );
}
