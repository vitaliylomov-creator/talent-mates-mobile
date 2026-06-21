// Talent Mates MATE AI — Inside Shell design tokens.
// Source of truth: talent-mates-design-system skill, Section 4.
// Inside Shell rule: saturated brand purple as the ground, glass-morphic cards,
// no film grain (Hard Rule #2 in sprint brief — grain belongs to brand storytelling, not product).

export const theme = {
  colors: {
    purple:     '#794DC6',
    purpleDk:   '#6b42b5',
    purpleLt:   '#9d6ee8',
    purpleDeep: '#3d2566',
    ink:        '#1a0f2e',

    glass:       'rgba(255,255,255,0.05)',
    glassHover:  'rgba(255,255,255,0.08)',
    glassActive: 'rgba(255,255,255,0.12)',

    white: '#ffffff',
    t1: '#ffffff',
    t2: 'rgba(255,255,255,0.82)',
    t3: 'rgba(255,255,255,0.55)',
    t4: 'rgba(255,255,255,0.35)',

    border:       'rgba(255,255,255,0.10)',
    borderMid:    'rgba(255,255,255,0.20)',
    borderStrong: 'rgba(255,255,255,0.35)',

    accentGreen: '#6dffb3',
    danger:      '#ff5d6c',
    warning:     '#ffb84d',
  },
  fonts: {
    display:       'DMSerifDisplay-Regular',
    displayItalic: 'DMSerifDisplay-Italic',
    bodyLight:     'DMSans-Light',
    body:          'DMSans-Regular',
    bodyMedium:    'DMSans-Medium',
  },
  radii: { sm: 8, md: 14, lg: 24, pill: 100 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
