'use client';

import { useState } from 'react';
import { TicketStatus } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

export function useStatusTransitions(ticketId: string, onError: (msg: string | null) => void) {
  const { showToast } = useAppToast();
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);
  const [scheduledModal, setScheduledModal] = useState<{ status: TicketStatus } | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDateError, setScheduledDateError] = useState<string | null>(null);

  const executeTransition = async (newStatus: TicketStatus, date?: string) => {
    setLoadingStatus(newStatus);
    onError(null);
    try {
      await ticketsService.transition(ticketId, newStatus, undefined, date);
      showToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `El ticket cambió a ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Algo salió mal al transicionar el estado.';
      onError(msg);
      showToast({ type: 'error', title: 'No se pudo cambiar el estado', message: msg });
    } finally {
      setLoadingStatus(null);
    }
  };

  const changeStatus = (newStatus: TicketStatus) => {
    if (newStatus === 'PROGRAMADO' || newStatus === 'REPROGRAMADO') {
      setScheduledDate('');
      setScheduledTime('');
      setScheduledDateError(null);
      setScheduledModal({ status: newStatus });
      return;
    }
    void executeTransition(newStatus);
  };

  const confirmScheduledTransition = async () => {
    if (!scheduledModal) return;
    if (!scheduledDate || !scheduledTime) {
      setScheduledDateError('La fecha y hora programadas son obligatorias.');
      return;
    }
    const newStatus = scheduledModal.status;
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}`;
    setScheduledModal(null);
    await executeTransition(newStatus, scheduledDateTime);
  };

  return {
    loadingStatus,
    scheduledModal, setScheduledModal,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    scheduledDateError,
    changeStatus, confirmScheduledTransition,
  };
}
