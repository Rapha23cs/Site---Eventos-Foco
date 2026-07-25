import { Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from './components/ThemeProvider';

export function AdminSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-6 mt-8 animate-fade-in pb-24">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#303392]/10 rounded-2xl flex items-center justify-center text-[#303392]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configurações do Sistema</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">Gerencie as preferências globais do painel administrativo.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
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
                <p className="font-bold text-gray-900 dark:text-white">Modo Escuro (Admin)</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Alternar o tema do painel administrativo</p>
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
