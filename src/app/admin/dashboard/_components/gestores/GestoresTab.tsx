'use client';

import { useState } from 'react';
import { Group, Title, Button, Text, Tooltip } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { BotField } from '@/types';
import { useGestores } from '@/hooks/useGestores';
import { GestoresTable } from './GestoresTable';
import { CreateGestorModal } from './CreateGestorModal';
import { EditGestorModal } from './EditGestorModal';
import { DeleteGestorModal } from './DeleteGestorModal';

interface Props {
  gestoresApi: ReturnType<typeof useGestores>;
  configFields: BotField[];
  listFields: BotField[];
  getFieldOptions: (fieldKey: string) => string[];
}

export function GestoresTab({ gestoresApi, configFields, listFields, getFieldOptions }: Props) {
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const {
    gestores, loading, openCreate, openEdit, toggleActive, deleteGestor, recompute,
  } = gestoresApi;

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Gestores</Title>
        <Group gap="xs">
          <Tooltip label="Recalcular asignaciones de todos los tickets" withArrow>
            <Button leftSection={<IconRefresh size={14} />} variant="light" color="gray" onClick={recompute}>
              Recalcular asignaciones
            </Button>
          </Tooltip>
          <Button leftSection={<IconPlus size={14} />} onClick={openCreate}>
            Crear Gestor
          </Button>
        </Group>
      </Group>
      <Text size="sm" c="dimmed" mb="lg">
        Los gestores solo ven los tickets que coincidan con sus reglas de asignación. Las reglas se basan en campos tipo lista del bot.
      </Text>

      <GestoresTable
        gestores={gestores}
        loading={loading}
        configFields={configFields}
        onEdit={openEdit}
        onToggleActive={toggleActive}
        onDelete={setDeletingUid}
      />

      <CreateGestorModal
        gestoresApi={gestoresApi}
        configFields={configFields}
        listFields={listFields}
        getFieldOptions={getFieldOptions}
      />
      <EditGestorModal
        gestoresApi={gestoresApi}
        configFields={configFields}
        listFields={listFields}
        getFieldOptions={getFieldOptions}
      />
      <DeleteGestorModal
        uid={deletingUid}
        onClose={() => setDeletingUid(null)}
        onConfirm={deleteGestor}
      />
    </>
  );
}
