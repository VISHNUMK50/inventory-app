import React from 'react';
import Image from 'next/image';

interface LoadingIconProps {
  size?: number;
  stroke?: number;
  color?: string;
}

const LoadingIcon: React.FC<LoadingIconProps> = ({
  size = 24,
  stroke = 2,
  color = 'currentColor'
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Favicon */}
      <div className="absolute">
        <Image 
          src="/favicon.ico" 
          alt="Loading" 
          width={size * 0.7} 
          height={size * 0.7} 
          className="object-contain"
        />
      </div>
      
      {/* Spinning ring */}
      <svg 
        className="animate-spin" 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={(size/2) - (stroke/2)} 
          stroke={color} 
          strokeWidth={stroke} 
          strokeLinecap="round" 
          strokeDasharray={size * 2} 
          strokeDashoffset={size * 0.75} 
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

export default LoadingIcon;