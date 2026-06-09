'use client';

import { useParams } from 'next/navigation';
import { Paper, Loader } from '@mantine/core';
import { useTicketDetail } from '@/hooks/useTicketDetail';
import { useBotConfig } from '@/hooks/useBotConfig';
import { TicketHeader } from './_components/TicketHeader';
import { TicketFields } from './_components/TicketFields';
import { StatusHistory } from './_components/StatusHistory';
import { StatusChanger } from './_components/StatusChanger';
import { ScheduledDateModal } from './_components/ScheduledDateModal';
import { RequestFieldModal } from './_components/RequestFieldModal';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const {
    ticket, hostName, timeline,
    loadingStatus,
    errorStatus, setErrorStatus,
    historyExpanded, setHistoryExpanded,
    expandedFields, toggleField,
    deletingPhoto, uploadingField, updatingFieldKey,
    scheduledModal, setScheduledModal,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    scheduledDateError,
    requestModal, setRequestModal,
    requestMessage, setRequestMessage,
    requestingField,
    changeStatus, confirmScheduledTransition,
    deletePhoto, uploadPhotos, updateExtraField,
    requestFieldImprovement,
  } = useTicketDetail(ticketId);

  const { configFields } = useBotConfig();

  if (!ticket) return <Loader color="blue" type="bars" mt="xl" />;

  return (
    <Paper p="lg" shadow="sm" radius="md" withBorder>
      <TicketHeader
        ticket={ticket}
        hostName={hostName}
        errorStatus={errorStatus}
        onClearError={() => setErrorStatus(null)}
        configFields={configFields}
        timeline={timeline}
      />

      <TicketFields
        ticket={ticket}
        configFields={configFields}
        expandedFields={expandedFields}
        toggleField={toggleField}
        deletingPhoto={deletingPhoto}
        uploadingField={uploadingField}
        updatingFieldKey={updatingFieldKey}
        onDeletePhoto={deletePhoto}
        onUploadPhotos={uploadPhotos}
        onUpdateExtraField={updateExtraField}
        onRequestImprovement={(fieldKey, fieldLabel) => setRequestModal({ fieldKey, fieldLabel })}
      />

      <StatusHistory
        timeline={timeline}
        expanded={historyExpanded}
        onToggle={() => setHistoryExpanded(!historyExpanded)}
      />

      <StatusChanger
        currentStatus={ticket.status}
        loadingStatus={loadingStatus}
        onChange={changeStatus}
      />

      <ScheduledDateModal
        status={scheduledModal?.status ?? null}
        onClose={() => setScheduledModal(null)}
        date={scheduledDate}
        setDate={setScheduledDate}
        time={scheduledTime}
        setTime={setScheduledTime}
        error={scheduledDateError}
        loading={loadingStatus !== null}
        onConfirm={confirmScheduledTransition}
      />

      <RequestFieldModal
        data={requestModal}
        ticketNumber={ticket.ticketNumber}
        message={requestMessage}
        setMessage={setRequestMessage}
        loading={requestingField}
        onClose={() => setRequestModal(null)}
        onSend={requestFieldImprovement}
      />
    </Paper>
  );
}
