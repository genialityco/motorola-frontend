'use client';

import { Modal, Stack, Text, Badge, Group, TextInput, Textarea, Button } from '@mantine/core';
import { FieldType } from '@/types';
import { useBotConfig } from '@/hooks/useBotConfig';
import { TYPE_LABELS, TYPE_COLORS, SOURCE_LABELS, SOURCE_COLORS } from '../../../_constants';
import { ListOptionsEditor } from './ListOptionsEditor';

type ConfigApi = ReturnType<typeof useBotConfig>;

interface Props {
  api: ConfigApi;
}

export function EditFieldModal({ api }: Props) {
  const {
    configFields,
    editFieldOpen,
    editingFieldIdx,
    editFieldLabel, setEditFieldLabel,
    editFieldQuestion, setEditFieldQuestion,
    editFieldPlaceholder, setEditFieldPlaceholder,
    editFieldOptions, setEditFieldOptions,
    editFieldOptionInput, setEditFieldOptionInput,
    editFieldAllowOther, setEditFieldAllowOther,
    editFieldOtherLabel, setEditFieldOtherLabel,
    saveEditField, cancelEditField,
    addEditListOption, removeEditListOption,
  } = api;

  const field = editingFieldIdx !== null ? configFields[editingFieldIdx] : null;
  const isAdmin = field?.source === 'admin';
  const isList = field?.type === 'list';

  const canSave =
    editFieldLabel.trim() &&
    (isAdmin ? editFieldPlaceholder.trim() : editFieldQuestion.trim()) &&
    !(isList && editFieldOptions.length === 0);

  return (
    <Modal opened={editFieldOpen} onClose={cancelEditField} title="Editar Campo" size="md" centered>
      <Stack>
        {field && (
          <Stack gap="xs" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <div>
              <Text size="xs" fw={600} c="dimmed">Campo</Text>
              <Badge variant="outline" color="blue" size="sm" mt={4}>{field.key}</Badge>
            </div>
            <Group gap="xs" grow>
              <div>
                <Text size="xs" fw={600} c="dimmed">Tipo de dato</Text>
                <Badge size="xs" color={TYPE_COLORS[field.type as FieldType] || 'gray'} mt={4}>
                  {TYPE_LABELS[field.type as FieldType] || field.type}
                </Badge>
              </div>
              <div>
                <Text size="xs" fw={600} c="dimmed">Origen</Text>
                <Badge size="xs" color={SOURCE_COLORS[field.source] || 'gray'} mt={4}>
                  {SOURCE_LABELS[field.source] || field.source}
                </Badge>
              </div>
              <div>
                <Text size="xs" fw={600} c="dimmed">Requerido</Text>
                <Badge size="xs" color={field.required ? 'red' : 'gray'} mt={4}>
                  {field.required ? 'Sí' : 'No'}
                </Badge>
              </div>
            </Group>
          </Stack>
        )}

        <TextInput
          label="Etiqueta (para tabla)"
          placeholder="Etiqueta para tabla"
          value={editFieldLabel}
          onChange={(e) => setEditFieldLabel(e.currentTarget.value)}
        />

        {isAdmin ? (
          <Textarea
            label="Placeholder (ejemplo para el admin)"
            placeholder="Ej: Ingrese el número de serie del equipo"
            value={editFieldPlaceholder}
            onChange={(e) => setEditFieldPlaceholder(e.currentTarget.value)}
            autosize minRows={2}
          />
        ) : (
          <Textarea
            label="Pregunta (para bot)"
            placeholder="Pregunta del bot"
            value={editFieldQuestion}
            onChange={(e) => setEditFieldQuestion(e.currentTarget.value)}
            autosize minRows={2}
          />
        )}

        {isList && (
          <ListOptionsEditor
            options={editFieldOptions} setOptions={setEditFieldOptions}
            optionInput={editFieldOptionInput} setOptionInput={setEditFieldOptionInput}
            addOption={addEditListOption} removeOption={removeEditListOption}
            allowOther={editFieldAllowOther} setAllowOther={setEditFieldAllowOther}
            otherLabel={editFieldOtherLabel} setOtherLabel={setEditFieldOtherLabel}
          />
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={cancelEditField}>Cancelar</Button>
          <Button onClick={saveEditField} disabled={!canSave}>Guardar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
