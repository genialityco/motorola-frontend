import { BotMessages, BotSettings, BotField, SystemFieldConfig } from '@/types';

export const DEFAULT_BOT_MESSAGES: BotMessages = {
  menu: 'Hola, a continuación te mostraré las diferentes funcionalidades que poseo:\n1. Para crear un ticket presiona 1\n2. Para ver el estado de tus tickets presiona 2\n3. Para editar un ticket presiona 3\n4. Para eliminar un ticket presiona 4\n5. Para finalizar un ticket presiona 5',
  ticketCreated: '✅ Ticket *{ticketNumber}* {action} exitosamente.\n\nTe notificaremos cuando haya actualizaciones de estados.',
  ticketDeleted: '✅ Ticket *{ticketNumber}* eliminado correctamente.',
  statusChanged: 'El estado de su solicitud *{ticketNumber}* ha cambiado de "{prevStatus}" a "{newStatus}".',
  aprobacionPiezasMessage: 'Estas son las piezas propuestas para la aprobación de tu solicitud *{ticketNumber}*:',
  noTickets: 'No tienes tickets registrados aún. ¿Puedo ayudarte en algo más?',
  invalidField: 'Por favor ingresa una respuesta válida.',
  cancelled: 'Operación cancelada.',
  goodbye: 'Hasta luego 👋. Escribe cualquier mensaje para volver al menú.',
  viewTicketOptions: '¿Qué deseas ver?\n1. Info del ticket\n2. Ver fotos',
  backToMenuKeyword: 'INICIO',
  adminRequestUpdate: '📋 El administrador te solicita actualizar el campo *{fieldLabel}* de tu ticket *{ticketNumber}*.\n\nPara actualizar esta información, selecciona la opción *3* (Editar) en el menú.',
  ticketSelectPrompt: 'Selecciona el número del ticket que deseas *{action}*:',
  ticketListItemTemplate: '{index}. 📋 *{ticketNumber}*\n   Estado: {estado}\n   Fecha: {fecha}',
  deletePhotoRequest: '',
  editFieldPrompt: '',
  sessionExpiredCreate: 'Tu sesión para crear el ticket expiró por inactividad ({hours} horas). Por favor, selecciona la opción *1* para comenzar nuevamente.',
  sessionExpiredEdit: 'Tu sesión para editar el ticket expiró por inactividad ({hours} horas). Por favor, selecciona la opción *3* para editar nuevamente.',
  sessionExpiredGeneric: 'Tu sesión expiró por inactividad ({hours} horas). Por favor, selecciona una opción del menú.',
};

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  sessionTimeoutHours: 24,
  compliance: {
    aTiempoMaxDias: 7,
    atencionPrioritariaMaxDias: 14,
  },
};

export const DEFAULT_BOT_FIELDS: BotField[] = [
  { key: 'ciudad', label: 'Ciudad', question: '¿En qué ciudad se encuentra el punto de venta?', order: 0, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'canal', label: 'Canal', question: '¿Cuál es el canal de venta? (ejemplo: Retail, Operador, Online):', order: 1, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'punto', label: 'Punto de Venta', question: '¿Cuál es el nombre del punto de venta?', order: 2, normalize: true, type: 'string', source: 'bot', required: true, visible: true, excel: true },
  { key: 'novelty.type', label: 'Tipo de Novedad', question: 'Tipo de Novedad', order: 3, normalize: false, type: 'string', source: 'bot', required: false, visible: true, excel: false },
  { key: 'novelty.description', label: 'Descripción / Novedad', question: 'Descripción / Novedad', order: 4, normalize: false, type: 'string', source: 'bot', required: true, visible: true, excel: false },
  { key: 'photos.evidence', label: 'Fotos de Evidencia', question: 'Fotos de Evidencia', order: 5, normalize: false, type: 'photo', source: 'bot', required: false, visible: false, excel: false },
  { key: 'photos.repair', label: 'Fotos de Reparación', question: 'Fotos de Reparación', placeholder: 'Sube aquí las fotos de reparación', order: 6, normalize: false, type: 'photo', source: 'admin', required: false, visible: false, excel: false },
];

export const SYSTEM_FIELDS_DEFAULT: SystemFieldConfig[] = [
  { key: 'ticketNumber', label: 'Ticket #', visible: true },
  { key: 'createdAt', label: 'Creación', visible: true },
  { key: 'estado', label: 'Estado', visible: true },
  { key: 'alertaCumplimiento', label: 'Alerta', visible: true },
  { key: 'reporter', label: 'Reportado Por', visible: true },
];
