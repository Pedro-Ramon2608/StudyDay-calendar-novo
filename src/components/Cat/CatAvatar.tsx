import React, { useState } from 'react';
import catMascotImg from '../../assets/cat-mascot.jpeg';
import { CatIcon } from './CatIcon';

interface CatAvatarProps {
  className?: string;
  alt?: string;
  fallbackPriority?: 'urgent' | 'alert' | 'calm' | 'done';
  fallbackSize?: number;
}

export const CatAvatar: React.FC<CatAvatarProps> = ({
  className = 'w-full h-full object-cover',
  alt = 'Gatinho StudyDay',
  fallbackPriority = 'calm',
  fallbackSize = 40,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CatIcon priority={fallbackPriority} size={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      src={catMascotImg}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="eager"
    />
  );
};

export { catMascotImg };
