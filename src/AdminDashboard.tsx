import { useState, useEffect } from 'react';
import { 
  LogOut, DollarSign, Ticket, Users, MousePointerClick, 
  LayoutDashboard, CalendarDays, Settings, Bell, Search, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { AdminEventsList } from './AdminEventsList';
import { AdminCreateEvent } from './AdminCreateEvent';
import { AdminEventAttendees } from './AdminEventAttendees';
import { AdminSettings } from './AdminSettings';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [adminView, setAdminView] = useState<'overview' | 'events' | 'create_event' | 'attendees' | 'settings'>('overview');
  const [editingEventId, setEditingEventId] = useState<string | number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null);

  const [revenue, setRevenue] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      // 1. Total Usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalUsers(usersCount || 0);

      // 2. Total Inscrições
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });
      
      setTotalTickets(enrollmentsCount || 0);

      // 3. Últimas Inscrições (sem join de profiles para evitar erro cache)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          created_at,
          user_id,
          events (name, price)
        `)
        .order('created_at', { ascending: false });

      if (enrollments && enrollments.length > 0) {
        let totalRev = 0;
        
        // Pega todos users únicos
        const userIds = [...new Set(enrollments.map(e => e.user_id))];
        
        // Usa adminClient para bypass RLS de leitura de profiles
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
        });
        
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
          
        const profilesMap = new Map();
        if (profiles) {
          profiles.forEach(p => profilesMap.set(p.id, p.full_name));
        }

        const salesData: any[] = [];

        enrollments.forEach((enrollment: any, index: number) => {
          const eventPrice = parseFloat(enrollment.events?.price || 0);
          totalRev += eventPrice;

          if (index < 5) {
            salesData.push({
              id: `#INV-${String(enrollment.id).padStart(4, '0')}`,
              user: profilesMap.get(enrollment.user_id) || 'Usuário',
              event: enrollment.events?.name || 'Evento',
              date: new Date(enrollment.created_at).toLocaleDateString('pt-BR'),
              amount: eventPrice > 0 ? `R$ ${eventPrice.toFixed(2)}` : 'R$ 0,00',
              status: eventPrice > 0 ? 'Pago' : 'Gratuito'
            });
          }
        });

        setRevenue(totalRev);
        setRecentSales(salesData);
      } else {
        setRevenue(0);
        setRecentSales([]);
      }
      
      setLoading(false);
    }

    loadAdminData();
  }, []);

  // Dados KPI Dinâmicos
  const kpis = [
    { title: 'Faturamento', value: loading ? '...' : `R$ ${revenue.toFixed(2)}`, trend: '+12.5%', isPositive: true, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Ingressos Vendidos', value: loading ? '...' : totalTickets.toString(), trend: '+5.2%', isPositive: true, icon: Ticket, color: 'text-[#303392] dark:text-blue-400', bg: 'bg-[#303392]/10 dark:bg-blue-900/30' },
    { title: 'Novos Usuários', value: loading ? '...' : totalUsers.toString(), trend: '+2.1%', isPositive: true, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Acessos na Plataforma', value: '12.5K', trend: '+18.4%', isPositive: true, icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-slate-950 font-sans text-[#1A1A1A] dark:text-white selection:bg-[#E31E24] selection:text-white">
      
      {/* Sidebar Fixa (Estilo SaaS) */}
      <aside className="w-72 bg-[#1E205A] text-white flex flex-col fixed h-full z-20">
        <div className="p-8 flex items-center gap-3">
          <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain bg-white dark:bg-slate-900 rounded-lg p-1" />
          <span className="text-xl font-extrabold tracking-wider">ADMIN</span>
        </div>
        
        <div className="px-6 pb-6 text-xs font-bold text-[#6B6EED] tracking-widest uppercase">Menu Principal</div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setAdminView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              adminView === 'overview' ? 'bg-[#303392] text-white' : 'text-blue-200 hover:bg-[#303392]/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setAdminView('events')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              adminView === 'events' ? 'bg-[#303392] text-white' : 'text-blue-200 hover:bg-[#303392]/50 hover:text-white'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Eventos
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-200 hover:bg-[#303392]/50 hover:text-white rounded-xl font-semibold transition-colors">
            <Users className="w-5 h-5" />
            Participantes
          </button>
          <button 
            onClick={() => setAdminView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
              adminView === 'settings' ? 'bg-[#303392] text-white' : 'text-blue-200 hover:bg-[#303392]/50 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="p-4">
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 ml-72 flex flex-col min-h-screen">
        
        {/* Topbar do Admin */}
        <header className="h-24 px-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-medium">
            <span>Visão Geral</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#303392] dark:text-blue-400 font-bold">Dashboard Financeiro</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Busca rápida..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none text-sm font-medium"
              />
            </div>
            
            <button className="relative p-2 text-gray-400 hover:text-[#303392] dark:text-blue-400 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E31E24] rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-700 pl-6 cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="font-bold text-gray-900 dark:text-white text-sm">Administrador</p>
                <p className="text-gray-500 dark:text-slate-400 text-xs font-semibold">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#303392] to-[#6B6EED] flex items-center justify-center text-white font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Scrollável */}
        {adminView === 'overview' && (
          <div className="p-10 space-y-8 flex-1">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Bom dia, Administrador!</h2>
              <button 
                onClick={() => { setEditingEventId(null); setAdminView('create_event'); }}
                className="px-5 py-2.5 bg-[#303392] text-white font-bold rounded-xl shadow-sm hover:bg-[#1E205A] transition-colors text-sm"
              >
                + Criar Novo Evento
              </button>
            </div>

          {/* Grid de KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {kpi.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-sm mb-1">{kpi.title}</p>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Gráfico Largo & Tabela */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Gráfico de Desempenho (Ocupa 2 colunas) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Desempenho de Vendas (Semanal)</h3>
                <select className="bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-400 rounded-lg px-3 py-1.5 outline-none">
                  <option>Esta Semana</option>
                  <option>Mês Passado</option>
                </select>
              </div>
              
              <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 pt-6 border-b border-gray-100 dark:border-slate-800 pb-2">
                {/* Barras do Gráfico Web */}
                {[
                  { day: 'Seg', val1: 40, val2: 20 },
                  { day: 'Ter', val1: 70, val2: 50 },
                  { day: 'Qua', val1: 50, val2: 30 },
                  { day: 'Qui', val1: 100, val2: 80 },
                  { day: 'Sex', val1: 130, val2: 90 },
                  { day: 'Sáb', val1: 90, val2: 60 },
                  { day: 'Dom', val1: 30, val2: 10 }
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center justify-end h-full w-full group">
                    <div className="flex items-end gap-1 w-full justify-center">
                      <div className="w-1/3 max-w-[20px] bg-gray-200 rounded-t-md group-hover:bg-[#E31E24]/40 transition-colors" style={{ height: `${(bar.val2 / 150) * 100}%` }}></div>
                      <div className="w-1/3 max-w-[20px] bg-[#303392] rounded-t-md shadow-sm group-hover:bg-[#1E205A] transition-colors" style={{ height: `${(bar.val1 / 150) * 100}%` }}></div>
                    </div>
                    <span className="mt-4 text-xs font-bold text-gray-400">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela Resumo (Últimas Vendas) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Últimas Transações</h3>
                <button className="text-[#303392] dark:text-blue-400 font-bold text-sm hover:underline">Ver todas</button>
              </div>
              
              <div className="space-y-5 flex-1 relative">
                {loading && (
                  <div className="absolute inset-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                     <Loader2 className="w-8 h-8 animate-spin text-[#303392] dark:text-blue-400" />
                  </div>
                )}
                
                {recentSales.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400 font-medium">Nenhuma transação recente.</div>
                )}

                {recentSales.map((sale, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 dark:text-slate-400 font-bold text-sm">
                        {sale.user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-[#303392] dark:text-blue-400 transition-colors line-clamp-1">{sale.user}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 line-clamp-1 w-32">{sale.event}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">{sale.amount}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        sale.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' : 
                        sale.status === 'Gratuito' ? 'bg-gray-100 text-gray-600 dark:text-slate-400' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        )}

        {adminView === 'events' && (
          <AdminEventsList 
            onCreateNew={() => { setEditingEventId(null); setAdminView('create_event'); }}
            onEdit={(id) => { setEditingEventId(id); setAdminView('create_event'); }}
            onViewAttendees={(id) => { setSelectedEventId(id); setAdminView('attendees'); }}
          />
        )}

        {adminView === 'create_event' && (
          <AdminCreateEvent 
            eventId={editingEventId}
            onBack={() => setAdminView('events')}
          />
        )}

        {adminView === 'attendees' && selectedEventId && (
          <AdminEventAttendees 
            eventId={selectedEventId}
            onBack={() => setAdminView('events')}
          />
        )}

        {adminView === 'settings' && (
          <AdminSettings />
        )}
      </main>
    </div>
  );
}
