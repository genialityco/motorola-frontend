'use client';

import { useState } from 'react';
import { BotField, FieldType, FieldSource } from '@/types';

type FieldsSetter = React.Dispatch<React.SetStateAction<BotField[]>>;

export function useFieldEditor(configFields: BotField[], setConfigFields: FieldsSetter) {
  // Add modal state
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldQuestion, setNewFieldQuestion] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('string');
  const [newFieldSource, setNewFieldSource] = useState<FieldSource>('bot');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  // Pasar a MAYÚSCULAS sin tildes ayuda a agrupar valores repetidos (ciudad,
  // canal), pero destroza el texto libre. Por eso se pregunta en vez de
  // aplicarse a todo campo de texto.
  const [newFieldNormalize, setNewFieldNormalize] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newFieldOptionInput, setNewFieldOptionInput] = useState('');
  const [newFieldAllowOther, setNewFieldAllowOther] = useState(false);
  const [newFieldOtherLabel, setNewFieldOtherLabel] = useState('');

  // Edit modal state
  const [editFieldOpen, setEditFieldOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldQuestion, setEditFieldQuestion] = useState('');
  const [editFieldPlaceholder, setEditFieldPlaceholder] = useState('');
  const [editFieldOptions, setEditFieldOptions] = useState<string[]>([]);
  const [editFieldOptionInput, setEditFieldOptionInput] = useState('');
  const [editFieldAllowOther, setEditFieldAllowOther] = useState(false);
  const [editFieldOtherLabel, setEditFieldOtherLabel] = useState('');

  const resetEditState = () => {
    setEditingFieldIdx(null);
    setEditFieldLabel('');
    setEditFieldQuestion('');
    setEditFieldPlaceholder('');
    setEditFieldOptions([]);
    setEditFieldOptionInput('');
    setEditFieldAllowOther(false);
    setEditFieldOtherLabel('');
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
    resetEditState();
  };

  const cancelEditField = () => {
    setEditFieldOpen(false);
    resetEditState();
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
      // Orden temporal alto para que aparezca al final de la lista unificada;
      // se renumera a 0..N-1 al guardar/recargar.
      order: Date.now(),
      normalize: newFieldType === 'string' && newFieldNormalize,
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
    setNewFieldNormalize(false);
    setNewFieldOptions([]);
    setNewFieldOptionInput('');
    setNewFieldAllowOther(false);
    setNewFieldOtherLabel('');
    setAddFieldOpen(false);
  };

  return {
    addFieldOpen, setAddFieldOpen,
    newFieldKey, setNewFieldKey,
    newFieldLabel, setNewFieldLabel,
    newFieldQuestion, setNewFieldQuestion,
    newFieldPlaceholder, setNewFieldPlaceholder,
    newFieldType, setNewFieldType,
    newFieldSource, setNewFieldSource,
    newFieldRequired, setNewFieldRequired,
    newFieldNormalize, setNewFieldNormalize,
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
    moveField, deleteField,
    openEditField, saveEditField, cancelEditField,
    addField, addListOption, removeListOption,
    addEditListOption, removeEditListOption,
  };
}
