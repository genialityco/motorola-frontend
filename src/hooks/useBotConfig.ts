'use client';

import { useMemo, useState } from 'react';
import { BotField, SystemFieldConfig } from '@/types';
import { useConfigData } from './_botConfig/useConfigData';
import { useFieldEditor } from './_botConfig/useFieldEditor';

// Fila de la tabla unificada de campos: puede ser un campo del sistema (fijo,
// no editable/borrable) o un campo personalizado. `index` apunta a la posición
// del campo dentro de `configFields` para edición/borrado.
export type MergedField =
  | { kind: 'system'; key: string; order: number; system: SystemFieldConfig }
  | { kind: 'custom'; key: string; order: number; field: BotField; index: number };

export function useBotConfig() {
  const data = useConfigData();
  const editor = useFieldEditor(data.configFields, data.setConfigFields);
  const [infoTab, setInfoTab] = useState<string | null>('messages');

  // Lista combinada y ordenada de campos del sistema + personalizados.
  const mergedFields = useMemo<MergedField[]>(() => {
    const rows: MergedField[] = [
      ...data.systemFields.map((s) => ({
        kind: 'system' as const, key: s.key, order: s.order ?? 0, system: s,
      })),
      ...data.configFields.map((f, index) => ({
        kind: 'custom' as const, key: f.key, order: f.order ?? 0, field: f, index,
      })),
    ];
    return rows.sort((a, b) => a.order - b.order);
  }, [data.systemFields, data.configFields]);

  // Reordena cualquier campo (sistema o personalizado) intercambiando su `order`
  // con el del vecino en la lista combinada.
  const moveMergedField = (key: string, dir: 'up' | 'down') => {
    const idx = mergedFields.findIndex((r) => r.key === key);
    if (idx < 0) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= mergedFields.length) return;
    const a = mergedFields[idx];
    const b = mergedFields[target];

    const apply = (k: string, kind: 'system' | 'custom', order: number) => {
      if (kind === 'system') {
        data.setSystemFields((prev) => prev.map((f) => (f.key === k ? { ...f, order } : f)));
      } else {
        data.setConfigFields((prev) => prev.map((f) => (f.key === k ? { ...f, order } : f)));
      }
    };
    apply(a.key, a.kind, b.order);
    apply(b.key, b.kind, a.order);
  };

  // Actualiza un campo personalizado por su índice en configFields.
  const updateConfigField = (index: number, patch: Partial<BotField>) => {
    data.setConfigFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  return {
    ...data,
    ...editor,
    infoTab, setInfoTab,
    mergedFields,
    moveMergedField,
    updateConfigField,
  };
}
