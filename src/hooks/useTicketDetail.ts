import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [deletingPhotoIdx, setDeletingPhotoIdx] = useState<number | null>(null);
  const [deletingRepairIdx, setDeletingRepairIdx] = useState<number | null>(null);
  const [repairFiles, setRepairFiles] = useState<File[]>([]);
  const [uploadingRepair, setUploadingRepair] = useState(false);
  const repairFileInputRef = useRef<(() => void) | null>(null);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [repairExpanded, setRepairExpanded] = useState(false);
  const [observations, setObservations] = useState('');
  const [savingObservations, setSavingObservations] = useState(false);
  const [requestModal, setRequestModal] = useState<{ fieldKey: string; fieldLabel: string } | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestingField, setRequestingField] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    const unsub = onSnapshot(
      doc(db, 'tickets', ticketId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()!;
          setTicket({ id: snap.id, ...data } as Ticket);
          setObservations((data.observations as string) || '');
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
    return [initial, ...history.map((e) => ({ status: e.newStatus, timestamp: e.timestamp, comments: e.comments, changedBy: e.changedBy }))];
  }, [ticket, history]);

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

  const deleteEvidencePhoto = async (idx: number) => {
    setDeletingPhotoIdx(idx);
    setErrorStatus(null);
    try {
      await ticketsService.deleteEvidencePhoto(ticketId, idx);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar la foto.';
      setErrorStatus(msg);
    } finally {
      setDeletingPhotoIdx(null);
    }
  };

  const deleteRepairPhoto = async (idx: number) => {
    setDeletingRepairIdx(idx);
    setErrorStatus(null);
    try {
      await ticketsService.deleteRepairPhoto(ticketId, idx);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar la foto de reparación.';
      setErrorStatus(msg);
    } finally {
      setDeletingRepairIdx(null);
    }
  };

  const uploadRepairPhotos = async () => {
    if (!repairFiles.length) return;
    setUploadingRepair(true);
    setErrorStatus(null);
    try {
      for (const file of repairFiles) {
        await ticketsService.uploadRepairPhoto(ticketId, file);
      }
      setRepairFiles([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al subir las fotos.';
      setErrorStatus(msg);
    } finally {
      setUploadingRepair(false);
    }
  };

  const saveObservations = async () => {
    setSavingObservations(true);
    setErrorStatus(null);
    try {
      await ticketsService.updateObservation(ticketId, observations);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar las observaciones.';
      setErrorStatus(msg);
    } finally {
      setSavingObservations(false);
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
    observations, setObservations,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    evidenceExpanded, setEvidenceExpanded,
    repairExpanded, setRepairExpanded,
    deletingPhotoIdx,
    deletingRepairIdx,
    repairFiles, setRepairFiles,
    uploadingRepair,
    repairFileInputRef,
    savingObservations,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus,
    deleteEvidencePhoto,
    deleteRepairPhoto,
    uploadRepairPhotos,
    saveObservations,
    requestFieldImprovement,
  };
}
