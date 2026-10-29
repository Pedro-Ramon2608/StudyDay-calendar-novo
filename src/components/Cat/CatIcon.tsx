import React from 'react';
import { TaskPriority, PRIORITY_CONFIG } from '../../types';

interface CatThemePalette {
  body: string;
  patch: string;
  stripes: string;
  muzzleBelly: string;
  earsInner: string;
  cheeks: string;
  outline: string;
  tail: string;
}

const CAT_PALETTES: Record<TaskPriority | 'default', CatThemePalette> = {
  // GATINHO VERMELHO (URGENTE)
  urgent: {
    body: '#ef4444', // Vermelho vibrante
    patch: '#b91c1c', // Vermelho escuro
    stripes: '#991b1b',
    muzzleBelly: '#fee2e2', // Focinho e barriga claros para alto contraste
    earsInner: '#fecdd3',
    cheeks: '#f87171',
    outline: '#450a0a',
    tail: '#ef4444',
  },
  // GATINHO AMARELO / LARANJA (ALERTA)
  alert: {
    body: '#f59e0b', // Amarelo dourado / Laranja
    patch: '#d97706', // Âmbar queimado
    stripes: '#b45309',
    muzzleBelly: '#fef3c7',
    earsInner: '#fed7aa',
    cheeks: '#fb923c',
    outline: '#451a03',
    tail: '#f59e0b',
  },
  // GATINHO AZUL (TRANQUILO)
  calm: {
    body: '#3b82f6', // Azul fofo
    patch: '#1d4ed8', // Azul royal
    stripes: '#1e40af',
    muzzleBelly: '#dbeafe',
    earsInner: '#bfdbfe',
    cheeks: '#60a5fa',
    outline: '#0f172a',
    tail: '#3b82f6',
  },
  // GATINHO VERDE (CONCLUÍDO)
  done: {
    body: '#10b981', // Verde esmeralda vivo
    patch: '#047857', // Verde escuro
    stripes: '#065f46',
    muzzleBelly: '#d1fae5',
    earsInner: '#a7f3d0',
    cheeks: '#34d399',
    outline: '#022c22',
    tail: '#10b981',
  },
  // PADRÃO (Calico clássico)
  default: {
    body: '#ffffff',
    patch: '#baa38a',
    stripes: '#967d64',
    muzzleBelly: '#ffffff',
    earsInner: '#fbcfe8',
    cheeks: '#fca5a5',
    outline: '#262626',
    tail: '#d1baa0',
  },
};

interface CatIconProps {
  priority?: TaskPriority;
  size?: number | string;
  className?: string;
  showBadgeDot?: boolean;
}

export const CatIcon: React.FC<CatIconProps> = ({
  priority,
  size = 28,
  className = '',
  showBadgeDot = true,
}) => {
  const config = priority ? PRIORITY_CONFIG[priority] : null;
  const palette = priority ? CAT_PALETTES[priority] : CAT_PALETTES.default;
  const accentColor = config ? config.catColor : '#6366f1';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={config ? config.description : 'Gatinho StudyDay'}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Cauda colorida do gatinho */}
        <path
          d="M72 70 C85 68, 92 78, 88 88 C85 94, 76 92, 70 84 Z"
          fill={palette.tail}
          stroke={palette.outline}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Corpo e Cabeça Inteiros na Cor do Gatinho */}
        <path
          d="M26 40 
             C20 30, 22 18, 32 18 
             C36 18, 42 22, 45 25 
             C55 25, 64 22, 68 18 
             C78 18, 80 30, 74 40 
             C84 50, 84 72, 75 84 
             C66 94, 34 94, 25 84 
             C16 72, 16 50, 26 40 Z"
          fill={palette.body}
          stroke={palette.outline}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interior das orelhas */}
        <path
          d="M27 34 C25 26, 26 22, 32 23 C35 23, 38 27, 39 31 Z"
          fill={palette.earsInner}
        />
        <path
          d="M73 34 C75 26, 74 22, 68 23 C65 23, 62 27, 61 31 Z"
          fill={palette.earsInner}
        />

        {/* Mancha estilizada na cabeça */}
        <path
          d="M36 21 
             C42 27, 58 27, 64 21 
             C58 35, 42 35, 36 21 Z"
          fill={palette.patch}
        />
        {/* Listras na testa */}
        <path d="M46 22 L46 31" stroke={palette.stripes} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M54 22 L54 31" stroke={palette.stripes} strokeWidth="2.5" strokeLinecap="round" />

        {/* Área Clara do Focinho e Bochechas (destaca os olhinhos e boquinha em 'w') */}
        <path
          d="M32 50 
             C32 44, 40 43, 50 43 
             C60 43, 68 44, 68 50 
             C68 62, 58 64, 50 64 
             C42 64, 32 62, 32 50 Z"
          fill={palette.muzzleBelly}
          opacity="0.95"
        />

        {/* Mancha da Barriguinha Clara */}
        <ellipse cx="50" cy="74" rx="14" ry="10" fill={palette.muzzleBelly} opacity="0.9" />

        {/* Olhinhos pretos grandes e brilhantes */}
        <ellipse cx="36" cy="50" rx="4.5" ry="5.5" fill="#1e1e1e" />
        <circle cx="35" cy="48" r="1.5" fill="#ffffff" />

        <ellipse cx="64" cy="50" rx="4.5" ry="5.5" fill="#1e1e1e" />
        <circle cx="63" cy="48" r="1.5" fill="#ffffff" />

        {/* Bochechinhas coradas */}
        <ellipse cx="28" cy="54" rx="4" ry="2.5" fill={palette.cheeks} opacity="0.9" />
        <ellipse cx="72" cy="54" rx="4" ry="2.5" fill={palette.cheeks} opacity="0.9" />

        {/* Boquinha em 'w' */}
        <path
          d="M45 52 Q50 55, 50 53 Q50 55, 55 52"
          fill="none"
          stroke="#1e1e1e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bigodes fofos */}
        <line x1="14" y1="48" x2="24" y2="50" stroke={palette.outline} strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="56" x2="24" y2="54" stroke={palette.outline} strokeWidth="3" strokeLinecap="round" />

        <line x1="86" y1="48" x2="76" y2="50" stroke={palette.outline} strokeWidth="3" strokeLinecap="round" />
        <line x1="86" y1="56" x2="76" y2="54" stroke={palette.outline} strokeWidth="3" strokeLinecap="round" />

        {/* Patinhas dianteiras */}
        <path
          d="M40 82 C40 76, 44 76, 45 82"
          fill="none"
          stroke={palette.outline}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M45 82 C45 76, 50 76, 50 82"
          fill="none"
          stroke={palette.outline}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M50 82 C50 76, 55 76, 55 82"
          fill="none"
          stroke={palette.outline}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M55 82 C55 76, 60 76, 60 82"
          fill="none"
          stroke={palette.outline}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Indicador de prioridade adicional com glow */}
      {showBadgeDot && priority && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </div>
  );
};

export const CatPawIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 20,
  className = '',
  color = '#f472b6',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Almofadinha principal da pata */}
      <path
        d="M16 14 C11 14, 8 19, 10 24 C11.5 27, 14 27.5, 16 26.5 C18 27.5, 20.5 27, 22 24 C24 19, 21 14, 16 14 Z"
        fill={color}
      />
      {/* 4 Dedinhos da patinha */}
      <circle cx="8" cy="11" r="3" fill={color} />
      <circle cx="13" cy="8" r="3.2" fill={color} />
      <circle cx="19" cy="8" r="3.2" fill={color} />
      <circle cx="24" cy="11" r="3" fill={color} />
    </svg>
  );
};
