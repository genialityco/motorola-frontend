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

export function AdminFlowPanel({ configMessages, setConfigMessages, trackFocus, insertVar, textTicketFields }: Props) {
  return (
    <>
      <TicketVarChips textTicketFields={textTicketFields} onInsert={insertVar} />
      <Stack gap="md" mb="lg">
        <Stack gap={4}>
          <Text size="sm" fw={600}>Solicitud de actualización de campo (admin → usuario)</Text>
          <Text size="xs" c="dimmed">
            Se envía cuando el admin solicita al usuario actualizar un campo del ticket.
          </Text>
          <Group gap={4}>
            <Text size="xs" c="dimmed">Variables fijas:</Text>
            <Badge size="xs" variant="outline" color="gray">{'{fieldLabel}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Text size="xs" c="dimmed">+ variables del ticket de arriba.</Text>
          </Group>
          <Textarea
            value={configMessages.adminRequestUpdate}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, adminRequestUpdate: e.target.value }))}
            onFocus={trackFocus('adminRequestUpdate')}
            autosize minRows={3}
          />
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600}>Solicitud de re-adjuntar evidencias (admin elimina foto)</Text>
          <Text size="xs" c="dimmed">
            Se envía al usuario cuando el admin elimina una foto de un campo del ticket.
          </Text>
          <Group gap={4}>
            <Text size="xs" c="dimmed">Variables fijas:</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{fieldLabel}'}</Badge>
            <Text size="xs" c="dimmed">+ variables del ticket de arriba.</Text>
          </Group>
          <Textarea
            value={configMessages.deletePhotoRequest}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, deletePhotoRequest: e.target.value }))}
            onFocus={trackFocus('deletePhotoRequest')}
            autosize minRows={2}
          />
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600}>Selección de campo a editar (bot → usuario)</Text>
          <Text size="xs" c="dimmed">
            Se envía cuando el usuario selecciona un ticket para editar y debe elegir qué campo modificar.
          </Text>
          <Group gap={4}>
            <Text size="xs" c="dimmed">Variables fijas:</Text>
            <Badge size="xs" variant="outline" color="gray">{'{ticketNumber}'}</Badge>
            <Badge size="xs" variant="outline" color="gray">{'{fieldList}'}</Badge>
            <Text size="xs" c="dimmed">+ variables del ticket de arriba.</Text>
          </Group>
          <Textarea
            value={configMessages.editFieldPrompt}
            onChange={(e) => setConfigMessages((prev) => ({ ...prev, editFieldPrompt: e.target.value }))}
            onFocus={trackFocus('editFieldPrompt')}
            autosize minRows={3}
          />
        </Stack>
      </Stack>
    </>
  );
}
