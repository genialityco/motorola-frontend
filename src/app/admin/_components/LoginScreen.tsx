'use client';

import { useState } from 'react';
import { Container, Title, Text, Paper, Alert, Stack, TextInput, PasswordInput, Button } from '@mantine/core';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Credenciales inválidas o correo no registrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>Bienvenido al CRM</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Ingresa tus credenciales de Administrador para continuar
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <Stack>
            <TextInput
              label="Correo Electrónico"
              placeholder="admin@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña secreta"
              required
              mt="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Button fullWidth mt="xl" type="submit" loading={loading}>
              Iniciar Sesión
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
