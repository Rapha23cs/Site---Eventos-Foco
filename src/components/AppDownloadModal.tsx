import { X, Smartphone, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }
  }, [isOpen]);

  if (!isOpen && !isRendered) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div 
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#303392]/10 to-[#E31E24]/10 dark:from-blue-500/10 dark:to-red-500/10 text-[#303392] dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Smartphone className="w-10 h-10 -rotate-3" />
          </div>

          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            App em Desenvolvimento
          </h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            Nossa equipe está preparando uma experiência incrível para seu celular. Em breve disponível nas principais lojas de aplicativos.
          </p>

          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 mb-6 flex flex-col items-center">
            <div className="w-32 h-32 bg-white dark:bg-white rounded-xl shadow-sm mb-4 flex items-center justify-center p-2">
              <QrCode className="w-full h-full text-gray-900" strokeWidth={1} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Aponte a câmera
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className="h-12 w-36 bg-black dark:bg-white rounded-xl opacity-20 flex items-center justify-center">
              <span className="text-xs font-bold text-white dark:text-black">App Store</span>
            </div>
            <div className="h-12 w-36 bg-black dark:bg-white rounded-xl opacity-20 flex items-center justify-center">
              <span className="text-xs font-bold text-white dark:text-black">Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
