import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  Search,
  ArrowLeft,
  Loader2,
  UserPlus,
  CheckCircle,
  XCircle,
  User,
  Copy,
  Check,
  Mail,
  Key,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Award,
} from 'lucide-react';
import { EmailService, type SendEmailResult } from './services/emailService';
import { useToast } from './components/Toast';

interface AdminEventAttendeesProps {
  eventId: string | number;
  onBack: () => void;
}

export function AdminEventAttendees({ eventId, onBack }: AdminEventAttendeesProps) {
  const toast = useToast();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  // States para busca via QRCode / Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmitting, setIsEmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Modal de adição manual
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNome, setNewUserNome] = useState('');
  const [newUserEmpresa, setNewUserEmpresa] = useState('');
  const [newUserCargo, setNewUserCargo] = useState('');
  const [newUserContato, setNewUserContato] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  // Modal de Sucesso com Credenciais & Status Resend
  const [createdSuccessData, setCreatedSuccessData] = useState<{
    nome: string;
    email: string;
    senha: string;
    emailResult: SendEmailResult;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  async function fetchData() {
    setLoading(true);

    // Busca dados do evento
    const { data: evData } = await supabase.from('events').select('name').eq('id', eventId).single();
    if (evData) setEventData(evData);

    const { data: enrollData, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        attended,
        attended_at,
        created_at,
        user_id
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (enrollError) {
      console.error('Erro ao buscar inscritos:', enrollError);
      toast.error('Erro ao buscar inscritos', enrollError.message);
      setLoading(false);
      return;
    }

    if (enrollData && enrollData.length > 0) {
      const userIds = enrollData.map((e) => e.user_id);

      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      });

      const usersMap = new Map();
      for (const uid of userIds) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(uid);
          if (userData?.user) {
            const u = userData.user;
            usersMap.set(uid, {
              id: uid,
              full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário',
              email: u.email || '',
              avatar_url: u.user_metadata?.avatar_url || null,
            });
          }
        } catch (e) {
          console.warn('[Admin] Não foi possível buscar usuário', uid, e);
        }
      }

      const mergedData = enrollData.map((e) => ({
        ...e,
        profiles: usersMap.get(e.user_id) || null,
      }));

      setAttendees(mergedData);
    } else {
      setAttendees([]);
    }
    setLoading(false);
  }

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserNome.trim() || !newUserEmail.trim()) {
      toast.warning('Campos Obrigatórios', 'Preencha o Nome e o E-mail do participante.');
      return;
    }

    setAddingUser(true);

    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      toast.error('Configuração Ausente', 'Service Role Key do Supabase não foi configurada.');
      setAddingUser(false);
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const randomPassword = Math.random().toString(36).slice(-8);

    try {
      // 1. Cria o usuário no Auth
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: newUserEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: newUserNome,
        },
      });

      if (authErr) {
        const errorMsg = authErr.message || '';
        if (
          errorMsg.toLowerCase().includes('already') ||
          errorMsg.toLowerCase().includes('registered')
        ) {
          throw new Error(
            'Já existe um usuário cadastrado no FOCO Eventos com este e-mail. Como ele já tem conta, ele pode fazer login e se inscrever no evento.'
          );
        }
        throw authErr;
      }

      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error('Falha ao obter ID do novo usuário.');

      // 2. Insere no profiles
      let profileErr: any = null;
      const { error: profileErr1 } = await adminClient.from('profiles').insert({
        id: newUserId,
        full_name: newUserNome,
        company: newUserEmpresa || null,
        job_title: newUserCargo || null,
        phone: newUserContato || null,
        email: newUserEmail,
      });

      if (profileErr1) {
        const { error: profileErr2 } = await adminClient.from('profiles').insert({
          id: newUserId,
          full_name: newUserNome,
          company: newUserEmpresa || null,
          job_title: newUserCargo || null,
          phone: newUserContato || null,
        });
        profileErr = profileErr2;
      }

      if (profileErr) {
        console.warn('[Admin] Continuando mesmo sem salvar o perfil.');
      }

      // 3. Insere no enrollments
      const { error: enrollErr } = await adminClient.from('enrollments').insert({
        event_id: eventId,
        user_id: newUserId,
        status: 'confirmed',
      });

      if (enrollErr) throw enrollErr;

      // 4. Envia o e-mail via Resend (com diagnóstico detalhado)
      const emailResult = await EmailService.sendEmailDetailed({
        to: newUserEmail,
        subject: 'Você foi inscrito em um Evento!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #303392;">Olá, ${newUserNome}!</h1>
            <p>Você acaba de ganhar um ingresso para o evento <strong>${eventData?.name || 'exclusivo'}</strong> no nosso app!</p>
            <p>Seus dados de acesso são:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${newUserEmail}</p>
              <p style="margin: 5px 0;"><strong>Senha de Acesso:</strong> ${randomPassword}</p>
            </div>
            <p>Acesse o app ou nosso site, faça o login e você encontrará seu ingresso na aba <strong>Meus Ingressos</strong>!</p>
          </div>
        `,
      });

      setShowAddModal(false);
      const savedNome = newUserNome;
      const savedEmail = newUserEmail;

      setNewUserEmail('');
      setNewUserNome('');
      setNewUserEmpresa('');
      setNewUserCargo('');
      setNewUserContato('');

      fetchData();

      // Notificação Toast
      toast.success('Inscrição Realizada!', `Participante ${savedNome} inscrito com sucesso.`);

      // Abre Modal Moderno com Credenciais & Status Resend
      setCreatedSuccessData({
        nome: savedNome,
        email: savedEmail,
        senha: randomPassword,
        emailResult,
      });
    } catch (err: any) {
      toast.error('Erro na Inscrição', err.message || 'Erro ao adicionar participante.');
    } finally {
      setAddingUser(false);
    }
  };

  const copyCredentials = (email: string, pass: string) => {
    const text = `Email: ${email}\nSenha: ${pass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info('Copiado!', 'Credenciais copiadas para a área de transferência.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmitCertificates = async () => {
    const validatedAttendees = attendees.filter((a) => a.status === 'validated');
    
    if (validatedAttendees.length === 0) {
      toast.warning('Aviso', 'Nenhum participante com ingresso validado foi encontrado.');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmEmitCertificates = async () => {
    setShowConfirmModal(false);
    setIsEmitting(true);
    
    const validatedAttendees = attendees.filter((a) => a.status === 'validated');
    let successCount = 0;
    let errorCount = 0;

    const emailServiceInstance = new EmailService();

    for (const attendee of validatedAttendees) {
      const email = attendee.profiles?.email;
      const name = attendee.profiles?.full_name || 'Participante';
      const eventTitle = eventData?.name || 'Evento';

      if (email) {
        try {
          const result = await emailServiceInstance.sendCertificateEmail(email, name, eventTitle);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Falha ao enviar para ${email}:`, result.resendError);
          }
        } catch (err) {
          errorCount++;
          console.error(`Erro inesperado ao enviar para ${email}:`, err);
        }
      }
    }

    setIsEmitting(false);

    if (successCount > 0) {
      toast.success(
        'Certificados Emitidos!',
        `${successCount} certificado(s) enviado(s) com sucesso via e-mail.`
      );
    }
    
    if (errorCount > 0) {
      toast.error(
        'Aviso',
        `Houve falha ao enviar ${errorCount} certificado(s). Verifique os limites do Resend ou logs no console.`
      );
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    const term = searchTerm.toLowerCase();
    const name = a.profiles?.full_name?.toLowerCase() || '';
    const email = a.profiles?.email?.toLowerCase() || '';
    const ticketId = String(a.id || '').toLowerCase();

    return name.includes(term) || email.includes(term) || ticketId.includes(term);
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 mt-8 pb-24 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-[#303392] dark:text-blue-400 font-semibold mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Voltar para Painel Admin
      </button>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#E31E24] bg-red-50 px-3 py-1 rounded-full">
            Gestão de Presença
          </span>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {eventData?.name || 'Carregando Evento...'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Total de participantes inscritos: <strong className="text-gray-800 dark:text-slate-200">{attendees.length}</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <button
            onClick={handleEmitCertificates}
            disabled={isEmitting}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-6 py-3.5 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
            {isEmitting ? 'Emitindo...' : 'Emitir Certificados'}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#303392] to-[#1E205A] text-white font-bold px-6 py-3.5 rounded-2xl hover:shadow-lg hover:shadow-[#303392]/20 hover:scale-[1.02] transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar Participante
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou código do ingresso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 text-sm font-medium text-gray-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Attendees Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#303392] dark:text-blue-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Carregando lista de inscritos...</p>
        </div>
      ) : filteredAttendees.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300">Nenhum participante encontrado</h3>
          <p className="text-sm text-gray-400 mt-1">Nenhuma inscrição corresponde aos critérios buscados.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs uppercase font-extrabold text-gray-500 dark:text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Participante</th>
                  <th className="py-4 px-6">Status da Inscrição</th>
                  <th className="py-4 px-6 text-right">Validação do Ticket (App)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[#303392] dark:text-blue-400 uppercase border border-slate-200 dark:border-slate-700">
                          {attendee.profiles?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {attendee.profiles?.full_name || 'Nome não informado'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {attendee.profiles?.email || 'Sem e-mail'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        {attendee.status === 'confirmed' ? 'Confirmado' : attendee.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex justify-end">
                      {attendee.attended ? (
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-3.5 py-1.5 rounded-full w-fit">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Ticket Validado (App)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full w-fit">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Aguardando Validação no App
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-slate-800 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#303392] dark:text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Adicionar Participante</h3>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              Inscreva um participante manualmente neste evento. As credenciais de acesso serão geradas e notificadas.
            </p>

            <form onSubmit={handleManualEnroll} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUserNome}
                  onChange={(e) => setNewUserNome(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-800 dark:text-slate-200 text-sm"
                  placeholder="Ex: Raphael Sá"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-800 dark:text-slate-200 text-sm"
                  placeholder="Ex: raphael@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Empresa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newUserEmpresa}
                    onChange={(e) => setNewUserEmpresa(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-800 dark:text-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Cargo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newUserCargo}
                    onChange={(e) => setNewUserCargo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-800 dark:text-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Contato (Opcional)
                </label>
                <input
                  type="text"
                  value={newUserContato}
                  onChange={(e) => setNewUserContato(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#303392] dark:border-blue-500 font-medium text-gray-800 dark:text-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={addingUser}
                className="w-full py-4 bg-gradient-to-r from-[#303392] to-[#1E205A] text-white font-bold rounded-2xl hover:scale-[1.01] transition-all flex justify-center items-center gap-2 mt-4 shadow-lg shadow-[#303392]/20"
              >
                {addingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRMAR E GERAR SENHA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODERN SUCCESS & CREDENTIALS MODAL */}
      {createdSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-800 relative animate-in zoom-in-95">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-black text-center text-white">Inscrição Concluída!</h3>
            <p className="text-xs text-slate-400 text-center mt-1 mb-6">
              O participante <strong className="text-slate-200">{createdSuccessData.nome}</strong> foi inscrito com sucesso.
            </p>

            {/* Credentials Card */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 mb-5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Credenciais Geradas
                </span>
                <button
                  onClick={() => copyCredentials(createdSuccessData.email, createdSuccessData.senha)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-500/30"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Dados'}
                </button>
              </div>

              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700/40">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300 truncate">{createdSuccessData.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700/40">
                  <Key className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-bold tracking-wider">{createdSuccessData.senha}</span>
                </div>
              </div>
            </div>

            {/* Resend Status Banner */}
            <div className="mb-6">
              {createdSuccessData.emailResult.success ? (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-emerald-200">E-mail enviado via Resend!</strong>
                    <span>Uma mensagem de boas-vindas com a senha foi entregue para {createdSuccessData.email}.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-200">Status do Envio via Resend:</strong>
                    <span className="mt-1 block leading-relaxed">{createdSuccessData.emailResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCreatedSuccessData(null)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700"
            >
              CONCLUÍDO
            </button>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100 dark:border-slate-800 transform transition-all scale-100">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-center text-gray-900 dark:text-white mb-2">
              Emitir Certificados
            </h2>
            
            <p className="text-center text-gray-500 dark:text-slate-400 mb-8 font-medium">
              O sistema irá gerar e enviar um e-mail com o certificado para <strong className="text-gray-900 dark:text-white">{attendees.filter(a => a.status === 'validated').length}</strong> participante(s) que tiveram o ingresso validado. Deseja continuar?
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEmitCertificates}
                className="flex-1 py-3.5 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 transition-all"
              >
                Sim, Emitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
