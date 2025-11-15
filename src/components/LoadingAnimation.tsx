import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

interface LoadingAnimationProps {
  width?: number;
  height?: number;
  className?: string;
}

export function LoadingAnimation({ width = 40, height = 40, className = '' }: LoadingAnimationProps) {
  return (
    <div style={{ width, height }} className={className}>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width, height, background: 'transparent' }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
          clearCanvas: true,
        }}
      />
    </div>
  );
}
