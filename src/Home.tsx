import { Users, Ticket, ArrowRight, ShieldCheck, Sparkles, Smartphone, Play, Zap, Star, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { AppDownloadModal } from './components/AppDownloadModal';

export function Home() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModeRegister, setAuthModeRegister] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#1A1A1A] dark:text-white font-sans selection:bg-[#E31E24] selection:text-white overflow-x-hidden relative">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => navigate('/user')} 
        defaultToRegister={authModeRegister}
        showAdminAccess={true}
      />
      <AppDownloadModal 
        isOpen={showAppModal} 
        onClose={() => setShowAppModal(false)} 
      />

      {/* Background Mesh Gradients & Video */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F8FAFC] dark:bg-slate-950">
        {/* Vídeo de Fundo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        >
          {/* Você pode baixar um vídeo abstrato ou de show, nomear como background.mp4 e colocar na pasta public, depois trocar o src abaixo para "/background.mp4" */}
          <source src="https://assets.mixkit.co/videos/preview/mixkit-crowd-cheering-at-a-music-festival-4357-large.mp4" type="video/mp4" />
        </video>

        {/* Overlay claro para garantir que o texto escuro fique muito legível */}
        <div className="absolute inset-0 bg-white dark:bg-slate-900/60 backdrop-blur-[1px]"></div>

        {/* Gradientes por cima do vídeo para manter o tom da marca */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E31E24]/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#303392]/10 dark:bg-blue-900/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>

        {/* Logo Overlay Suave */}
        <div className="absolute inset-0 flex items-center justify-start pl-8 md:pl-20 lg:pl-32 opacity-[0.03]">
          <img src="/logo1.png" alt="" className="w-full max-w-[500px] md:max-w-[600px] lg:max-w-[900px] object-contain mix-blend-multiply" />
        </div>
      </div>

      {/* Modern Floating Navbar */}
      <nav className="fixed w-full z-50 top-6 px-6">
        <div className="max-w-5xl mx-auto h-16 bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-full border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center justify-between px-2 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full p-1.5 flex items-center justify-center shadow-md">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">
              <span className="text-[#E31E24]">FOCO</span>{' '}
              <span className="text-[#303392] dark:text-blue-400">Eventos</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 dark:text-slate-400">
            <a href="#eventos" className="hover:text-[#303392] dark:text-blue-400 transition-colors">Eventos</a>
            <a href="#comunidade" className="hover:text-[#303392] dark:text-blue-400 transition-colors">Comunidade</a>
            <button onClick={() => setShowAppModal(true)} className="hover:text-[#303392] dark:text-blue-400 transition-colors">App</button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthModeRegister(false);
                setShowAuthModal(true);
              }}
              className="text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-[#303392] dark:text-blue-400 transition-colors px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800/50"
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setAuthModeRegister(true);
                setShowAuthModal(true);
              }}
              className="bg-[#303392] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#1E205A] hover:shadow-[0_4px_12px_rgba(48,51,146,0.3)] transition-all"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Split Layout */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900/60 backdrop-blur-md border border-white/80 text-xs font-bold text-[#303392] dark:text-blue-400 mb-8 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#E31E24]" />
                <span className="uppercase tracking-wider">A Nova Era de Eventos</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight mb-8 leading-[1.1] text-gray-900 dark:text-white">
                Viva as <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#303392] via-[#5C5FBD] to-[#E31E24]">
                  melhores
                </span> <br />
                experiências.
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 font-medium leading-relaxed">
                Descubra, compre e avalie eventos com um sistema inteligente. Tenha seus ingressos na palma da mão e interaja com a comunidade.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => {
                    setAuthModeRegister(true);
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#E31E24] to-[#B31217] rounded-full text-white font-bold text-lg hover:shadow-[0_8px_24px_rgba(227,30,36,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 tracking-wide"
                >
                  Explorar Eventos
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowAppModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900/50 backdrop-blur-md border-2 border-transparent hover:border-gray-200 dark:border-slate-700 rounded-full text-gray-800 dark:text-slate-200 font-bold text-lg hover:bg-white dark:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Smartphone className="w-5 h-5" />
                  Baixar App
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2 font-bold text-sm text-gray-600 dark:text-slate-400"><ShieldCheck className="w-5 h-5" /> Seguro</div>
                <div className="flex items-center gap-2 font-bold text-sm text-gray-600 dark:text-slate-400"><Zap className="w-5 h-5" /> Rápido</div>
                <div className="flex items-center gap-2 font-bold text-sm text-gray-600 dark:text-slate-400"><Star className="w-5 h-5" /> Confiável</div>
              </div>
            </div>

            {/* Right Content - Abstract UI Mockup */}
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="relative w-full aspect-square rounded-[40px] bg-gradient-to-br from-[#303392]/5 to-[#E31E24]/5 border border-white/60 dark:border-slate-800 shadow-2xl backdrop-blur-3xl overflow-hidden flex items-center justify-center group">

                {/* Floating Elements mimicking App UI */}
                <div className="absolute top-10 left-10 w-64 bg-white dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] transform -rotate-6 group-hover:rotate-0 transition-transform duration-700 border border-transparent dark:border-slate-800">
                  <div className="flex gap-4 items-center mb-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 dark:bg-slate-700 rounded-full mb-2"></div>
                      <div className="w-16 h-3 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-6 bg-[#E31E24]/10 dark:bg-[#E31E24]/20 rounded-full"></div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-72 bg-white dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] transform rotate-6 group-hover:rotate-0 transition-transform duration-700 delay-75 border border-white dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-20 h-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full"></div>
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="w-full h-24 bg-[#303392]/5 dark:bg-blue-900/20 rounded-2xl mb-4 flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-[#303392] dark:text-blue-400/30" />
                  </div>
                  <div className="w-3/4 h-3 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-slate-900/40 to-transparent pointer-events-none"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="py-24 relative z-10 bg-white dark:bg-slate-900/50 border-t border-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#303392] dark:text-blue-400 tracking-tight mb-4">
              Tudo que você precisa.
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              Uma plataforma completa projetada para a melhor experiência antes, durante e depois do evento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Bento Card 1 - Span 2 */}
            <div className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-10 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all group overflow-hidden relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-[80px] group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row h-full gap-8">
                <div className="flex flex-col h-full justify-between sm:w-3/5">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ingressos em Segundos</h3>
                    <p className="text-gray-600 dark:text-slate-400 font-medium max-w-md">O processo de compra mais rápido do mercado. Confirmação instantânea e QR Code disponível offline.</p>
                  </div>
                </div>

                {/* Visual Element - Mock Ticket */}
                <div className="hidden sm:flex flex-1 items-center justify-center relative">
                  <div className="w-48 h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 transform rotate-12 group-hover:rotate-6 transition-transform duration-500 flex flex-col overflow-hidden relative">
                    <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-400 p-4 flex flex-col justify-end">
                      <div className="w-20 h-4 bg-white/30 rounded-full mb-2"></div>
                      <div className="w-12 h-3 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="flex-1 p-4 bg-white dark:bg-slate-800 flex flex-col items-center justify-center border-t-2 border-dashed border-gray-200 dark:border-slate-600 relative">
                      {/* Círculos do ingresso */}
                      <div className="absolute top-[-10px] left-[-10px] w-5 h-5 bg-gray-50 dark:bg-slate-900 rounded-full"></div>
                      <div className="absolute top-[-10px] right-[-10px] w-5 h-5 bg-gray-50 dark:bg-slate-900 rounded-full"></div>
                      {/* Fake QR */}
                      <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-lg flex flex-wrap gap-1 p-2">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? 'bg-gray-800 dark:bg-white' : 'bg-transparent'}`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-gradient-to-br from-[#303392] to-[#1E205A] p-10 rounded-[32px] border border-[#303392] dark:border-blue-500 shadow-xl hover:-translate-y-2 transition-transform group text-white relative overflow-hidden">
              <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:text-white/10 transition-colors transform -rotate-12 group-hover:rotate-0 duration-500" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-14 h-14 bg-white dark:bg-slate-900/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/20">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">100% Seguro</h3>
                  <p className="text-blue-200/80 font-medium text-sm leading-relaxed">Criptografia de ponta a ponta e sistema anti-fraude na leitura das catracas.</p>
                </div>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-10 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all group relative overflow-hidden">
              <div className="absolute top-6 right-6 flex -space-x-4 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">A</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-red-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">M</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">+5</div>
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between mt-10 sm:mt-0">
                <div className="w-14 h-14 bg-[#E31E24]/10 dark:bg-red-500/20 text-[#E31E24] dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Comunidade</h3>
                  <p className="text-gray-600 dark:text-slate-400 font-medium text-sm leading-relaxed">Conecte-se com pessoas, deixe suas avaliações e sugira novas ideias.</p>
                </div>
              </div>
            </div>

            {/* Bento Card 4 - Span 2 */}
            <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black p-10 rounded-[32px] border border-gray-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#E31E24]/20 rounded-full blur-[80px] group-hover:bg-[#E31E24]/30 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row h-full gap-8 text-white">
                <div className="flex flex-col h-full justify-between sm:w-1/2">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/20 shadow-lg">
                    <Play className="w-7 h-7 ml-1" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Painel do Organizador</h3>
                    <p className="text-gray-400 font-medium max-w-md leading-relaxed">Gerencie seus próprios eventos, escaneie ingressos na porta e visualize KPIs de vendas em tempo real.</p>
                  </div>
                </div>

                {/* Visual Element - Mock Dashboard */}
                <div className="hidden sm:flex flex-1 items-center justify-end relative">
                  <div className="w-full max-w-[280px] h-48 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-5 flex flex-col gap-4 transform group-hover:-translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-2">
                      <div className="w-24 h-4 bg-white/20 rounded-full"></div>
                      <div className="w-12 h-4 bg-emerald-400/50 rounded-full"></div>
                    </div>
                    {/* Fake Chart */}
                    <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                      {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
                        <div key={i} className="w-full bg-white/10 hover:bg-white/30 rounded-t-sm transition-colors duration-300" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Floating Notification */}
                  <div className="absolute -bottom-4 -left-4 w-40 bg-[#303392] p-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-3 transform group-hover:-translate-y-4 transition-transform duration-700 delay-100">
                    <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
                    <div className="flex-1">
                      <div className="w-16 h-2 bg-white/40 rounded-full mb-1"></div>
                      <div className="w-20 h-2 bg-white/20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-12">
            {/* Branding */}
            <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full p-1.5 flex items-center justify-center shadow-sm border border-gray-100">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight">
                  <span className="text-[#E31E24]">FOCO</span>{' '}
                  <span className="text-[#303392] dark:text-blue-400">Eventos</span>
                </span>
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
                O seu app de ingressos e eventos. Conecte-se aos momentos que importam com segurança e praticidade.
              </p>
            </div>

            {/* Organização */}
            <div className="md:col-span-3 lg:col-span-3">
              <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Organização</h4>
              <ul className="space-y-4">
                <li className="text-gray-600 dark:text-slate-400 font-medium text-sm">
                  FOCO Consultancy Group
                </li>
                <li className="text-gray-600 dark:text-slate-400 font-medium text-sm">
                  FOCO Eventos e Feiras Ltda.
                </li>
                <li className="text-gray-600 dark:text-slate-400 font-medium text-sm">
                  CNPJ: 65.112.106/0001-22
                </li>
              </ul>
            </div>

            {/* Plataforma */}
            <div className="md:col-span-2 lg:col-span-2">
              <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Plataforma</h4>
              <div className="flex flex-col gap-4">
                <a href="#eventos" className="text-gray-500 dark:text-slate-400 hover:text-[#303392] dark:hover:text-blue-400 font-medium transition-colors text-sm">Explorar Eventos</a>
                <button onClick={() => setShowAppModal(true)} className="text-gray-500 dark:text-slate-400 hover:text-[#303392] dark:hover:text-blue-400 font-medium transition-colors text-sm text-left w-fit">Aplicativo</button>
                <a href="#comunidade" className="text-gray-500 dark:text-slate-400 hover:text-[#303392] dark:hover:text-blue-400 font-medium transition-colors text-sm">Comunidade</a>
              </div>
            </div>

            {/* Contato */}
            <div className="md:col-span-3 lg:col-span-3">
              <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-6">Contato</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-600 dark:text-slate-400">
                  <Phone className="w-5 h-5 text-[#E31E24] shrink-0" />
                  <span className="font-medium text-sm">(98) 98880-1402</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-slate-400">
                  <Mail className="w-5 h-5 text-[#E31E24] shrink-0" />
                  <span className="font-medium text-sm truncate">edilsonlira@fococonsultancy.com.br</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-gray-500 dark:text-slate-500">
              © {new Date().getFullYear()} FOCO Eventos. Todos os direitos reservados.
            </div>
            <div className="flex gap-4 text-sm font-bold text-gray-400 dark:text-slate-600">
              <a href="#" className="hover:text-[#303392] dark:hover:text-blue-400 transition-colors">Termos</a>
              <a href="#" className="hover:text-[#303392] dark:hover:text-blue-400 transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
