"use client";

import { useParams } from "next/navigation";
import {
  Title, Paper, Group, Text, Badge, Button, Stack, Loader,
  Alert, Image, SimpleGrid, Timeline, Collapse, ActionIcon,
  Tooltip, FileButton, Box, Textarea, Modal,
} from "@mantine/core";
import { TicketStatus } from "@/types";
import { useTicketDetail } from "@/hooks/useTicketDetail";

const STATUS_COLORS: Record<TicketStatus, string> = {
  REPORTADO: "gray", REVISION: "blue", EN_REPARACION: "yellow",
  REPARADO: "teal", ENTREGADO: "green", FINALIZADO: "green", ARCHIVADO: "",
};

const STATUS_OPTIONS: TicketStatus[] = [
  "REPORTADO", "REVISION", "EN_REPARACION", "REPARADO", "ENTREGADO", "FINALIZADO",
];

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const {
    ticket,
    timeline,
    observations, setObservations,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    evidenceExpanded, setEvidenceExpanded,
    repairExpanded, setRepairExpanded,
    deletingPhotoIdx,
    deletingRepairIdx,
    repairFiles, setRepairFiles,
    uploadingRepair,
    repairFileInputRef,
    savingObservations,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus,
    deleteEvidencePhoto,
    deleteRepairPhoto,
    uploadRepairPhotos,
    saveObservations,
    requestFieldImprovement,
  } = useTicketDetail(ticketId);

  if (!ticket) return <Loader color="blue" type="bars" mt="xl" />;

  return (
    <Paper p="lg" shadow="sm" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Detalle de Ticket: {ticket.ticketNumber}</Title>
        <Badge size="xl" color={ticket.status === "ENTREGADO" ? "green" : "blue"}>
          {ticket.status}
        </Badge>
      </Group>

      {errorStatus && (
        <Alert color="red" title="Error" mb="md" withCloseButton onClose={() => setErrorStatus(null)}>
          {errorStatus}
        </Alert>
      )}

      <Stack gap="md" mb="xl" bg="gray.0" p="md" c="black" style={{ borderRadius: "8px" }}>
        {ticket.ciudad && (
          <Group justify="space-between">
            <Group>
              <Text fw={700}>Ciudad:</Text>
              <Text>{ticket.ciudad}</Text>
            </Group>
            <Tooltip label="Solicitar mejora al usuario">
              <ActionIcon variant="filled" color="orange" size="sm" onClick={() => setRequestModal({ fieldKey: "ciudad", fieldLabel: "Ciudad" })}>✎</ActionIcon>
            </Tooltip>
          </Group>
        )}

        {ticket.canal && (
          <Group justify="space-between">
            <Group>
              <Text fw={700}>Canal:</Text>
              <Text>{ticket.canal}</Text>
            </Group>
            <Tooltip label="Solicitar mejora al usuario">
              <ActionIcon variant="filled" color="orange" size="sm" onClick={() => setRequestModal({ fieldKey: "canal", fieldLabel: "Canal" })}>✎</ActionIcon>
            </Tooltip>
          </Group>
        )}

        <Group justify="space-between">
          <Group>
            <Text fw={700}>Punto Afectado:</Text>
            <Text>{ticket.point?.name || "---"}</Text>
          </Group>
          <Tooltip label="Solicitar mejora al usuario">
            <ActionIcon variant="filled" color="orange" size="sm" onClick={() => setRequestModal({ fieldKey: "punto", fieldLabel: "Punto de Venta" })}>✎</ActionIcon>
          </Tooltip>
        </Group>

        <Group>
          <Text fw={700}>Reportado Por:</Text>
          <Text>{ticket.reporter?.name} ({ticket.reporter?.phone})</Text>
        </Group>

        {(ticket.novelty?.type || ticket.extraFields?.['novelty.type']) && (
          <Group justify="space-between">
            <Group>
              <Text fw={700}>Tipo de Novedad:</Text>
              <Text>{ticket.novelty?.type || ticket.extraFields?.['novelty.type']}</Text>
            </Group>
            <Tooltip label="Solicitar mejora al usuario">
              <ActionIcon variant="filled" color="orange" size="sm" onClick={() => setRequestModal({ fieldKey: "novelty.type", fieldLabel: "Tipo de Novedad" })}>✎</ActionIcon>
            </Tooltip>
          </Group>
        )}

        <Group justify="space-between">
          <Group>
            <Text fw={700}>Descripción de la Novedad:</Text>
            <Text>{ticket.novelty?.description || ticket.extraFields?.['novelty.description'] || "Sin descripción"}</Text>
          </Group>
          <Tooltip label="Solicitar mejora al usuario">
            <ActionIcon variant="filled" color="orange" size="sm" onClick={() => setRequestModal({ fieldKey: "novelty.description", fieldLabel: "Descripción de la Novedad" })}>✎</ActionIcon>
          </Tooltip>
        </Group>

        <Stack gap="xs">
          <Button variant="light" fullWidth onClick={() => setHistoryExpanded(!historyExpanded)} justify="space-between">
            <Text fw={700}>Historial de Estados ({timeline.length})</Text>
            <Text>{historyExpanded ? "▼" : "▶"}</Text>
          </Button>
          <Collapse expanded={historyExpanded}>
            {timeline.length === 0 ? (
              <Text c="dimmed" size="sm">Sin registros aún.</Text>
            ) : (
              <Timeline active={timeline.length - 1} bulletSize={20} lineWidth={2} mt="xs">
                {timeline.map((entry, idx) => (
                  <Timeline.Item key={idx} title={<Badge color={STATUS_COLORS[entry.status] || "gray"}>{entry.status}</Badge>}>
                    <Text size="sm">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "---"}</Text>
                    {entry.comments && <Text size="xs" c="dimmed">{entry.comments}</Text>}
                    {entry.changedBy?.role && (
                      <Text size="xs" c="dimmed">
                        Por: {entry.changedBy.role}{entry.changedBy.uid ? ` (${entry.changedBy.uid.slice(0, 8)}…)` : ""}
                      </Text>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Collapse>
        </Stack>
      </Stack>

      {/* ── Fotos de Evidencia ── */}
      <Stack gap="xs" mb="xl" mt="xl">
        <Button variant="light" fullWidth onClick={() => setEvidenceExpanded(!evidenceExpanded)} justify="space-between">
          <Text fw={700}>📷 Evidencia del Problema ({ticket.photos?.evidence?.length ?? 0} fotos)</Text>
          <Text>{evidenceExpanded ? "▼" : "▶"}</Text>
        </Button>
        <Collapse expanded={evidenceExpanded}>
          {ticket.photos?.evidence && ticket.photos.evidence.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
              {ticket.photos.evidence.map((photoUrl, idx) => (
                <Paper key={idx} p="xs" withBorder radius="md" style={{ position: "relative" }}>
                  <Image src={photoUrl} alt={`Evidencia ${idx + 1}`} radius="md" fit="cover" h={200} />
                  <Tooltip label="Eliminar foto" withArrow>
                    <ActionIcon color="red" variant="filled" size="sm" style={{ position: "absolute", top: 12, right: 12 }}
                      onClick={() => deleteEvidencePhoto(idx)} loading={deletingPhotoIdx === idx}>✕</ActionIcon>
                  </Tooltip>
                  <Text size="xs" c="dimmed" ta="center" mt={4}>Foto {idx + 1}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <Alert color="gray" title="Sin evidencia" mt="sm">No hay fotos adjuntas para este ticket.</Alert>
          )}
        </Collapse>
      </Stack>

      {/* ── Fotos de Reparación ── */}
      <Stack gap="xs" mb="md">
        <Button variant="light" color="teal" fullWidth onClick={() => setRepairExpanded(!repairExpanded)} justify="space-between">
          <Text fw={700}>🔧 Evidencias de Reparación ({ticket.photos?.repair?.length ?? 0} fotos)</Text>
          <Text>{repairExpanded ? "▼" : "▶"}</Text>
        </Button>
        <Collapse expanded={repairExpanded}>
          {ticket.photos?.repair && ticket.photos.repair.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
              {ticket.photos.repair.map((photoUrl, idx) => (
                <Paper key={idx} p="xs" withBorder radius="md" style={{ position: "relative" }}>
                  <Image src={photoUrl} alt={`Reparación ${idx + 1}`} radius="md" fit="cover" h={200} />
                  <Tooltip label="Eliminar foto" withArrow>
                    <ActionIcon color="red" variant="filled" size="sm" style={{ position: "absolute", top: 12, right: 12 }}
                      onClick={() => deleteRepairPhoto(idx)} loading={deletingRepairIdx === idx}>✕</ActionIcon>
                  </Tooltip>
                  <Text size="xs" c="dimmed" ta="center" mt={4}>Reparación {idx + 1}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <Alert color="gray" title="Sin evidencias de reparación" mt="sm">No hay fotos de reparación adjuntas.</Alert>
          )}
        </Collapse>
      </Stack>

      <Box mb="xl">
        <FileButton resetRef={repairFileInputRef} onChange={(files) => setRepairFiles(files)} accept="image/*" multiple>
          {(props) => (
            <Button {...props} variant="light" color="teal" mr="sm">
              Seleccionar fotos de reparación
            </Button>
          )}
        </FileButton>
        {repairFiles.length > 0 && (
          <>
            <Text size="sm" c="dimmed" mt="xs" mb="xs">
              {repairFiles.length} archivo(s) seleccionado(s): {repairFiles.map((f) => f.name).join(", ")}
            </Text>
            <Button onClick={uploadRepairPhotos} loading={uploadingRepair} color="teal">
              Subir fotos de reparación
            </Button>
          </>
        )}
      </Box>

      {/* ── Máquina de Estados ── */}
      <Title order={4} mb="xs">Estados de Reparación</Title>
      <Group gap="sm">
        {STATUS_OPTIONS.map((status) => (
          <Button key={status} onClick={() => changeStatus(status)}
            loading={loadingStatus === status}
            disabled={ticket.status === status || loadingStatus !== null}
            color={ticket.status === status ? "gray" : "dark"}
            variant={ticket.status === status ? "filled" : "outline"}>
            Mover a {status}
          </Button>
        ))}
      </Group>

      {/* ── Observaciones del Admin ── */}
      <Box mt="xl">
        <Title order={4} mb="xs">Observaciones del Ticket</Title>
        <Text size="sm" c="dimmed" mb="sm">Notas internas del administrador. No se envían al usuario.</Text>
        <Textarea
          placeholder="Agrega observaciones o comentarios sobre este ticket..."
          value={observations}
          onChange={(e) => setObservations(e.currentTarget.value)}
          minRows={3}
          autosize
          mb="sm"
        />
        <Button onClick={saveObservations} loading={savingObservations} variant="light" color="blue">
          Guardar observaciones
        </Button>
      </Box>

      <Modal
        opened={!!requestModal}
        onClose={() => { setRequestModal(null); setRequestMessage(""); }}
        title={`Solicitar mejora: ${requestModal?.fieldLabel}`}
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
            <Button variant="default" onClick={() => { setRequestModal(null); setRequestMessage(""); }}>Cancelar</Button>
            <Button color="orange" loading={requestingField} onClick={requestFieldImprovement}>Enviar solicitud</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
