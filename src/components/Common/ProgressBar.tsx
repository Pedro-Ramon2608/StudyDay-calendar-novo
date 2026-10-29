import React from 'react';

interface ProgressBarProps {
  total: number;
  completed: number;
  label?: string;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  total,
  completed,
  label,
  size = 'md',
}) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = total > 0 && completed === total;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1.5 text-slate-500">
        <span className="font-medium text-slate-700">
          {label || (total === 0 ? 'Nenhuma tarefa' : `${completed} de ${total} tarefas concluídas`)}
        </span>
        <span className="font-mono tabular-nums font-semibold text-slate-800">
          {percentage}%
        </span>
      </div>
      <div
        className={`w-full bg-slate-100 rounded-full overflow-hidden ${
          size === 'sm' ? 'h-1.5' : 'h-2'
        }`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${
            isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
