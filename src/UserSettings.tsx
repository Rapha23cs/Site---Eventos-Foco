import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User, Mail, Link as LinkIcon, Loader2, Save, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useToast } from './components/Toast';
import { useTheme } from './components/ThemeProvider';

export function UserSettings() {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    avatar_url: '',
    email: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile({
        id: user.id,
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        avatar_url: data?.avatar_url || '',
        email: user.email || ''
      });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess(true);
      toast.success('Perfil Atualizado!', 'Suas alterações foram salvas com sucesso.');
      
      // Esconder a mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao Salvar', 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-12 h-12 animate-spin text-[#303392] dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 mt-8 animate-fade-in pb-24">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#303392]/10 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-[#303392] dark:text-blue-400">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Meu Perfil</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">Atualize suas informações pessoais e foto de perfil.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        
        {/* Preview da Imagem de Perfil */}
        <div className="bg-gradient-to-r from-[#303392]/5 to-[#1E205A]/5 p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-300" />
            )}
          </div>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white">{profile.full_name || 'Usuário sem nome'}</p>
        </div>

        <div className="p-8">
          {success && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm">Perfil atualizado com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">E-mail (Apenas leitura)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-500 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#303392] dark:text-blue-400/50" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none text-gray-900 dark:text-white font-medium transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1">URL da Foto de Perfil</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-[#303392] dark:text-blue-400/50" />
                </div>
                <input
                  type="url"
                  name="avatar_url"
                  value={profile.avatar_url}
                  onChange={handleChange}
                  placeholder="https://sua-imagem.com/foto.jpg"
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] dark:bg-slate-950 border border-gray-200 dark:border-slate-700 focus:border-[#303392] dark:border-blue-500 rounded-xl outline-none text-gray-900 dark:text-white font-medium transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-[#303392] text-white font-bold rounded-xl shadow-sm hover:bg-[#1E205A] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>

          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mt-8">
        <div className="p-8">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            Aparência
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm text-gray-600 dark:text-slate-400">
                {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Modo Escuro</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Alternar entre o tema claro e escuro</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-[#303392]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 transition-transform ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
