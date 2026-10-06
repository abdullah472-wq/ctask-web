import Image from 'next/image';
import React from 'react';

interface LogoLoaderProps {
  fullScreen?: boolean;
}

export function LogoLoader({ fullScreen = false }: LogoLoaderProps) {
  const imageSize = fullScreen ? 80 : 40; // w-20/h-20 vs w-10/h-10
  const imageClass = fullScreen ? 'w-20 h-20' : 'w-10 h-10';

  const content = (
    <div style={{ perspective: '1000px' }}>
      <Image 
        src="/icon.png" 
        alt="Loading..." 
        width={imageSize} 
        height={imageSize} 
        className={`${imageClass} animate-spin-y object-contain`}
        priority
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {content}
    </div>
  );
}
