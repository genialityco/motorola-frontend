import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ticket } from '@/types';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tickets'));
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
  }, []);

  return { tickets };
}
