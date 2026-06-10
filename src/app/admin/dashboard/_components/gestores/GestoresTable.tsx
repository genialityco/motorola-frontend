'use client';

import { Table, Text, Stack, Badge, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { BotField } from '@/types';
import { GestorUser } from '@/services/users.service';

interface Props {
  gestores: GestorUser[];
  loading: boolean;
  configFields: BotField[];
  onEdit: (g: GestorUser) => void;
  onToggleActive: (g: GestorUser) => void;
  onDelete: (uid: string) => void;
}

export function GestoresTable({ gestores, loading, configFields, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th><Text size="sm" fw={600}>Nombre</Text></Table.Th>
          <Table.Th><Text size="sm" fw={600}>Email</Text></Table.Th>
          <Table.Th><Text size="sm" fw={600}>Reglas de asignación</Text></Table.Th>
          <Table.Th><Text size="sm" fw={600}>Estado</Text></Table.Th>
          <Table.Th><Text size="sm" fw={600}>Acciones</Text></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {loading ? (
          <Table.Tr key="loading"><Table.Td colSpan={5} ta="center" c="dimmed">Cargando...</Table.Td></Table.Tr>
        ) : gestores.length === 0 ? (
          <Table.Tr key="empty">
            <Table.Td colSpan={5} ta="center" c="dimmed">No hay gestores registrados. Crea uno con el botón de arriba.</Table.Td>
          </Table.Tr>
        ) : gestores.map((g) => (
          <Table.Tr key={g.uid}>
            <Table.Td fw={500}>{g.name}</Table.Td>
            <Table.Td>{g.email}</Table.Td>
            <Table.Td>
              {(g.assignmentRules ?? []).length === 0 ? (
                <Text size="xs" c="dimmed">Sin reglas (no verá tickets)</Text>
              ) : (
                <Stack gap={2}>
                  {g.assignmentRules.map((r, i) => {
                    const field = configFields.find((f) => f.key === r.fieldKey);
                    return (
                      <Text key={i} size="xs">
                        <Text span fw={600}>{field?.label ?? r.fieldKey}:</Text>{' '}
                        {r.fieldValues.join(', ')}
                      </Text>
                    );
                  })}
                </Stack>
              )}
            </Table.Td>
            <Table.Td>
              <Badge color={g.active ? 'green' : 'gray'} size="sm">
                {g.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Tooltip label="Editar" withArrow>
                  <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => onEdit(g)}>
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={g.active ? 'Desactivar' : 'Activar'} withArrow>
                  <ActionIcon size="sm" variant="subtle" color={g.active ? 'orange' : 'green'} onClick={() => onToggleActive(g)}>
                    {g.active ? '⏸' : '▶'}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Eliminar" withArrow>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(g.uid)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
