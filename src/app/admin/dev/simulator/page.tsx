"use client";

import {
  ActionIcon, Box, Button, Container, FileButton, Group,
  Image, Paper, ScrollArea, Stack, Text, Textarea, TextInput, Title,
} from "@mantine/core";
import { IconPaperclip, IconX } from "@tabler/icons-react";
import { useSimulator } from "@/hooks/useSimulator";

export default function SimulatorPage() {
  const {
    phone, setPhone,
    input, setInput,
    messages,
    pendingFiles,
    loading,
    error,
    viewport,
    resetFileRef,
    handleAddFiles,
    removePendingFile,
    handleSend,
    handleReset,
  } = useSimulator();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <TextInput
          label="Número de teléfono (remitente)"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          mb="md"
          size="xs"
        />

        <Paper withBorder radius="md" style={{ overflow: "hidden" }} mb="sm">
          <Box bg="green.7" p="xs">
            <Text c="white" size="sm" fw={600}>WhatsApp · {phone}</Text>
          </Box>

          <ScrollArea h={420} viewportRef={viewport} p="sm" style={{ background: "#ece5dd" }}>
            {messages.length === 0 && (
              <Text c="dimmed" size="sm" ta="center" mt="xl">
                Escribe un mensaje o adjunta fotos para iniciar la conversación...
              </Text>
            )}
            {messages.map((msg, i) => (
              <Group key={i} justify={msg.from === "user" ? "flex-end" : "flex-start"} mb={6}>
                <Paper p={msg.photoUrl ? 4 : "xs"} radius="md" maw="75%"
                  style={{
                    background: msg.from === "user" ? "#dcf8c6" : "#bffcb2",
                    boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                  {msg.photoUrl ? (
                    <Image src={msg.photoUrl} alt="Foto" radius="sm" fit="cover" mah={220} maw={260} />
                  ) : (
                    <Text size="sm" c="dark">{msg.text}</Text>
                  )}
                </Paper>
              </Group>
            ))}
            {loading && (
              <Group justify="flex-start" mb={6}>
                <Paper p="xs" radius="md" style={{ background: "#ffffff", minWidth: 56 }}>
                  <Text size="sm" c="dimmed">escribiendo…</Text>
                </Paper>
              </Group>
            )}
          </ScrollArea>

          {pendingFiles.length > 0 && (
            <Box p="xs" style={{ background: "#f5f5f5", borderTop: "1px solid #ddd" }}>
              <Text size="xs" c="dimmed" mb={4}>{pendingFiles.length} foto(s) listas para enviar:</Text>
              <Group gap="xs" wrap="wrap">
                {pendingFiles.map((f, i) => (
                  <Box key={i} style={{ position: "relative" }}>
                    <Image src={URL.createObjectURL(f)} alt={f.name} w={64} h={64} radius="sm" fit="cover" />
                    <ActionIcon size="xs" color="red" variant="filled" onClick={() => removePendingFile(i)}
                      style={{ position: "absolute", top: -6, right: -6 }}>
                      <IconX size={12} />
                    </ActionIcon>
                  </Box>
                ))}
              </Group>
            </Box>
          )}

          <Box p="sm" style={{ background: "#f0f0f0", borderTop: "1px solid #ddd" }}>
            {error && <Text c="red" size="xs" mb={6}>{error}</Text>}
            <Group gap="xs" align="flex-end">
              <FileButton resetRef={resetFileRef} onChange={handleAddFiles} accept="image/*" multiple>
                {(props) => (
                  <ActionIcon {...props} size="lg" variant="filled" color="green" disabled={loading} title="Adjuntar fotos">
                    <IconPaperclip size={20} />
                  </ActionIcon>
                )}
              </FileButton>
              <Textarea
                placeholder="Escribe un mensaje…"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                autosize
                minRows={1}
                maxRows={4}
                style={{ flex: 1 }}
                disabled={loading}
              />
              <Button color="green" onClick={handleSend} loading={loading} h={36}>Enviar</Button>
            </Group>
          </Box>
        </Paper>

        <Group justify="space-between">
          <Button size="xs" variant="light" color="gray" onClick={handleReset}>Limpiar chat</Button>
        </Group>
      </Paper>
    </Container>
  );
}
