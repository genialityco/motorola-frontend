'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usersService } from '@/services/users.service';

/**
 * Visibilidad de las columnas de la tabla de tickets, por usuario.
 *
 * Solo se guardan las columnas que el usuario cambió (`{ clave: visible }`);
 * el resto sigue el valor por defecto de la configuración de campos, así que
 * las columnas nuevas aparecen sin tener que tocar las preferencias guardadas.
 * Se persisten en el backend (`/api/users/me/preferences`) con un pequeño
 * retardo para no lanzar una petición por cada clic.
 */
export function useColumnPrefs(uid?: string | null) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const overridesRef = useRef<Record<string, boolean>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    usersService
      .getMyPreferences()
      .then((prefs) => {
        if (!active) return;
        const saved = prefs?.ticketColumns ?? {};
        overridesRef.current = saved;
        setOverrides(saved);
      })
      .catch((err) => console.warn('No se pudieron cargar las preferencias de columnas:', err))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [uid]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const persist = useCallback((next: Record<string, boolean>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      usersService
        .updateMyPreferences({ ticketColumns: next })
        .catch((err) => console.warn('No se pudieron guardar las preferencias de columnas:', err));
    }, 500);
  }, []);

  const setColumnVisible = useCallback((key: string, visible: boolean) => {
    const next = { ...overridesRef.current, [key]: visible };
    overridesRef.current = next;
    setOverrides(next);
    persist(next);
  }, [persist]);

  /** Vuelve a los valores por defecto de la configuración de campos. */
  const resetColumns = useCallback(() => {
    overridesRef.current = {};
    setOverrides({});
    persist({});
  }, [persist]);

  return { columnOverrides: overrides, setColumnVisible, resetColumns, prefsLoaded: loaded };
}
