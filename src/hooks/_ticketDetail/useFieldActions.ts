'use client';

import { useState } from 'react';
import { ticketsService } from '@/services/tickets.service';
import { whatsappService } from '@/services/whatsapp.service';
import { useAppToast } from '@/components/toast-provider';

export function useFieldActions(ticketId: string, onError: (msg: string | null) => void) {
  const { showToast } = useAppToast();
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [deletingPhoto, setDeletingPhoto] = useState<{ fieldKey: string; idx: number } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [updatingFieldKey, setUpdatingFieldKey] = useState<string | null>(null);

  const [requestModal, setRequestModal] = useState<{ fieldKey: string; fieldLabel: string } | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestingField, setRequestingField] = useState(false);

  const toggleField = (fieldKey: string) => {
    setExpandedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const deletePhoto = async (fieldKey: string, idx: number) => {
    setDeletingPhoto({ fieldKey, idx });
    onError(null);
    try {
      await ticketsService.deletePhoto(ticketId, fieldKey, idx);
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Error al eliminar la foto.');
    } finally {
      setDeletingPhoto(null);
    }
  };

  const uploadPhotos = async (fieldKey: string, files: File[]) => {
    if (!files.length) return;
    setUploadingField(fieldKey);
    onError(null);
    try {
      for (const file of files) {
        await ticketsService.uploadPhoto(ticketId, fieldKey, file);
      }
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Error al subir las fotos.');
    } finally {
      setUploadingField(null);
    }
  };

  const updateExtraField = async (fieldKey: string, value: string) => {
    setUpdatingFieldKey(fieldKey);
    onError(null);
    try {
      await ticketsService.updateExtraField(ticketId, fieldKey, value);
      showToast({ type: 'success', title: 'Campo actualizado', message: 'El valor se guardó correctamente.' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar el campo.';
      onError(msg);
      showToast({ type: 'error', title: 'No se pudo actualizar el campo', message: msg });
    } finally {
      setUpdatingFieldKey(null);
    }
  };

  const requestFieldImprovement = async () => {
    if (!requestModal) return;
    setRequestingField(true);
    onError(null);
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
      onError(error instanceof Error ? error.message : 'Error al enviar la solicitud.');
    } finally {
      setRequestingField(false);
    }
  };

  return {
    expandedFields, toggleField,
    deletingPhoto, uploadingField, updatingFieldKey,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    deletePhoto, uploadPhotos, updateExtraField, requestFieldImprovement,
  };
}
