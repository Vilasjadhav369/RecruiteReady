/**
 * RecruitReady Design Tokens
 * Direction: Apple + Linear + Premium University
 * Pure semantic tokens — consistent across Student and Admin surfaces.
 */

export const COLORS = {
  // Brand & Accents
  navy: '#0F172A',
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#EFF6FF',
  
  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Content & Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  
  // Structural
  border: '#E2E8F0',
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
};

export const TYPOGRAPHY = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  display: 'text-3xl sm:text-4xl font-bold tracking-tight',
  h1: 'text-2xl sm:text-3xl font-bold tracking-tight',
  h2: 'text-xl sm:text-2xl font-semibold tracking-tight',
  h3: 'text-lg sm:text-xl font-semibold',
  h4: 'text-base font-semibold',
  body: 'text-sm sm:text-base font-normal leading-relaxed',
  bodySmall: 'text-xs sm:text-sm font-normal leading-normal',
  caption: 'text-xs font-medium text-slate-500',
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
