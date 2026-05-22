'use client';

import { useState } from 'react';
import { Stack, Group, Text, ActionIcon, Select, MultiSelect, Button } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { BotField } from '@/types';
import { AssignmentRule } from '@/services/users.service';

interface Props {
  rules: AssignmentRule[];
  onAddRule: (fieldKey: string, fieldValues: string[]) => void;
  onRemoveRule: (idx: number) => void;
  configFields: BotField[];
  listFields: BotField[];
  getFieldOptions: (fieldKey: string) => string[];
}

export function RuleBuilder({ rules, onAddRule, onRemoveRule, configFields, listFields, getFieldOptions }: Props) {
  const [ruleFieldKey, setRuleFieldKey] = useState<string | null>(null);
  const [ruleValues, setRuleValues] = useState<string[]>([]);

  const reset = () => { setRuleFieldKey(null); setRuleValues([]); };

  return (
    <>
      {rules.length > 0 && (
        <Stack gap={4}>
          {rules.map((r, i) => {
            const field = configFields.find((f) => f.key === r.fieldKey);
            return (
              <Group
                key={i}
                gap="xs"
                justify="space-between"
                p={6}
                style={{ borderRadius: 4, border: '1px solid var(--mantine-color-default-border)' }}
              >
                <Text size="xs">
                  <Text span fw={600}>{field?.label ?? r.fieldKey}:</Text>{' '}
                  {r.fieldValues.join(', ')}
                </Text>
                <ActionIcon size="xs" color="red" variant="subtle" onClick={() => onRemoveRule(i)}>
                  <IconTrash size={12} />
                </ActionIcon>
              </Group>
            );
          })}
        </Stack>
      )}

      <Select
        label="Campo (tipo lista)"
        placeholder="Selecciona un campo"
        value={ruleFieldKey}
        onChange={(v) => { setRuleFieldKey(v); setRuleValues([]); }}
        data={listFields.map((f) => ({ value: f.key, label: f.label || f.key }))}
        clearable
      />
      {ruleFieldKey && (
        <MultiSelect
          label="Valores que activan la asignación"
          placeholder="Selecciona uno o más valores"
          value={ruleValues}
          onChange={setRuleValues}
          data={getFieldOptions(ruleFieldKey)}
        />
      )}
      <Button
        size="xs"
        variant="light"
        color="violet"
        leftSection={<IconPlus size={12} />}
        disabled={!ruleFieldKey || ruleValues.length === 0}
        onClick={() => { if (ruleFieldKey) { onAddRule(ruleFieldKey, ruleValues); reset(); } }}
      >
        Agregar regla
      </Button>
    </>
  );
}
