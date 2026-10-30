import React, { useState } from 'react';
import { CatIcon } from './CatIcon';
import { TaskPriority } from '../../types';

// Mascote oficial StudyDay (O gatinho da imagem de referência: public/assets/cat-mascot.jpeg)
export const DEFAULT_CAT_MASCOT_URL = '/assets/cat-mascot.jpeg';
export const catMascotImg = DEFAULT_CAT_MASCOT_URL;
export const CAT_MASCOT_BASE64 = catMascotImg;

interface CatAvatarProps {
  className?: string;
  alt?: string;
  src?: string;
  fallbackPriority?: TaskPriority;
  fallbackSize?: number;
  showBadgeDot?: boolean;
}

export const CatAvatar: React.FC<CatAvatarProps> = ({
  className = 'w-full h-full object-contain',
  alt = 'Gatinho StudyDay',
  src = DEFAULT_CAT_MASCOT_URL,
  fallbackPriority = 'calm',
  fallbackSize = 32,
  showBadgeDot = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const finalSrc = src || DEFAULT_CAT_MASCOT_URL;

  // Fallback caso a imagem não possa ser carregada por erro de rede
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center select-none">
        <CatIcon priority={fallbackPriority} size={fallbackSize} showBadgeDot={showBadgeDot} />
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="eager"
      decoding="async"
    />
  );
};

export default CatAvatar;
