import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ticket, TicketStatus, StatusHistoryEntry } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { whatsappService } from '@/services/whatsapp.service';

export function useTicketDetail(ticketId: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Per-field accordion expansion state
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  // Photo operations
  const [deletingPhoto, setDeletingPhoto] = useState<{ fieldKey: string; idx: number } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Request field improvement modal
  const [requestModal, setRequestModal] = useState<{ fieldKey: string; fieldLabel: string } | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestingField, setRequestingField] = useState(false);

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

  const timeline = useMemo(() => {
    if (!ticket) return [];
    const initial = {
      status: 'REPORTADO' as TicketStatus,
      timestamp: ticket.timestamps?.createdAt ? Number(ticket.timestamps.createdAt) : 0,
      comments: 'Ticket creado',
      changedBy: undefined as StatusHistoryEntry['changedBy'],
    };
    return [
      initial,
      ...history.map((e) => ({
        status: e.newStatus,
        timestamp: e.timestamp,
        comments: e.comments,
        changedBy: e.changedBy,
      })),
    ];
  }, [ticket, history]);

  const toggleField = (fieldKey: string) => {
    setExpandedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const changeStatus = async (newStatus: TicketStatus) => {
    setLoadingStatus(newStatus);
    setErrorStatus(null);
    try {
      await ticketsService.transition(ticketId, newStatus);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Algo salió mal al transicionar el estado.';
      setErrorStatus(msg);
    } finally {
      setLoadingStatus(null);
    }
  };

  const deletePhoto = async (fieldKey: string, idx: number) => {
    setDeletingPhoto({ fieldKey, idx });
    setErrorStatus(null);
    try {
      await ticketsService.deletePhoto(ticketId, fieldKey, idx);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar la foto.';
      setErrorStatus(msg);
    } finally {
      setDeletingPhoto(null);
    }
  };

  const uploadPhotos = async (fieldKey: string, files: File[]) => {
    if (!files.length) return;
    setUploadingField(fieldKey);
    setErrorStatus(null);
    try {
      for (const file of files) {
        await ticketsService.uploadPhoto(ticketId, fieldKey, file);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al subir las fotos.';
      setErrorStatus(msg);
    } finally {
      setUploadingField(null);
    }
  };

  const requestFieldImprovement = async () => {
    if (!requestModal || !ticket) return;
    setRequestingField(true);
    setErrorStatus(null);
    try {
      await whatsappService.requestFieldUpdate(
        ticketId,
        requestModal.fieldKey,
        requestModal.fieldLabel,
        requestMessage.trim() || undefined,
      );
      setRequestModal(null);
      setRequestMessage('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al enviar la solicitud.';
      setErrorStatus(msg);
    } finally {
      setRequestingField(false);
    }
  };

  return {
    ticket,
    history,
    timeline,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    expandedFields,
    toggleField,
    deletingPhoto,
    uploadingField,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus,
    deletePhoto,
    uploadPhotos,
    requestFieldImprovement,
  };
}
