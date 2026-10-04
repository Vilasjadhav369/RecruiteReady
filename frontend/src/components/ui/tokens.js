/**
 * RecruitReady Design Tokens
 * Direction: Apple + Linear + Premium University
 * Pure semantic tokens — consistent across Student and Admin surfaces.
 */

export const COLORS = {
  // Brand & Accents
  brandGreen: '#166534',
  brandGreenDark: '#14532D',
  brandGreenFresh: '#22C55E',
  brandMint: '#DCFCE7',
  brandMintSoft: '#F0FDF4',
  
  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Content & Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  
  // Structural
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',
  borderHover: '#CBD5E1',
  
  // Feedback & Semantic Status
  success: '#16A34A',
  successLight: '#F0FDF4',
  successBorder: '#BBF7D0',
  
  warning: '#D97706',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',
  
  info: '#2563EB',
  infoLight: '#EFF6FF',
  infoBorder: '#BFDBFE',

  // Backward Compatibility Aliases
  navy: '#0F172A',
  blue: '#166534',
  blueDark: '#14532D',
  blueLight: '#F0FDF4',
};

export const TYPOGRAPHY = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  display: 'text-3xl sm:text-4xl font-bold tracking-tight',
  h1: 'text-2xl sm:text-3xl font-bold tracking-tight',
  h2: 'text-xl sm:text-2xl font-semibold tracking-tight',
  h3: 'text-base sm:text-lg font-semibold',
  h4: 'text-sm sm:text-base font-semibold',
  body: 'text-sm sm:text-base font-normal leading-relaxed',
  bodySmall: 'text-xs sm:text-sm font-normal leading-normal',
  caption: 'text-xs font-medium text-slate-500',
  monospace: 'font-mono text-xs sm:text-sm',
  overline: 'text-[11px] font-semibold tracking-wider uppercase text-slate-500',
};

export const RADIUS = {
  control: 'rounded-md',     // 6px - 8px
  input: 'rounded-lg',       // 8px
  card: 'rounded-xl',        // 12px
  surface: 'rounded-2xl',    // 16px
  badge: 'rounded-full',     // Pill only for status/badges
};

export const SHADOWS = {
  sm: 'shadow-xs',
  card: 'shadow-sm',
  modal: 'shadow-xl',
};

export default {
  COLORS,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
};
