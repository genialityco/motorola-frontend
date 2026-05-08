"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Title, Paper, Group, Text, Badge, Button, Stack, Loader,
  Alert, Image, SimpleGrid, Timeline, Collapse, ActionIcon,
  Tooltip, FileButton, Box, Textarea, Modal,
} from "@mantine/core";
import { BotField, FieldType, TicketStatus } from "@/types";
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { useBotConfig } from "@/hooks/useBotConfig";

const STATUS_COLORS: Record<TicketStatus, string> = {
  REPORTADO: "gray", REVISION: "blue", EN_REPARACION: "yellow",
  REPARADO: "teal", ENTREGADO: "green", FINALIZADO: "green", ARCHIVADO: "",
};

const STATUS_OPTIONS: TicketStatus[] = [
  "REPORTADO", "REVISION", "EN_REPARACION", "REPARADO", "ENTREGADO", "FINALIZADO",
];

// ── Componente acordeón para campos de foto ──────────────────────────────────
function PhotoFieldAccordion({
  field,
  photos,
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
          📷 {field.label} ({count} {count === 1 ? "foto" : "fotos"})
        </Text>
        <Text>{expanded ? "▼" : "▶"}</Text>
      </Button>
      <Collapse expanded={expanded}>
        {count > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
            {photos.map((photoUrl, idx) => (
              <Paper key={idx} p="xs" withBorder radius="md" style={{ position: "relative" }}>
                <Image src={photoUrl} alt={`${field.label} ${idx + 1}`} radius="md" fit="cover" h={200} />
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

        {/* Subir nuevas fotos (solo si es campo admin o de cualquier tipo) */}
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const {
    ticket,
    timeline,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    expandedFields,
    toggleField,
    deletingPhoto,
    uploadingField,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus,
    deletePhoto,
    uploadPhotos,
    requestFieldImprovement,
  } = useTicketDetail(ticketId);

  const { configFields } = useBotConfig();

  if (!ticket) return <Loader color="blue" type="bars" mt="xl" />;

  const extraFields = ticket.extraFields || {};

  return (
    <Paper p="lg" shadow="sm" radius="md" withBorder>
      {/* ── Encabezado ── */}
      <Group justify="space-between" mb="lg">
        <Title order={2}>Ticket: {ticket.ticketNumber}</Title>
        <Badge size="xl" color={STATUS_COLORS[ticket.status] || "gray"}>
          {ticket.status}
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
          <Text>{ticket.reporter?.name || "—"} ({ticket.reporter?.phone || "—"})</Text>
        </Group>
        <Group>
          <Text fw={700} size="sm" c="dimmed">Fecha de creación:</Text>
          <Text>
            {ticket.timestamps?.createdAt
              ? new Date(ticket.timestamps.createdAt).toLocaleString("es-CO")
              : "—"}
          </Text>
        </Group>
      </Stack>

      {/* ── Campos configurados ── */}
      <Stack gap="md" mb="xl">
        {configFields.map((field) => {
          const isPhotoField = field.type === ("photo" as FieldType);
          const value = extraFields[field.key];

          if (isPhotoField) {
            const photos = Array.isArray(value) ? value : [];
            return (
              <PhotoFieldAccordion
                key={field.key}
                field={field}
                photos={photos}
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
              <Tooltip label="Solicitar actualización al usuario" withArrow>
                <ActionIcon
                  variant="filled"
                  color="orange"
                  size="sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => setRequestModal({ fieldKey: field.key, fieldLabel: field.label })}
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
                    <Badge color={STATUS_COLORS[entry.status] || "gray"}>{entry.status}</Badge>
                  }
                >
                  <Text size="sm">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString("es-CO") : "—"}
                  </Text>
                  {entry.comments && <Text size="xs" c="dimmed">{entry.comments}</Text>}
                  {entry.changedBy?.role && (
                    <Text size="xs" c="dimmed">
                      Por: {entry.changedBy.role}
                      {entry.changedBy.uid ? ` (${entry.changedBy.uid.slice(0, 8)}…)` : ""}
                    </Text>
                  )}
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
            color={ticket.status === status ? "gray" : "dark"}
            variant={ticket.status === status ? "filled" : "outline"}
            size="sm"
          >
            {status}
          </Button>
        ))}
      </Group>

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
