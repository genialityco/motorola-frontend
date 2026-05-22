'use client';

import { Modal, Stack, TextInput, Divider, Group, Button } from '@mantine/core';
import { BotField } from '@/types';
import { useGestores } from '@/hooks/useGestores';
import { RuleBuilder } from './RuleBuilder';

interface Props {
  gestoresApi: ReturnType<typeof useGestores>;
  configFields: BotField[];
  listFields: BotField[];
  getFieldOptions: (fieldKey: string) => string[];
}

export function EditGestorModal({ gestoresApi, configFields, listFields, getFieldOptions }: Props) {
  const {
    editOpen, setEditOpen,
    editForm, setEditForm,
    saving, saveEdit,
    addEditRule, removeEditRule,
  } = gestoresApi;

  return (
    <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Editar Gestor" size="md" centered>
      <Stack>
        <TextInput
          label="Nombre"
          value={editForm.name}
          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          required
        />

        <Divider label="Reglas de asignación" labelPosition="center" />

        <RuleBuilder
          rules={editForm.assignmentRules}
          onAddRule={addEditRule}
          onRemoveRule={removeEditRule}
          configFields={configFields}
          listFields={listFields}
          getFieldOptions={getFieldOptions}
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button loading={saving} onClick={saveEdit} disabled={!editForm.name?.trim()}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
