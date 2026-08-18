'use client';

import { Popover, Button, Checkbox, Stack, Group, Text, ScrollArea, Badge } from '@mantine/core';
import { IconChevronDown, IconColumns } from '@tabler/icons-react';

export interface ColumnOption {
  key: string;
  label: string;
  visible: boolean;
}

interface Props {
  options: ColumnOption[];
  onToggle: (key: string, visible: boolean) => void;
  onReset: () => void;
}

/**
 * Selector de columnas de la tabla de tickets. La elección es de cada usuario
 * (se guarda en sus preferencias), no de la configuración global de campos.
 */
export function ColumnsMenu({ options, onToggle, onReset }: Props) {
  const hidden = options.filter((o) => !o.visible).length;

  return (
    <Popover width={260} position="bottom-end" withArrow shadow="md" withinPortal>
      <Popover.Target>
        <Button
          variant="light"
          color="gray"
          size="xs"
          leftSection={<IconColumns size={15} />}
          rightSection={<IconChevronDown size={14} />}
        >
          Columnas
          {hidden > 0 && (
            <Badge size="xs" ml={6} color="blue" variant="filled">
              {hidden}
            </Badge>
          )}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Text size="xs" fw={700} mb={4}>Columnas visibles</Text>
        <Text size="xs" c="dimmed" mb="xs">
          Solo afecta a tu vista de la tabla.
        </Text>
        <ScrollArea.Autosize mah={280}>
          <Stack gap={8} pr="xs">
            {options.map((opt) => (
              <Checkbox
                key={opt.key}
                size="xs"
                label={opt.label}
                checked={opt.visible}
                onChange={(e) => onToggle(opt.key, e.currentTarget.checked)}
              />
            ))}
            {options.length === 0 && <Text size="xs" c="dimmed">No hay columnas configuradas.</Text>}
          </Stack>
        </ScrollArea.Autosize>
        <Group justify="flex-end" mt="sm">
          <Button size="xs" variant="subtle" onClick={onReset}>
            Restablecer
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}
