'use client';

import { Group, Stack, Badge, NumberInput, Text, Button, Title } from '@mantine/core';
import { BotSettings } from '@/types';

interface Props {
  configSettings: BotSettings;
  setConfigSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  savingSettings: boolean;
  saveSettings: () => Promise<void>;
}

export function ComplianceLimits({ configSettings, setConfigSettings, savingSettings, saveSettings }: Props) {
  const aTiempo = configSettings.compliance?.aTiempoMaxDias ?? 7;
  const atencion = configSettings.compliance?.atencionPrioritariaMaxDias ?? 14;
  const complianceError = aTiempo >= atencion ? '"A tiempo" debe ser menor que "Atención prioritaria".' : null;

  return (
    <>
      <Title order={5} mb={4} mt="xs">Límites de tiempo para alertas</Title>
      <Text size="xs" c="dimmed" mb="sm">
        Define cuántos días desde la creación del ticket corresponden a cada nivel. La columna <strong>Alerta</strong> de la tabla usa estos valores.
      </Text>
      <Group gap="lg" align="flex-end" mb="xs">
        <Stack gap={4}>
          <Badge color="green" size="sm">🟢 A tiempo — máximo</Badge>
          <NumberInput
            value={aTiempo}
            onChange={(v) => setConfigSettings((prev) => ({
              ...prev,
              compliance: {
                aTiempoMaxDias: Number(v) || 1,
                atencionPrioritariaMaxDias: prev.compliance?.atencionPrioritariaMaxDias ?? 14,
              },
            }))}
            min={1} max={365} step={1} suffix=" días" w={150}
            error={!!complianceError}
          />
        </Stack>
        <Stack gap={4}>
          <Badge color="yellow" size="sm">🟡 Atención prioritaria — máximo</Badge>
          <NumberInput
            value={atencion}
            onChange={(v) => setConfigSettings((prev) => ({
              ...prev,
              compliance: {
                aTiempoMaxDias: prev.compliance?.aTiempoMaxDias ?? 7,
                atencionPrioritariaMaxDias: Number(v) || 1,
              },
            }))}
            min={1} max={365} step={1} suffix=" días" w={150}
            error={!!complianceError}
          />
        </Stack>
        <Stack gap={4}>
          <Badge color="red" size="sm">🔴 Fuera de tiempo — desde</Badge>
          <Text size="sm" fw={600} pt={6}>
            Día {atencion + 1} en adelante
          </Text>
        </Stack>
      </Group>
      {complianceError && <Text size="xs" c="red" mb="xs">{complianceError}</Text>}
      <Button size="xs" loading={savingSettings} onClick={saveSettings} mb="lg" disabled={!!complianceError}>
        Guardar límites de alerta
      </Button>
    </>
  );
}
