'use client';

import { Modal, Stack, TextInput, Group, Button } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  nombre: string;
  onNombreChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditHostModal({ opened, onClose, nombre, onNombreChange, onSave, saving }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Editar nombre del host" size="sm" centered>
      <Stack>
        <TextInput label="Nombre" value={nombre} onChange={(e) => onNombreChange(e.currentTarget.value)} />
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button loading={saving} onClick={onSave} disabled={!nombre.trim()}>Guardar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
