import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, User, X, ShieldCheck, Building2, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultToRegister?: boolean;
  showAdminAccess?: boolean;
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultToRegister = false, showAdminAccess = false }: AuthModalProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(defaultToRegister);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsRegistering(defaultToRegister);
      setIsForgotPassword(false);
      setErrorMsg('');
      setSuccessMsg('');
      setShowPassword(false);
      setLoading(false);
    }
  }, [isOpen, defaultToRegister]);

  if (!isOpen) return null;

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
      onClose();
      navigate('/admin');
    } else {
      setPinError('PIN incorreto.');
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
              company: company,
              role: role
            }
          }
        });

        if (error) {
          setErrorMsg(error.message || 'Erro ao criar conta.');
        } else {
          if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              full_name: fullName,
              email: email,
              company: company,
              role: role
            });
            if (profileError) {
              console.warn("Aviso:", profileError);
            }
          }

          if (data.session) {
            onSuccess();
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
          onSuccess();
        }
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao conectar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-[#303392] dark:text-white tracking-tight">
              {isForgotPassword ? 'Recuperar Senha' : isRegistering ? 'Criar Conta' : 'Fazer Login'}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">
              {isForgotPassword ? 'Enviaremos um link para redefinir sua senha' : isRegistering ? 'Precisamos dos seus dados para a inscrição' : 'Acesse sua conta para continuar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto shrink">
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
                    className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white py-4 rounded-[16px] font-bold tracking-wider transition-all flex items-center justify-center hover:opacity-90 disabled:opacity-70 uppercase text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ENVIAR LINK'}
                </button>
              </div>

              <div className="mt-6 text-center text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[#303392] font-bold hover:underline"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>

              {isRegistering && (
                <div className="space-y-5">
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
                        className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Empresa</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-[#303392]/50" />
                      </div>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Nome da sua empresa"
                        className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Cargo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-[#303392]/50" />
                      </div>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Seu cargo na empresa"
                        className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    className="w-full pl-11 pr-4 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                  />
                </div>
              </div>

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
                    className="w-full pl-11 pr-12 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
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
                      className="w-full pl-11 pr-12 py-4 bg-[#F9FAFB] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] focus:ring-4 focus:ring-[#303392]/10 rounded-[16px] outline-none transition-all font-medium text-sm text-gray-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}

              {!isRegistering && (
                <div className="flex justify-between items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 peer-checked:bg-[#303392] peer-checked:border-[#303392] transition-all"></div>
                      <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors">Manter conectado</span>
                  </label>
                  <button type="button" onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg(''); }} className="text-sm font-bold text-[#E31E24] dark:text-red-400 hover:underline transition-colors">
                    Esqueceu a Senha?
                  </button>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#E31E24] to-[#B31217] text-white py-4 rounded-[16px] font-bold tracking-wider transition-all flex items-center justify-center hover:opacity-90 disabled:opacity-70 uppercase text-sm"
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

          {showAdminAccess && (
            <>
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
            </>
          )}
        </div>


        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50 dark:bg-slate-800/30 text-center text-sm">
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
      </div>

      {/* Modal de PIN do Admin */}
      {showPinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
