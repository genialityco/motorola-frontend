'use client';

import { useState, useEffect, useCallback } from 'react';
import { usersService, GestorUser, AssignmentRule } from '@/services/users.service';
import { useAppToast } from '@/components/toast-provider';

export interface GestorCreateForm {
  name: string;
  email: string;
  password: string;
  assignmentRules: AssignmentRule[];
}

export interface GestorEditForm {
  name: string;
  assignmentRules: AssignmentRule[];
}

const EMPTY_CREATE: GestorCreateForm = { name: '', email: '', password: '', assignmentRules: [] };
const EMPTY_EDIT: GestorEditForm = { name: '', assignmentRules: [] };

export function useGestores() {
  const { showToast } = useAppToast();
  const [gestores, setGestores] = useState<GestorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<GestorCreateForm>(EMPTY_CREATE);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GestorEditForm>(EMPTY_EDIT);

  const fetchGestores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersService.listUsers();
      setGestores(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGestores(); }, [fetchGestores]);

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setCreateOpen(true);
  };

  const openEdit = (g: GestorUser) => {
    setEditingUid(g.uid);
    setEditForm({ name: g.name ?? '', assignmentRules: g.assignmentRules ?? [] });
    setEditOpen(true);
  };

  // ── Rule helpers for create form ─────────────────────────────────────────
  const addCreateRule = (fieldKey: string, fieldValues: string[]) => {
    setCreateForm((prev) => {
      const idx = prev.assignmentRules.findIndex((r) => r.fieldKey === fieldKey);
      if (idx >= 0) {
        return {
          ...prev,
          assignmentRules: prev.assignmentRules.map((r, i) =>
            i === idx ? { ...r, fieldValues: [...new Set([...r.fieldValues, ...fieldValues])] } : r,
          ),
        };
      }
      return { ...prev, assignmentRules: [...prev.assignmentRules, { fieldKey, fieldValues }] };
    });
  };

  const removeCreateRule = (idx: number) => {
    setCreateForm((prev) => ({
      ...prev,
      assignmentRules: prev.assignmentRules.filter((_, i) => i !== idx),
    }));
  };

  // ── Rule helpers for edit form ────────────────────────────────────────────
  const addEditRule = (fieldKey: string, fieldValues: string[]) => {
    setEditForm((prev) => {
      const idx = prev.assignmentRules.findIndex((r) => r.fieldKey === fieldKey);
      if (idx >= 0) {
        return {
          ...prev,
          assignmentRules: prev.assignmentRules.map((r, i) =>
            i === idx ? { ...r, fieldValues: [...new Set([...r.fieldValues, ...fieldValues])] } : r,
          ),
        };
      }
      return { ...prev, assignmentRules: [...prev.assignmentRules, { fieldKey, fieldValues }] };
    });
  };

  const removeEditRule = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      assignmentRules: prev.assignmentRules.filter((_, i) => i !== idx),
    }));
  };

  // ── API actions ───────────────────────────────────────────────────────────
  const createGestor = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) return;
    setSaving(true);
    try {
      await usersService.createGestor({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        assignmentRules: createForm.assignmentRules,
      });
      showToast({ type: 'success', title: 'Gestor creado', message: `${createForm.name} fue creado correctamente.` });
      setCreateOpen(false);
      await fetchGestores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el gestor.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editingUid || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await usersService.updateUser(editingUid, {
        name: editForm.name.trim(),
        assignmentRules: editForm.assignmentRules,
      });
      showToast({ type: 'success', title: 'Gestor actualizado', message: 'Los cambios se guardaron.' });
      setEditOpen(false);
      await fetchGestores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar.';
      showToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (g: GestorUser) => {
    try {
      await usersService.updateUser(g.uid, { active: !g.active });
      showToast({ type: 'success', title: g.active ? 'Gestor desactivado' : 'Gestor activado', message: g.name });
      await fetchGestores();
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo cambiar el estado.' });
    }
  };

  const deleteGestor = async (uid: string) => {
    try {
      await usersService.deleteUser(uid);
      showToast({ type: 'success', title: 'Gestor eliminado', message: 'El usuario fue eliminado del sistema.' });
      await fetchGestores();
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el gestor.' });
    }
  };

  const recompute = async () => {
    try {
      const result = await usersService.recomputeAssignments();
      showToast({ type: 'success', title: 'Asignaciones recalculadas', message: `${result.updated} tickets actualizados.` });
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'No se pudo recalcular.' });
    }
  };

  return {
    gestores, loading, saving,
    createOpen, setCreateOpen, createForm, setCreateForm, openCreate, createGestor,
    addCreateRule, removeCreateRule,
    editOpen, setEditOpen, editForm, setEditForm, openEdit, saveEdit,
    addEditRule, removeEditRule,
    toggleActive, deleteGestor, recompute,
  };
}
