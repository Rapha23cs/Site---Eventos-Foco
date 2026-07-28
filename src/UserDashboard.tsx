import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Heart, LogOut, ArrowRight, Filter, ChevronDown, Loader2, Settings, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserTickets } from './UserTickets';
import { UserSettings } from './UserSettings';
import { UserCommunity } from './UserCommunity';

interface Event {
  id: string | number;
  title: string;
  date: string;
  location: string;
  price: string;
  type: string;
  imageUrl: string;
  isFavorite: boolean;
  status?: string;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const [userView, setUserView] = useState<'explore' | 'tickets' | 'settings' | 'favorites' | 'community'>('explore');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (events.length === 0 || userView !== 'explore') return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(events.length, 5));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [events, userView]);

  useEffect(() => {
    async function fetchEvents() {
      const { data: { user } } = await supabase.auth.getUser();
      let favoriteIds: (string | number)[] = [];
      
      if (user) {
        const { data: favs } = await supabase.from('favorite_events').select('event_id').eq('user_id', user.id);
        if (favs) {
          favoriteIds = favs.map((f: any) => f.event_id);
        }
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const mappedEvents = data.map((e: any) => ({
          id: e.id,
          title: e.name || 'Evento sem título',
          date: e.date && e.time ? `${e.date} às ${e.time}` : (e.date || ''),
          location: e.location || 'Local a definir',
          price: e.price && e.price > 0 ? `R$ ${e.price.toFixed(2)}` : 'Grátis',
          type: e.type || 'Evento',
          imageUrl: e.image_url 
            ? e.image_url.split(',')[0] 
            : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
          isFavorite: favoriteIds.includes(e.id),
          status: e.status || 'ativo',
        }));
        setEvents(mappedEvents);
      }
      setLoading(false);
    }
    
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile({
          name: data?.full_name || user.user_metadata?.full_name || 'Usuário',
          avatarUrl: data?.avatar_url || ''
        });
      }
    }

    fetchEvents();
    fetchUserProfile();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, eventId: string | number) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const eventIndex = events.findIndex(ev => ev.id === eventId);
    if (eventIndex === -1) return;

    const isFav = events[eventIndex].isFavorite;
    
    // Atualização otimista
    const newEvents = [...events];
    newEvents[eventIndex].isFavorite = !isFav;
    setEvents(newEvents);

    if (isFav) {
      await supabase.from('favorite_events').delete().eq('user_id', user.id).eq('event_id', eventId);
    } else {
      await supabase.from('favorite_events').insert({ user_id: user.id, event_id: eventId });
    }
  };

  const displayedEvents = userView === 'favorites' ? events.filter(e => e.isFavorite) : events;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-[#1A1A1A] dark:text-white selection:bg-[#E31E24] selection:text-white pb-24">
      
      {/* Topbar / Navegação Horizontal Larga */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full p-1.5 flex items-center justify-center shadow-sm border border-gray-100">
                <img src="/logo.jpg" alt="FOCO Eventos Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight hidden sm:block">
                <span className="text-[#E31E24]">FOCO</span>{' '}
                <span className="text-[#303392] dark:text-blue-400">Eventos</span>
              </h1>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 dark:text-slate-400">
              <button 
                onClick={() => setUserView('explore')}
                className={`py-2 transition-colors ${userView === 'explore' ? 'text-[#303392] dark:text-blue-400 border-b-2 border-[#303392] dark:border-blue-500' : 'hover:text-[#303392] dark:text-blue-400'}`}
              >
                Explorar
              </button>
              <button 
                onClick={() => setUserView('tickets')}
                className={`py-2 transition-colors ${userView === 'tickets' ? 'text-[#303392] dark:text-blue-400 border-b-2 border-[#303392] dark:border-blue-500' : 'hover:text-[#303392] dark:text-blue-400'}`}
              >
                Meus Ingressos
              </button>
              <button 
                onClick={() => setUserView('favorites')}
                className={`py-2 transition-colors ${userView === 'favorites' ? 'text-[#303392] dark:text-blue-400 border-b-2 border-[#303392] dark:border-blue-500' : 'hover:text-[#303392] dark:text-blue-400'}`}
              >
                Favoritos
              </button>
              <button 
                onClick={() => setUserView('community')}
                className={`py-2 transition-colors flex items-center gap-1 ${userView === 'community' ? 'text-[#303392] dark:text-blue-400 border-b-2 border-[#303392] dark:border-blue-500' : 'hover:text-[#303392] dark:text-blue-400'}`}
              >
                <MessageSquare className="w-4 h-4" />
                Comunidade
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-[#E31E24] transition-colors group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Sair</span>
            </button>
            <div 
              onClick={() => setUserView('settings')}
              className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-700 pl-6 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-[#303392] dark:border-blue-500 overflow-hidden flex items-center justify-center bg-gray-100">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#303392] dark:text-blue-400 font-bold text-sm">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-sm group-hover:text-[#303392] dark:text-blue-400 transition-colors">
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-[#303392] dark:text-blue-400">{userProfile?.name || 'Usuário'}</p>
                <p className="text-gray-500 dark:text-slate-400 text-xs flex items-center gap-1"><Settings className="w-3 h-3"/> Editar Perfil</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {userView === 'explore' || userView === 'favorites' ? (
        <main className="max-w-[1400px] mx-auto px-6 mt-8">
          
          {userView === 'explore' && (
            events.length > 0 ? (() => {
            const featuredEvents = events.slice(0, 5);
            const slideEvent = featuredEvents[currentSlide];
            
            return (
              <section className="relative w-full h-[400px] rounded-[32px] overflow-hidden shadow-2xl mb-16 group">
                <div className="absolute inset-0 transition-opacity duration-1000">
                  <img 
                    key={slideEvent.id}
                    src={slideEvent.imageUrl} 
                    alt={slideEvent.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 lg:p-20 text-white w-full lg:w-2/3 z-10 animate-fade-in-up" key={`content-${slideEvent.id}`}>
                  <span className="inline-block px-4 py-1.5 bg-[#E31E24] text-white font-bold text-xs sm:text-sm rounded-full mb-4 sm:mb-6 w-max uppercase tracking-wider">
                    Destaque da Semana
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-2 sm:mb-4 leading-tight text-white shadow-sm">
                    {slideEvent.title}
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-xl font-medium">
                    {slideEvent.date} • {slideEvent.location}
                  </p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/event/${slideEvent.id}`)}
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-white dark:bg-slate-900 text-[#303392] dark:text-blue-400 font-extrabold rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg text-sm sm:text-base"
                    >
                      GARANTIR INGRESSO
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Carousel Controls */}
                <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 flex gap-3 z-20">
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? featuredEvents.length - 1 : prev - 1))}
                    className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors border border-white/30 text-white"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredEvents.length)}
                    className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors border border-white/30 text-white"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-6 sm:bottom-8 left-8 sm:left-12 lg:left-20 flex gap-2 z-20">
                  {featuredEvents.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-[#E31E24]' : 'w-2 bg-white/50 hover:bg-white'}`}
                    />
                  ))}
                </div>
              </section>
            );
          })() : (
            <section className="relative w-full h-[400px] rounded-[32px] overflow-hidden shadow-2xl mb-16 bg-gray-100 dark:bg-slate-800/50 animate-pulse flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
            </section>
          )
        )}

        {/* Barra de Busca e Filtros Avançados */}
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-10 bg-white dark:bg-slate-900 p-4 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-800">
          
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar eventos por nome, local ou categoria..."
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-gray-700 dark:text-slate-300 font-medium placeholder:text-gray-400"
            />
          </div>
          
          <div className="hidden lg:block w-px h-10 bg-gray-200"></div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none flex items-center justify-between gap-2 px-6 py-3 bg-[#F8FAFC] dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-600 dark:text-slate-400 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#303392] dark:text-blue-400" />
                <span>Qualquer Data</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-4" />
            </button>
            <button className="flex-1 lg:flex-none flex items-center justify-between gap-2 px-6 py-3 bg-[#F8FAFC] dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-600 dark:text-slate-400 transition-colors">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#303392] dark:text-blue-400" />
                <span>Local</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-4" />
            </button>
            <button className="p-3 bg-[#303392]/5 dark:bg-blue-900/20 hover:bg-[#303392]/10 dark:bg-blue-900/30 text-[#303392] dark:text-blue-400 rounded-xl transition-colors">
              <Filter className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Grid de Eventos (Desktop Style) */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {userView === 'favorites' ? 'Meus Favoritos' : 'Próximos Eventos'}
          </h3>
          <span className="text-gray-500 dark:text-slate-400 font-bold">
            {loading ? 'Carregando...' : `${displayedEvents.length} eventos encontrados`}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-[#303392] dark:text-blue-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayedEvents.map((event) => (
            <div key={event.id} onClick={() => navigate(`/event/${event.id}`)} className="bg-white dark:bg-slate-900 rounded-[24px] overflow-hidden border border-gray-100 dark:border-slate-800 group flex flex-col hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              
              {/* Imagem do Evento */}
              <div className="relative h-60 w-full overflow-hidden">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm">
                    <span className="text-xs font-extrabold text-[#303392] dark:text-blue-400 uppercase tracking-wider">{event.type}</span>
                  </div>
                  {event.status === 'encerrado' && (
                    <div className="bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm">
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Encerrado</span>
                    </div>
                  )}
                  {event.status === 'ativo' && (
                    <div className="bg-green-600/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm">
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Ativo</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button 
                  onClick={(e) => toggleFavorite(e, event.id)}
                  className="p-3 bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform group/btn"
                >
                  <Heart className={`w-5 h-5 ${event.isFavorite ? 'fill-[#E31E24] text-[#E31E24]' : 'text-gray-400 group-hover/btn:text-[#E31E24]'}`} />
                </button>
              </div>
              </div>
              
              {/* Detalhes do Evento */}
              <div className="p-8 flex flex-col flex-1">
                <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-[#303392] dark:text-blue-400 transition-colors">{event.title}</h4>
                
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
                    <Calendar className="w-5 h-5 text-[#E31E24]" />
                    <span className="text-sm font-semibold">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
                    <MapPin className="w-5 h-5 text-[#E31E24]" />
                    <span className="text-sm font-semibold line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Preço</p>
                    <p className="text-2xl font-extrabold text-emerald-600">
                      {event.price}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center group-hover:bg-[#303392] group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
        </main>
      ) : userView === 'tickets' ? (
        <UserTickets />
      ) : userView === 'community' ? (
        <UserCommunity />
      ) : (
        <UserSettings />
      )}
    </div>
  );
}
