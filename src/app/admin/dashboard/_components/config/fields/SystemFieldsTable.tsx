'use client';

import { Table, Text, Switch, Group, Tooltip, ActionIcon } from '@mantine/core';
import { SystemFieldConfig } from '@/types';

interface Props {
  systemFields: SystemFieldConfig[];
  setSystemFields: React.Dispatch<React.SetStateAction<SystemFieldConfig[]>>;
  moveSysField: (idx: number, dir: 'up' | 'down') => void;
}

export function SystemFieldsTable({ systemFields, setSystemFields, moveSysField }: Props) {
  return (
    <Table withTableBorder withColumnBorders mb="xl" style={{ tableLayout: 'fixed' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Campo</Table.Th>
          <Table.Th style={{ width: 110, textAlign: 'center' }}>Visible en tabla</Table.Th>
          <Table.Th style={{ width: 70, textAlign: 'center' }}>Orden</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {systemFields.map((sf, idx) => (
          <Table.Tr key={sf.key}>
            <Table.Td>
              <Text size="sm" fw={500}>{sf.label}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
              <Switch
                size="xs"
                checked={sf.visible}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setSystemFields((prev) =>
                    prev.map((f) => (f.key === sf.key ? { ...f, visible: checked } : f)),
                  );
                }}
              />
            </Table.Td>
            <Table.Td>
              <Group gap={2} wrap="nowrap" justify="center">
                <Tooltip label="Subir" withArrow>
                  <ActionIcon size="xs" variant="subtle" onClick={() => moveSysField(idx, 'up')} disabled={idx === 0}>↑</ActionIcon>
                </Tooltip>
                <Tooltip label="Bajar" withArrow>
                  <ActionIcon size="xs" variant="subtle" onClick={() => moveSysField(idx, 'down')} disabled={idx === systemFields.length - 1}>↓</ActionIcon>
                </Tooltip>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
