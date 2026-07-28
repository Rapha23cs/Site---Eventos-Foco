import { useState, useEffect } from 'react';
import { CreditCard, ArrowLeft, CheckCircle2, ShieldCheck, Loader2, QrCode } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useToast } from './components/Toast';
import { AuthModal } from './components/AuthModal';

export function PaymentCheckout() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function loadCheckoutData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventData) {
        setEvent(eventData);
      }
      setLoading(false);
    }
    loadCheckoutData();
  }, [eventId]);

  const handlePayment = async () => {
    if (!event) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setProcessing(true);

    // Simular tempo de processamento do gateway de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Inserir inscrição como 'paid'
    const { error } = await supabase.from('enrollments').insert({
      user_id: user.id,
      event_id: eventId,
      created_at: new Date().toISOString(),
      status: 'paid'
    });

    setProcessing(false);

    if (error) {
      toast.error('Erro no Pagamento', 'Não foi possível confirmar o pagamento. Tente novamente.');
    } else {
      setIsSuccess(true);
      toast.success('Pagamento Aprovado', 'Sua inscrição foi confirmada!');
      // Aguardar alguns segundos antes de voltar
      setTimeout(() => {
        navigate('/user');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-[#303392] dark:text-blue-400" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Pagamento Confirmado!</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium mb-8">
            Sua vaga no evento <strong>{event?.name}</strong> foi garantida com sucesso.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecionando...
          </div>
        </div>
      </div>
    );
  }

  const priceFormatted = event?.price > 0 
    ? `R$ ${parseFloat(event.price).toFixed(2).replace('.', ',')}` 
    : 'Gratuito';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={async () => {
          setShowAuthModal(false);
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }} 
        defaultToRegister={true}
      />
      <div className="bg-[#303392] pt-8 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white dark:bg-slate-900/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar ao Evento
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Finalizar Compra</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda: Formulário de Pagamento */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" /> Pagamento Seguro
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                    paymentMethod === 'credit_card' 
                      ? 'border-[#303392] dark:border-blue-500 bg-[#303392]/5 dark:bg-blue-900/20 text-[#303392] dark:text-blue-400' 
                      : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="font-bold text-sm">Cartão de Crédito</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-[#303392] dark:border-blue-500 bg-[#303392]/5 dark:bg-blue-900/20 text-[#303392] dark:text-blue-400' 
                      : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <QrCode className="w-8 h-8" />
                  <span className="font-bold text-sm">PIX (Instantâneo)</span>
                </button>
              </div>

              {paymentMethod === 'credit_card' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Número do Cartão</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Nome do Titular</label>
                    <input type="text" placeholder="Nome como está no cartão" className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Validade</label>
                      <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">CVV</label>
                      <input type="text" placeholder="123" className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none font-medium" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="font-bold text-blue-900 mb-2">Pague via PIX rapidamente</p>
                  <p className="text-sm text-blue-700 font-medium">
                    Ao confirmar, a inscrição será validada de forma instantânea através do nosso sistema.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-slate-800 sticky top-24">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">Resumo do Pedido</h3>
              
              <div className="flex gap-4 items-center mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
                <img 
                  src={event?.image_url ? event.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'} 
                  alt={event?.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <p className="font-extrabold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">{event?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-bold">{event?.date}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-slate-400">
                  <span>Ingresso</span>
                  <span>{priceFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                  <span>Taxas</span>
                  <span>Isento</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                <span className="font-black text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-black text-[#303392] dark:text-blue-400">{priceFormatted}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-[#303392] to-[#1E205A] text-white py-4 rounded-xl font-bold text-lg hover:shadow-[0_8px_20px_rgba(48,51,146,0.3)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:shadow-none"
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                ) : (
                  'Finalizar Pagamento'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
