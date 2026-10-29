import React from 'react';
import { TaskPriority, PRIORITY_CONFIG } from '../../types';
import { CatIcon } from './CatIcon';

interface CatPriorityBadgeProps {
  priority?: TaskPriority;
  size?: 'xs' | 'sm';
  onClick?: () => void;
}

export const CatPriorityBadge: React.FC<CatPriorityBadgeProps> = ({
  priority = 'calm',
  size = 'sm',
  onClick,
}) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.calm;

  const content = (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-2xs ${config.badgeBg} ${config.badgeBorder} ${config.textColor} ${
        size === 'xs' ? 'text-[10px]' : 'text-xs'
      } font-semibold transition-colors select-none`}
      title={config.description}
    >
      <CatIcon priority={priority} size={size === 'xs' ? 16 : 19} showBadgeDot={false} />
      <span>{config.label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="cursor-pointer hover:opacity-85 focus:outline-none"
      >
        {content}
      </button>
    );
  }

  return content;
};
