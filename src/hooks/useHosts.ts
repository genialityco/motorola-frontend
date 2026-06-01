import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/lib/firebase';
import { Host } from '@/types';
import { hostsService } from '@/services/hosts.service';
import { useAppToast } from '@/components/toast-provider';

export function useHosts() {
  const { showToast } = useAppToast();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [hostTicketsModalOpen, setHostTicketsModalOpen] = useState(false);
  const [editHostModalOpen, setEditHostModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [savingHost, setSavingHost] = useState(false);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.HOSTS));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Host[];
        setHosts(data);
      },
      (err) => {
        console.warn('⚠️ No se pudo leer hosts:', err.message);
      },
    );
    return () => unsub();
  }, []);

  const openHostTickets = (host: Host) => {
    setSelectedHost(host);
    setHostTicketsModalOpen(true);
  };

  const openEditHost = (host: Host) => {
    setEditingHost(host);
    setEditNombre(host.nombre);
    setEditHostModalOpen(true);
  };

  const saveHostNombre = async () => {
    if (!editingHost || !editNombre.trim()) return;
    setSavingHost(true);
    try {
      await hostsService.updateNombre(editingHost.telefono, editNombre.trim());
      setEditHostModalOpen(false);
      showToast({
        type: 'success',
        title: 'Host actualizado',
        message: `El nombre de ${editingHost.telefono} se actualizó correctamente.`,
      });
    } catch (e) {
      console.error('Error actualizando host:', e);
      showToast({
        type: 'error',
        title: 'No se pudo actualizar el host',
        message: 'Intenta nuevamente en unos segundos.',
      });
    } finally {
      setSavingHost(false);
    }
  };

  return {
    hosts,
    selectedHost,
    hostTicketsModalOpen, setHostTicketsModalOpen,
    editHostModalOpen, setEditHostModalOpen,
    editingHost,
    editNombre, setEditNombre,
    savingHost,
    openHostTickets,
    openEditHost,
    saveHostNombre,
  };
}
