export type AspectRatio = '9:16' | '16:9' | '1:1';

export type TextStyle = 'minimal' | 'impact' | 'bordered' | 'cyber' | 'serif' | 'duotone';

export type AnimationType = 'fade' | 'slide-up' | 'pop-in' | 'expand' | 'drift' | 'reveal';

export type TextPosition = 'center' | 'bottom' | 'top' | 'middle-left' | 'middle-right';

export interface VisualConfig {
  title: string;
  subtitle?: string;
  accentWord?: string; // High-priority word to highlight with another color/style
  backgroundColor: string; // Tailwind gradient or color (e.g., "from-[#0c0f1d] to-[#11162d]")
  backgroundType: 'gradient' | 'image' | 'solid';
  backgroundImage?: string; // Optional image URL
  textPosition: TextPosition;
  textStyle: TextStyle;
  animationType: AnimationType;
  assetKeywords?: string; // Keywords describing the scene visual background
  fontFamily?: string;  // Custom Google Font family or choice
  customAccentColor?: string; // Custom Hex color override for high-priority word
}

export interface AudioConfig {
  voiceName: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck' | 'Charon';
  speechSpeed: number; // multiplier, e.g. 1.0
  backgroundMusicVibe: string; // Music vibe ID or track name (e.g., 'lofi', 'techno', 'acoustic')
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
  visualTheme: string; // Theme ID, customizable
  exportFormat: 'mp4' | 'gif' | 'web-canvas';
  logoUrl?: string; // Brand logo URL to render in video corner or base64 file
  avatarUrl?: string; // Interactive talking presenter avatar URL or file
  avatarStyle?: 'none' | 'floating' | 'split-screen' | 'podcast-bubble'; // Avatar rendering layout style
  avatarPresetName?: string; // Prebuilt professional name
  platform?: 'tiktok' | 'instagram' | 'linkedin'; // Active distribution platform chosen by user
  slideCount?: number; // Number of slides or services to present
  workingLanguage?: 'fr' | 'en'; // Translation content target lang
  interfaceLanguage?: 'fr' | 'en'; // Active UI navigation locale choice
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
