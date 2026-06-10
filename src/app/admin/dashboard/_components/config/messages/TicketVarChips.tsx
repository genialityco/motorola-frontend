'use client';

import { Stack, Group, Text, Tooltip, Button } from '@mantine/core';
import { BotField } from '@/types';

export const TICKET_SYSTEM_VARS: { key: string; label: string }[] = [
  { key: 'index', label: 'Nº' },
  { key: 'ticketNumber', label: 'Nº Ticket' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha' },
];

interface VarButtonsProps {
  vars: { key: string; label: string }[];
  color: string;
  onInsert: (varStr: string) => void;
}

export function VarButtons({ vars, color, onInsert }: VarButtonsProps) {
  return (
    <>
      {vars.map(({ key, label }) => {
        const varStr = `{${key}}`;
        return (
          <Tooltip key={key} label={varStr} withArrow>
            <Button size="xs" variant="light" color={color} onClick={() => onInsert(varStr)}>
              {label}
            </Button>
          </Tooltip>
        );
      })}
    </>
  );
}

interface ChipsProps {
  textTicketFields: BotField[];
  onInsert: (varStr: string) => void;
}

export function TicketVarChips({ textTicketFields, onInsert }: ChipsProps) {
  return (
    <Stack
      gap={4}
      mb="md"
      p="sm"
      style={{
        background: 'var(--mantine-color-blue-0)',
        borderRadius: 6,
        border: '1px solid var(--mantine-color-blue-2)',
      }}
    >
      <Text size="xs" fw={700} c="blue.7">
        Variables del ticket — haz clic en una variable para insertarla donde está el cursor:
      </Text>
      <Group gap={4}>
        <VarButtons
          vars={textTicketFields.map((f) => ({ key: f.key.split('.').pop() || f.key, label: f.label }))}
          color="blue"
          onInsert={onInsert}
        />
      </Group>
    </Stack>
  );
}
