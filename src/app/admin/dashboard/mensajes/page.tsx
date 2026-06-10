'use client';

import { Paper, Title, Tabs } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { MessagesPanel } from '../_components/config/messages/MessagesPanel';
import { EmailPanel } from '../_components/config/email/EmailPanel';

export default function MensajesPage() {
  const {
    infoTab, setInfoTab,
    configMessages, setConfigMessages,
    configSettings, setConfigSettings,
    configFields,
    savingMessages, savingSettings,
    saveMessages, saveSettings,
  } = useBotConfig();

  return (
    <Paper p="md" shadow="sm" radius="md" withBorder>
      <Title order={2} mb="lg">Mensajes</Title>
      <Tabs value={infoTab} onChange={setInfoTab} variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="messages">Mensajes</Tabs.Tab>
          <Tabs.Tab value="email">Plantillas del correo</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="messages">
          <MessagesPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            configSettings={configSettings} setConfigSettings={setConfigSettings}
            configFields={configFields}
            savingMessages={savingMessages} savingSettings={savingSettings}
            saveMessages={saveMessages} saveSettings={saveSettings}
          />
        </Tabs.Panel>

        <Tabs.Panel value="email">
          <EmailPanel configFields={configFields} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
