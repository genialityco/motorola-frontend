'use client';

import { Title, Tabs } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { MessagesPanel } from './messages/MessagesPanel';
import { FieldsPanel } from './fields/FieldsPanel';
import { EmailPanel } from './email/EmailPanel';

interface Props {
  api: ReturnType<typeof useBotConfig>;
}

export function ConfigTab({ api }: Props) {
  const {
    infoTab, setInfoTab,
    configMessages, setConfigMessages,
    configSettings, setConfigSettings,
    configFields,
    savingMessages, savingSettings,
    saveMessages, saveSettings,
  } = api;

  return (
    <>
      <Title order={2} mb="lg">Configuración del Bot</Title>
      <Tabs value={infoTab} onChange={setInfoTab} variant="outline">
        <Tabs.List mb="lg">
          <Tabs.Tab value="messages">Mensajes</Tabs.Tab>
          <Tabs.Tab value="fields">Campos del Ticket</Tabs.Tab>
          <Tabs.Tab value="email">Correo</Tabs.Tab>
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

        <Tabs.Panel value="fields">
          <FieldsPanel api={api} />
        </Tabs.Panel>

        <Tabs.Panel value="email">
          <EmailPanel configFields={configFields} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
