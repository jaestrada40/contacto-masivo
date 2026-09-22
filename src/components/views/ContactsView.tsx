import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Smartphone, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Edit3, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
  PhoneCall,
  Mail,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Contact, User, UserRole } from '../../types';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';
import { ConfirmDialog } from '../layout/ConfirmDialog';

interface ContactsViewProps {
  contacts: Contact[];
  currentUser: User;
  onOpenNewContact: () => void;
  onOpenImport: () => void;
  onSelectContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onDataChanged: () => Promise<void>;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  currentUser,
  onOpenNewContact,
  onOpenImport,
  onSelectContact,
  onEditContact,
  onDataChanged,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConsentWA, setFilterConsentWA] = useState<'all' | 'yes' | 'no'>('all');
  const [filterConsentSMS, setFilterConsentSMS] = useState<'all' | 'yes' | 'no'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Unsubscribe Confirmation Modal State
  const [contactToUnsubscribe, setContactToUnsubscribe] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [unsubscribeReason, setUnsubscribeReason] = useState('Solicitud expresa de baja por llamada telefónica');

  // Dynamic filter lists
  const availableZones = useMemo(() => {
    const zones = new Set(contacts.map(c => c.zona).filter(Boolean));
    return Array.from(zones);
  }, [contacts]);

  const availableGroups = useMemo(() => {
    const groups = new Set(contacts.map(c => c.grupo).filter(Boolean));
    return Array.from(groups);
  }, [contacts]);

  // Filtering Logic
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Search
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        !s ||
        c.nombres.toLowerCase().includes(s) ||
        c.apellidos.toLowerCase().includes(s) ||
        c.telefono.includes(s) ||
        c.dpi.includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.grupo.toLowerCase().includes(s);

      if (!matchSearch) return false;

      // Consent WhatsApp
      if (filterConsentWA === 'yes' && !c.consentimientoWhatsApp) return false;
      if (filterConsentWA === 'no' && c.consentimientoWhatsApp) return false;

      // Consent SMS
      if (filterConsentSMS === 'yes' && !c.consentimientoSMS) return false;
      if (filterConsentSMS === 'no' && c.consentimientoSMS) return false;

      // Status
      if (filterStatus !== 'all' && c.estado !== filterStatus) return false;

      // Zone
      if (filterZone !== 'all' && c.zona !== filterZone) return false;

      // Group
      if (filterGroup !== 'all' && c.grupo !== filterGroup) return false;

      return true;
    });
  }, [contacts, searchTerm, filterConsentWA, filterConsentSMS, filterStatus, filterZone, filterGroup]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / pageSize) || 1;
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Nombres', 'Apellidos', 'DPI', 'Teléfono', 'Email', 
      'Departamento', 'Zona', 'Grupo', 'Fecha Registro', 
      'Consentimiento WhatsApp', 'Consentimiento SMS', 'Estado', 
      'Fecha Consentimiento', 'Fuente Consentimiento', 'Fecha Baja', 'Motivo Baja', 'Es Prueba Twilio'
    ];

    const rows = filteredContacts.map(c => [
      c.id,
      `"${c.nombres}"`,
      `"${c.apellidos}"`,
      `"${c.dpi}"`,
      `"${c.telefono}"`,
      `"${c.email}"`,
      `"${c.departamento}"`,
      `"${c.zona}"`,
      `"${c.grupo}"`,
      c.fechaRegistro,
      c.consentimientoWhatsApp ? 'SI' : 'NO',
      c.consentimientoSMS ? 'SI' : 'NO',
      c.estado,
      c.fechaConsentimiento,
      `"${c.fuenteConsentimiento}"`,
      c.fechaBaja || '',
      `"${c.motivoBaja || ''}"`,
      c.esNumeroPruebaTwilio ? 'SI' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_conecta_masivo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmUnsubscribe = async () => {
    if (!contactToUnsubscribe) return;
    try {
      await api.request(`/contacts/${contactToUnsubscribe.id}/opt-out`, { method: 'POST', body: JSON.stringify({ reason: unsubscribeReason }) });
      await onDataChanged();
      setContactToUnsubscribe(null);
      showToast('Contacto dado de baja y excluido de futuros envíos.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo dar de baja el contacto.', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Directorio de Contactos</h1>
          <p className="text-xs text-slate-500">
            {filteredContacts.length} contactos encontrados • Cumplimiento estricto de consentimiento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            title="Exportar registros filtrados a CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            title="Importar contactos masivos desde archivo CSV"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importar CSV</span>
          </button>

          {currentUser.rol !== 'consulta' && (
            <button
              onClick={onOpenNewContact}
              className="flex items-center gap-2 bg-[#0C2A5A] hover:bg-[#123875] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Nuevo Contacto</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, teléfono (+502...), DPI o correo..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Status */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Estado: Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo (Baja)</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>

          {/* Filter WhatsApp */}
          <div className="md:col-span-2">
            <select
              value={filterConsentWA}
              onChange={e => {
                setFilterConsentWA(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">WhatsApp: Todos</option>
              <option value="yes">WhatsApp: Autorizado</option>
              <option value="no">WhatsApp: No autoriz.</option>
            </select>
          </div>

          {/* Filter SMS */}
          <div className="md:col-span-3">
            <select
              value={filterConsentSMS}
              onChange={e => {
                setFilterConsentSMS(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">SMS: Todos</option>
              <option value="yes">SMS: Autorizado</option>
              <option value="no">SMS: No autoriz.</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Zone & Group */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Filtrar por ubicación:</span>
          
          <select
            value={filterZone}
            onChange={e => {
              setFilterZone(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600"
          >
            <option value="all">Todas las zonas</option>
            {availableZones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          <select
            value={filterGroup}
            onChange={e => {
              setFilterGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600"
          >
            <option value="all">Todos los grupos</option>
            {availableGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {(searchTerm || filterConsentWA !== 'all' || filterConsentSMS !== 'all' || filterStatus !== 'all' || filterZone !== 'all' || filterGroup !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterConsentWA('all');
                setFilterConsentSMS('all');
                setFilterStatus('all');
                setFilterZone('all');
                setFilterGroup('all');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contacts Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-900">
              <tr>
                <th className="py-3 px-4">Contacto & DPI</th>
                <th className="py-3 px-4">Teléfono (E.164)</th>
                <th className="py-3 px-4">Zona / Grupo</th>
                <th className="py-3 px-3 text-center">WhatsApp</th>
                <th className="py-3 px-3 text-center">SMS</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-4">Consentimiento</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No se encontraron contactos con los filtros actuales</p>
                    <p className="text-xs mt-1">Pruebe ajustando el término de búsqueda o limpiando los filtros</p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map(contact => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Name & DPI */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {contact.nombres} {contact.apellidos}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>DPI: {contact.dpi}</span>
                        {contact.esNumeroPruebaTwilio && (
                          <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded" title="Número autorizado para pruebas de mensajería">
                            Prueba
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3 px-4">
                      <div className="font-semibold font-mono text-slate-800 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{contact.telefono}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {contact.email}
                      </div>
                    </td>

                    {/* Zone & Group */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{contact.zona}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {contact.grupo}
                      </div>
                    </td>

                    {/* Consent WA */}
                    <td className="py-3 px-3 text-center">
                      {contact.consentimientoWhatsApp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sí</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>No</span>
                        </span>
                      )}
                    </td>

                    {/* Consent SMS */}
                    <td className="py-3 px-3 text-center">
                      {contact.consentimientoSMS ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Sí</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>No</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {contact.estado === 'activo' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Activo
                        </span>
                      ) : contact.estado === 'inactivo' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold" title={contact.motivoBaja}>
                          Baja ({contact.fechaBaja})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                          Bloqueado
                        </span>
                      )}
                    </td>

                    {/* Consent Date & Source */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium text-[11px] truncate max-w-[150px]" title={contact.fuenteConsentimiento}>
                        {contact.fuenteConsentimiento}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{contact.fechaConsentimiento}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectContact(contact)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver ficha completa y trazabilidad"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {currentUser.rol !== 'consulta' && (
                          <>
                            <button
                              onClick={() => onEditContact(contact)}
                              className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar datos de contacto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {currentUser.rol === 'admin' && (
                              <button onClick={() => setContactToDelete(contact)} className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg" title="Eliminar contacto (solo sin historial)">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {contact.estado === 'activo' && (
                              <button
                                onClick={() => setContactToUnsubscribe(contact)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Dar de baja (Revocar consentimiento y bloquear futuros envíos)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * pageSize, filteredContacts.length)}</strong> de{' '}
            <strong>{filteredContacts.length}</strong> contactos
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unsubscribe Modal */}
      {contactToDelete && <ConfirmDialog
        title="Eliminar contacto permanentemente"
        description={`¿Eliminar a ${contactToDelete.nombres} ${contactToDelete.apellidos}? Si tiene historial de campañas, no se podrá borrar; use la opción de baja para conservar la trazabilidad.`}
        confirmLabel="Eliminar contacto"
        destructive
        onCancel={() => setContactToDelete(null)}
        onConfirm={async () => {
          try { await api.deleteContact(contactToDelete.id); await onDataChanged(); showToast('Contacto eliminado.', 'success'); }
          catch (error) { showToast(error instanceof Error ? error.message : 'No se pudo eliminar el contacto.', 'error'); }
          setContactToDelete(null);
        }}
      />}

      {contactToUnsubscribe && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dar de Baja Contacto</h3>
                <p className="text-xs text-slate-500">Revocación formal de consentimiento y exclusión de envíos</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4 space-y-1">
              <p><strong>Destinatario:</strong> {contactToUnsubscribe.nombres} {contactToUnsubscribe.apellidos}</p>
              <p><strong>Teléfono:</strong> {contactToUnsubscribe.telefono}</p>
              <p><strong>Consentimiento previo:</strong> {contactToUnsubscribe.fuenteConsentimiento}</p>
            </div>

            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-slate-700">
                Motivo de la baja (Quedará registrado en auditoría):
              </label>
              <textarea
                rows={2}
                value={unsubscribeReason}
                onChange={e => setUnsubscribeReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                placeholder="Ej. Solicitud directa del afiliado, número no corresponde..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setContactToUnsubscribe(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUnsubscribe}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Confirmar baja definitiva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
