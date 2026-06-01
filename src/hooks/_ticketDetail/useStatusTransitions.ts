'use client';

import { useState } from 'react';
import { TicketStatus } from '@/types';
import { ticketsService } from '@/services/tickets.service';
import { useAppToast } from '@/components/toast-provider';

export function useStatusTransitions(ticketId: string, onError: (msg: string | null) => void) {
  const { showToast } = useAppToast();
  const [loadingStatus, setLoadingStatus] = useState<TicketStatus | null>(null);

  const executeTransition = async (newStatus: TicketStatus) => {
    setLoadingStatus(newStatus);
    onError(null);
    try {
      await ticketsService.transition(ticketId, newStatus);
      showToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `El ticket cambió a ${newStatus.replace(/_/g, ' ')}.`,
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
    void executeTransition(newStatus);
  };

  return {
    loadingStatus,
    changeStatus,
  };
}
