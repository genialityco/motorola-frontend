'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BotMessages, BotSettings, BotField, SystemFieldConfig } from '@/types';
import { configService } from '@/services/config.service';
import { useAppToast } from '@/components/toast-provider';
import { DEFAULT_BOT_MESSAGES, DEFAULT_BOT_SETTINGS, DEFAULT_BOT_FIELDS, SYSTEM_FIELDS_DEFAULT } from './defaults';

type Combined =
  | { kind: 'sys'; order: number; f: SystemFieldConfig }
  | { kind: 'cus'; order: number; f: BotField };

// Renumera la lista combinada a un espacio de orden 0..N-1 y la divide de vuelta
// en campos del sistema y personalizados conservando su posición relativa.
function renumber(combined: Combined[]) {
  const sysOrdered: SystemFieldConfig[] = [];
  const customOrdered: BotField[] = [];
  combined.forEach((item, i) => {
    if (item.kind === 'sys') sysOrdered.push({ ...item.f, order: i });
    else customOrdered.push({ ...item.f, order: i });
  });
  return { sysOrdered, customOrdered };
}

export function useConfigData() {
  const { showToast } = useAppToast();
  const [configMessages, setConfigMessages] = useState<BotMessages>(DEFAULT_BOT_MESSAGES);
  const [configFields, setConfigFields] = useState<BotField[]>(DEFAULT_BOT_FIELDS);
  const [systemFields, setSystemFields] = useState<SystemFieldConfig[]>(SYSTEM_FIELDS_DEFAULT);
  const [configSettings, setConfigSettings] = useState<BotSettings>(DEFAULT_BOT_SETTINGS);
  const [savingMessages, setSavingMessages] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'bot_config', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const saved = snap.data() as Partial<BotSettings>;
          setConfigSettings({
            ...DEFAULT_BOT_SETTINGS,
            ...saved,
            compliance: { ...DEFAULT_BOT_SETTINGS.compliance!, ...(saved.compliance ?? {}) },
          });
        }
      },
      () => {},
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'bot_config', 'messages'),
      (snap) => {
        if (snap.exists()) {
          setConfigMessages({ ...DEFAULT_BOT_MESSAGES, ...(snap.data() as Partial<BotMessages>) });
        }
      },
      () => {},
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'bot_config', 'ticket_fields'),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const savedFields = data?.fields as BotField[] | undefined;
        const savedSysFields = data?.systemFields as SystemFieldConfig[] | undefined;

        // Campos personalizados: merge con defaults para incluir nuevos campos.
        let customFields: BotField[];
        if (savedFields && savedFields.length > 0) {
          const savedKeys = new Set(savedFields.map((f) => f.key));
          const newDefaults = DEFAULT_BOT_FIELDS.filter((df) => !savedKeys.has(df.key));
          customFields = [...savedFields, ...newDefaults];
        } else {
          customFields = DEFAULT_BOT_FIELDS;
        }

        // Campos del sistema: merge con defaults para incluir nuevas columnas.
        let sysFields: SystemFieldConfig[];
        if (savedSysFields && savedSysFields.length > 0) {
          const savedKeys = new Set(savedSysFields.map((f) => f.key));
          sysFields = [...savedSysFields, ...SYSTEM_FIELDS_DEFAULT.filter((f) => !savedKeys.has(f.key))];
        } else {
          sysFields = SYSTEM_FIELDS_DEFAULT;
        }

        // ¿El documento ya tiene orden unificado? Solo lo está si los campos del
        // sistema guardados traen `order`. Si no (doc antiguo o sin systemFields),
        // mostramos primero los del sistema y después los personalizados.
        const isUnified =
          !!savedSysFields &&
          savedSysFields.length > 0 &&
          savedSysFields.every((f) => typeof f.order === 'number');

        let combined: Combined[];
        if (isUnified) {
          combined = [
            ...sysFields.map((f) => ({ kind: 'sys' as const, order: f.order ?? 0, f })),
            ...customFields.map((f) => ({ kind: 'cus' as const, order: f.order ?? 0, f })),
          ].sort((a, b) => a.order - b.order);
        } else {
          const sortedCustom = [...customFields].sort((a, b) => a.order - b.order);
          combined = [
            ...sysFields.map((f) => ({ kind: 'sys' as const, order: 0, f })),
            ...sortedCustom.map((f) => ({ kind: 'cus' as const, order: 0, f })),
          ];
        }

        const { sysOrdered, customOrdered } = renumber(combined);
        setConfigFields(customOrdered);
        setSystemFields(sysOrdered);
      },
      () => {},
    );
    return () => unsub();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await configService.saveSettings(configSettings);
      showToast({ type: 'success', title: 'Configuración guardada', message: 'La configuración del bot se actualizó correctamente.' });
    } catch (e) {
      console.error('Error guardando configuración:', e);
      showToast({ type: 'error', title: 'Error al guardar', message: 'No se pudo guardar la configuración. Intenta de nuevo.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const saveMessages = async () => {
    setSavingMessages(true);
    try {
      await configService.saveMessages(configMessages);
      showToast({ type: 'success', title: 'Mensajes guardados', message: 'Los mensajes del bot se actualizaron correctamente.' });
    } catch (e) {
      console.error('Error guardando mensajes:', e);
      showToast({ type: 'error', title: 'Error al guardar', message: 'No se pudieron guardar los mensajes. Intenta de nuevo.' });
    } finally {
      setSavingMessages(false);
    }
  };

  const saveFields = async () => {
    setSavingFields(true);
    try {
      // Normaliza el orden unificado (sistema + personalizados) antes de guardar.
      const combined: Combined[] = [
        ...systemFields.map((f) => ({ kind: 'sys' as const, order: f.order ?? 0, f })),
        ...configFields.map((f) => ({ kind: 'cus' as const, order: f.order ?? 0, f })),
      ].sort((a, b) => a.order - b.order);
      const { sysOrdered, customOrdered } = renumber(combined);
      await configService.saveFields(customOrdered, sysOrdered);
      showToast({ type: 'success', title: 'Campos guardados', message: 'Los campos del ticket se actualizaron correctamente.' });
    } catch (e) {
      console.error('Error guardando campos:', e);
      showToast({ type: 'error', title: 'Error al guardar', message: 'No se pudieron guardar los campos. Intenta de nuevo.' });
    } finally {
      setSavingFields(false);
    }
  };

  return {
    configMessages, setConfigMessages,
    configFields, setConfigFields,
    systemFields, setSystemFields,
    configSettings, setConfigSettings,
    savingMessages, savingFields, savingSettings,
    saveSettings, saveMessages, saveFields,
  };
}
