'use client';

import { useState } from 'react';
import {
  Container, Title, Text, Paper, Alert, Stack, TextInput, PasswordInput, Select, Button,
} from '@mantine/core';
import { registerService } from '@/services/register.service';

/**
 * Página oculta de registro de usuarios. No está enlazada en ninguna parte de la
 * app; solo se llega escribiendo la URL. El backend exige la clave de
 * configuración (ADMIN_SETUP_KEY), así que conocer la ruta no basta para crear
 * usuarios.
 */
export default function RegistroPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'gestor'>('gestor');
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await registerService.register({ email, name, password, role, setupKey });
      setSuccess(`Usuario creado: ${res.email} (${res.role}).`);
      setEmail('');
      setName('');
      setPassword('');
      setSetupKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={460} my={40}>
      <Title ta="center" order={2}>Registro de usuarios</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Crea administradores o gestores. Requiere la clave de configuración.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        {success && <Alert color="green" mb="md">{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Nombre"
              placeholder="Nombre completo"
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <TextInput
              label="Correo electrónico"
              placeholder="usuario@ejemplo.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Select
              label="Rol"
              data={[
                { value: 'gestor', label: 'Gestor' },
                { value: 'admin', label: 'Administrador' },
              ]}
              value={role}
              onChange={(v) => setRole((v as 'admin' | 'gestor') ?? 'gestor')}
              allowDeselect={false}
            />
            <PasswordInput
              label="Clave de configuración"
              placeholder="ADMIN_SETUP_KEY"
              required
              value={setupKey}
              onChange={(e) => setSetupKey(e.currentTarget.value)}
            />
            <Button fullWidth mt="md" type="submit" loading={loading}>
              Registrar usuario
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
