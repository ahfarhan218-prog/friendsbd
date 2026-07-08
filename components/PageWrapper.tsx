import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  maxWidth?: '7xl' | '5xl' | 'full' | 'none';
  gutters?: boolean;
  noPadding?: boolean;
}

export const PageWrapper: React.FC<Props> = ({
  children,
  className = '',
  maxWidth = '7xl',
  gutters = true,
  noPadding = false,
}) => {
  const maxWClass = maxWidth === 'none' ? '' : `max-w-${maxWidth} mx-auto`;
  const padClass = gutters ? 'px-4 sm:px-6' : '';
  const pbClass = noPadding ? '' : 'pb-28';

  return (
    <div className={`w-full ${maxWClass} ${padClass} ${pbClass} ${className}`}>
      {children}
    </div>
  );
};
