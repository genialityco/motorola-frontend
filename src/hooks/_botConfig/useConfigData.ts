'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/lib/firebase';
import { BotMessages, BotSettings, BotField, SystemFieldConfig } from '@/types';
import { configService } from '@/services/config.service';
import { useAppToast } from '@/components/toast-provider';
import { DEFAULT_BOT_MESSAGES, DEFAULT_BOT_SETTINGS, DEFAULT_BOT_FIELDS, SYSTEM_FIELDS_DEFAULT } from './defaults';

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
      doc(db, COLLECTIONS.BOT_CONFIG, 'settings'),
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
      doc(db, COLLECTIONS.BOT_CONFIG, 'messages'),
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
      doc(db, COLLECTIONS.BOT_CONFIG, 'ticket_fields'),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const fields = data?.fields as BotField[] | undefined;
        const toUse: BotField[] =
          fields && fields.length > 0 ? fields : DEFAULT_BOT_FIELDS;
        setConfigFields([...toUse].sort((a, b) => a.order - b.order));

        const savedSysFields = data?.systemFields as SystemFieldConfig[] | undefined;
        if (savedSysFields && savedSysFields.length > 0) {
          const savedKeys = new Set(savedSysFields.map((f) => f.key));
          const merged = [
            ...savedSysFields,
            ...SYSTEM_FIELDS_DEFAULT.filter((f) => !savedKeys.has(f.key)),
          ];
          setSystemFields(merged);
        }
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
      await configService.saveFields(
        configFields.map((f, i) => ({ ...f, order: i })),
        systemFields,
      );
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
