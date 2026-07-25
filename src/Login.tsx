import { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2, User } from 'lucide-react';
import { supabase } from './lib/supabase';

interface LoginProps {
  onBack: () => void;
  onLoginUser: () => void;
  onLoginAdmin: () => void;
}

export function Login({ onBack, onLoginUser, onLoginAdmin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  
  // PIN de Admin
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor, informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setErrorMsg('Erro ao enviar email de recuperação.');
      } else {
        setSuccessMsg('Link de recuperação enviado! Verifique seu e-mail.');
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha e-mail e senha.');
      return;
    }

    if (isRegistering) {
      if (!fullName) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isRegistering) {
        // Criar Conta
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) {
          setErrorMsg(error.message || 'Erro ao criar conta.');
        } else {
          // Tentar criar perfil caso o trigger do banco não exista ou haja bloqueio RLS
          if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              full_name: fullName,
              email: email,
              company: company,
              job_title: jobTitle
            });
            
            if (profileError) {
              console.warn("Aviso: Não foi possível criar o perfil automaticamente devido às políticas de segurança (RLS). Por favor, crie as políticas no painel do Supabase.", profileError);
            }
          }

          // Se o Supabase exigir confirmação de email, o session virá nulo
          if (data.session) {
            onLoginUser();
          } else {
            setSuccessMsg('Conta criada! Verifique seu e-mail ou faça login.');
            setIsRegistering(false);
          }
        }
      } else {
        // Fazer Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg('E-mail ou senha inválidos.');
        } else {
          onLoginUser();
        }
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao conectar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAccess = () => {
    setPinError('');
    setPinInput('');
    setShowPinModal(true);
  };

  const verifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = import.meta.env.VITE_ADMIN_PIN || '123456';
    if (pinInput === correctPin) {
      setShowPinModal(false);
      onLoginAdmin();
    } else {
      setPinError('PIN incorreto.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-[#1A1A1A] dark:text-white flex selection:bg-[#E31E24] selection:text-white">
      {/* Botão Voltar Absoluto */}
      <div className="absolute top-0 left-0 p-4 sm:p-6 z-20">
        <button 
          onClick={onBack}
          className="p-3 text-[#303392] lg:text-white bg-white dark:bg-slate-900/20 lg:bg-black/20 hover:bg-black/10 lg:hover:bg-black/40 backdrop-blur-md rounded-full transition-colors flex items-center justify-center shadow-sm lg:shadow-none"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Lado Esquerdo - Branding (Logo Grande) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#303392] to-[#1E205A] relative items-center justify-center overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white dark:bg-slate-900 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E31E24] rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-2xl mb-10 transform hover:scale-105 transition-transform duration-500">
            <img 
              src="/logo1.png" 
              alt="AppEventos Logo" 
              className="h-40 w-auto object-contain rounded-2xl" 
            />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Bem-vindo(a)!</h1>
          <p className="text-blue-100 text-lg max-w-md font-medium">O seu app de ingressos e eventos. Conecte-se aos momentos que importam.</p>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 bg-[#F5F7FA]">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 lg:bg-transparent p-8 lg:p-0 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] lg:shadow-none">
          {/* Logo fallback para mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src="/logo1.png" 
              alt="AppEventos Logo" 
              className="h-28 object-contain rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800" 
            />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-[#303392] dark:text-blue-400 mb-2 tracking-tight">
              {isForgotPassword ? 'Recuperar Senha' : isRegistering ? 'Criar Conta' : 'Login'}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              {isForgotPassword ? 'Enviaremos um link para redefinir sua senha' : isRegistering ? 'Preencha seus dados para começar' : 'Acesse sua conta para continuar'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              {successMsg}
            </div>
          )}

          {isForgotPassword ? (
            <form className="space-y-5" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#303392]/50" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white py-4 rounded-[16px] font-bold text-lg tracking-wider hover:scale-[1.02] hover:shadow-[0_8px_16px_rgba(227,30,36,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed uppercase"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ENVIAR LINK'}
                </button>
              </div>

              <div className="mt-6 text-center text-sm font-medium text-gray-600 dark:text-slate-400">
                <button 
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[#303392] font-extrabold hover:underline"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Campos Específicos de Cadastro */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Nome Completo *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-[#303392]/50" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Empresa</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Sua empresa"
                      className="w-full px-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Cargo</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Seu cargo"
                      className="w-full px-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campo de E-mail */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">{isRegistering ? 'E-mail *' : 'E-mail'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#303392]/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">{isRegistering ? 'Senha *' : 'Senha'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#303392]/50" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#303392] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Confirmar Senha *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#303392]/50" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-4 bg-[#F9FAFB] dark:bg-slate-950 lg:bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all text-gray-800 dark:text-slate-200 font-semibold placeholder:text-gray-400 placeholder:font-normal shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Manter conectado e Esqueceu a Senha */}
            {!isRegistering && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303392]/30 checked:border-[#303392] checked:bg-[#303392] transition-all cursor-pointer"
                    />
                    <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:text-white transition-colors">
                    Manter conectado
                  </span>
                </label>
                
                <button type="button" onClick={() => {setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg('');}} className="text-sm font-bold text-[#E31E24] dark:text-red-400 hover:text-[#B31217] transition-colors hover:underline text-left">
                  Esqueceu a Senha?
                </button>
              </div>
            )}

            {/* Botão Principal */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white py-4 rounded-[16px] font-bold text-lg tracking-wider hover:scale-[1.02] hover:shadow-[0_8px_16px_rgba(227,30,36,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed uppercase"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    PROCESSANDO...
                  </span>
                ) : (
                  isRegistering ? 'CADASTRAR' : 'ENTRAR'
                )}
              </button>
            </div>
          </form>
          )}

          {/* Toggle Cadastro/Login */}
          <div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-slate-400">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            {' '}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[#303392] dark:text-blue-400 font-extrabold hover:underline"
            >
              {isRegistering ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </div>

          {/* Separador */}
          <div className="mt-8 mb-8 flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Acesso Restrito</span>
            <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
          </div>

          {/* Acesso Administrativo */}
          <div className="flex justify-center">
            <button 
              type="button"
              onClick={handleAdminAccess}
              className="flex items-center gap-2 px-6 py-3 rounded-[16px] border-2 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-[#303392] hover:border-[#303392] hover:bg-[#303392]/5 font-bold text-sm transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              Acesso Administrativo
            </button>
          </div>
          
        </div>
      </div>

      {/* Modal de PIN do Admin */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-[#303392]/10 text-[#303392] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Acesso Restrito</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Digite o PIN de administrador para acessar o painel.</p>
            
            <form onSubmit={verifyAdminPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-4 text-center tracking-[0.5em] text-2xl font-black bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] transition-colors"
                  autoFocus
                />
              </div>
              
              {pinError && (
                <p className="text-[#E31E24] font-bold text-sm">{pinError}</p>
              )}

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-[#303392] hover:bg-[#1E205A] text-white py-3 rounded-xl font-bold tracking-wide transition-colors"
                >
                  ACESSAR PAINEL
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-white font-bold py-2 transition-colors text-sm"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
