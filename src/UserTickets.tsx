import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Ticket, Calendar, MapPin, Loader2, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function UserTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar inscrições com os dados do evento usando inner join implícito via Supabase
      const { data } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          attended,
          created_at,
          event_id,
          events (
            id,
            name,
            date,
            time,
            location,
            image_url,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setTickets(data);
      }
      setLoading(false);
    }

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-12 h-12 animate-spin text-[#303392]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 mt-8 animate-fade-in pb-24">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#303392]/10 rounded-2xl flex items-center justify-center text-[#303392]">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Meus Ingressos</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">Gerencie suas inscrições e acesse os eventos.</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 p-16 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <Ticket className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum ingresso encontrado</h3>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md">Você ainda não se inscreveu em nenhum evento. Explore nossa lista de eventos e garanta sua vaga!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tickets.map((ticket) => {
            const event = ticket.events;
            // Caso o evento tenha sido deletado mas a inscrição ficou orfã
            if (!event) return null;

            return (
              <div key={ticket.id} className="bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col sm:flex-row">
                
                <div className="w-full sm:w-48 h-48 sm:h-auto relative shrink-0">
                  <img 
                    src={event.image_url ? event.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80'} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                    {ticket.attended 
                      ? <span className="text-[#303392]">CHECK-IN REALIZADO</span>
                      : ticket.status === 'paid' || ticket.status === 'confirmed'
                        ? <span className="text-emerald-600">CONFIRMADO</span>
                        : <span className="text-[#E31E24]">PENDENTE</span>
                    }
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#303392] uppercase tracking-wider mb-2 block">{event.type || 'Evento'}</span>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4 line-clamp-2">{event.name}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {event.date} <span className="text-gray-300">•</span> {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-medium line-clamp-1">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        {event.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-gray-400 font-semibold">
                      Comprado em {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <button 
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="flex items-center gap-2 text-[#E31E24] font-bold text-sm hover:underline"
                    >
                      <QrCode className="w-4 h-4" />
                      Ver Ingresso
                    </button>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center text-center">
            <button 
              onClick={() => setSelectedTicketId(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Seu Ingresso</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Apresente este código na entrada do evento para validação.</p>
            
            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm mb-6 inline-block">
              <QRCodeSVG value={selectedTicketId} size={200} level="H" includeMargin={true} />
            </div>

            <p className="text-xs text-gray-400 font-mono tracking-wider">{selectedTicketId}</p>
          </div>
        </div>
      )}
    </div>
  );
}
