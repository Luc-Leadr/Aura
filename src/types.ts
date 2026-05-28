export type AspectRatio = '9:16' | '16:9';

export type TextStyle = 'minimal' | 'impact' | 'bordered' | 'cyber' | 'serif' | 'duotone';

export type AnimationType = 'fade' | 'slide-up' | 'pop-in' | 'expand' | 'drift' | 'reveal';

export type TextPosition = 'center' | 'bottom' | 'top' | 'middle-left' | 'middle-right';

export interface VisualConfig {
  title: string;
  subtitle?: string;
  accentWord?: string; // High-priority word to highlight with another color/style
  backgroundColor: string; // Tailwind gradient or color (e.g., "from-slate-900 to-indigo-950")
  backgroundType: 'gradient' | 'image' | 'solid';
  backgroundImage?: string; // Optional image URL
  textPosition: TextPosition;
  textStyle: TextStyle;
  animationType: AnimationType;
  assetKeywords?: string; // Keywords describing the scene visual background
}

export interface AudioConfig {
  voiceName: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck' | 'Charon';
  speechSpeed: number; // multiplier, e.g. 1.0
  backgroundMusicVibe: 'none' | 'lofi' | 'cinematic' | 'techno' | 'corporate' | 'acoustic';
  volume: number; // 0.0 to 1.0
}

export interface Scene {
  id: string;
  duration: number; // in seconds
  subtitle: string; // Narrated spoken voice
  visual: VisualConfig;
  audio: AudioConfig;
  transition: 'fade' | 'slide' | 'scale' | 'none';
}

export interface ProjectSettings {
  name: string;
  aspectRatio: AspectRatio;
  visualTheme: 'modern-dark' | 'neon-pulse' | 'warm-editorial' | 'clean-corporate' | 'brutalist-yellow';
  exportFormat: 'mp4' | 'gif' | 'web-canvas';
  logoUrl?: string; // Brand logo URL to render in video corner
  avatarUrl?: string; // Interactive talking presenter avatar URL or file
  avatarStyle?: 'none' | 'floating' | 'split-screen' | 'podcast-bubble'; // Avatar rendering layout style
  avatarPresetName?: string; // Prebuilt professional name e.g. "Sarah" or "David"
}

export interface Project {
  settings: ProjectSettings;
  scenes: Scene[];
}

export interface ScriptAnalysis {
  sourceTextOrUrl: string;
  detectedTone: string;
  detectedBrandColors: string[];
  suggestedSlogan: string;
  suggestedDuration: number; // total suggested in seconds
}
