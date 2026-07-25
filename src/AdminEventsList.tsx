import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Calendar, Clock, Loader2, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useToast } from './components/Toast';

interface AdminEventsListProps {
  onCreateNew: () => void;
  onEdit: (eventId: string | number) => void;
  onViewAttendees: (eventId: string | number) => void;
}

export function AdminEventsList({ onCreateNew, onEdit, onViewAttendees }: AdminEventsListProps) {
  const toast = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de confirmação moderno de exclusão
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<{ id: string | number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setEvents(data);
    }
    setLoading(false);
  }

  const promptDelete = (event: any) => {
    setDeleteConfirmEvent({ id: event.id, name: event.name || 'este evento' });
  };

  const executeDelete = async () => {
    if (!deleteConfirmEvent) return;
    setDeleting(true);
    
    const { error } = await supabase.from('events').delete().eq('id', deleteConfirmEvent.id);
    if (!error) {
      toast.success('Evento Excluído', 'O evento foi removido com sucesso.');
      setEvents(events.filter(e => e.id !== deleteConfirmEvent.id));
    } else {
      toast.error('Erro ao excluir', 'Não foi possível excluir o evento: ' + error.message);
    }
    setDeleting(false);
    setDeleteConfirmEvent(null);
  };

  async function toggleStatus(id: string | number, currentStatus: string) {
    const newStatus = currentStatus === 'encerrado' ? 'ativo' : 'encerrado';
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast.success('Status Atualizado', `Evento alterado para "${newStatus}".`);
      setEvents(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } else {
      toast.error('Erro ao alterar status', 'Não foi possível atualizar o status do evento.');
    }
  }

  const filteredEvents = events.filter((e) => {
    const term = searchTerm.toLowerCase();
    const name = (e.name || '').toLowerCase();
    const location = (e.location || '').toLowerCase();
    const type = (e.type || '').toLowerCase();
    return name.includes(term) || location.includes(term) || type.includes(term);
  });

  return (
    <div className="p-10 space-y-8 flex-1">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Gerenciar Eventos</h2>
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#303392] text-white font-bold rounded-xl shadow-sm hover:bg-[#1E205A] transition-colors text-sm"
        >
          <Plus className="w-5 h-5" /> Criar Novo Evento
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Todos os Eventos</h3>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] rounded-xl outline-none text-sm font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#303392]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-slate-950 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Evento</th>
                  <th className="p-4">Data e Hora</th>
                  <th className="p-4">Local</th>
                  <th className="p-4">Capacidade</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-slate-400 font-medium">
                      Nenhum evento encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:bg-slate-800/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={event.image_url ? event.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=100&q=80'} 
                            alt={event.name} 
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-gray-900 dark:text-white text-sm leading-tight">{event.name}</p>
                              {event.status === 'encerrado' ? (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-wider">Encerrado</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Ativo</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-[#E31E24] mt-1 inline-block">{event.type || 'Evento'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {event.time}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {event.location || 'Não definido'}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">
                        {event.capacity ? `${event.capacity} pessoas` : 'Livre'}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button 
                          onClick={() => toggleStatus(event.id, event.status || 'ativo')}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-gray-200 transition-colors mr-2"
                        >
                          {event.status === 'encerrado' ? 'Reativar' : 'Encerrar'}
                        </button>
                        <button 
                          onClick={() => onViewAttendees(event.id)}
                          className="px-3 py-1.5 bg-[#303392]/10 text-[#303392] font-bold text-xs rounded-lg hover:bg-[#303392]/20 transition-colors mr-2"
                        >
                          Participantes
                        </button>
                        <button 
                          onClick={() => onEdit(event.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Evento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => promptDelete(event)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODERN DELETE CONFIRMATION MODAL */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-800 relative animate-in zoom-in-95 text-center">
            <button
              onClick={() => setDeleteConfirmEvent(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white">Excluir Evento?</h3>
            <p className="text-sm text-slate-300 mt-2 mb-6 leading-relaxed">
              Tem certeza que deseja excluir o evento <strong className="text-white font-bold">"{deleteConfirmEvent.name}"</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmEvent(null)}
                disabled={deleting}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-colors border border-slate-700 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-900/30 transition-all text-sm flex justify-center items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
