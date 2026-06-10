'use client';

import { useState } from 'react';
import { Modal, Stack, Text, Alert, PasswordInput, Group, Button } from '@mantine/core';
import { auth } from '../../../lib/firebase';
import { usersService } from '@/services/users.service';
import { useAppToast } from '@/components/toast-provider';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function AdminSetupModal({ opened, onClose, onSuccess }: Props) {
  const { showToast } = useAppToast();
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    setSetupKey('');
    onClose();
  };

  const handlePromote = async () => {
    if (!setupKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await usersService.promoteAdmin(setupKey.trim());
      showToast({ type: 'success', title: 'Listo', message: res.message });
      if (auth.currentUser) await onSuccess();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clave incorrecta o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Activar rol de Administrador" size="sm" centered>
      <Stack>
        <Text size="sm" c="dimmed">
          Ingresa la clave de configuración definida en el servidor (
          <Text span fw={600} c="dark">ADMIN_SETUP_KEY</Text>
          ) para activar el acceso de administrador en esta cuenta.
        </Text>
        {error && <Alert color="red">{error}</Alert>}
        <PasswordInput
          label="Clave de configuración"
          placeholder="Ingresa la clave del servidor"
          value={setupKey}
          onChange={(e) => setSetupKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePromote(); }}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={handleClose}>Cancelar</Button>
          <Button loading={loading} onClick={handlePromote} disabled={!setupKey.trim()}>
            Activar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
