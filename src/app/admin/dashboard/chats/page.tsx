"use client";

import {
  Box, Button, Group, Image, Loader, Paper,
  ScrollArea, Stack, Switch, Text, Textarea, Title,
} from "@mantine/core";
import { useWhatsappSessions } from "@/hooks/useWhatsappSessions";

const FROM_COLORS: Record<string, string> = {
  user: "#dcf8c6",
  bot: "#ffffff",
  admin: "#d0e8ff",
};

const FROM_LABELS: Record<string, string> = {
  user: "Usuario",
  bot: "Bot",
  admin: "Admin",
};

export default function ChatsPage() {
  const {
    sessions,
    hostNames,
    selectedPhone, setSelectedPhone,
    selectedSession,
    input, setInput,
    sending,
    error,
    botEnabled,
    togglingBot,
    viewport,
    handleSend,
    handleToggleBot,
  } = useWhatsappSessions();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper p="md" shadow="sm" radius="md" withBorder style={{ height: "calc(100vh - 120px)" }}>
      <Group mb="md">
        <Title order={2}>Chats WhatsApp</Title>
      </Group>

      <Group align="flex-start" style={{ height: "calc(100% - 56px)" }} gap={0}>
        {/* ── Panel izquierdo: lista de sesiones ── */}
        <Box style={{ width: 260, height: "100%", borderRight: "1px solid #dee2e6", overflowY: "auto", flexShrink: 0 }}>
          {sessions.length === 0 && (
            <Text c="dimmed" size="sm" p="md">No hay conversaciones aún.</Text>
          )}
          {sessions.map((s) => (
            <Box
              key={s.phone}
              p="sm"
              onClick={() => setSelectedPhone(s.phone)}
              style={{
                cursor: "pointer",
                background: selectedPhone === s.phone ? "#455545" : "transparent",
                borderBottom: "1px solid #6f9b75",
              }}
            >
              <Text fw={600} size="sm">{hostNames[s.phone] ?? s.phone}</Text>
              <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.lastMessage || "Sin mensajes"}
              </Text>
            </Box>
          ))}
        </Box>

        {/* ── Panel derecho: conversación ── */}
        <Box style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
          {!selectedPhone ? (
            <Text c="dimmed" size="sm" p="xl" ta="center">Selecciona una conversación para ver los mensajes.</Text>
          ) : !selectedSession ? (
            <Loader m="xl" />
          ) : (
            <>
              <Box p="sm" style={{ borderBottom: "1px solid #dee2e6", background: "#6e8f6d", flexShrink: 0 }}>
                <Group justify="space-between" mb="xs">
                  <Box>
                    <Text fw={700} c="dark">{hostNames[selectedPhone!] ?? selectedPhone}</Text>
                  </Box>
                  <Switch
                    label={botEnabled ? "Bot activo" : "Bot inactivo"}
                    checked={botEnabled}
                    onChange={(e) => handleToggleBot(e.currentTarget.checked)}
                    disabled={togglingBot}
                    color="green"
                  />
                </Group>
              </Box>

              <ScrollArea style={{ flex: 1, background: "#ece5dd" }} viewportRef={viewport} p="sm">
                {selectedSession.messages.length === 0 && (
                  <Text c="dimmed" size="sm" ta="center" mt="xl">Sin mensajes aún.</Text>
                )}
                {selectedSession.messages.map((msg, i) => (
                  <Group key={i} justify={msg.from === "user" ? "flex-start" : "flex-end"} mb={6}>
                    <Box>
                      <Text size="xs" c="dimmed" mb={2} ta={msg.from === "user" ? "left" : "right"}>
                        {FROM_LABELS[msg.from]}
                      </Text>
                      <Paper p={msg.photoUrl ? 4 : "xs"} radius="md" maw={360}
                        style={{ background: FROM_COLORS[msg.from] ?? "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.15)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {msg.photoUrl ? (
                          <Stack gap={4}>
                            <Image src={msg.photoUrl} alt="Foto del chat" radius="sm" fit="cover" mah={220} maw={260} />
                            {msg.text && <Text size="sm" c="dark">{msg.text}</Text>}
                          </Stack>
                        ) : (
                          <Text size="sm" c="dark">{msg.text || "[imagen]"}</Text>
                        )}
                        <Text size="xs" c="dimmed" ta="right">{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                      </Paper>
                    </Box>
                  </Group>
                ))}
              </ScrollArea>

              <Box p="sm" style={{ borderTop: "1px solid #dee2e6", background: "#f0f0f0", flexShrink: 0 }}>
                {error && <Text c="red" size="xs" mb={4}>{error}</Text>}
                <Group gap="xs" align="flex-end">
                  <Textarea
                    placeholder="Escribe un mensaje como admin…"
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    autosize
                    minRows={1}
                    maxRows={4}
                    style={{ flex: 1 }}
                    disabled={sending}
                  />
                  <Button color="blue" onClick={handleSend} loading={sending} h={36}>Enviar</Button>
                </Group>
              </Box>
            </>
          )}
        </Box>
      </Group>
    </Paper>
  );
}
