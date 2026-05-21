import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BotMessages, BotSettings, BotField, FieldType, FieldSource, SystemFieldConfig } from '@/types';
import { configService } from '@/services/config.service';
import { useAppToast } from '@/components/toast-provider';

const DEFAULT_BOT_MESSAGES: BotMessages = {
  menu: 'Hola, a continuación te mostraré las diferentes funcionalidades que poseo:\n1. Para crear un ticket presiona 1\n2. Para ver el estado de tus tickets presiona 2\n3. Para editar un ticket presiona 3\n4. Para eliminar un ticket presiona 4\n5. Para finalizar un ticket presiona 5',
  ticketCreated: '✅ Ticket *{ticketNumber}* {action} exitosamente.\n\nTe notificaremos cuando haya actualizaciones de estados.',
  ticketDeleted: '✅ Ticket *{ticketNumber}* eliminado correctamente.',
  statusChanged: 'El estado de su solicitud *{ticketNumber}* ha cambiado de "{prevStatus}" a "{newStatus}".',
  reparadoMessage: 'Estas son las evidencias de que su ticket *{ticketNumber}* con descripción "{description}" ha sido reparado:',
  noTickets: 'No tienes tickets registrados aún. ¿Puedo ayudarte en algo más?',
  invalidField: 'Por favor ingresa una respuesta válida.',
  cancelled: 'Operación cancelada.',
  goodbye: 'Hasta luego 👋. Escribe cualquier mensaje para volver al menú.',
  viewTicketOptions: '¿Qué deseas ver?\n1. Info del ticket\n2. Ver fotos',
  backToMenuKeyword: 'INICIO',
  adminRequestUpdate: '📋 El administrador te solicita actualizar el campo *{fieldLabel}* de tu ticket *{ticketNumber}*.\n\nPara actualizar esta información, selecciona la opción *3* (Editar) en el menú.',
  ticketSelectPrompt: 'Selecciona el número del ticket que deseas *{action}*:',
  ticketListItemTemplate: '{index}. 📋 *{ticketNumber}*\n   Estado: {estado}\n   Fecha: {fecha}',
  deletePhotoRequest: '',
  editFieldPrompt: '',
  sessionExpiredCreate: 'Tu sesión para crear el ticket expiró por inactividad ({hours} horas). Por favor, selecciona la opción *1* para comenzar nuevamente.',
  sessionExpiredEdit: 'Tu sesión para editar el ticket expiró por inactividad ({hours} horas). Por favor, selecciona la opción *3* para editar nuevamente.',
  sessionExpiredGeneric: 'Tu sesión expiró por inactividad ({hours} horas). Por favor, selecciona una opción del menú.',
};

const DEFAULT_BOT_SETTINGS: BotSettings = {
  sessionTimeoutHours: 24,
  compliance: {
    aTiempoMaxDias: 7,
    atencionPrioritariaMaxDias: 14,
  },
};

const DEFAULT_BOT_FIELDS: BotField[] = [
  { key: 'ciudad', label: 'Ciudad', question: '¿En qué ciudad se encuentra el punto de venta?', order: 0, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'canal', label: 'Canal', question: '¿Cuál es el canal de venta? (ejemplo: Retail, Operador, Online):', order: 1, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'punto', label: 'Punto de Venta', question: '¿Cuál es el nombre del punto de venta?', order: 2, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'novelty.type', label: 'Tipo de Novedad', question: 'Tipo de Novedad', order: 3, normalize: false, type: 'string', source: 'bot', required: false, visible: true, excel: false },
  { key: 'novelty.description', label: 'Descripción / Novedad', question: 'Descripción / Novedad', order: 4, normalize: false, type: 'string', source: 'bot', required: true, visible: true, excel: false },
  { key: 'photos.evidence', label: 'Fotos de Evidencia', question: 'Fotos de Evidencia', order: 5, normalize: false, type: 'photo', source: 'bot', required: false, visible: false, excel: false },
  { key: 'photos.repair', label: 'Fotos de Reparación', question: 'Fotos de Reparación', placeholder: 'Sube aquí las fotos de reparación', order: 6, normalize: false, type: 'photo', source: 'admin', required: false, visible: false, excel: false },
];

