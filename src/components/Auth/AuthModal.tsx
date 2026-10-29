import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CatIcon, CatPawIcon } from '../Cat/CatIcon';
import { CatAvatar } from '../Cat/CatAvatar';
import { LogIn, UserPlus, KeyRound, Mail, User, Sparkles, X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
}) => {
  const { login, register, loginDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Erro ao fazer login.');
        } else if (onClose) {
          onClose();
        }
      } else {
        if (!name.trim()) {
          setError('Por favor, informe seu nome.');
          setIsSubmitting(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.success) {
          setError(res.error || 'Erro ao criar conta.');
        } else if (onClose) {
          onClose();
        }
      }
    } catch {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await loginDemo();
      if (!res.success) {
        setError(res.error || 'Erro ao entrar na conta demo.');
      } else if (onClose) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Fofo com Mascote */}
        <div className="bg-gradient-to-b from-indigo-50/80 to-white p-5 border-b border-slate-100 relative text-center">
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xs border border-indigo-100 mb-2 overflow-hidden">
            <CatAvatar
              alt="Mascote StudyDay"
              className="w-full h-full object-cover"
              fallbackPriority="calm"
              fallbackSize={48}
            />
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            <span>StudyDay</span>
            <CatPawIcon size={16} color="#ec4899" />
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Suas tarefas salvas no banco de dados e sincronizadas em qualquer dispositivo.
          </p>

          {/* Abas Entrar / Criar Conta */}
          <div className="flex gap-1 p-1 bg-slate-100/90 rounded-xl mt-4 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Seu Nome</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Pedro"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                E-mail (pode ser fictício)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex.: teste@gmail.com ou qualquer-email@fake"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Senha</label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex.: 1234teste"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Processando...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar na Minha Conta</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Minha Conta</span>
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2 text-[11px] text-slate-400 font-medium">
              ou acesso instantâneo
            </span>
          </div>

          {/* Botão de Conta Demo em 1 Clique */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CatIcon priority="calm" size={20} showBadgeDot={false} />
            <span>Entrar com Conta de Demonstração (teste@gmail.com)</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Conta demo já vem com senha preenchida (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">1234teste</code>) para você testar imediatamente!
          </p>
        </div>
      </div>
    </div>
  );
};
