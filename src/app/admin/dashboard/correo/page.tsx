'use client';

import { Paper, Title } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { EmailPanel } from '../_components/config/email/EmailPanel';

export default function CorreoPage() {
  const { configFields } = useBotConfig();

  return (
    <Paper p="md" shadow="sm" radius="md" withBorder>
      <Title order={2} mb="lg">Correo</Title>
      <EmailPanel configFields={configFields} />
    </Paper>
  );
}
