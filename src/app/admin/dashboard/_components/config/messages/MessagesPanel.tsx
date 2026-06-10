'use client';

import { useState } from 'react';
import { Tabs, Text, Button } from '@mantine/core';
import { BotField, BotMessages, BotSettings } from '@/types';
import { useVarInserter } from '../../../_hooks/useVarInserter';
import { MenuFlowPanel } from './MenuFlowPanel';
import { VerFlowPanel } from './VerFlowPanel';
import { AccionesFlowPanel } from './AccionesFlowPanel';
import { AdminFlowPanel } from './AdminFlowPanel';
import { EstadosFlowPanel } from './EstadosFlowPanel';

interface Props {
  configMessages: BotMessages;
  setConfigMessages: React.Dispatch<React.SetStateAction<BotMessages>>;
  configSettings: BotSettings;
  setConfigSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  configFields: BotField[];
  savingMessages: boolean;
  savingSettings: boolean;
  saveMessages: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export function MessagesPanel({
  configMessages, setConfigMessages,
  configSettings, setConfigSettings,
  configFields, savingMessages, savingSettings, saveMessages, saveSettings,
}: Props) {
  const [flowTab, setFlowTab] = useState<string | null>('menu');
  const { trackFocus, insertVar } = useVarInserter(setConfigMessages);
  const textTicketFields = configFields.filter((f) => f.type !== 'photo' && f.type !== 'video');

  return (
    <>
      <Text size="sm" c="dimmed" mb="md">
        Organiza los mensajes del bot por flujo. Las variables en {'{llaves}'} se reemplazan automáticamente.
      </Text>
      <Tabs value={flowTab} onChange={setFlowTab} variant="pills">
        <Tabs.List mb="md">
          <Tabs.Tab value="menu">Menú</Tabs.Tab>
          <Tabs.Tab value="ver">Ver Tickets</Tabs.Tab>
          <Tabs.Tab value="acciones">Crear / Editar / Eliminar</Tabs.Tab>
          <Tabs.Tab value="admin">Mensajes Admin</Tabs.Tab>
          <Tabs.Tab value="estados">Cambios de Estado</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="menu">
          <MenuFlowPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            configSettings={configSettings} setConfigSettings={setConfigSettings}
            trackFocus={trackFocus}
            savingMessages={savingMessages} savingSettings={savingSettings}
            saveMessages={saveMessages} saveSettings={saveSettings}
          />
        </Tabs.Panel>

        <Tabs.Panel value="ver">
          <VerFlowPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            trackFocus={trackFocus} insertVar={insertVar}
            textTicketFields={textTicketFields}
          />
        </Tabs.Panel>

        <Tabs.Panel value="acciones">
          <AccionesFlowPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            trackFocus={trackFocus} insertVar={insertVar}
            textTicketFields={textTicketFields}
          />
        </Tabs.Panel>

        <Tabs.Panel value="admin">
          <AdminFlowPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            trackFocus={trackFocus} insertVar={insertVar}
            textTicketFields={textTicketFields}
          />
        </Tabs.Panel>

        <Tabs.Panel value="estados">
          <EstadosFlowPanel
            configMessages={configMessages} setConfigMessages={setConfigMessages}
            trackFocus={trackFocus} insertVar={insertVar}
            textTicketFields={textTicketFields}
          />
        </Tabs.Panel>
      </Tabs>
      <Button onClick={saveMessages} loading={savingMessages}>Guardar mensajes</Button>
    </>
  );
}
