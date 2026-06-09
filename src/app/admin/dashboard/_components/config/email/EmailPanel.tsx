'use client';

import { useRef } from 'react';
import {
  Stack, Text, Switch, Button, Table, Checkbox, Badge, Group, Loader,
  Tabs, TextInput, Textarea, Tooltip, Divider, Alert,
} from '@mantine/core';
import { BotField, EmailEvent } from '@/types';
import { useEmailConfig } from '@/hooks/useEmailConfig';

interface Props {
  configFields: BotField[];
}

const EVENT_VARS: Record<EmailEvent, { key: string; label: string }[]> = {
  created: [
    { key: 'ticketNumber', label: 'Nº Ticket' },
    { key: 'reporterName', label: 'Reportante' },
    { key: 'reporterPhone', label: 'Teléfono' },
    { key: 'status', label: 'Estado' },
    { key: 'date', label: 'Fecha' },
    { key: 'link', label: 'Botón "Ver ticket"' },
  ],
  statusChanged: [
    { key: 'ticketNumber', label: 'Nº Ticket' },
    { key: 'reporterName', label: 'Reportante' },
    { key: 'reporterPhone', label: 'Teléfono' },
    { key: 'prevStatus', label: 'Estado anterior' },
    { key: 'newStatus', label: 'Estado nuevo' },
    { key: 'date', label: 'Fecha' },
    { key: 'link', label: 'Botón "Ver ticket"' },
  ],
};

const EVENT_LABELS: Record<EmailEvent, string> = {
  created: 'Ticket creado',
  statusChanged: 'Cambio de estado',
};

export function EmailPanel({ configFields }: Props) {
  const {
    config, options, loading, saving,
    recipientFor, toggleRecipientEvent, setNotifyAssignedGestores, setTemplate, save,
  } = useEmailConfig();

  // Custom ticket fields usable as variables (excludes media fields, which can't go in text).
  const ticketFieldVars = configFields
    .filter((f) => f.type !== 'photo' && f.type !== 'video')
    .map((f) => ({ key: f.key, label: f.label }));

  // Track the currently focused textarea/input per template field to insert variables at the cursor.
  const activeFieldRef = useRef<{ el: HTMLTextAreaElement | HTMLInputElement; event: EmailEvent; field: 'subject' | 'body' } | null>(null);

  const insertVar = (varStr: string) => {
    const active = activeFieldRef.current;
    if (!active) return;
    const { el, event, field } = active;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + varStr + el.value.slice(end);
    setTemplate(event, field, next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + varStr.length, start + varStr.length);
    });
  };

  if (loading) return <Loader color="blue" type="bars" mt="md" />;

  const renderTemplate = (event: EmailEvent) => {
    const tpl = config.templates[event];
    return (
      <Stack gap="md">
        <Stack
          gap={4} p="sm"
          style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 6, border: '1px solid var(--mantine-color-blue-2)' }}
        >
          <Text size="xs" fw={700} c="blue.7">
            Variables — haz clic para insertarla donde está el cursor:
          </Text>
          <Group gap={4}>
            {EVENT_VARS[event].map(({ key, label }) => (
              <Tooltip key={key} label={`{${key}}`} withArrow>
                <Button size="xs" variant="light" color="blue" onClick={() => insertVar(`{${key}}`)}>
                  {label}
                </Button>
              </Tooltip>
            ))}
          </Group>

          {ticketFieldVars.length > 0 && (
            <>
              <Text size="xs" fw={700} c="grape.7" mt={6}>
                Campos del ticket:
              </Text>
              <Group gap={4}>
                {ticketFieldVars.map(({ key, label }) => (
                  <Tooltip key={key} label={`{${key}}`} withArrow>
                    <Button size="xs" variant="light" color="grape" onClick={() => insertVar(`{${key}}`)}>
                      {label}
                    </Button>
                  </Tooltip>
                ))}
              </Group>
            </>
          )}
        </Stack>

        <TextInput
          label="Asunto del correo"
          value={tpl.subject}
          onFocus={(e) => { activeFieldRef.current = { el: e.currentTarget, event, field: 'subject' }; }}
          onChange={(e) => setTemplate(event, 'subject', e.currentTarget.value)}
        />
        <Textarea
          label="Cuerpo del correo"
          description="El texto se envuelve automáticamente en el diseño del correo (encabezado y formato)."
          autosize minRows={6}
          value={tpl.body}
          onFocus={(e) => { activeFieldRef.current = { el: e.currentTarget, event, field: 'body' }; }}
          onChange={(e) => setTemplate(event, 'body', e.currentTarget.value)}
        />
      </Stack>
    );
  };

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        Configura quién recibe los correos de notificación y edita las plantillas de cada evento.
      </Text>

      {/* ── Destinatarios ───────────────────────────────────────────── */}
      <div>
        <Text fw={700} mb="xs">Destinatarios</Text>
        <Switch
          label="Notificar automáticamente a los gestores asignados al ticket"
          checked={config.notifyAssignedGestores}
          onChange={(e) => setNotifyAssignedGestores(e.currentTarget.checked)}
          mb="md"
        />

        {options.length === 0 ? (
          <Alert color="gray">No hay administradores ni gestores disponibles para seleccionar.</Alert>
        ) : (
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th ta="center">Ticket creado</Table.Th>
                <Table.Th ta="center">Cambio de estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {options.map((opt) => {
                const rec = recipientFor(opt.id);
                return (
                  <Table.Tr key={opt.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{opt.name}</Text>
                      <Text size="xs" c="dimmed">{opt.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={opt.type === 'admin' ? 'grape' : 'teal'} variant="light">
                        {opt.type === 'admin' ? 'Admin' : 'Gestor'}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Checkbox
                        checked={!!rec?.events.created}
                        onChange={() => toggleRecipientEvent(opt, 'created')}
                        style={{ display: 'inline-block' }}
                      />
                    </Table.Td>
                    <Table.Td ta="center">
                      <Checkbox
                        checked={!!rec?.events.statusChanged}
                        onChange={() => toggleRecipientEvent(opt, 'statusChanged')}
                        style={{ display: 'inline-block' }}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </div>

      <Divider />

      {/* ── Plantillas ──────────────────────────────────────────────── */}
      <div>
        <Text fw={700} mb="xs">Plantillas del correo</Text>
        <Tabs defaultValue="created" variant="pills">
          <Tabs.List mb="md">
            <Tabs.Tab value="created">{EVENT_LABELS.created}</Tabs.Tab>
            <Tabs.Tab value="statusChanged">{EVENT_LABELS.statusChanged}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="created">{renderTemplate('created')}</Tabs.Panel>
          <Tabs.Panel value="statusChanged">{renderTemplate('statusChanged')}</Tabs.Panel>
        </Tabs>
      </div>

      <Group>
        <Button onClick={save} loading={saving}>Guardar configuración de correo</Button>
      </Group>
    </Stack>
  );
}
