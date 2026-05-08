import { useState } from 'react';
import { ChatMessage } from '@/types';
import { whatsappService } from '@/services/whatsapp.service';

export function useWhatsappHistory() {
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;
    setLoading(true);
    setError(null);
    setMessages([]);
    try {
      const data = await whatsappService.getChatHistory(phoneSearch.trim());
      setMessages(data.messages || []);
      setSelectedPhone(phoneSearch.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la conversación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedPhone) return;
    setSendingReply(true);
    setError(null);
    try {
      await whatsappService.sendReply(selectedPhone, replyText);
      setReplyText('');
      const data = await whatsappService.getChatHistory(selectedPhone);
      setMessages(data.messages || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la respuesta.';
      setError(msg);
    } finally {
      setSendingReply(false);
    }
  };

  return {
    phoneSearch, setPhoneSearch,
    selectedPhone,
    messages,
    loading,
    error,
    replyText, setReplyText,
    sendingReply,
    search,
    sendReply,
  };
}
