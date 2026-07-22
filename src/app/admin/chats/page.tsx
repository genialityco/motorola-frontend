"use client";

import {
  Container, Title, Paper, Group, TextInput, Button, Stack,
  ScrollArea, Text, Image, Badge, Box, Loader, Alert, Tooltip,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useWhatsappHistory } from "@/hooks/useWhatsappHistory";

export default function ChatsPage() {
  const {
    phoneSearch, setPhoneSearch,
    selectedPhone,
    messages,
    loading,
    error,
    replyText, setReplyText,
    sendingReply,
    search,
    sendReply,
  } = useWhatsappHistory();

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">💬 Chats con Usuarios</Title>

      <Paper p="lg" shadow="sm" radius="md" withBorder mb="xl">
        <form onSubmit={search}>
          <Group>
            <TextInput
              placeholder="Buscar por número de teléfono (ej: 573001234567)"
              leftSection={<IconSearch size={16} />}
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.currentTarget.value)}
              flex={1}
            />
            <Button type="submit" loading={loading}>Buscar</Button>
          </Group>
        </form>
      </Paper>

      {selectedPhone && (
        <Paper shadow="sm" radius="md" withBorder>
          <Box bg="blue.6" p="md">
            <Group justify="space-between">
              <Text c="white" fw={600} size="lg">Conversación con {selectedPhone}</Text>
              <Badge color="cyan">Chat Activo</Badge>
            </Group>
          </Box>

          {error && <Alert color="red" title="Error" p="md">{error}</Alert>}

          <ScrollArea h={500} p="md" style={{ background: "#f8f8f8" }}>
            {loading && (
              <Stack align="center">
                <Loader />
                <Text c="dimmed">Cargando conversación...</Text>
              </Stack>
            )}
            {messages.length === 0 && !loading && (
              <Text c="dimmed" ta="center" mt="xl">Sin mensajes o conversación vacía.</Text>
            )}
            {messages.map((msg, i) => (
              <Group key={i} justify={msg.from === "user" ? "flex-end" : "flex-start"} mb="sm">
                <Paper p={msg.photoUrl ? 4 : "xs"} radius="md" maw="70%"
                  style={{
                    background: msg.from === "user" ? "#dcf8c6" : msg.from === "admin" ? "#fff3cd" : "#ffffff",
                    boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                  }}>
                  <Stack gap={4}>
                    {msg.photoUrl ? (
                      <Image src={msg.photoUrl} alt="Foto del chat" radius="sm" fit="cover" mah={220} maw={260} />
                    ) : (
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</Text>
                    )}
                    <Text size="xs" c="dimmed">{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                    {msg.deliveryError && (
                      <Tooltip label={msg.deliveryError} withArrow multiline w={280}>
                        <Badge color="red" variant="light" size="xs">No entregado</Badge>
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
              </Group>
            ))}
          </ScrollArea>

          <Box p="md" style={{ borderTop: "1px solid #ddd" }}>
            <Group>
              <TextInput
                placeholder="Escribe una respuesta..."
                value={replyText}
                onChange={(e) => setReplyText(e.currentTarget.value)}
                flex={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <Button onClick={sendReply} loading={sendingReply} disabled={!replyText.trim()}>
                Enviar
              </Button>
            </Group>
          </Box>
        </Paper>
      )}
    </Container>
  );
}
