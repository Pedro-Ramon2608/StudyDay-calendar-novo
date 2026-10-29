import React, { useState } from 'react';
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
  // Caminhos possíveis para carregar a foto do mascote da pasta pública
  const candidates = [
    src,
    '/assets/cat-mascot.jpeg',
    '/assets/cat-mascot.jpg',
    '/cat-mascot.jpeg',
    '/cat-mascot.jpg',
  ].filter(Boolean) as string[];

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      // Se nenhuma imagem externa foi encontrada no servidor, exibe o mascote vetorial
      setHasError(true);
    }
  };

  if (hasError || candidates.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-indigo-50/50">
        <CatIcon priority={fallbackPriority} size={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIndex]}
      alt={alt}
      className={className}
      onError={handleError}
      loading="eager"
    />
  );
};

export const catMascotImg = '/assets/cat-mascot.jpeg';
export default CatAvatar;