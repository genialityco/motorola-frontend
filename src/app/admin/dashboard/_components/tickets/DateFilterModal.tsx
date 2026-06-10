'use client';

import { Modal, Stack, TextInput, Button, Group } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
  onApply: () => void;
}

export function DateFilterModal({ opened, onClose, from, to, onFromChange, onToChange, onClear, onApply }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Filtrar por Fecha de Creación" size="sm" centered>
      <Stack>
        <TextInput label="Desde" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
        <TextInput label="Hasta" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
        <Group justify="space-between" mt="xs">
          <Button variant="subtle" color="red" size="sm" disabled={!from && !to} onClick={onClear}>
            Limpiar fechas
          </Button>
          <Button size="sm" onClick={onApply}>Aplicar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
