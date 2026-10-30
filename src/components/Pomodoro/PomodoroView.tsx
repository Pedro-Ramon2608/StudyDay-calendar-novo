import React, { useState, useEffect, useRef } from 'react';
import { CatIcon, CatPawIcon } from '../Cat/CatIcon';
import { CatAvatar } from '../Cat/CatAvatar';
import { playCatMeowSound } from '../../utils/audioUtils';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Coffee,
  Brain,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

export const PomodoroView: React.FC = () => {
  // Configuração de tempo (padrão 40 min de foco e 5 min de descanso)
  const [focusMinutes, setFocusMinutes] = useState<number>(40);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);

  // Modo atual
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  // Tempo restante em segundos
  const [timeLeft, setTimeLeft] = useState<number>(40 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza tempo ao trocar os minutos configurados quando parado
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, mode, isRunning]);

  // Contagem regressiva do timer com MIADO ao término da etapa
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Ciclo concluído: Toca o miado do gatinho!
            if (soundEnabled) {
              playCatMeowSound();
            }

            if (mode === 'focus') {
              setCompletedSessions((s) => s + 1);
              setMode('break');
              return breakMinutes * 60;
            } else {
              setMode('focus');
              return focusMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode, breakMinutes, focusMinutes, soundEnabled]);

  const toggleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusMinutes * 60);
    }
  };

  const applyPreset = (focus: number, rest: number) => {
    setIsRunning(false);
    setFocusMinutes(focus);
    setBreakMinutes(rest);
    setTimeLeft(mode === 'focus' ? focus * 60 : rest * 60);
  };

  // Formatação MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Porcentagem decorrida
  const totalDuration = (mode === 'focus' ? focusMinutes : breakMinutes) * 60;
  const progressPercent = Math.min(100, Math.max(0, Math.round(((totalDuration - timeLeft) / totalDuration) * 100)));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Card Principal do Pomodoro */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-6 relative overflow-hidden">
        {/* Patinhas decorativas de fundo */}
        <div className="absolute top-4 left-6 opacity-15 pointer-events-none">
          <CatPawIcon size={28} color="#ec4899" />
        </div>
        <div className="absolute top-4 right-6 opacity-15 pointer-events-none">
          <CatPawIcon size={28} color="#6366f1" />
        </div>
        <div className="absolute bottom-4 left-8 opacity-10 pointer-events-none">
          <CatPawIcon size={24} color="#10b981" />
        </div>
        <div className="absolute bottom-4 right-8 opacity-10 pointer-events-none">
          <CatPawIcon size={24} color="#f59e0b" />
        </div>

        {/* Chaveamento de Modo (Foco vs Descanso) */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                if (mode !== 'focus') {
                  setIsRunning(false);
                  setMode('focus');
                  setTimeLeft(focusMinutes * 60);
                }
              }}
              className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'focus'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Modo Foco ({focusMinutes}m)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode !== 'break') {
                  setIsRunning(false);
                  setMode('break');
                  setTimeLeft(breakMinutes * 60);
                }
              }}
              className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                mode === 'break'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-4 h-4 text-emerald-600" />
              <span>Descanso ({breakMinutes}m)</span>
            </button>
          </div>
        </div>

        {/* Mascote de Gatinho Central com Miado ao Clicar */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="relative group cursor-pointer" onClick={() => playCatMeowSound()} title="Clique para ouvir o miado do gatinho!">
            <div
              className={`w-28 h-28 rounded-full border-4 flex items-center justify-center p-1 shadow-inner transition-all transform group-hover:scale-105 overflow-hidden ${
                mode === 'focus'
                  ? 'bg-indigo-50/60 border-indigo-200'
                  : 'bg-emerald-50/60 border-emerald-200'
              }`}
            >
              <CatAvatar
                alt="Gatinho Pomodoro"
                className="w-full h-full object-contain"
                fallbackPriority={mode === 'focus' ? 'alert' : 'calm'}
                fallbackSize={80}
              />
            </div>
            {/* Patinha indicadora de estado */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-xs border border-slate-200">
              <CatPawIcon size={20} color={mode === 'focus' ? '#6366f1' : '#10b981'} />
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            {mode === 'focus' ? (
              <span className="text-indigo-600 flex items-center gap-1">
                <span>Gatinho Focado · Hora de render nos estudos!</span>
                <CatPawIcon size={13} color="#6366f1" />
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <span>Gatinho Descansando · Alongue-se e tome uma água ☕</span>
                <CatPawIcon size={13} color="#10b981" />
              </span>
            )}
          </div>
        </div>

        {/* Display Grande do Tempo */}
        <div className="space-y-2">
          <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-slate-900 tabular-nums">
            {formattedTime}
          </div>

          {/* Barra de Progresso do Ciclo com Patinhas */}
          <div className="w-full max-w-md mx-auto">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <CatPawIcon size={11} color="#94a3b8" />
                <span>0%</span>
              </span>
              <span className="font-medium text-slate-600">{progressPercent}% decorrido</span>
              <span className="flex items-center gap-1">
                <span>100%</span>
                <CatPawIcon size={11} color="#94a3b8" />
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={toggleStartPause}
            className={`px-8 py-3.5 rounded-2xl font-bold text-white text-base shadow-sm inline-flex items-center gap-2.5 transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-100'
                : mode === 'focus'
                ? 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100'
                : 'bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-100'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar Foco</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reiniciar tempo atual"
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            title="Pular para a próxima etapa"
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Sessões Concluídas Hoje */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>
            {completedSessions === 0
              ? 'Nenhum ciclo concluído ainda hoje.'
              : `${completedSessions} ciclo(s) de foco concluído(s) hoje! Parabéns! 🐾`}
          </span>
        </div>
      </div>

      {/* Painel de Configurações de Tempo */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Personalizar Tempos de Estudo</span>
              <CatPawIcon size={14} color="#f472b6" />
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Testar Miado */}
            <button
              type="button"
              onClick={() => playCatMeowSound()}
              className="px-2.5 py-1 text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Ouvir o miado do gatinho"
            >
              <CatPawIcon size={14} color="#ec4899" />
              <span>Testar Miado (Miau!)</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 text-xs inline-flex items-center gap-1 transition-colors"
              title={soundEnabled ? 'Miado ativado ao terminar' : 'Som desativado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Som ativado' : 'Sem som'}</span>
            </button>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-500">Presets Sugeridos:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset(40, 5)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                focusMinutes === 40 && breakMinutes === 5
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>40m Foco · 5m Pausa</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Padrão StudyDay</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(25, 5)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                focusMinutes === 25 && breakMinutes === 5
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>25m Foco · 5m Pausa</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pomodoro Clássico</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(50, 10)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                focusMinutes === 50 && breakMinutes === 10
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>50m Foco · 10m Pausa</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Foco Estendido</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(60, 15)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                focusMinutes === 60 && breakMinutes === 15
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>60m Foco · 15m Pausa</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sprint Universitário</div>
            </button>
          </div>
        </div>

        {/* Inputs Manuais de Minutos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Minutos de Foco (1 a 120 min)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={focusMinutes}
              onChange={(e) => {
                const val = Math.max(1, Math.min(120, Number(e.target.value) || 1));
                setFocusMinutes(val);
                if (!isRunning && mode === 'focus') setTimeLeft(val * 60);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Minutos de Descanso (1 a 60 min)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={breakMinutes}
              onChange={(e) => {
                const val = Math.max(1, Math.min(60, Number(e.target.value) || 1));
                setBreakMinutes(val);
                if (!isRunning && mode === 'break') setTimeLeft(val * 60);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
