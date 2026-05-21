"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Title, Paper, Group, Text, Badge, Button, Stack, Loader,
  Alert, Image, SimpleGrid, Timeline, Collapse, ActionIcon,
  Tooltip, FileButton, Box, Textarea, Modal, TextInput, Select,
} from "@mantine/core";
import { BotField, FieldType, TicketStatus } from "@/types";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { useBotConfig } from "@/hooks/useBotConfig";

const STATUS_COLORS: Record<TicketStatus, string> = {
  REPORTADO: "gray",
  EN_PROGRAMACION: "blue",
  PROGRAMADO: "cyan",
  REPROGRAMADO: "orange",
  REPARADO: "teal",
  FINALIZADO: "green",
  ARCHIVADO: "",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  REPORTADO: "Reportado",
  EN_PROGRAMACION: "En programación",
  PROGRAMADO: "Programado",
  REPROGRAMADO: "Reprogramado",
  REPARADO: "Reparado",
  FINALIZADO: "Finalizado",
  ARCHIVADO: "Archivado",
};

const STATUS_OPTIONS: TicketStatus[] = [
  "REPORTADO", "EN_PROGRAMACION", "PROGRAMADO", "REPROGRAMADO", "REPARADO", "FINALIZADO",
];

function getNestedFieldValue(obj: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, obj);
}

