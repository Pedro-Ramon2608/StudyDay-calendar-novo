import React, { useEffect, useState } from 'react';
import { CatPawIcon } from './CatIcon';

export interface PawParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

import { playCuteSuccessSound } from '../../utils/audioUtils';

interface CatPawEffectProps {
  triggerCount: number;
  lastCompletedTaskTitle?: string;
}

export const CatPawEffect: React.FC<CatPawEffectProps> = ({
  triggerCount,
  lastCompletedTaskTitle,
}) => {
  const [particles, setParticles] = useState<PawParticle[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (triggerCount <= 0) return;

    playCuteSuccessSound();
    setShowToast(true);

    // Cria um cluster de 4 a 6 patinhas subindo suavemente
    const colors = ['#f472b6', '#fb7185', '#a78bfa', '#34d399', '#f59e0b'];
    const newParticles: PawParticle[] = Array.from({ length: 6 }, (_, i) => ({
      id: `paw-${Date.now()}-${i}-${Math.random()}`,
      x: 35 + Math.random() * 30, // Centro da tela
      y: 60 + Math.random() * 20,
      size: 24 + Math.random() * 20,
      rotation: -30 + Math.random() * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    const timerToast = setTimeout(() => {
      setShowToast(false);
    }, 2500);

    const timerClear = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1800);

    return () => {
      clearTimeout(timerToast);
      clearTimeout(timerClear);
    };
  }, [triggerCount]);

  if (particles.length === 0 && !showToast) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Patinhas Flutuantes com Animação CSS */}
      {particles.map((p, index) => (
        <div
          key={p.id}
          className="absolute animate-paw-float transition-all"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${index * 100}ms`,
          }}
        >
          <CatPawIcon size={p.size} color={p.color} />
        </div>
      ))}

      {/* Mini Toast Fofo de Conclusão com a Patinha */}
      {showToast && (
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm border border-pink-200 shadow-lg rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <CatPawIcon size={22} color="#ec4899" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span>Patinha de Aprovação! 🐾</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-[200px] truncate">
              {lastCompletedTaskTitle ? `"${lastCompletedTaskTitle}" concluída!` : 'Mais uma tarefa finalizada com sucesso!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
