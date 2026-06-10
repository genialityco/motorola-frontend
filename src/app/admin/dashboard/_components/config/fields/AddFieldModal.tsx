'use client';

import { Modal, Stack, TextInput, Select, Switch, Group, Button } from '@mantine/core';
import { BotField, FieldSource } from '@/types';
import { useBotConfig } from '@/hooks/useBotConfig';
import { ListOptionsEditor } from './ListOptionsEditor';

type ConfigApi = ReturnType<typeof useBotConfig>;

interface Props {
  api: ConfigApi;
}

export function AddFieldModal({ api }: Props) {
  const {
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldPlaceholder, setNewFieldPlaceholder,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    newFieldOptions, setNewFieldOptions,
    newFieldOptionInput, setNewFieldOptionInput,
    newFieldAllowOther, setNewFieldAllowOther,
    newFieldOtherLabel, setNewFieldOtherLabel,
    addField, addListOption, removeListOption,
  } = api;

  const canSave =
    newFieldKey.trim() &&
    newFieldLabel.trim() &&
    (newFieldSource === 'admin' ? newFieldPlaceholder.trim() : newFieldQuestion.trim()) &&
    !(newFieldType === 'list' && newFieldOptions.length === 0);

  return (
    <Modal opened={addFieldOpen} onClose={() => setAddFieldOpen(false)} title="Agregar campo" size="md" centered>
      <Stack>
        <TextInput
          label="Clave (identificador)"
          placeholder="ej: numero_serie"
          description="Solo letras, números y guión bajo. No se puede cambiar después."
          value={newFieldKey}
          onChange={(e) => setNewFieldKey(e.currentTarget.value)}
        />
        <TextInput
          label="Etiqueta (se muestra en tabla)"
          placeholder="ej: Número de Serie"
          value={newFieldLabel}
          onChange={(e) => setNewFieldLabel(e.currentTarget.value)}
        />
        <TextInput
          label={newFieldSource === 'admin' ? 'Placeholder (ejemplo para el admin)' : 'Pregunta (pregunta del bot)'}
          placeholder={newFieldSource === 'admin' ? 'ej: Ingrese el número de serie del equipo' : 'ej: ¿Cuál es el número de serie del equipo?'}
          value={newFieldSource === 'admin' ? newFieldPlaceholder : newFieldQuestion}
          onChange={(e) => {
            if (newFieldSource === 'admin') setNewFieldPlaceholder(e.currentTarget.value);
            else setNewFieldQuestion(e.currentTarget.value);
          }}
        />
        <Select
          label="Tipo de dato"
          value={newFieldType}
          onChange={(val) => { if (val) setNewFieldType(val as BotField['type']); }}
          data={[
            { value: 'string', label: 'Texto' },
            { value: 'numeric', label: 'Número' },
            { value: 'photo', label: 'Fotos / Videos' },
            { value: 'boolean', label: 'Booleano (Sí / No)' },
            { value: 'list', label: 'Lista de opciones' },
          ]}
          allowDeselect={false}
        />

        {newFieldType === 'list' && (
          <ListOptionsEditor
            options={newFieldOptions} setOptions={setNewFieldOptions}
            optionInput={newFieldOptionInput} setOptionInput={setNewFieldOptionInput}
            addOption={addListOption} removeOption={removeListOption}
            allowOther={newFieldAllowOther} setAllowOther={setNewFieldAllowOther}
            otherLabel={newFieldOtherLabel} setOtherLabel={setNewFieldOtherLabel}
            emptyMessage="Aún no hay opciones. Agrega al menos una."
          />
        )}

        <Select
          label="Origen"
          value={newFieldSource}
          onChange={(val) => { if (val) setNewFieldSource(val as FieldSource); }}
          data={[
            { value: 'bot', label: 'Chat (Bot) — el usuario lo envía por WhatsApp' },
            { value: 'admin', label: 'Panel Admin — lo ingresa el administrador' },
          ]}
          allowDeselect={false}
        />
        <Switch
          label="Campo requerido"
          size="sm"
          checked={newFieldRequired}
          onChange={(e) => setNewFieldRequired(e.currentTarget.checked)}
        />
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={() => setAddFieldOpen(false)}>Cancelar</Button>
          <Button onClick={addField} disabled={!canSave}>Agregar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
