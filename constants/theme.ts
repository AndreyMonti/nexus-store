export const Colors = {
  light: {
    // Green palette - primary
    primary: '#7CB342',
    primaryDark: '#5D9B2F',
    primaryLight: '#9CCC65',
    
    // Backgrounds
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9E9E9E',
    
    // Accents
    accent: '#7CB342',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    
    // Borders
    border: '#E0E0E0',
    divider: '#EEEEEE',
    
    // Interactive
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
  },
  dark: {
    // Green palette - primary
    primary: '#9CCC65',
    primaryDark: '#7CB342',
    primaryLight: '#AED581',
    
    // Backgrounds
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    
    // Text
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textLight: '#808080',
    
    // Accents
    accent: '#9CCC65',
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',
    
    // Borders
    border: '#3A3A3A',
    divider: '#2C2C2C',
    
    // Interactive
    disabled: '#4A4A4A',
    placeholder: '#6A6A6A',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
