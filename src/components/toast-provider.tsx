"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Portal, Paper, Group, Text, ActionIcon, Stack } from '@mantine/core';
import { IconCheck, IconX, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

type ToastType = 'success' | 'error' | 'info';

export type AppToast = {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
};

type ToastInput = Omit<AppToast, 'id'>;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_META: Record<ToastType, { color: string; icon: ReactNode }> = {
  success: { color: 'teal', icon: <IconCheck size={16} /> },
  error: { color: 'red', icon: <IconAlertCircle size={16} /> },
  info: { color: 'blue', icon: <IconInfoCircle size={16} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const nextToast: AppToast = { id, type: 'info', duration: 3200, ...toast };
    setToasts((prev) => [...prev, nextToast]);
    window.setTimeout(() => hideToast(id), nextToast.duration ?? 3200);
  }, [hideToast]);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <Stack gap="xs" style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000, pointerEvents: 'none' }}>
          {toasts.map((toast) => {
            const meta = TYPE_META[toast.type || 'info'];
            return (
              <Paper
                key={toast.id}
                shadow="lg"
                radius="md"
                withBorder
                p="sm"
                style={{
                  width: 320,
                  borderLeft: `4px solid var(--mantine-color-${meta.color}-6)`,
                  pointerEvents: 'auto',
                  background: 'var(--mantine-color-body)',
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="xs" align="flex-start" wrap="nowrap" style={{ flex: 1 }}>
                    <ActionIcon variant="light" color={meta.color} radius="xl" size="sm">
                      {meta.icon}
                    </ActionIcon>
                    <div style={{ minWidth: 0 }}>
                      <Text fw={700} size="sm">{toast.title}</Text>
                      {toast.message && <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{toast.message}</Text>}
                    </div>
                  </Group>
                  <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => hideToast(toast.id)}>
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </Portal>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useAppToast must be used within ToastProvider');
  }
  return ctx;
}
