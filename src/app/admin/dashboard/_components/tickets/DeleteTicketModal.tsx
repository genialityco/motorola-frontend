'use client';

import { useState } from 'react';
import { Modal, Text, Group, Button } from '@mantine/core';
import { Ticket } from '@/types';

interface Props {
  ticket: Ticket | null;
  onClose: () => void;
  onConfirm: (ticket: Ticket) => Promise<void> | void;
}

export function DeleteTicketModal({ ticket, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!ticket) return;
    setDeleting(true);
    try {
      await onConfirm(ticket);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal opened={!!ticket} onClose={onClose} title="Eliminar Ticket" size="sm" centered>
      <Text mb="lg">
        ¿Estás seguro de eliminar el ticket <Text span fw={700}>#{ticket?.ticketNumber}</Text>?
        Esta acción es irreversible.
      </Text>
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose} disabled={deleting}>Cancelar</Button>
        <Button color="red" onClick={handleConfirm} loading={deleting}>Eliminar</Button>
      </Group>
    </Modal>
  );
}