// ── Componente acordeón para campos de foto ──────────────────────────────────
function PhotoFieldAccordion({
  field,
  photos,
  mediaKind,
  ticketId,
  expanded,
  onToggle,
  onDelete,
  onUpload,
  uploadingField,
  deletingPhoto,
}: {
  field: BotField;
  photos: string[];
  mediaKind: 'photo' | 'video';
  ticketId: string;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (fieldKey: string, idx: number) => void;
  onUpload: (fieldKey: string, files: File[]) => void;
  uploadingField: string | null;
  deletingPhoto: { fieldKey: string; idx: number } | null;
}) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const resetRef = useRef<(() => void) | null>(null);

  const count = photos.length;
  const isUploading = uploadingField === field.key;

  const handleUpload = () => {
    if (!pendingFiles.length) return;
    onUpload(field.key, pendingFiles);
    setPendingFiles([]);
    resetRef.current?.();
  };

  return (
    <Stack gap="xs">
      <Button
        variant="light"
        color="blue"
        fullWidth
        onClick={onToggle}
        justify="space-between"
      >
        <Text fw={700}>
          📎 {field.label} ({count} {count === 1 ? "archivo" : "archivos"})
        </Text>
        <Text>{expanded ? "▼" : "▶"}</Text>
      </Button>
      <Collapse expanded={expanded}>
        {count > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
            {photos.map((photoUrl, idx) => (
              <Paper key={idx} p="xs" withBorder radius="md" style={{ position: "relative" }}>
                {mediaKind === 'video' ? (
                  <video
                    src={photoUrl}
                    controls
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <Image src={photoUrl} alt={`${field.label} ${idx + 1}`} radius="md" fit="cover" h={200} />
                )}
                <Tooltip label="Eliminar foto" withArrow>
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    style={{ position: "absolute", top: 12, right: 12 }}
                    onClick={() => onDelete(field.key, idx)}
                    loading={deletingPhoto?.fieldKey === field.key && deletingPhoto?.idx === idx}
                  >
                    ✕
                  </ActionIcon>
                </Tooltip>
                <Text size="xs" c="dimmed" ta="center" mt={4}>Foto {idx + 1}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Alert color="gray" mt="sm">No hay fotos en este campo.</Alert>
        )}

        {/* Subir nuevos archivos multimedia */}
        <Box mt="sm">
          <FileButton
            resetRef={resetRef}
            onChange={(files) => setPendingFiles(files)}
            accept="image/*,video/*"
            multiple
          >
            {(props) => (
              <Button {...props} variant="light" size="xs" color="gray">
                Seleccionar archivos
              </Button>
            )}
          </FileButton>
          {pendingFiles.length > 0 && (
            <Group gap="xs" mt="xs">
              <Text size="xs" c="dimmed">{pendingFiles.length} archivo(s) seleccionado(s)</Text>
              <Button size="xs" color="teal" onClick={handleUpload} loading={isUploading}>
                Subir {pendingFiles.length} archivo(s)
              </Button>
              <Button size="xs" variant="subtle" color="red" onClick={() => { setPendingFiles([]); resetRef.current?.(); }}>
                Cancelar
              </Button>
            </Group>
          )}
        </Box>
      </Collapse>
    </Stack>
  );
}

function AdminFieldEditor({
  field,
  value,
  onSave,
  saving,
}: {
  field: BotField;
  value: string | string[] | undefined;
  onSave: (fieldKey: string, value: string) => Promise<void>;
  saving: boolean;
}) {
  const normalizeValue = (raw: string | string[] | undefined) => {
    if (Array.isArray(raw)) return raw.join(', ');
    return typeof raw === 'string' ? raw : '';
  };

  const [draft, setDraft] = useState(normalizeValue(value));

  useEffect(() => {
    setDraft(normalizeValue(value));
  }, [value, field.key]);

  const hasValue = normalizeValue(value).trim().length > 0;
  const placeholder = field.placeholder || field.question || `Completa ${field.label}`;

  const handleSave = async () => {
    const nextValue = draft.trim();
    if (!nextValue) return;
    await onSave(field.key, nextValue);
  };

  const input = (() => {
    if (field.type === 'list' && field.options && field.options.length > 0) {
      return (
        <Select
          value={draft || null}
          onChange={(val) => setDraft(val || '')}
          data={field.options.map((opt) => ({ value: opt, label: opt }))}
          placeholder={placeholder}
          allowDeselect
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <Select
          value={draft || null}
          onChange={(val) => setDraft(val || '')}
          data={[
            { value: 'true', label: 'Sí' },
            { value: 'false', label: 'No' },
          ]}
          placeholder={placeholder}
          allowDeselect
        />
      );
    }

    if (field.type === 'numeric' || field.type === 'date') {
      return (
        <TextInput
          type={field.type === 'numeric' ? 'number' : 'date'}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder={placeholder}
        />
      );
    }

    return (
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        placeholder={placeholder}
        autosize
        minRows={2}
      />
    );
  })();

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text fw={700} size="sm">{field.label}</Text>
            <Text size="xs" c="dimmed">
              {hasValue ? 'Ya está lleno. Puedes actualizarlo.' : 'Aún está vacío. Completa el campo.'}
            </Text>
          </div>
        </Group>

        {input}

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {field.placeholder ? `Ejemplo: ${field.placeholder}` : 'Este campo es editable por el administrador.'}
          </Text>
          <Button size="xs" onClick={handleSave} loading={saving} disabled={!draft.trim()}>
            {hasValue ? 'Actualizar campo' : 'Guardar campo'}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const {
    ticket,
    hostName,
    timeline,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    expandedFields,
    toggleField,
    deletingPhoto,
    uploadingField,
    updatingFieldKey,
    scheduledModal, setScheduledModal,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    scheduledDateError,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus,
    confirmScheduledTransition,
    deletePhoto,
    uploadPhotos,
    updateExtraField,
    requestFieldImprovement,
  } = useTicketDetail(ticketId);

  const { configFields } = useBotConfig();

  if (!ticket) return <Loader color="blue" type="bars" mt="xl" />;

  const extraFields = ticket.extraFields || {};
  const isTicketClosed = ticket.status === 'ARCHIVADO' || ticket.status === 'FINALIZADO';

  return (
    <Paper p="lg" shadow="sm" radius="md" withBorder>
      {/* ── Encabezado ── */}
      <Group justify="space-between" mb="lg">
        <Title order={2}>Ticket: {ticket.ticketNumber}</Title>
        <Badge size="xl" color={STATUS_COLORS[ticket.status] || "gray"}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      </Group>

      {errorStatus && (
        <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setErrorStatus(null)}>
          {errorStatus}
        </Alert>
      )}

      {/* ── Info del sistema ── */}
      <Stack gap="xs" mb="xl" bg="gray.0" p="md" style={{ borderRadius: "8px" }}>
        <Group>
          <Text fw={700} size="sm" c="dimmed">Reportado Por:</Text>
          <Text c="dark">{hostName || ticket.reporter?.name || ticket.reporter?.phone || "—"}</Text>
        </Group>
        <Group>
          <Text fw={700} size="sm" c="dimmed">Fecha de creación:</Text>
          <Text c="dark">
            {ticket.timestamps?.createdAt
              ? new Date(ticket.timestamps.createdAt).toLocaleString("es-CO")
              : "—"}
          </Text>
        </Group>
      </Stack>

      {/* ── Campos configurados ── */}
      <Stack gap="md" mb="xl">
        {configFields.map((field) => {
          const isMediaField = field.type === 'photo' || field.type === 'video';
          const isAdminField = field.source === 'admin' && !isMediaField;
          const value = getNestedFieldValue(extraFields, field.key) as string | string[] | undefined;

          if (isMediaField) {
            const photos = Array.isArray(value) ? value : [];
            return (
              <PhotoFieldAccordion
                key={field.key}
                field={field}
                photos={photos}
                mediaKind={field.type === 'video' ? 'video' : 'photo'}
                ticketId={ticketId}
                expanded={!!expandedFields[field.key]}
                onToggle={() => toggleField(field.key)}
                onDelete={deletePhoto}
                onUpload={uploadPhotos}
                uploadingField={uploadingField}
                deletingPhoto={deletingPhoto}
              />
            );
          }

          if (isAdminField) {
            return (
              <AdminFieldEditor
                key={field.key}
                field={field}
                value={value}
                saving={updatingFieldKey === field.key}
                onSave={updateExtraField}
              />
            );
          }

          // Campo de texto / numérico / booleano / lista
          const displayValue = typeof value === "string"
            ? (value === "true" ? "Sí" : value === "false" ? "No" : value)
            : "—";

          return (
            <Group key={field.key} justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} size="sm" style={{ whiteSpace: "nowrap" }}>{field.label}:</Text>
                <Text style={{ wordBreak: "break-word" }}>{displayValue}</Text>
              </Group>
              <Tooltip
                label={isTicketClosed ? "No se pueden enviar mensajes en tickets Archivados o Finalizados" : "Solicitar actualización al usuario"}
                withArrow
              >
                <ActionIcon
                  variant="filled"
                  color="orange"
                  size="sm"
                  style={{ flexShrink: 0 }}
                  disabled={isTicketClosed}
                  onClick={() => !isTicketClosed && setRequestModal({ fieldKey: field.key, fieldLabel: field.label })}
                >
                  ✎
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        })}

        {configFields.length === 0 && (
          <Text size="sm" c="dimmed">No hay campos configurados. Ve a Info Tickets → Campos ticket para agregar campos.</Text>
        )}
      </Stack>

      {/* ── Historial de estados ── */}
      <Stack gap="xs" mb="xl">
        <Button
          variant="light"
          fullWidth
          onClick={() => setHistoryExpanded(!historyExpanded)}
          justify="space-between"
        >
          <Text fw={700}>Historial de Estados ({timeline.length})</Text>
          <Text>{historyExpanded ? "▼" : "▶"}</Text>
        </Button>
        <Collapse expanded={historyExpanded}>
          {timeline.length === 0 ? (
            <Text c="dimmed" size="sm">Sin registros aún.</Text>
          ) : (
            <Timeline active={timeline.length - 1} bulletSize={20} lineWidth={2} mt="xs">
              {timeline.map((entry, idx) => (
                <Timeline.Item
                  key={idx}
                  title={
                    <Badge color={STATUS_COLORS[entry.status] || "gray"}>
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </Badge>
                  }
                >
                  <Text size="sm">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString("es-CO") : "—"}
                  </Text>
                  {entry.scheduledDate && (() => {
                    const d = new Date(entry.scheduledDate);
                    return !isNaN(d.getTime()) ? (
                      <Text size="xs" c="cyan">
                        Fecha programada: {d.toLocaleString("es-CO")}
                      </Text>
                    ) : null;
                  })()}
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </Collapse>
      </Stack>

      {/* ── Cambiar estado ── */}
      <Title order={4} mb="xs">Cambiar Estado</Title>
      <Group gap="sm" mb="xl" wrap="wrap">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            onClick={() => changeStatus(status)}
            loading={loadingStatus === status}
            disabled={ticket.status === status || loadingStatus !== null}
            color={ticket.status === status ? "gray" : STATUS_COLORS[status] || "dark"}
            variant={ticket.status === status ? "filled" : "outline"}
            size="sm"
          >
            {STATUS_LABELS[status]}
          </Button>
        ))}
      </Group>

      {/* ── Modal: fecha programada ── */}
      <Modal
        opened={!!scheduledModal}
        onClose={() => setScheduledModal(null)}
        title={`Programar ticket — ${scheduledModal ? STATUS_LABELS[scheduledModal.status] : ''}`}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Para cambiar el ticket a <strong>{scheduledModal ? STATUS_LABELS[scheduledModal.status] : ''}</strong>{" "}
            debes indicar la fecha de atención programada.
          </Text>
          <Group grow>
            <TextInput
              type="date"
              label="Fecha programada"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.currentTarget.value)}
              error={scheduledDateError}
            />
            <TextInput
              type="time"
              label="Hora programada"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.currentTarget.value)}
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setScheduledModal(null)}>
              Cancelar
            </Button>
            <Button
              color={scheduledModal ? STATUS_COLORS[scheduledModal.status] || "dark" : "dark"}
              loading={loadingStatus !== null}
              onClick={confirmScheduledTransition}
            >
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal: solicitar mejora de campo ── */}
      <Modal
        opened={!!requestModal}
        onClose={() => { setRequestModal(null); setRequestMessage(""); }}
        title={`Solicitar actualización: ${requestModal?.fieldLabel}`}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Se enviará un mensaje por WhatsApp al usuario pidiéndole que actualice{" "}
            <strong>{requestModal?.fieldLabel}</strong> del ticket{" "}
            <strong>{ticket.ticketNumber}</strong>.
          </Text>
          <Textarea
            label="Mensaje adicional (opcional)"
            placeholder="Ej: La descripción debe incluir el modelo del equipo afectado."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.currentTarget.value)}
            minRows={2}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setRequestModal(null); setRequestMessage(""); }}>
              Cancelar
            </Button>
            <Button color="orange" loading={requestingField} onClick={requestFieldImprovement}>
              Enviar solicitud
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
