import React, { useState } from 'react';
import { CAT_MASCOT_BASE64 } from './catMascotData';
import { CatIcon } from './CatIcon';

interface CatAvatarProps {
  className?: string;
  alt?: string;
  src?: string;
  fallbackPriority?: 'urgent' | 'alert' | 'calm' | 'done';
  fallbackSize?: number;
}

export const CatAvatar: React.FC<CatAvatarProps> = ({
  className = 'w-full h-full object-cover',
  alt = 'Gatinho StudyDay',
  src,
  fallbackPriority = 'calm',
  fallbackSize = 40,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || CAT_MASCOT_BASE64);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Se um src alternativo falhar, recorre ao Base64 embutido
    if (imgSrc !== CAT_MASCOT_BASE64) {
      setImgSrc(CAT_MASCOT_BASE64);
    } else {
      // Se até o Base64 falhar por qualquer motivo, mostra o ícone vetorial SVG
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CatIcon priority={fallbackPriority} size={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="eager"
    />
  );
};

export const catMascotImg = CAT_MASCOT_BASE64;
export default CatAvatar;
