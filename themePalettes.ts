import { ThemePalette } from '../types';

export interface PaletteConfig {
  id: ThemePalette;
  name: string;
  tagline: string;
  isLight: boolean;
  colors: {
    bg: string;
    bgSubtle: string;
    surface: string;
    surfaceHover: string;
    surfaceActive: string;
    border: string;
    borderHighlight: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    primarySubtle: string;
    accent: string;
    glow: string;
    userBubble: string;
    assistantBubble: string;
    ring: string;
  };
}

export const PALETTES: Record<ThemePalette, PaletteConfig> = {
  'cyber-cyan': {
    id: 'cyber-cyan',
    name: 'Cyber Cyan & Electric Blue',
    tagline: 'High-contrast futuristic HUD aesthetics with razor-sharp readability',
    isLight: false,
    colors: {
      bg: '#040711',
      bgSubtle: '#080E1E',
      surface: '#0B1326',
      surfaceHover: '#101B35',
      surfaceActive: '#152347',
      border: 'rgba(56, 189, 248, 0.16)',
      borderHighlight: 'rgba(56, 189, 248, 0.45)',
      text: '#F0F6FC',
      textMuted: '#94A3B8',
      primary: '#00D2FF',
      primaryHover: '#38BDF8',
      primarySubtle: 'rgba(0, 210, 255, 0.12)',
      accent: '#34D399',
      glow: 'rgba(0, 210, 255, 0.35)',
      userBubble: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(14, 165, 233, 0.85) 100%)',
      assistantBubble: '#0B1326',
      ring: 'linear-gradient(135deg, #00D2FF, #3B82F6, #10B981)',
    },
  },
  'matrix-emerald': {
    id: 'matrix-emerald',
    name: 'Matrix Emerald & Mint',
    tagline: 'Deep obsidian backdrop with striking vibrant mint & emerald contrast',
    isLight: false,
    colors: {
      bg: '#020B07',
      bgSubtle: '#06160F',
      surface: '#092116',
      surfaceHover: '#0E2E20',
      surfaceActive: '#133D2B',
      border: 'rgba(16, 185, 129, 0.20)',
      borderHighlight: 'rgba(52, 211, 153, 0.50)',
      text: '#ECFDF5',
      textMuted: '#6EE7B7',
      primary: '#10B981',
      primaryHover: '#34D399',
      primarySubtle: 'rgba(16, 185, 129, 0.15)',
      accent: '#06B6D4',
      glow: 'rgba(16, 185, 129, 0.35)',
      userBubble: 'linear-gradient(135deg, rgba(5, 150, 105, 0.9) 0%, rgba(13, 148, 136, 0.9) 100%)',
      assistantBubble: '#092116',
      ring: 'linear-gradient(135deg, #10B981, #06B6D4, #34D399)',
    },
  },
  'aurora-violet': {
    id: 'aurora-violet',
    name: 'Aurora Violet & Indigo',
    tagline: 'Deep space cosmic aesthetic with vivid amethyst & cobalt illumination',
    isLight: false,
    colors: {
      bg: '#070512',
      bgSubtle: '#0E0B22',
      surface: '#141033',
      surfaceHover: '#1B1645',
      surfaceActive: '#231D58',
      border: 'rgba(168, 85, 247, 0.20)',
      borderHighlight: 'rgba(192, 132, 252, 0.50)',
      text: '#FAF5FF',
      textMuted: '#C084FC',
      primary: '#A855F7',
      primaryHover: '#C084FC',
      primarySubtle: 'rgba(168, 85, 247, 0.15)',
      accent: '#EC4899',
      glow: 'rgba(168, 85, 247, 0.35)',
      userBubble: 'linear-gradient(135deg, rgba(126, 34, 206, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
      assistantBubble: '#141033',
      ring: 'linear-gradient(135deg, #A855F7, #EC4899, #6366F1)',
    },
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Amber & Gold',
    tagline: 'Warm titanium dark theme with rich golden amber glow and crisp text',
    isLight: false,
    colors: {
      bg: '#0C0A05',
      bgSubtle: '#171309',
      surface: '#221C0E',
      surfaceHover: '#2E2613',
      surfaceActive: '#3C3119',
      border: 'rgba(245, 158, 11, 0.22)',
      borderHighlight: 'rgba(251, 191, 36, 0.55)',
      text: '#FFFBEB',
      textMuted: '#FCD34D',
      primary: '#F59E0B',
      primaryHover: '#FBBF24',
      primarySubtle: 'rgba(245, 158, 11, 0.15)',
      accent: '#F97316',
      glow: 'rgba(245, 158, 11, 0.35)',
      userBubble: 'linear-gradient(135deg, rgba(217, 119, 6, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
      assistantBubble: '#221C0E',
      ring: 'linear-gradient(135deg, #F59E0B, #EF4444, #FBBF24)',
    },
  },
  'lunar-light': {
    id: 'lunar-light',
    name: 'Lunar Crystal Light',
    tagline: 'Ultra-crisp high-contrast daylight theme with deep indigo text and clear accents',
    isLight: true,
    colors: {
      bg: '#F8FAFC',
      bgSubtle: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceHover: '#F1F5F9',
      surfaceActive: '#E2E8F0',
      border: 'rgba(15, 23, 42, 0.12)',
      borderHighlight: 'rgba(2, 132, 199, 0.40)',
      text: '#0F172A',
      textMuted: '#475569',
      primary: '#0284C7',
      primaryHover: '#0369A1',
      primarySubtle: 'rgba(2, 132, 199, 0.10)',
      accent: '#059669',
      glow: 'rgba(2, 132, 199, 0.20)',
      userBubble: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
      assistantBubble: '#FFFFFF',
      ring: 'linear-gradient(135deg, #0284C7, #2563EB, #10B981)',
    },
  },
};

export function getPalette(id: ThemePalette): PaletteConfig {
  return PALETTES[id] || PALETTES['cyber-cyan'];
}
