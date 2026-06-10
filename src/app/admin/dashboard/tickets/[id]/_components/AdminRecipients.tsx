'use client';

import { useEffect, useState } from 'react';
import { MultiSelect, Title, Text, Stack } from '@mantine/core';
import { RecipientOption } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

interface Props {
  ticketId: string;
  value?: string[];
}

/**
 * Selector de administradores que reciben copia de los correos de este ticket.
 * Los gestores asignados siempre reciben los correos; aquí se eligen los admins
 * adicionales a los que se les enviará copia.
 */
export function AdminRecipients({ ticketId, value }: Props) {
  const { showToast } = useAppToast();
  const [admins, setAdmins] = useState<RecipientOption[]>([]);
  const [selected, setSelected] = useState<string[]>(value ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ticketsService.listAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, []);

  // Mantiene la selección sincronizada con el ticket (actualizaciones en vivo).
  useEffect(() => {
    setSelected(value ?? []);
  }, [value]);

  const handleChange = async (emails: string[]) => {
    setSelected(emails);
    setSaving(true);
    try {
      await ticketsService.updateNotifyAdmins(ticketId, emails);
      showToast({ type: 'success', title: 'Destinatarios actualizados', message: 'Se guardaron los administradores con copia.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.';
      showToast({ type: 'error', title: 'Error', message: msg });
      setSelected(value ?? []); // revertir
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={4} mb="xl">
      <Title order={4} mb={2}>Admin destinatario</Title>
      <Text size="xs" c="dimmed">
        Administradores que recibirán copia de los correos de este ticket. Los gestores asignados siempre reciben los correos.
      </Text>
      <MultiSelect
        placeholder={selected.length === 0 ? 'Selecciona administradores…' : undefined}
        data={admins.map((a) => ({ value: a.email, label: `${a.name} (${a.email})` }))}
        value={selected}
        onChange={handleChange}
        disabled={saving}
        searchable
        clearable
        nothingFoundMessage="Sin administradores"
        maxDropdownHeight={240}
      />
    </Stack>
  );
}
