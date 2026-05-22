'use client';

import { useState } from 'react';
import { SystemFieldConfig } from '@/types';
import { useConfigData } from './_botConfig/useConfigData';
import { useFieldEditor } from './_botConfig/useFieldEditor';

export function useBotConfig() {
  const data = useConfigData();
  const editor = useFieldEditor(data.configFields, data.setConfigFields);
  const [infoTab, setInfoTab] = useState<string | null>('messages');

  const moveSysField = (idx: number, dir: 'up' | 'down') => {
    data.setSystemFields((prev: SystemFieldConfig[]) => {
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  return {
    ...data,
    ...editor,
    infoTab, setInfoTab,
    moveSysField,
  };
}
