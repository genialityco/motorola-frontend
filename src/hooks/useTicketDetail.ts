'use client';

import { useState } from 'react';
import { useTicketData } from './_ticketDetail/useTicketData';
import { useStatusTransitions } from './_ticketDetail/useStatusTransitions';
import { useFieldActions } from './_ticketDetail/useFieldActions';

export function useTicketDetail(ticketId: string) {
  const data = useTicketData(ticketId);
  const transitions = useStatusTransitions(ticketId, data.setErrorStatus);
  const fields = useFieldActions(ticketId, data.setErrorStatus);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  return {
    ...data,
    historyExpanded, setHistoryExpanded,
    ...transitions,
    ...fields,
  };
}
