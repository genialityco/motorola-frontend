import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/lib/firebase';
import { ChatSession, Host, SessionMessage } from '@/types';
import { whatsappService } from '@/services/whatsapp.service';
import { useAppToast } from '@/components/toast-provider';

export function useWhatsappSessions() {
  const { showToast } = useAppToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [hostNames, setHostNames] = useState<Record<string, string>>({});
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botEnabled, setBotEnabled] = useState(true);
  const [togglingBot, setTogglingBot] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.HOSTS),
      (snapshot) => {
        const map: Record<string, string> = {};
        snapshot.docs.forEach((d) => {
          const h = d.data() as Host;
          if (h.telefono && h.nombre) map[h.telefono] = h.nombre;
        });
        setHostNames(map);
      },
      (err) => console.warn('Error leyendo hosts:', err),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.SESSIONS),
      (snapshot) => {
        const list: ChatSession[] = snapshot.docs.map((d) => {
          const data = d.data();
          const msgs: SessionMessage[] = data.messages || [];
          const last = msgs[msgs.length - 1]?.text ?? '';
          return {
            phone: d.id,
            state: data.state || 'IDLE',
            messages: msgs,
            lastMessage: last.length > 50 ? last.slice(0, 50) + '…' : last,
          };
        });
        list.sort((a, b) => {
          const aT = a.messages[a.messages.length - 1]?.timestamp ?? 0;
          const bT = b.messages[b.messages.length - 1]?.timestamp ?? 0;
          return bT - aT;
        });
        setSessions(list);
      },
      (err) => console.warn('Error leyendo sesiones:', err),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedPhone) return;
    const unsub = onSnapshot(
      doc(db, COLLECTIONS.SESSIONS, selectedPhone),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSelectedSession({
            phone: snap.id,
            state: data.state || 'IDLE',
            messages: (data.messages || []).sort(
              (a: SessionMessage, b: SessionMessage) => a.timestamp - b.timestamp,
            ),
            lastMessage: '',
          });
          setBotEnabled(data.botEnabled !== false);
        }
      },
    );
    return () => unsub();
  }, [selectedPhone]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedPhone || sending) return;
    setInput('');
    setSending(true);
    setError(null);
    try {
      await whatsappService.sendAdminMessage(selectedPhone, text);
      showToast({
        type: 'success',
        title: 'Mensaje enviado',
        message: `Se envió un mensaje a ${hostNames[selectedPhone] ?? selectedPhone}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error enviando el mensaje.';
      setError(msg);
      showToast({
        type: 'error',
        title: 'No se pudo enviar el mensaje',
        message: msg,
      });
    } finally {
      setSending(false);
    }
  };

  const handleToggleBot = async (enabled: boolean) => {
    if (!selectedPhone) return;
    setTogglingBot(true);
    try {
      await whatsappService.toggleBot(selectedPhone, enabled);
      setBotEnabled(enabled);
      showToast({
        type: 'success',
        title: enabled ? 'Bot activado' : 'Bot desactivado',
        message: `${hostNames[selectedPhone] ?? selectedPhone} quedó ${enabled ? 'con bot activo' : 'sin bot activo'}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar el estado del bot.';
      setError(msg);
      setBotEnabled(!enabled);
      showToast({
        type: 'error',
        title: 'No se pudo cambiar el bot',
        message: msg,
      });
    } finally {
      setTogglingBot(false);
    }
  };

  return {
    sessions,
    hostNames,
    selectedPhone, setSelectedPhone,
    selectedSession,
    input, setInput,
    sending,
    error,
    botEnabled,
    togglingBot,
    viewport,
    handleSend,
    handleToggleBot,
  };
}
