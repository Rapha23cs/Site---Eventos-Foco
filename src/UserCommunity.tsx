import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MessageSquare, Star, Lightbulb, User, Loader2, Send, Plus, X } from 'lucide-react';
import { useToast } from './components/Toast';

export function UserCommunity() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'reviews' | 'feedbacks'>('reviews');
  const [reviews, setReviews] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('sugestao');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Busca Avaliações
      const { data: revData } = await supabase
        .from('event_reviews')
        .select('id, rating, comment, created_at, parent_id, profiles(full_name, avatar_url), events(name)')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (revData) setReviews(revData);

      // Busca Feedbacks
      const { data: fbData } = await supabase
        .from('app_feedbacks')
        .select('id, type, content, created_at, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (fbData) setFeedbacks(fbData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('app_feedbacks').insert({
        user_id: user.id,
        type: feedbackType,
        content: feedbackContent.trim()
      });

      if (!error) {
        setFeedbackContent('');
        setShowFeedbackModal(false);
        fetchData();
        toast.success('Feedback Enviado!', 'Obrigado por contribuir com a nossa comunidade.');
      } else {
        toast.error('Erro ao Enviar', 'Não foi possível enviar o seu feedback.');
      }
    }
    setSubmitting(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
      />
    ));
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 mt-8 pb-24 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#303392]/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-[#303392] dark:text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Comunidade</h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">Veja o que estão falando e ajude-nos a melhorar.</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (activeTab === 'feedbacks') {
              setShowFeedbackModal(true);
            } else {
              toast.info('Como Avaliar', 'Para avaliar um evento, acesse a página do evento correspondente em "Meus Ingressos".');
            }
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#303392] hover:bg-[#1E205A] text-white font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'feedbacks' ? 'Enviar Ideia' : 'Nova Avaliação'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 mb-8">
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-[#303392] dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:text-slate-200'}`}
        >
          <Star className="w-4 h-4" />
          Avaliações de Eventos
          {activeTab === 'reviews' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#303392]"></div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 py-4 px-6 font-bold text-sm transition-colors relative ${activeTab === 'feedbacks' ? 'text-[#303392] dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:text-slate-200'}`}
        >
          <Lightbulb className="w-4 h-4" />
          Ideias e Sugestões do App
          {activeTab === 'feedbacks' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#303392]"></div>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center p-24">
          <Loader2 className="w-10 h-10 animate-spin text-[#303392] dark:text-blue-400" />
        </div>
      ) : activeTab === 'reviews' ? (
        
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm text-gray-500 dark:text-slate-400 font-medium">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar um evento!
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{review.profiles?.full_name || 'Usuário Anônimo'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">sobre {review.events?.name || 'Evento Removido'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {renderStars(review.rating || 0)}
                </div>
                
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>

      ) : (
        
        <div className="space-y-6">
          {feedbacks.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm text-gray-500 dark:text-slate-400 font-medium">
              Nenhuma ideia compartilhada ainda. Envie-nos uma sugestão!
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {fb.profiles?.avatar_url ? (
                      <img src={fb.profiles.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <p className="font-bold text-gray-900 dark:text-white">{fb.profiles?.full_name || 'Usuário Anônimo'}</p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    fb.type === 'bug' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {fb.type === 'bug' ? 'Reporte de Bug' : 'Ideia / Sugestão'}
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm">
                  {fb.content}
                </p>
              </div>
            ))
          )}
        </div>

      )}

      {/* Modal de Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Enviar Feedback</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Como podemos melhorar sua experiência com o FOCO Eventos?</p>
            
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Tipo de Feedback</label>
                <select 
                  value={feedbackType}
                  onChange={e => setFeedbackType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-700 dark:text-slate-300"
                >
                  <option value="sugestao">💡 Ideia / Sugestão</option>
                  <option value="bug">🐛 Reportar Bug</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Sua Mensagem</label>
                <textarea 
                  required
                  value={feedbackContent}
                  onChange={e => setFeedbackContent(e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhadamente..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-700 dark:text-slate-300 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#303392] hover:bg-[#1E205A] disabled:bg-gray-400 text-white font-bold rounded-[16px] shadow-sm transition-colors mt-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Enviar Feedback
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
