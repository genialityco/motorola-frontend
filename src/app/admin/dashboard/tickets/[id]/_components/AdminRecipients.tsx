'use client';

import { useEffect, useState } from 'react';
import { TagsInput, Title, Text, Stack } from '@mantine/core';
import { RecipientOption } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

interface Props {
  ticketId: string;
  value?: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Destinatarios de copia de los correos de este ticket. El gestor puede elegir
 * administradores de la lista (sugerencias) o escribir cualquier correo libre
 * que no esté en la lista de admins/gestores. Los gestores asignados siempre
 * reciben los correos; estos son copias adicionales.
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

  const persist = async (emails: string[]) => {
    setSaving(true);
    try {
      await ticketsService.updateNotifyAdmins(ticketId, emails);
      showToast({ type: 'success', title: 'Destinatarios actualizados', message: 'Se guardaron los correos con copia.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.';
      showToast({ type: 'error', title: 'Error', message: msg });
      setSelected(value ?? []); // revertir
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (next: string[]) => {
    const normalized = next.map((e) => e.trim()).filter(Boolean);
    // Validar solo lo recién agregado (las sugerencias de admins ya son válidas).
    const added = normalized.filter((e) => !selected.includes(e));
    const invalid = added.filter((e) => !EMAIL_RE.test(e));
    if (invalid.length > 0) {
      showToast({ type: 'error', title: 'Correo inválido', message: `No es un correo válido: ${invalid.join(', ')}` });
    }
    const valid = [...new Set(normalized.filter((e) => !invalid.includes(e)))];
    setSelected(valid);
    void persist(valid);
  };

  return (
    <Stack gap={4} mb="xl">
      <Title order={4} mb={2}>Admin destinatario</Title>
      <Text size="xs" c="dimmed">
        Correos que recibirán copia de los correos de este ticket. Elige un administrador de la lista o
        escribe cualquier correo y presiona Enter. Los gestores asignados siempre reciben los correos.
      </Text>
      <TagsInput
        placeholder={selected.length === 0 ? 'Selecciona o escribe un correo…' : undefined}
        data={admins.map((a) => ({ value: a.email, label: `${a.name} (${a.email})` }))}
        value={selected}
        onChange={handleChange}
        disabled={saving}
        clearable
        splitChars={[',', ';', ' ']}
        maxDropdownHeight={240}
      />
    </Stack>
  );
}
