'use client';

import { Modal, Stack, Text, Textarea, Group, Button } from '@mantine/core';

interface Props {
  data: { fieldKey: string; fieldLabel: string } | null;
  ticketNumber?: string | number;
  message: string;
  setMessage: (v: string) => void;
  loading: boolean;
  onClose: () => void;
  onSend: () => void;
}

export function RequestFieldModal({ data, ticketNumber, message, setMessage, loading, onClose, onSend }: Props) {
  return (
    <Modal
      opened={!!data}
      onClose={() => { onClose(); setMessage(''); }}
      title={`Solicitar actualización: ${data?.fieldLabel ?? ''}`}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Se enviará un mensaje por WhatsApp al usuario pidiéndole que actualice{' '}
          <strong>{data?.fieldLabel}</strong> del ticket{' '}
          <strong>{ticketNumber}</strong>.
        </Text>
        <Textarea
          label="Mensaje adicional (opcional)"
          placeholder="Ej: La descripción debe incluir el modelo del equipo afectado."
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          minRows={2}
          autosize
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => { onClose(); setMessage(''); }}>
            Cancelar
          </Button>
          <Button color="orange" loading={loading} onClick={onSend}>
            Enviar solicitud
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
