import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Ticket, Tag, Loader2, CheckCircle2, Star, Send } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useToast } from './components/Toast';

interface EventDetailsProps {
  eventId: string | number;
  onBack: () => void;
  onProceedToPayment?: () => void;
}

export function EventDetails({ eventId, onBack, onProceedToPayment }: EventDetailsProps) {
  const toast = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Rating states
  const [userAttended, setUserAttended] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function fetchEventDetails() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (data) {
        setEvent({
          ...data,
          speakersList: data.speakers ? (typeof data.speakers === 'string' ? JSON.parse(data.speakers) : data.speakers) : [],
          sponsorsList: data.sponsors ? (typeof data.sponsors === 'string' ? JSON.parse(data.sponsors) : data.sponsors) : [],
          scheduleList: data.schedule ? (typeof data.schedule === 'string' ? JSON.parse(data.schedule) : data.schedule) : [],
          imageUrl: data.image_url ? data.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
        });
      }

      // Buscar enrollment do user para saber se ele já está inscrito ou compareceu
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id, attended, status')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .maybeSingle();
        
        if (enrollment) {
          setIsAlreadyEnrolled(true);
          if (enrollment.attended) {
            setUserAttended(true);
          }
        }

        // Checar se o usuário já avaliou
        const { data: myReview } = await supabase
          .from('event_reviews')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .maybeSingle();
        
        if (myReview) {
          setHasReviewed(true);
        }
      }

      // Calcular média de notas
      const { data: reviews } = await supabase
        .from('event_reviews')
        .select('rating')
        .eq('event_id', eventId);
      
      if (reviews && reviews.length > 0) {
        setTotalReviews(reviews.length);
        const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        setAverageRating(sum / reviews.length);
      }

      setLoading(false);
    }
    fetchEventDetails();
  }, [eventId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollStatus('idle');
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setErrorMessage('Você precisa estar logado para se inscrever.');
        setEnrollStatus('error');
        return;
      }

      // Checar se já está inscrito
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

      if (existingEnrollment) {
        setErrorMessage('Você já está inscrito neste evento!');
        setEnrollStatus('error');
        return;
      }

      // Se o evento for pago e a função onProceedToPayment foi passada, redireciona para o checkout
      if (event.price > 0 && onProceedToPayment) {
        onProceedToPayment();
        return;
      }

      // Se for gratuito (ou sem onProceedToPayment configurado), insere a inscrição diretamente
      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        event_id: eventId,
        created_at: new Date().toISOString(),
        status: 'confirmed'
      });

      if (error) {
        console.error(error);
        setErrorMessage('Erro ao realizar inscrição. Tente novamente.');
        setEnrollStatus('error');
      } else {
        setEnrollStatus('success');
        setIsAlreadyEnrolled(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro na comunicação com o servidor.');
      setEnrollStatus('error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myRating === 0) {
      toast.warning('Nota Necessária', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setSubmittingReview(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('event_reviews').insert({
        event_id: eventId,
        user_id: user.id,
        rating: myRating,
        comment: myComment.trim(),
        created_at: new Date().toISOString()
      });

      if (!error) {
        setHasReviewed(true);
        toast.success('Avaliação Enviada!', 'Sua avaliação foi enviada com sucesso e aparecerá na Comunidade.');
      } else {
        toast.error('Erro ao Enviar', 'Não foi possível salvar sua avaliação.');
      }
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#303392] dark:text-blue-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Evento não encontrado</h2>
        <button onClick={onBack} className="text-[#303392] dark:text-blue-400 font-bold flex items-center gap-2 hover:underline">
          <ArrowLeft className="w-5 h-5" /> Voltar ao Painel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans pb-24">
      {/* Botão de Voltar Flutuante */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 z-50 p-3 bg-white dark:bg-slate-900 text-[#303392] dark:text-blue-400 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-full transition-all group flex items-center gap-2 pr-5"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-bold text-sm hidden sm:block">Voltar</span>
      </button>

      {/* Header com Imagem */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
        <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
        
        <div className="absolute bottom-0 left-0 w-full z-20 p-8 md:p-12 max-w-7xl mx-auto">
          <div className="flex gap-2 mb-4">
            <span className="inline-block px-3 py-1 bg-[#E31E24] text-white text-xs font-extrabold tracking-wider rounded-md uppercase">
              {event.type || 'Evento'}
            </span>
            {event.status === 'encerrado' && (
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-extrabold tracking-wider rounded-md uppercase">
                Encerrado
              </span>
            )}
            {event.status === 'ativo' && (
              <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-extrabold tracking-wider rounded-md uppercase">
                Ativo
              </span>
            )}
            {totalReviews > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-gray-900 dark:text-white text-xs font-extrabold tracking-wider rounded-md">
                <Star className="w-3 h-3 fill-current" />
                {averageRating.toFixed(1)} ({totalReviews})
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {event.name}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Coluna Principal */}
          <div className="flex-1 space-y-10">
            {/* Cards de Informação Rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <Calendar className="w-6 h-6 text-[#303392] dark:text-blue-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Data</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">{event.date}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <Clock className="w-6 h-6 text-[#303392] dark:text-blue-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Horário</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">{event.time}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <MapPin className="w-6 h-6 text-[#303392] dark:text-blue-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Local</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">{event.location}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <Users className="w-6 h-6 text-[#303392] dark:text-blue-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Capacidade</span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">{event.capacity || 'Livre'} pessoas</span>
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Tag className="w-6 h-6 text-[#303392] dark:text-blue-400" /> Sobre o Evento
              </h3>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-lg whitespace-pre-wrap">
                {event.description || 'Nenhuma descrição fornecida para este evento.'}
              </p>
            </div>

            {/* Programação / Timeline */}
            {event.scheduleList?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-[#303392] dark:text-blue-400" /> Programação do Evento
                </h3>
                
                <div className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-4 space-y-8">
                  {event.scheduleList.map((item: any, index: number) => (
                    <div key={index} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-[#E31E24] shadow-sm"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-1">
                        <span className="text-[#303392] dark:text-blue-400 font-black text-lg bg-[#F8FAFC] dark:bg-slate-950 px-3 py-1 rounded-lg w-max border border-gray-100 dark:border-slate-800">
                          {item.time}
                        </span>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed mt-2 pl-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Palestrantes */}
            {event.speakersList?.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#303392] dark:text-blue-400" /> Palestrantes Confirmados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.speakersList.map((speaker: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="h-64 overflow-hidden relative">
                        {speaker.imageUrl ? (
                          <img src={speaker.imageUrl} alt={speaker?.name || 'Palestrante'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center text-[#303392] dark:text-blue-400 font-bold text-5xl">
                            {speaker?.name ? speaker.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        {/* Removido o gradiente escuro, a imagem corta direto para o branco da div de baixo */}
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="text-gray-900 dark:text-white font-extrabold text-xl mb-1">{speaker?.name || 'Nome não informado'}</h4>
                        {speaker.role && (
                          <p className="text-[#303392] dark:text-blue-400 text-sm font-bold mb-4">{speaker.role}</p>
                        )}
                        
                        <div className="flex-1"></div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex gap-3 text-gray-400">
                            {/* LinkedIn SVG */}
                            <svg className="w-5 h-5 hover:text-[#303392] dark:text-blue-400 cursor-pointer transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            {/* Instagram SVG */}
                            <svg className="w-5 h-5 hover:text-[#E31E24] cursor-pointer transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          </div>
                          <button className="text-[#E31E24] text-sm font-bold flex items-center gap-1 hover:text-[#B31217] transition-colors">
                            Saiba mais <span className="text-lg leading-none">&rsaquo;</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patrocinadores, Apoiadores e Realização */}
            {event.sponsorsList?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mt-8 flex flex-col items-center">
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">Patrocinadores e Apoiadores</h3>
                <p className="text-gray-500 dark:text-slate-400 font-medium text-center mb-10">Empresas que acreditam e apoiam este evento.</p>
                
                {['Patrocinador', 'Apoiador', 'Realização'].map(category => {
                  const filtered = event.sponsorsList.filter((s: any) => (s.category === category) || (!s.category && category === 'Patrocinador'));
                  if (filtered.length === 0) return null;
                  
                  return (
                    <div key={category} className="w-full flex flex-col items-center mb-12 last:mb-0">
                      <h4 className="text-[#303392] dark:text-blue-400 text-sm font-bold uppercase tracking-[0.2em] mb-6">{category === 'Patrocinador' ? 'Patrocinadores' : category === 'Apoiador' ? 'Apoiadores' : 'Realização'}</h4>
                      <div className="flex flex-wrap justify-center gap-6 w-full">
                        {filtered.map((sponsor: any, idx: number) => (
                          <div key={idx} className={`bg-[#F8FAFC] dark:bg-slate-950 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-center transition-all hover:border-gray-200 dark:border-slate-700 hover:shadow-sm ${category === 'Patrocinador' || category === 'Realização' ? 'w-full max-w-[400px] h-32' : 'w-[200px] h-28'}`}>
                            {sponsor.imageUrl ? (
                              <img src={sponsor.imageUrl} alt={sponsor.name} className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300 opacity-80 hover:opacity-100" />
                            ) : (
                              <span className="text-[#303392] dark:text-blue-400 font-bold text-lg tracking-wide text-center">{sponsor.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Avaliação do Evento (se usuário fez checkin) */}
            {userAttended && !hasReviewed && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-[#303392] dark:border-blue-500/20">
                <h3 className="text-xl font-extrabold text-[#303392] dark:text-blue-400 mb-2">Como foi o evento?</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Como você já fez check-in, adoraríamos saber sua opinião!</p>
                
                <form onSubmit={handleSubmitReview}>
                  <div className="flex items-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMyRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${myRating >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    required
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Escreva um comentário sobre o evento..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-700 dark:text-slate-300 resize-none mb-4"
                    rows={3}
                  />
                  
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex items-center gap-2 px-6 py-3 bg-[#303392] hover:bg-[#1E205A] text-white font-bold rounded-xl transition-colors"
                  >
                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Enviar Avaliação
                  </button>
                </form>
              </div>
            )}
            {userAttended && hasReviewed && (
              <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center gap-3 text-emerald-600 font-bold">
                <CheckCircle2 className="w-6 h-6" />
                Obrigado por ter avaliado este evento!
              </div>
            )}

          </div>

          {/* Coluna Sidebar (Checkout) */}
          <div className="lg:w-[400px]">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-slate-800 sticky top-24">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">Investimento</h3>
              
              <div className="flex items-end gap-2 mb-8 pb-8 border-b border-gray-100 dark:border-slate-800">
                <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                  {event.price > 0 ? `R$ ${parseFloat(event.price).toFixed(2).replace('.', ',')}` : 'Gratuito'}
                </span>
                {event.price > 0 && <span className="text-gray-500 dark:text-slate-400 font-bold mb-1 text-sm">/ ingresso</span>}
              </div>

              {isAlreadyEnrolled || enrollStatus === 'success' ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-2xl flex flex-col items-center justify-center text-center animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-600" />
                  <p className="font-extrabold text-lg text-emerald-950">INSCRITO NO EVENTO</p>
                  <p className="text-sm mt-1 font-medium text-emerald-600">Sua vaga está garantida neste evento.</p>
                  <button 
                    onClick={onBack}
                    className="mt-6 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Voltar para Meus Ingressos
                  </button>
                </div>
              ) : (
                <>
                  {enrollStatus === 'error' && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold text-center">
                      {errorMessage}
                    </div>
                  )}
                  
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || event.status === 'encerrado'}
                    className="w-full bg-gradient-to-r from-[#303392] to-[#1E205A] text-white py-4 rounded-2xl font-bold text-lg tracking-wide hover:shadow-[0_8px_20px_rgba(48,51,146,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                  >
                    {enrolling ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processando...</span>
                    ) : event.status === 'encerrado' ? (
                      <span className="flex items-center gap-2">INSCRIÇÕES ENCERRADAS</span>
                    ) : (
                      <span className="flex items-center gap-2"><Ticket className="w-5 h-5" /> GARANTIR VAGA</span>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 font-semibold mt-4">
                    Pagamento 100% seguro pelo sistema da plataforma.
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
