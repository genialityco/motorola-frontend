'use client';

import { useMemo, useState } from 'react';
import { Ticket, BotSettings, ComplianceLevel } from '@/types';
import { ACTIVE_TICKET_STATUSES, getComplianceLevel } from '../_constants';
import { getFieldValue } from '../_utils';

export type SortDir = 'asc' | 'desc';

export function useTicketsFilter(tickets: Ticket[], configSettings: BotSettings) {
  const [ticketSubTab, setTicketSubTab] = useState<string | null>('activos');
  const [sortCol, setSortCol] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterFields, setFilterFieldsState] = useState<Record<string, string[]>>({});
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterAlerta, setFilterAlerta] = useState<ComplianceLevel[]>([]);
  const [filterFechaFrom, setFilterFechaFrom] = useState('');
  const [filterFechaTo, setFilterFechaTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketSubTab === 'activos' && !ACTIVE_TICKET_STATUSES.has(t.status)) return false;
      if (ticketSubTab === 'archivados' && !['ARCHIVADO', 'CANCELADO'].includes(t.status)) return false;
      if (ticketSubTab === 'finalizados' && t.status !== 'FINALIZADO') return false;
      if (ticketSubTab === 'cancelados' && !['ARCHIVADO', 'CANCELADO'].includes(t.status)) return false;
      for (const [key, vals] of Object.entries(filterFields)) {
        if (vals.length && !vals.includes(getFieldValue(t, key))) return false;
      }
      if (filterEstados.length && !filterEstados.includes(t.status)) return false;
      if (filterAlerta.length && !filterAlerta.includes(getComplianceLevel(t.timestamps, configSettings))) return false;
      if (filterFechaFrom) {
        const from = new Date(filterFechaFrom).getTime();
        if ((t.timestamps?.createdAt || 0) < from) return false;
      }
      if (filterFechaTo) {
        const to = new Date(filterFechaTo + 'T23:59:59').getTime();
        if ((t.timestamps?.createdAt || 0) > to) return false;
      }
      return true;
    });
  }, [tickets, ticketSubTab, filterFields, filterEstados, filterAlerta, filterFechaFrom, filterFechaTo, configSettings]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      if (sortCol === 'ticketNumber') { aVal = a.ticketNumber ?? 0; bVal = b.ticketNumber ?? 0; }
      else if (sortCol === 'createdAt') { aVal = a.timestamps?.createdAt ?? 0; bVal = b.timestamps?.createdAt ?? 0; }
      else if (sortCol === 'estado') { aVal = a.status ?? ''; bVal = b.status ?? ''; }
      else if (sortCol === 'alertaCumplimiento') { aVal = a.timestamps?.createdAt ?? 0; bVal = b.timestamps?.createdAt ?? 0; }
      else { aVal = getFieldValue(a, sortCol); bVal = getFieldValue(b, sortCol); }

      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const pageSizeNum = parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSizeNum));
  const paginated = sorted.slice((page - 1) * pageSizeNum, page * pageSizeNum);
  const startIdx = sorted.length === 0 ? 0 : (page - 1) * pageSizeNum + 1;
  const endIdx = Math.min(page * pageSizeNum, sorted.length);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const setFieldFilter = (key: string, vals: string[]) => {
    setFilterFieldsState((prev) => ({ ...prev, [key]: vals }));
    setPage(1);
  };

  const withPageReset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };

  return {
    ticketSubTab, setTicketSubTab,
    sortCol, sortDir, handleSort,
    filterFields, setFieldFilter,
    filterEstados, setFilterEstados,
    filterAlerta, setFilterAlerta,
    filterFechaFrom, setFilterFechaFrom,
    filterFechaTo, setFilterFechaTo,
    page, setPage,
    pageSize, setPageSize,
    filtered, sorted, paginated,
    totalPages, startIdx, endIdx,
    withPageReset,
  };
}
