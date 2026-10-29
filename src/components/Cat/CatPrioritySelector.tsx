import React from 'react';
import { TaskPriority, PRIORITY_CONFIG } from '../../types';
import { CatIcon, CatPawIcon } from './CatIcon';

interface CatPrioritySelectorProps {
  value?: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  size?: 'sm' | 'md';
}

export const CatPrioritySelector: React.FC<CatPrioritySelectorProps> = ({
  value = 'calm',
  onChange,
  size = 'md',
}) => {
  const priorities: TaskPriority[] = ['urgent', 'alert', 'calm', 'done'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <CatPawIcon size={12} color="#ec4899" />
          <span>Prioridade (Cor do Gatinho)</span>
        </span>
        {value && (
          <span className="font-semibold text-slate-700">
            {PRIORITY_CONFIG[value].description}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {priorities.map((key) => {
          const config = PRIORITY_CONFIG[key];
          const isSelected = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                isSelected
                  ? `${config.badgeBg} ${config.badgeBorder} ring-2 ring-indigo-400/50 shadow-xs font-semibold`
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CatIcon priority={key} size={size === 'sm' ? 26 : 30} showBadgeDot={false} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className={`text-xs ${isSelected ? config.textColor : 'text-slate-800'}`}>
                  {config.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {key === 'urgent' && 'Gatinho Vermelho'}
                  {key === 'alert' && 'Gatinho Amarelo/Laranja'}
                  {key === 'calm' && 'Gatinho Azul'}
                  {key === 'done' && 'Gatinho Verde'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
