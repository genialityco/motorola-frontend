'use client';

import { Title } from '@mantine/core';
import { useBotConfig } from '@/hooks/useBotConfig';
import { FieldsPanel } from './fields/FieldsPanel';

interface Props {
  api: ReturnType<typeof useBotConfig>;
}

export function ConfigTab({ api }: Props) {
  return (
    <>
      <Title order={2} mb="lg">Información de los Tickets</Title>
      <FieldsPanel api={api} />
    </>
  );
}
