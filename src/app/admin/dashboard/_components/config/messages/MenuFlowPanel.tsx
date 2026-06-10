'use client';

import { Stack, Group, Text, Badge, TextInput, Textarea, Divider, NumberInput, Button } from '@mantine/core';
import { BotMessages, BotSettings } from '@/types';

interface Props {
  configMessages: BotMessages;
  setConfigMessages: React.Dispatch<React.SetStateAction<BotMessages>>;
  configSettings: BotSettings;
  setConfigSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  trackFocus: (key: keyof BotMessages) => (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  savingMessages: boolean;
  savingSettings: boolean;
  saveMessages: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export function MenuFlowPanel({
  configMessages, setConfigMessages,
  configSettings, setConfigSettings,
  trackFocus, savingMessages, savingSettings, saveMessages, saveSettings,
}: Props) {
  return (
    <Stack gap="md" mb="lg">
      <Stack gap={4}>
        <Group gap="xs" align="center">
          <Text size="sm" fw={600}>Palabra para volver al menú</Text>
          <Badge size="xs" variant="outline" color="blue">En mayúsculas</Badge>
        </Group>
        <Text size="xs" c="dimmed">
          El usuario escribe esta palabra en cualquier flujo para volver al menú principal.
        </Text>
        <TextInput
          value={configMessages.backToMenuKeyword}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setConfigMessages((prev) => ({ ...prev, backToMenuKeyword: v }));
          }}
          placeholder="INICIO"
          style={{ maxWidth: 200 }}
        />
      </Stack>

      <Divider />

      <Stack gap={4}>
        <Text size="sm" fw={600}>Mensaje del menú principal</Text>
        <Textarea
          value={configMessages.menu}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, menu: e.target.value }))}
          onFocus={trackFocus('menu')}
          autosize minRows={3}
        />
      </Stack>

      <Divider my="xs" label="Expiración de sesión por inactividad" labelPosition="center" />

      <Stack gap={4}>
        <Text size="sm" fw={600}>Horas de inactividad para expirar sesión</Text>
        <Text size="xs" c="dimmed">
          Si el usuario deja de responder durante este tiempo en medio de un flujo, la sesión se reinicia automáticamente.
        </Text>
        <NumberInput
          value={configSettings.sessionTimeoutHours}
          onChange={(v) => setConfigSettings((prev) => ({ ...prev, sessionTimeoutHours: Number(v) || 24 }))}
          min={1} max={168} step={1} suffix=" horas" w={160}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Mensaje al expirar sesión de creación</Text>
        <Text size="xs" c="dimmed">Se envía cuando el usuario dejó un ticket a medio crear.</Text>
        <Group gap={4}><Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge></Group>
        <Textarea
          value={configMessages.sessionExpiredCreate}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, sessionExpiredCreate: e.target.value }))}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Mensaje al expirar sesión de edición</Text>
        <Text size="xs" c="dimmed">Se envía cuando el usuario dejó un ticket a medio editar.</Text>
        <Group gap={4}><Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge></Group>
        <Textarea
          value={configMessages.sessionExpiredEdit}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, sessionExpiredEdit: e.target.value }))}
          autosize minRows={2}
        />
      </Stack>

      <Stack gap={4}>
        <Text size="sm" fw={600}>Mensaje al expirar sesión (genérico)</Text>
        <Text size="xs" c="dimmed">Se envía cuando el usuario estaba en otro estado intermedio.</Text>
        <Group gap={4}><Badge size="xs" variant="outline" color="gray">{'{hours}'}</Badge></Group>
        <Textarea
          value={configMessages.sessionExpiredGeneric}
          onChange={(e) => setConfigMessages((prev) => ({ ...prev, sessionExpiredGeneric: e.target.value }))}
          autosize minRows={2}
        />
      </Stack>

      <Button
        onClick={async () => { await saveSettings(); await saveMessages(); }}
        loading={savingSettings || savingMessages}
        size="sm" w="fit-content"
      >
        Guardar expiración de sesión
      </Button>
    </Stack>
  );
}
