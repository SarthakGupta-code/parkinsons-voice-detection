/**
 * App Constants
 * Centralized constants and configuration
 */

export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2E7D32',
  accent: '#81C784',
  warning: '#FFA726',
  error: '#E57373',
  success: '#66BB6A',
  background: '#FAFAFA',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
  },
};

export const RECORDING_TYPES = {
  SUSTAINED_VOWEL: 'sustained_vowel',
  RAPID_SYLLABLE: 'rapid_syllable',
  READING_PASSAGE: 'reading_passage',
  SPONTANEOUS_SPEECH: 'spontaneous_speech',
} as const;

export const RECORDING_DURATIONS = {
  [RECORDING_TYPES.SUSTAINED_VOWEL]: 10,
  [RECORDING_TYPES.RAPID_SYLLABLE]: 10,
  [RECORDING_TYPES.READING_PASSAGE]: 30,
  [RECORDING_TYPES.SPONTANEOUS_SPEECH]: 20,
};

export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, color: COLORS.success, label: 'Low Risk' },
  MODERATE: { min: 31, max: 60, color: COLORS.warning, label: 'Moderate Risk' },
  HIGH: { min: 61, max: 100, color: COLORS.error, label: 'High Risk' },
};

export const USER_ROLES = {
  PATIENT: 'patient',
  HEALTHCARE_WORKER: 'healthcare_worker',
  SPECIALIST: 'specialist',
} as const;

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'or', name: 'Odia' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'as', name: 'Assamese' },
  { code: 'ur', name: 'Urdu' },
];

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 14, color: COLORS.text.secondary },
};

