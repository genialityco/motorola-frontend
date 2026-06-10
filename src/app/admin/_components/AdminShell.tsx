'use client';

import { useState } from 'react';
import { AppShell, Burger, Group, Title, Text, Badge, Button, NavLink, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconMessage, IconMessages, IconShieldLock } from '@tabler/icons-react';
import Link from 'next/link';
import { signOut, User } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { AdminSetupModal } from './AdminSetupModal';

interface Props {
  user: User;
  userRole: string | null;
  onRoleRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function AdminShell({ user, userRole, onRoleRefresh, children }: Props) {
  const [opened, { toggle }] = useDisclosure();
  const [setupOpen, setSetupOpen] = useState(false);

  const isGestor = userRole === 'gestor';

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header p="sm">
        <Group justify="space-between" h="100%">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>Motorola/Element CRM</Title>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">{user.email}</Text>
            {userRole ? (
              <Badge color={userRole === 'admin' ? 'blue' : 'violet'} size="sm">{userRole}</Badge>
            ) : (
              <Badge color="red" size="sm" style={{ cursor: 'pointer' }} onClick={() => setSetupOpen(true)}>
                sin rol
              </Badge>
            )}
            <Button size="xs" variant="light" color="red" onClick={() => signOut(auth)}>Salir</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink
          component={Link}
          href="/admin/dashboard"
          label="Dashboard Tickets"
          leftSection={<IconDashboard size="1rem" stroke={1.5} />}
        />
        {!isGestor && (
          <NavLink
            component={Link}
            href="/admin/dashboard/chats"
            label="Chats WhatsApp"
            leftSection={<IconMessage size="1rem" stroke={1.5} />}
          />
        )}
        {!isGestor && (
          <NavLink
            component={Link}
            href="/admin/dashboard/mensajes"
            label="Mensajes"
            leftSection={<IconMessages size="1rem" stroke={1.5} />}
          />
        )}
        {!userRole && (
          <NavLink
            label="Activar rol de Admin"
            leftSection={<IconShieldLock size="1rem" stroke={1.5} color="orange" />}
            color="orange"
            onClick={() => setSetupOpen(true)}
            mt="auto"
          />
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        {!userRole && (
          <Alert color="orange" mb="md" icon={<IconShieldLock size={16} />}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm">
                Tu cuenta no tiene un rol asignado. Las acciones del panel están restringidas hasta que actives tu rol de administrador.
              </Text>
              <Button size="xs" color="orange" onClick={() => setSetupOpen(true)}>
                Activar
              </Button>
            </Group>
          </Alert>
        )}
        {children}
      </AppShell.Main>

      <AdminSetupModal
        opened={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSuccess={onRoleRefresh}
      />
    </AppShell>
  );
}
