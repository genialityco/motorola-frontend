'use client';

import { Title } from '@mantine/core';
import { BotField, Ticket } from '@/types';
import { useHosts } from '@/hooks/useHosts';
import { HostsTable } from './HostsTable';
import { HostTicketsModal } from './HostTicketsModal';
import { EditHostModal } from './EditHostModal';

interface Props {
  tickets: Ticket[];
  visibleFields: BotField[];
  hostsApi: ReturnType<typeof useHosts>;
}

export function HostsTab({ tickets, visibleFields, hostsApi }: Props) {
  const {
    hosts, selectedHost,
    hostTicketsModalOpen, setHostTicketsModalOpen,
    editHostModalOpen, setEditHostModalOpen,
    editNombre, setEditNombre,
    savingHost,
    openHostTickets, openEditHost, saveHostNombre,
  } = hostsApi;

  return (
    <>
      <Title order={2} mb="xl">Hosts</Title>
      <HostsTable
        hosts={hosts}
        tickets={tickets}
        onOpenTickets={openHostTickets}
        onOpenEdit={openEditHost}
      />
      <HostTicketsModal
        opened={hostTicketsModalOpen}
        onClose={() => setHostTicketsModalOpen(false)}
        host={selectedHost}
        tickets={tickets}
        visibleFields={visibleFields}
      />
      <EditHostModal
        opened={editHostModalOpen}
        onClose={() => setEditHostModalOpen(false)}
        nombre={editNombre}
        onNombreChange={setEditNombre}
        onSave={saveHostNombre}
        saving={savingHost}
      />
    </>
  );
}
