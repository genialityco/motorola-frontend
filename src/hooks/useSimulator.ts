import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types';
import { whatsappService } from '@/services/whatsapp.service';

export function useSimulator() {
  const [phone, setPhone] = useState('573001234567');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const resetFileRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    whatsappService
      .getChatHistory(phone)
      .then((data) => setMessages(data.messages || []))
      .catch((err) => console.error('Error cargando historial:', err));
  }, [phone]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await whatsappService.getChatHistory(phone);
        const newMessages = data.messages || [];
        setMessages((prev) => (newMessages.length > prev.length ? newMessages : prev));
      } catch {
        // Error silencioso en polling
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phone]);

  const handleAddFiles = (files: File[] | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files]);
    resetFileRef.current?.();
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || !phone.trim() || loading) return;

    const filesSnapshot = pendingFiles;
    const localBubbles: ChatMessage[] = [
      ...filesSnapshot.map((f) => ({ from: 'user' as const, photoUrl: URL.createObjectURL(f), timestamp: Date.now() })),
      ...(text ? [{ from: 'user' as const, text, timestamp: Date.now() }] : []),
    ];

    setInput('');
    setPendingFiles([]);
    setError(null);
    setMessages((prev) => [...prev, ...localBubbles]);
    setLoading(true);

    try {
      await whatsappService.simulate(phone, text || undefined, filesSnapshot);
      const data = await whatsappService.getChatHistory(phone);
      setMessages(data.messages || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo conectar al backend NestJS.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setPendingFiles([]);
    setError(null);
  };

  return {
    phone, setPhone,
    input, setInput,
    messages,
    pendingFiles,
    loading,
    error,
    viewport,
    resetFileRef,
    handleAddFiles,
    removePendingFile,
    handleSend,
    handleReset,
  };
}
