'use client';

import { Group, Title, Button, Text, Divider } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { FieldsTable } from './FieldsTable';
import { ComplianceLimits } from './ComplianceLimits';
import { AddFieldModal } from './AddFieldModal';
import { EditFieldModal } from './EditFieldModal';

interface Props {
  api: ReturnType<typeof useBotConfig>;
}

export function FieldsPanel({ api }: Props) {
  const {
    mergedFields, moveMergedField, setSystemFieldVisible, updateConfigField,
    openEditField, deleteField, setAddFieldOpen,
    configSettings, setConfigSettings, savingSettings, saveSettings,
    savingFields, saveFields,
  } = api;

  return (
    <>
      <ComplianceLimits
        configSettings={configSettings}
        setConfigSettings={setConfigSettings}
        savingSettings={savingSettings}
        saveSettings={saveSettings}
      />

      <Divider mb="md" />

      <Group justify="space-between" mb="xs">
        <div>
          <Title order={4} mb={2}>Campos de la tabla de tickets</Title>
          <Text size="xs" c="dimmed">
            Ordena todas las columnas (sistema y personalizadas) tal como se ven en el dashboard.
            Los campos del sistema no se pueden editar ni borrar, solo mostrar/ocultar y reordenar.
          </Text>
        </div>
        <Button size="xs" variant="light" onClick={() => setAddFieldOpen(true)}>+ Agregar campo</Button>
      </Group>

      <FieldsTable
        mergedFields={mergedFields}
        moveMergedField={moveMergedField}
        setSystemFieldVisible={setSystemFieldVisible}
        updateConfigField={updateConfigField}
        openEditField={openEditField}
        deleteField={deleteField}
      />

      <Button onClick={saveFields} loading={savingFields} mb="xl">Guardar campos</Button>

      <AddFieldModal api={api} />
      <EditFieldModal api={api} />
    </>
  );
}
