'use client';

import { Modal, Stack, TextInput, PasswordInput, Divider, Text, Group, Button } from '@mantine/core';
import { BotField } from '@/types';
import { useGestores } from '@/hooks/useGestores';
import { RuleBuilder } from './RuleBuilder';

interface Props {
  gestoresApi: ReturnType<typeof useGestores>;
  configFields: BotField[];
  listFields: BotField[];
  getFieldOptions: (fieldKey: string) => string[];
}

export function CreateGestorModal({ gestoresApi, configFields, listFields, getFieldOptions }: Props) {
  const {
    createOpen, setCreateOpen,
    createForm, setCreateForm,
    saving, createGestor,
    addCreateRule, removeCreateRule,
  } = gestoresApi;

  return (
    <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Crear Gestor" size="md" centered>
      <Stack>
        <TextInput
          label="Nombre"
          placeholder="Nombre del gestor"
          value={createForm.name}
          onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <TextInput
          label="Email"
          placeholder="gestor@empresa.com"
          value={createForm.email}
          onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <PasswordInput
          label="Contraseña"
          placeholder="Mínimo 6 caracteres"
          value={createForm.password}
          onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
          required
        />

        <Divider label="Reglas de asignación" labelPosition="center" />
        <Text size="xs" c="dimmed">
          El gestor solo verá tickets cuyos campos coincidan con al menos una regla.
        </Text>

        <RuleBuilder
          rules={createForm.assignmentRules}
          onAddRule={addCreateRule}
          onRemoveRule={removeCreateRule}
          configFields={configFields}
          listFields={listFields}
          getFieldOptions={getFieldOptions}
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button
            loading={saving}
            onClick={createGestor}
            disabled={!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()}
          >
            Crear
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
