'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ticket, StatusHistoryEntry, TimelineEntry } from '@/types';

export function useTicketData(ticketId: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket?.reporter?.phone) return;
    getDoc(doc(db, 'hosts', ticket.reporter.phone)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as { nombre?: string };
        setHostName(data.nombre || null);
      }
    });
  }, [ticket?.reporter?.phone]);

  useEffect(() => {
    if (!ticketId) return;
    const unsub = onSnapshot(
      doc(db, 'tickets', ticketId),
      (snap) => {
        if (snap.exists()) {
          setTicket({ id: snap.id, ...snap.data() } as Ticket);
        }
      },
      (error) => {
        console.warn('⚠️ Snapshot bloqueado:', error.message);
        setErrorStatus('Permiso denegado. Inicia sesión como Admin.');
      },
    );
    return () => unsub();
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const q = query(
      collection(db, 'tickets', ticketId, 'statusHistory'),
      orderBy('timestamp', 'asc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StatusHistoryEntry));
      },
      (error) => {
        console.warn('⚠️ Historial bloqueado:', error.message);
      },
    );
    return () => unsub();
  }, [ticketId]);

  const timeline = useMemo<TimelineEntry[]>(() => {
    if (!ticket) return [];
    const initial: TimelineEntry = {
      kind: 'status',
      status: 'REPORTADO',
      timestamp: ticket.timestamps?.createdAt ? Number(ticket.timestamps.createdAt) : 0,
      comments: 'Ticket creado',
      changedBy: undefined,
      scheduledDate: undefined,
    };
    return [
      initial,
      ...history.map((e): TimelineEntry =>
        e.type === 'FIELD_UPDATE'
          ? {
              kind: 'field',
              fieldLabel: e.fieldLabel,
              previousValue: e.previousValue,
              newValue: e.newValue,
              timestamp: e.timestamp,
              comments: e.comments,
              changedBy: e.changedBy,
            }
          : {
              kind: 'status',
              status: e.newStatus,
              timestamp: e.timestamp,
              comments: e.comments,
              changedBy: e.changedBy,
              scheduledDate: e.scheduledDate,
            },
      ),
    ];
  }, [ticket, history]);

  return { ticket, hostName, history, timeline, errorStatus, setErrorStatus };
}
