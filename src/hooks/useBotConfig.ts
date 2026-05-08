import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BotMessages, BotField, FieldType, FieldSource } from '@/types';
import { configService } from '@/services/config.service';

const DEFAULT_BOT_MESSAGES: BotMessages = {
  menu: 'Hola, a continuación te mostraré las diferentes funcionalidades que poseo:\n1. Para crear un ticket presiona 1\n2. Para ver el estado de tus tickets presiona 2\n3. Para editar un ticket presiona 3\n4. Para eliminar un ticket presiona 4\n5. Para finalizar un ticket presiona 5',
  ticketCreated: '✅ Ticket *{ticketNumber}* creado exitosamente.\n\nTe notificaremos cuando haya actualizaciones de estados.',
  statusChanged: 'El estado de su solicitud *{ticketNumber}* ha cambiado de "{prevStatus}" a "{newStatus}".',
  reparadoMessage: 'Estas son las evidencias de que su ticket *{ticketNumber}* con descripción "{description}" ha sido reparado:',
  noTickets: 'No tienes tickets registrados aún. ¿Puedo ayudarte en algo más?',
  invalidField: 'Por favor ingresa una respuesta válida.',
  cancelled: 'Operación cancelada.',
  goodbye: 'Hasta luego 👋. Escribe cualquier mensaje para volver al menú.',
  viewTicketOptions: '¿Qué deseas ver?\n1. Info del ticket\n2. Ver fotos',
};

const DEFAULT_BOT_FIELDS: BotField[] = [
  { key: 'ciudad', label: 'Ciudad', question: '¿En qué ciudad se encuentra el punto de venta?', order: 0, normalize: true, type: 'string', source: 'bot', required: true, visible: true },
  { key: 'canal', label: 'Canal', question: '¿Cuál es el canal de venta? (ejemplo: Retail, Operador, Online):', order: 1, normalize: true, type: 'string', source: 'bot', required: true, visible: true },
  { key: 'punto', label: 'Punto de Venta', question: '¿Cuál es el nombre del punto de venta?', order: 2, normalize: true, type: 'string', source: 'bot', required: true, visible: true },
  { key: 'novelty.type', label: 'Tipo de Novedad', question: 'Tipo de Novedad', order: 3, normalize: false, type: 'string', source: 'bot', required: false, visible: true },
  { key: 'novelty.description', label: 'Descripción / Novedad', question: 'Descripción / Novedad', order: 4, normalize: false, type: 'string', source: 'bot', required: true, visible: true },
  { key: 'photos.evidence', label: 'Fotos de Evidencia', question: 'Fotos de Evidencia', order: 5, normalize: false, type: 'photo', source: 'bot', required: false, visible: false },
  { key: 'photos.repair', label: 'Fotos de Reparación', question: 'Fotos de Reparación', order: 6, normalize: false, type: 'photo', source: 'admin', required: false, visible: false },
];

export function useBotConfig() {
  const [configMessages, setConfigMessages] = useState<BotMessages>(DEFAULT_BOT_MESSAGES);
  const [configFields, setConfigFields] = useState<BotField[]>(DEFAULT_BOT_FIELDS);
  const [savingMessages, setSavingMessages] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [infoTab, setInfoTab] = useState<string | null>('messages');

  // Add field modal state
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldQuestion, setNewFieldQuestion] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldSource, setNewFieldSource] = useState<FieldSource>('bot');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Edit field modal state
  const [editFieldOpen, setEditFieldOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldQuestion, setEditFieldQuestion] = useState('');

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
        const fields = snap.exists() ? (snap.data()?.fields as BotField[] | undefined) : undefined;
        let toUse: BotField[];
        if (fields && fields.length > 0) {
          const savedKeys = new Set(fields.map((f) => f.key));
          const newDefaults = DEFAULT_BOT_FIELDS.filter((df) => !savedKeys.has(df.key));
          toUse = [...fields, ...newDefaults];
        } else {
          toUse = DEFAULT_BOT_FIELDS;
        }
        setConfigFields([...toUse].sort((a, b) => a.order - b.order));
      },
      () => {},
    );
    return () => unsub();
  }, []);

  const saveMessages = async () => {
    setSavingMessages(true);
    try {
      await configService.saveMessages(configMessages);
    } catch (e) {
      console.error('Error guardando mensajes:', e);
    } finally {
      setSavingMessages(false);
    }
  };

  const saveFields = async () => {
    setSavingFields(true);
    try {
      await configService.saveFields(
        configFields.map((f, i) => ({ ...f, order: i })),
      );
    } catch (e) {
      console.error('Error guardando campos:', e);
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

  const deleteField = (idx: number) => {
    setConfigFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const openEditField = (idx: number) => {
    const field = configFields[idx];
    if (!field) return;
    setEditingFieldIdx(idx);
    setEditFieldLabel(field.label);
    setEditFieldQuestion(field.question);
    setEditFieldOpen(true);
  };

  const saveEditField = () => {
    if (editingFieldIdx === null || !editFieldLabel.trim() || !editFieldQuestion.trim()) return;
    const updated = [...configFields];
    updated[editingFieldIdx] = {
      ...updated[editingFieldIdx],
      label: editFieldLabel.trim(),
      question: editFieldQuestion.trim(),
    };
    setConfigFields(updated);
    setEditFieldOpen(false);
    setEditingFieldIdx(null);
    setEditFieldLabel('');
    setEditFieldQuestion('');
  };

  const cancelEditField = () => {
    setEditFieldOpen(false);
    setEditingFieldIdx(null);
    setEditFieldLabel('');
    setEditFieldQuestion('');
  };

  const addField = () => {
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key || !newFieldLabel.trim() || !newFieldQuestion.trim()) return;
    if (configFields.some((f) => f.key === key)) return;
    setConfigFields((prev) => [
      ...prev,
      {
        key,
        label: newFieldLabel.trim(),
        question: newFieldQuestion.trim(),
        order: prev.length,
        normalize: newFieldType === 'string',
        type: newFieldType,
        source: newFieldSource,
        required: newFieldRequired,
        visible: true,
      },
    ]);
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldQuestion('');
    setNewFieldType('string');
    setNewFieldSource('bot');
    setNewFieldRequired(false);
    setAddFieldOpen(false);
  };

  return {
    configMessages, setConfigMessages,
    configFields, setConfigFields,
    savingMessages, savingFields,
    infoTab, setInfoTab,
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel: newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    editFieldOpen,
    editingFieldIdx,
    editFieldLabel, setEditFieldLabel,
    editFieldQuestion, setEditFieldQuestion,
    saveMessages, saveFields,
    moveField, deleteField,
    openEditField, saveEditField, cancelEditField,
    addField,
  };
}
