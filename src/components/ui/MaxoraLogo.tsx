import React from 'react';
import { cn } from '@/lib/utils';
import maxoraLogoImg from '@/assets/maxora-logo.png';

interface MaxoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const MaxoraLogo: React.FC<MaxoraLogoProps> = ({ 
  className, 
  size = 'md',
  showSubtitle = true 
}) => {
  const sizeClasses = {
    sm: {
      img: 'h-6',
      subtitle: 'text-[5px] tracking-[0.3em] mt-0.5',
      line: 'w-4 h-[1px] mt-0.5'
    },
    md: {
      img: 'h-8',
      subtitle: 'text-[7px] tracking-[0.35em] mt-1',
      line: 'w-6 h-[1.5px] mt-1'
    },
    lg: {
      img: 'h-16',
      subtitle: 'text-xs tracking-[0.4em] mt-2',
      line: 'w-12 h-[2px] mt-1.5'
    },
    xl: {
      img: 'h-24',
      subtitle: 'text-base tracking-[0.45em] mt-3',
      line: 'w-16 h-[3px] mt-2'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center justify-center select-none", className)}>
      {/* The original 3D rendered MAXORA image provided by the user */}
      <img 
        src={maxoraLogoImg} 
        alt="MAXORA" 
        className={cn("object-contain drop-shadow-md", currentSize.img)} 
      />
      
      {showSubtitle && (
        <div className="flex flex-col items-center">
          {/* Subtitle styled to match the original "EVERYTHING. CONNECTED." gold 3D text */}
          <div 
            className={cn("font-bold uppercase text-center whitespace-nowrap", currentSize.subtitle)}
            style={{
              fontFamily: '"Montserrat", "Bank Gothic", "Arial", sans-serif',
              background: 'linear-gradient(to bottom, #FCE16B 0%, #E6BA35 40%, #B8860B 60%, #8B6508 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.8), -0.5px -0.5px 0px rgba(255,255,255,0.3)',
              letterSpacing: '0.45em',
              marginLeft: '0.45em' // offset for the tracking on the last letter to keep it centered
            }}
          >
            ALL IN ONE BUSINESS SOLUTIONS
          </div>
          
          {/* The small gold line underneath the subtitle */}
          <div 
            className={currentSize.line}
            style={{
              background: 'linear-gradient(to right, #B8860B, #FCE16B, #B8860B)',
              boxShadow: '0.5px 0.5px 1px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
};
