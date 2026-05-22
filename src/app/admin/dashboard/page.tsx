'use client';

import { useCallback, useMemo, useState } from 'react';
import { Paper, Tabs, Badge } from '@mantine/core';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/hooks/useTickets';
import { useBotConfig } from '@/hooks/useBotConfig';
import { useHosts } from '@/hooks/useHosts';
import { useGestores } from '@/hooks/useGestores';
import { TicketsTab } from './_components/tickets/TicketsTab';
import { HostsTab } from './_components/hosts/HostsTab';
import { GestoresTab } from './_components/gestores/GestoresTab';
import { ConfigTab } from './_components/config/ConfigTab';

export default function DashboardPage() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const { tickets } = useTickets(userRole, user?.uid);
  const botConfigApi = useBotConfig();
  const hostsApi = useHosts();
  const gestoresApi = useGestores();

  const { configFields, systemFields, configSettings } = botConfigApi;
  const [activeTab, setActiveTab] = useState<string | null>('tickets');

  const visibleFields = useMemo(
    () => configFields.filter((f) => f.visible !== false),
    [configFields],
  );

  const listFields = useMemo(
    () => configFields.filter((f) => f.type === 'list' && (f.options?.length ?? 0) > 0),
    [configFields],
  );

  const getFieldOptions = useCallback(
    (fieldKey: string): string[] => {
      const f = listFields.find((lf) => lf.key === fieldKey);
      if (!f) return [];
      const opts = [...(f.options ?? [])];
      if (f.allowOther) opts.push('OTRO');
      return opts;
    },
    [listFields],
  );

  return (
    <Paper p="md" shadow="sm" radius="md" withBorder>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="tickets">Tickets</Tabs.Tab>
          {isAdmin && <Tabs.Tab value="hosts">Hosts</Tabs.Tab>}
          {isAdmin && (
            <Tabs.Tab value="gestores">
              Gestores
              <Badge size="xs" ml={6} color="violet" variant="light">
                {gestoresApi.gestores.length}
              </Badge>
            </Tabs.Tab>
          )}
          {isAdmin && <Tabs.Tab value="config">Info Tickets</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="tickets">
          <TicketsTab
            isAdmin={isAdmin}
            tickets={tickets}
            hosts={hostsApi.hosts}
            configFields={configFields}
            visibleFields={visibleFields}
            systemFields={systemFields}
            configSettings={configSettings}
          />
        </Tabs.Panel>

        {isAdmin && (
          <Tabs.Panel value="hosts">
            <HostsTab tickets={tickets} visibleFields={visibleFields} hostsApi={hostsApi} />
          </Tabs.Panel>
        )}

        {isAdmin && (
          <Tabs.Panel value="gestores">
            <GestoresTab
              gestoresApi={gestoresApi}
              configFields={configFields}
              listFields={listFields}
              getFieldOptions={getFieldOptions}
            />
          </Tabs.Panel>
        )}

        {isAdmin && (
          <Tabs.Panel value="config">
            <ConfigTab api={botConfigApi} />
          </Tabs.Panel>
        )}
      </Tabs>
    </Paper>
  );
}
