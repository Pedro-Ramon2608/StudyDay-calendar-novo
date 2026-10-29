import React, { useRef } from 'react';
import { ActiveTab, AppStorageState } from '../types';
import { useAuth } from '../context/AuthContext';
import { CatIcon, CatPawIcon } from './Cat/CatIcon';
import { CatAvatar } from './Cat/CatAvatar';
import {
  CalendarDays,
  CalendarRange,
  Timer,
  Target,
  Download,
  Upload,
  RotateCcw,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onExport: () => void;
  onImport: (data: AppStorageState) => boolean;
  onReset: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onExport,
  onImport,
  onReset,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = onImport(json);
        if (!success) {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
          {/* Zone 1: Brand Wordmark com Mascote */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
              <CatAvatar alt="StudyDay Mascote" fallbackPriority="calm" fallbackSize={32} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap flex items-center gap-1">
                <span>StudyDay</span>
                <CatPawIcon size={14} color="#ec4899" />
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs (4 Abas) */}
          <nav
            className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl max-w-full overflow-x-auto"
            aria-label="Navegação Principal"
          >
            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Calendário</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'week'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-4 h-4 shrink-0" />
              <span>Semana</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('pomodoro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'pomodoro'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-4 h-4 shrink-0" />
              <span>Pomodoro</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('future')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'future'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4 shrink-0" />
              <span>Metas</span>
            </button>
          </nav>

          {/* Zone 3: Usuário & Ações */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                <CatIcon priority="calm" size={20} showBadgeDot={false} />
                <div className="hidden lg:block text-left leading-none">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Sair da conta"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar / Conta</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={onExport}
              title="Exportar backup dos dados (JSON)"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors hidden md:inline-flex"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Importar backup (JSON)"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors hidden md:inline-flex"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja resetar para os dados de demonstração?')) {
                  onReset();
                }
              }}
              title="Restaurar dados de exemplo"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors hidden sm:inline-flex"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
