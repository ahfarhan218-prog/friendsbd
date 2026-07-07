import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

const FriendsBDLogo: React.FC<Props> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="fbg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
      <filter id="fbshadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#fbg)" filter="url(#fbshadow)" />
    <rect x="10" y="10" width="80" height="80" rx="18" fill="#1C1C2E" />
    <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" fill="url(#fbg)" fontSize="36" fontWeight="900" fontFamily="system-ui" letterSpacing="-1">F</text>
    <text x="50" y="72" textAnchor="middle" dominantBaseline="middle" fill="url(#fbg2)" fontSize="11" fontWeight="800" fontFamily="system-ui" letterSpacing="1.5">FRIENDS</text>
    <rect x="28" y="77" width="44" height="2" rx="1" fill="url(#fbg)" opacity="0.4" />
  </svg>
);

export default FriendsBDLogo;
