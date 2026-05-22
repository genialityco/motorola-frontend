'use client';

import { useState } from 'react';
import { Stack, Group, Text, TextInput, Button, ActionIcon, Checkbox } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

interface Props {
  options: string[];
  setOptions: React.Dispatch<React.SetStateAction<string[]>>;
  optionInput: string;
  setOptionInput: React.Dispatch<React.SetStateAction<string>>;
  addOption: () => void;
  removeOption: (idx: number) => void;
  allowOther: boolean;
  setAllowOther: React.Dispatch<React.SetStateAction<boolean>>;
  otherLabel: string;
  setOtherLabel: React.Dispatch<React.SetStateAction<string>>;
  emptyMessage?: string;
}

export function ListOptionsEditor(p: Props) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const commitEdit = (i: number) => {
    if (editValue.trim()) {
      p.setOptions((prev) => prev.map((o, j) => (j === i ? editValue.trim() : o)));
    }
    setEditIdx(null);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>Opciones de la lista</Text>
      <Group gap="xs">
        <TextInput
          placeholder="Nueva opción…"
          value={p.optionInput}
          onChange={(e) => p.setOptionInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); p.addOption(); } }}
          style={{ flex: 1 }}
          size="xs"
        />
        <Button size="xs" variant="light" onClick={p.addOption} disabled={!p.optionInput.trim()}>
          Agregar
        </Button>
      </Group>

      {p.options.length > 0 ? (
        <Stack gap={4}>
          {p.options.map((opt, i) => (
            <Group key={i} gap="xs" justify="space-between" p={6}
              style={{ background: 'var(--mantine-color-dark)', borderRadius: 4 }}>
              <Text size="xs" c="dimmed" fw={600} style={{ minWidth: 20 }}>{i + 1}.</Text>
              {editIdx === i ? (
                <TextInput
                  size="xs"
                  value={editValue}
                  onChange={(e) => setEditValue(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(i);
                    if (e.key === 'Escape') setEditIdx(null);
                  }}
                  style={{ flex: 1 }}
                  autoFocus
                />
              ) : (
                <Text size="xs" style={{ flex: 1 }}>{opt}</Text>
              )}
              {editIdx === i ? (
                <ActionIcon size="xs" color="green" variant="subtle" onClick={() => commitEdit(i)}>✓</ActionIcon>
              ) : (
                <ActionIcon size="xs" color="blue" variant="subtle"
                  onClick={() => { setEditIdx(i); setEditValue(opt); }}>✎</ActionIcon>
              )}
              <ActionIcon size="xs" color="red" variant="subtle"
                onClick={() => { p.removeOption(i); if (editIdx === i) setEditIdx(null); }}>
                <IconTrash size={12} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      ) : (
        <Text size="xs" c="dimmed">{p.emptyMessage ?? 'Sin opciones. Agrega al menos una.'}</Text>
      )}

      <Checkbox
        label="Permitir opción OTRO"
        size="xs"
        checked={p.allowOther}
        onChange={(e) => p.setAllowOther(e.currentTarget.checked)}
      />
      {p.allowOther && (
        <TextInput
          label="Mensaje para OTRO"
          description="Pregunta que el bot le hará al usuario cuando elija OTRO"
          placeholder="ej: Por favor describe tu respuesta"
          size="xs"
          value={p.otherLabel}
          onChange={(e) => p.setOtherLabel(e.currentTarget.value)}
        />
      )}
    </Stack>
  );
}
