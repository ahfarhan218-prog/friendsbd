import React, { createContext, useContext } from 'react';

// Hexadecimal bounds for light mode theme
export const LIGHT_THEME_TOKENS = {
  GLOBAL_BACKGROUND: '#f8fafc',
  SURFACE_CARDS: '#ffffff',
  MUTED_BORDER: '#cbd5e1',
  TEXT_PRIMARY: '#000000',
  TEXT_MUTED: '#64748b',
  PRIMARY_ACTION: '#6d28d9',
  ACCENT_SUCCESS: '#0f766e',
  ACCENT_DANGER: '#dc2626',
  ACCENT_WARNING: '#b45309',
  BRAND_NAVY: '#1e293b'
};

// Component level utility class mappings
export const LIGHT_THEME_CLASSES = {
  // A. Bidirectional Reward Ledger Capsule Tags
  ledgerTags: {
    add: 'text-[#0f766e] bg-[#0f766e]/10 border border-[#0f766e]/20 font-bold px-2.5 py-1 rounded-full text-sm inline-flex flex-wrap items-center gap-1',
    minus: 'text-[#dc2626] bg-[#dc2626]/10 border border-[#dc2626]/20 font-bold px-2.5 py-1 rounded-full text-sm inline-flex flex-wrap items-center gap-1',
    pending: 'text-[#b45309] bg-[#b45309]/10 border border-[#b45309]/20 font-bold px-2.5 py-1 rounded-full text-sm inline-flex flex-wrap items-center gap-1'
  },
  
  // B. User Tiers & Username styles
  userTiers: {
    admin: 'text-[#6d28d9] font-bold inline-flex flex-wrap items-center gap-1',
    seniorStaff: 'text-[#6d28d9] font-bold inline-flex flex-wrap items-center gap-1',
    premium: 'text-[#0f766e] font-semibold inline-flex flex-wrap items-center gap-1',
    trusted: 'text-[#0f766e] font-semibold inline-flex flex-wrap items-center gap-1',
    elite: 'text-[#0f766e] font-semibold inline-flex flex-wrap items-center gap-1',
    basic: 'text-[#000000] font-normal inline-flex flex-wrap items-center gap-1'
  },
  
  // C. Smilies Grid Mappings
  smilieCard: 'bg-[#ffffff] border border-[#cbd5e1] rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:shadow-sm transition-shadow',
  smilieShortcut: 'font-mono text-sm text-[#0f766e] bg-[#0f766e]/10 px-1.5 py-0.5 rounded border border-[#0f766e]/20',
  
  // D. Forum Architecture Mappings
  forumLayout: {
    pinnedTopic: 'bg-[#ffffff] border-l-4 border-[#6d28d9] shadow-sm rounded-r-xl p-4 transition-all hover:bg-slate-50/50',
    liveTopic: 'bg-[#ffffff] border-l-4 border-[#0f766e] shadow-sm rounded-r-xl p-4 transition-all hover:bg-slate-50/50',
    normalTopic: 'bg-[#ffffff] border border-[#cbd5e1] shadow-sm rounded-xl p-4 transition-all hover:bg-slate-50/50',
    warningBanner: 'bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 font-semibold text-sm flex flex-wrap items-center gap-2'
  }
};

const ThemeContext = createContext({
  tokens: LIGHT_THEME_TOKENS,
  classes: LIGHT_THEME_CLASSES
});

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ tokens: LIGHT_THEME_TOKENS, classes: LIGHT_THEME_CLASSES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
