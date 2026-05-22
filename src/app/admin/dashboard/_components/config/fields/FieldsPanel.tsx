'use client';

import { Group, Title, Button, Text, Divider } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { SystemFieldsTable } from './SystemFieldsTable';
import { ComplianceLimits } from './ComplianceLimits';
import { CustomFieldsTable } from './CustomFieldsTable';
import { AddFieldModal } from './AddFieldModal';
import { EditFieldModal } from './EditFieldModal';

interface Props {
  api: ReturnType<typeof useBotConfig>;
}

export function FieldsPanel({ api }: Props) {
  const {
    systemFields, setSystemFields, moveSysField,
    configSettings, setConfigSettings, savingSettings, saveSettings,
    configFields, setConfigFields, moveField, openEditField, deleteField,
    setAddFieldOpen,
    savingFields, saveFields,
  } = api;

  return (
    <>
      <Title order={4} mb={4}>Campos del sistema</Title>
      <Text size="xs" c="dimmed" mb="sm">
        Columnas fijas del sistema. Puedes mostrar u ocultar cada columna y reordenarlas en la tabla de tickets.
      </Text>
      <SystemFieldsTable
        systemFields={systemFields}
        setSystemFields={setSystemFields}
        moveSysField={moveSysField}
      />

      <ComplianceLimits
        configSettings={configSettings}
        setConfigSettings={setConfigSettings}
        savingSettings={savingSettings}
        saveSettings={saveSettings}
      />

      <Divider mb="md" />

      <Group justify="space-between" mb="xs">
        <div>
          <Title order={4} mb={2}>Campos ticket</Title>
          <Text size="xs" c="dimmed">Campos personalizados creados por el administrador.</Text>
        </div>
        <Button size="xs" variant="light" onClick={() => setAddFieldOpen(true)}>+ Agregar campo</Button>
      </Group>

      <CustomFieldsTable
        configFields={configFields}
        setConfigFields={setConfigFields}
        moveField={moveField}
        openEditField={openEditField}
        deleteField={deleteField}
      />

      <Button onClick={saveFields} loading={savingFields}>Guardar campos</Button>

      <AddFieldModal api={api} />
      <EditFieldModal api={api} />
    </>
  );
}