const SYSTEM_FIELDS_DEFAULT: SystemFieldConfig[] = [
  { key: 'ticketNumber', label: 'Ticket #', visible: true },
  { key: 'createdAt', label: 'Creación', visible: true },
  { key: 'estado', label: 'Estado', visible: true },
  { key: 'alertaCumplimiento', label: 'Alerta', visible: true },
  { key: 'reporter', label: 'Reportado Por', visible: true },
];

export function useBotConfig() {
  const { showToast } = useAppToast();
  const [configMessages, setConfigMessages] = useState<BotMessages>(DEFAULT_BOT_MESSAGES);
  const [configFields, setConfigFields] = useState<BotField[]>(DEFAULT_BOT_FIELDS);
  const [systemFields, setSystemFields] = useState<SystemFieldConfig[]>(SYSTEM_FIELDS_DEFAULT);
  const [configSettings, setConfigSettings] = useState<BotSettings>(DEFAULT_BOT_SETTINGS);
  const [savingMessages, setSavingMessages] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [infoTab, setInfoTab] = useState<string | null>('messages');

  // Add field modal state
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldQuestion, setNewFieldQuestion] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldSource, setNewFieldSource] = useState<FieldSource>('bot');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newFieldOptionInput, setNewFieldOptionInput] = useState('');
  const [newFieldAllowOther, setNewFieldAllowOther] = useState(false);
  const [newFieldOtherLabel, setNewFieldOtherLabel] = useState('');

  // Edit field modal state
  const [editFieldOpen, setEditFieldOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldQuestion, setEditFieldQuestion] = useState('');
  const [editFieldPlaceholder, setEditFieldPlaceholder] = useState('');
  const [editFieldOptions, setEditFieldOptions] = useState<string[]>([]);
  const [editFieldOptionInput, setEditFieldOptionInput] = useState('');
  const [editFieldAllowOther, setEditFieldAllowOther] = useState(false);
  const [editFieldOtherLabel, setEditFieldOtherLabel] = useState('');

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

        const fields = data?.fields as BotField[] | undefined;
        let toUse: BotField[];
        if (fields && fields.length > 0) {
          const savedKeys = new Set(fields.map((f) => f.key));
          const newDefaults = DEFAULT_BOT_FIELDS.filter((df) => !savedKeys.has(df.key));
          toUse = [...fields, ...newDefaults];
        } else {
          toUse = DEFAULT_BOT_FIELDS;
        }
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

  const moveField = (idx: number, dir: 'up' | 'down') => {
    const next = [...configFields];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setConfigFields(next);
  };

  const moveSysField = (idx: number, dir: 'up' | 'down') => {
    const next = [...systemFields];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSystemFields(next);
  };

  const deleteField = (idx: number) => {
    setConfigFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const openEditField = (idx: number) => {
    const field = configFields[idx];
    if (!field) return;
    setEditingFieldIdx(idx);
    setEditFieldLabel(field.label);
    setEditFieldQuestion(field.question ?? '');
    setEditFieldPlaceholder(field.placeholder ?? '');
    setEditFieldOptions(field.options ?? []);
    setEditFieldOptionInput('');
    setEditFieldAllowOther(field.allowOther ?? false);
    setEditFieldOtherLabel(field.otherLabel ?? '');
    setEditFieldOpen(true);
  };

  const saveEditField = () => {
    if (editingFieldIdx === null || !editFieldLabel.trim()) return;
    const currentField = configFields[editingFieldIdx];
    if (!currentField) return;
    const isAdminField = currentField.source === 'admin';
    if (!isAdminField && !editFieldQuestion.trim()) return;
    if (isAdminField && !editFieldPlaceholder.trim()) return;
    const updated = [...configFields];
    updated[editingFieldIdx] = {
      ...updated[editingFieldIdx],
      label: editFieldLabel.trim(),
      question: editFieldQuestion.trim(),
      placeholder: editFieldPlaceholder.trim(),
      ...(currentField.type === 'list' ? {
        options: editFieldOptions,
        allowOther: editFieldAllowOther,
        otherLabel: editFieldAllowOther ? editFieldOtherLabel.trim() : undefined,
      } : {}),
    };
    setConfigFields(updated);
    setEditFieldOpen(false);
    setEditingFieldIdx(null);
    setEditFieldLabel('');
    setEditFieldQuestion('');
    setEditFieldPlaceholder('');
    setEditFieldOptions([]);
    setEditFieldOptionInput('');
    setEditFieldAllowOther(false);
    setEditFieldOtherLabel('');
  };

  const cancelEditField = () => {
    setEditFieldOpen(false);
    setEditingFieldIdx(null);
    setEditFieldLabel('');
    setEditFieldQuestion('');
    setEditFieldPlaceholder('');
    setEditFieldOptions([]);
    setEditFieldOptionInput('');
    setEditFieldAllowOther(false);
    setEditFieldOtherLabel('');
  };

  const addEditListOption = () => {
    const opt = editFieldOptionInput.trim();
    if (!opt || editFieldOptions.includes(opt)) return;
    setEditFieldOptions((prev) => [...prev, opt]);
    setEditFieldOptionInput('');
  };

  const removeEditListOption = (idx: number) => {
    setEditFieldOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addListOption = () => {
    const opt = newFieldOptionInput.trim();
    if (!opt || newFieldOptions.includes(opt)) return;
    setNewFieldOptions((prev) => [...prev, opt]);
    setNewFieldOptionInput('');
  };

  const removeListOption = (idx: number) => {
    setNewFieldOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addField = () => {
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key || !newFieldLabel.trim()) return;
    const isAdminField = newFieldSource === 'admin';
    if ((!isAdminField && !newFieldQuestion.trim()) || (isAdminField && !newFieldPlaceholder.trim())) return;
    if (configFields.some((f) => f.key === key)) return;
    const newField: BotField = {
      key,
      label: newFieldLabel.trim(),
      question: newFieldQuestion.trim(),
      placeholder: newFieldPlaceholder.trim(),
      order: configFields.length,
      normalize: newFieldType === 'string',
      type: newFieldType,
      source: newFieldSource,
      required: newFieldRequired,
      visible: true,
      excel: newFieldType !== 'photo' && newFieldType !== 'video',
      ...(newFieldType === 'list' ? {
        options: newFieldOptions,
        allowOther: newFieldAllowOther,
        otherLabel: newFieldAllowOther ? newFieldOtherLabel.trim() : undefined,
      } : {}),
    };
    setConfigFields((prev) => [...prev, newField]);
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldQuestion('');
    setNewFieldPlaceholder('');
    setNewFieldType('string');
    setNewFieldSource('bot');
    setNewFieldRequired(false);
    setNewFieldOptions([]);
    setNewFieldOptionInput('');
    setNewFieldAllowOther(false);
    setNewFieldOtherLabel('');
    setAddFieldOpen(false);
  };

  return {
    configMessages, setConfigMessages,
    configFields, setConfigFields,
    systemFields, setSystemFields,
    configSettings, setConfigSettings,
    savingMessages, savingFields, savingSettings,
    infoTab, setInfoTab,
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldPlaceholder, setNewFieldPlaceholder,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    newFieldOptions, setNewFieldOptions,
    newFieldOptionInput, setNewFieldOptionInput,
    newFieldAllowOther, setNewFieldAllowOther,
    newFieldOtherLabel, setNewFieldOtherLabel,
    editFieldOpen,
    editingFieldIdx,
    editFieldLabel, setEditFieldLabel,
    editFieldQuestion, setEditFieldQuestion,
    editFieldPlaceholder, setEditFieldPlaceholder,
    editFieldOptions, setEditFieldOptions,
    editFieldOptionInput, setEditFieldOptionInput,
    editFieldAllowOther, setEditFieldAllowOther,
    editFieldOtherLabel, setEditFieldOtherLabel,
    saveMessages, saveFields, saveSettings,
    moveField, moveSysField, deleteField,
    openEditField, saveEditField, cancelEditField,
    addField, addListOption, removeListOption,
    addEditListOption, removeEditListOption,
  };
}
