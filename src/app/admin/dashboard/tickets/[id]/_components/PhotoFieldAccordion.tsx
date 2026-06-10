'use client';

import { useRef, useState } from 'react';
import {
  Stack, Button, Text, Collapse, SimpleGrid, Paper, Image, Tooltip,
  ActionIcon, Alert, Box, FileButton, Group,
} from '@mantine/core';
import { BotField } from '@/types';

interface Props {
  field: BotField;
  photos: string[];
  mediaKind: 'photo' | 'video';
  expanded: boolean;
  onToggle: () => void;
  onDelete: (fieldKey: string, idx: number) => void;
  onUpload: (fieldKey: string, files: File[]) => void;
  uploadingField: string | null;
  deletingPhoto: { fieldKey: string; idx: number } | null;
}

export function PhotoFieldAccordion({
  field, photos, mediaKind, expanded, onToggle,
  onDelete, onUpload, uploadingField, deletingPhoto,
}: Props) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const resetRef = useRef<(() => void) | null>(null);

  const count = photos.length;
  const isUploading = uploadingField === field.key;

  const handleUpload = () => {
    if (!pendingFiles.length) return;
    onUpload(field.key, pendingFiles);
    setPendingFiles([]);
    resetRef.current?.();
  };

  return (
    <Stack gap="xs">
      <Button variant="light" color="blue" fullWidth onClick={onToggle} justify="space-between">
        <Text fw={700}>
          📎 {field.label} ({count} {count === 1 ? 'archivo' : 'archivos'})
        </Text>
        <Text>{expanded ? '▼' : '▶'}</Text>
      </Button>
      <Collapse expanded={expanded}>
        {count > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
            {photos.map((url, idx) => (
              <Paper key={idx} p="xs" withBorder radius="md" style={{ position: 'relative' }}>
                {mediaKind === 'video' ? (
                  <video
                    src={url}
                    controls
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <Image src={url} alt={`${field.label} ${idx + 1}`} radius="md" fit="cover" h={200} />
                )}
                <Tooltip label="Eliminar foto" withArrow>
                  <ActionIcon
                    color="red" variant="filled" size="sm"
                    style={{ position: 'absolute', top: 12, right: 12 }}
                    onClick={() => onDelete(field.key, idx)}
                    loading={deletingPhoto?.fieldKey === field.key && deletingPhoto?.idx === idx}
                  >✕</ActionIcon>
                </Tooltip>
                <Text size="xs" c="dimmed" ta="center" mt={4}>Foto {idx + 1}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Alert color="gray" mt="sm">No hay fotos en este campo.</Alert>
        )}

        <Box mt="sm">
          <FileButton resetRef={resetRef} onChange={setPendingFiles} accept="image/*,video/*" multiple>
            {(props) => (
              <Button {...props} variant="light" size="xs" color="gray">
                Seleccionar archivos
              </Button>
            )}
          </FileButton>
          {pendingFiles.length > 0 && (
            <Group gap="xs" mt="xs">
              <Text size="xs" c="dimmed">{pendingFiles.length} archivo(s) seleccionado(s)</Text>
              <Button size="xs" color="teal" onClick={handleUpload} loading={isUploading}>
                Subir {pendingFiles.length} archivo(s)
              </Button>
              <Button size="xs" variant="subtle" color="red"
                onClick={() => { setPendingFiles([]); resetRef.current?.(); }}>
                Cancelar
              </Button>
            </Group>
          )}
        </Box>
      </Collapse>
    </Stack>
  );
}
