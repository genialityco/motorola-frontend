import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/lib/firebase';
import { Ticket } from '@/types';

export function useTickets(role?: string | null, uid?: string | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const baseCollection = collection(db, COLLECTIONS.TICKETS);
    const q =
      role === 'gestor' && uid
        ? query(baseCollection, where('assignedGestorIds', 'array-contains', uid))
        : query(baseCollection);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rawTickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Ticket[];
        setTickets(Array.from(new Map(rawTickets.map((t) => [t.id, t])).values()));
      },
      (err) => {
        console.warn('⚠️ Snapshot bloqueado por Reglas/Auth:', err.message);
        setTickets([]);
      },
    );
    return () => unsub();
  }, [role, uid]);

  return { tickets };
}
