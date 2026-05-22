'use client';

import { Modal, Text, Group, Button } from '@mantine/core';

interface Props {
  uid: string | null;
  onClose: () => void;
  onConfirm: (uid: string) => Promise<void> | void;
}

export function DeleteGestorModal({ uid, onClose, onConfirm }: Props) {
  return (
    <Modal opened={!!uid} onClose={onClose} title="Eliminar Gestor" size="sm" centered>
      <Text mb="lg">
        ¿Seguro que deseas eliminar este gestor? Se eliminará su acceso al sistema y no podrá iniciar sesión.
      </Text>
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Cancelar</Button>
        <Button color="red" onClick={async () => { if (uid) { await onConfirm(uid); onClose(); } }}>
          Eliminar
        </Button>
      </Group>
    </Modal>
  );
}
