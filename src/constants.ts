import { Project, Scene } from "./types";

export interface VisualThemePreset {
  id: string;
  name: string;
  className: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  font: string;
  styleDescription: string;
}

export const VISUAL_THEMES: VisualThemePreset[] = [
  {
    id: "modern-dark",
    name: "Modern Studio",
    className: "theme-modern-dark",
    bgGradient: "bg-gradient-to-br from-[#0c0f1d] via-[#11162d] to-[#070913]",
    textColor: "text-slate-100",
    accentColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    font: "font-sans",
    styleDescription: "Deep cinematic dark blues with a sleek emerald mint accent. Sleek and minimal."
  },
  {
    id: "neon-pulse",
    name: "Cyber Stream",
    className: "theme-neon-pulse",
    bgGradient: "bg-gradient-to-tr from-[#090514] via-[#160c2d] to-[#260533]",
    textColor: "text-purple-50",
    accentColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
    font: "font-mono",
    styleDescription: "High-voltage neon purples, deep violets, and magenta highlights. Energetic and bold."
  },
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    className: "theme-warm-editorial",
    bgGradient: "bg-gradient-to-br from-[#1a1512] via-[#241c18] to-[#120e0c]",
    textColor: "text-stone-100",
    accentColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    font: "font-serif",
    styleDescription: "Sophisticated charcoal and sand. Warm organic tones, elegant serif, high credibility."
  },
  {
    id: "clean-corporate",
    name: "Dynamic Blue",
    className: "theme-clean-corporate",
    bgGradient: "bg-gradient-to-br from-[#021124] via-[#092240] to-[#030e1a]",
    textColor: "text-blue-50",
    accentColor: "text-sky-400 bg-sky-500/10 border-sky-400/20",
    font: "font-sans",
    styleDescription: "Deep corporate cobalt combined with crisp electric sky blue. Authoritative, tech-forward."
  },
  {
    id: "brutalist-yellow",
    name: "Brutalist Active",
    className: "theme-brutalist",
    bgGradient: "bg-gradient-to-br from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb]",
    textColor: "text-[#0d0d0d]",
    accentColor: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]",
    font: "font-mono",
    styleDescription: "Light theme high-contrast. Bold, solid borders, offset labels. Heavy visual contrast."
  }
];

export const MUSIC_VIBES = [
  { id: 'none', name: '🔇 No Music', frequency: 0, sfxName: 'none' },
  { id: 'lofi', name: '☕ Lofi Beats', frequency: 120, sfxName: 'chill-warm' },
  { id: 'cinematic', name: '🎬 Cinematic Ambient', frequency: 80, sfxName: 'orchestra-drone' },
  { id: 'techno', name: '⚡ Tech Impulse', frequency: 140, sfxName: 'synthwave-arpeggio' },
  { id: 'corporate', name: '📈 Clean Corporate', frequency: 110, sfxName: 'acoustic-pulse' },
  { id: 'acoustic', name: '🎸 Organic Guitar', frequency: 95, sfxName: 'plucked-vibe' }
];

export const SAMPLE_SOURCE_EXAMPLES = [
  {
    title: "EcoBottle - Sustainable Hydration",
    url: "https://www.ecobottle-demo-web.com",
    prompt: "An elegant launch ad for EcoBottle. Highlight the 24-hour temperature lock and the ocean-bound plastic recycling pledge. Keep it green, clean, and inspiring.",
    vibe: "Inspiring & Ecological",
    theme: "warm-editorial"
  },
  {
    title: "SaaS DevFlow - Rapid Iteration Platform",
    url: "https://www.devflow-example-cloud.io",
    prompt: "Show developer pain: slow CI builds. Introduce DevFlow as the fast, instant caching layer boosting deployment, reducing hosting costs. Target CTOs/Engineers.",
    vibe: "Energetic & Tech product overview",
    theme: "neon-pulse"
  },
  {
    title: "FitPulse - Fitness Smart Rings",
    url: "https://www.fitpulse-ring.com",
    prompt: "Highlight ultra-comfortable smart ring tracking daily sleep wellness and physical performance. Show high aesthetic product shots and lifestyle benefits.",
    vibe: "Premium commercial lifestyle",
    theme: "modern-dark"
  }
];

export interface AvatarPreset {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: "sarah",
    name: "Sarah (Tech)",
    role: "Directrice Tech & SaaS",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "david",
    name: "David (Business)",
    role: "Partenaire Business & Finance",
    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "emma",
    name: "Emma (Impact)",
    role: "Responsable RSE & Stratégie",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: "thomas",
    name: "Thomas (SaaS)",
    role: "Concepteur Produit & Marketing",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
  }
];

// High-fidelity fallback storyboard used before any API requests succeed
export const DEFAULT_PROJECT: Project = {
  settings: {
    name: "Aura Motion Campaign",
    aspectRatio: "9:16",
    visualTheme: "modern-dark",
    exportFormat: "web-canvas",
    logoUrl: "", // initialized blank, customizable by user
    avatarUrl: "", // customizable with custom url
    avatarStyle: "none", // customized presenter avatar setup
    avatarPresetName: "",
    platform: "tiktok",
    slideCount: 4
  },
  scenes: [
    {
      id: "scene-1",
      duration: 5,
      subtitle: "Est-ce que votre site web convertit ses visiteurs ? Découvrez comment l'optimiser instantanément.",
      visual: {
        title: "DÉCOUVREZ L'OPTIMISATION",
        subtitle: "Maximez l'impact de chaque visiteur.",
        accentWord: "L'OPTIMISATION",
        backgroundColor: "bg-gradient-to-br from-[#0c0f1d] via-[#11162d] to-[#070913]",
        backgroundType: "gradient",
        textPosition: "center",
        textStyle: "impact",
        animationType: "reveal",
        assetKeywords: "tech analytics graph sleek motion lines"
      },
      audio: {
        voiceName: "Zephyr",
        speechSpeed: 1,
        backgroundMusicVibe: "lofi",
        volume: 0.8
      },
      transition: "fade"
    },
    {
      id: "scene-2",
      duration: 5,
      subtitle: "Analysez le ton de vos textes, ciblez votre audience, et produisez des clips percutants en un clic.",
      visual: {
        title: "DU TEXTE AU PRODUIT",
        subtitle: "L'intelligence artificielle au service du motion design.",
        accentWord: "PRODUIT",
        backgroundColor: "bg-gradient-to-tr from-[#160c2d] to-[#0c0f1d]",
        backgroundType: "gradient",
        textPosition: "bottom",
        textStyle: "cyber",
        animationType: "slide-up",
        assetKeywords: "digital waves node abstract wireframe"
      },
      audio: {
        voiceName: "Zephyr",
        speechSpeed: 1.05,
        backgroundMusicVibe: "lofi",
        volume: 0.8
      },
      transition: "slide"
    },
    {
      id: "scene-3",
      duration: 5,
      subtitle: "Générez des voix off premium synchronisées avec vos éléments graphiques pour marquer les esprits.",
      visual: {
        title: "SYNCHRONISATION PREMIUM",
        subtitle: "Sons d'ambiance et sous-titres animés.",
        accentWord: "SYNCHRONISATION",
        backgroundColor: "bg-gradient-to-br from-[#0c0f1d] to-[#011a0c]",
        backgroundType: "gradient",
        textPosition: "center",
        textStyle: "duotone",
        animationType: "pop-in",
        assetKeywords: "sound wave pattern ring radar visualizer"
      },
      audio: {
        voiceName: "Zephyr",
        speechSpeed: 1,
        backgroundMusicVibe: "lofi",
        volume: 0.8
      },
      transition: "fade"
    },
    {
      id: "scene-4",
      duration: 6,
      subtitle: "Lancez vos visuels publicitaires et captez l'attention sur TikTok, Shorts et LinkedIn dès aujourd'hui !",
      visual: {
        title: "COMMENCEZ MAINTENANT",
        subtitle: "Création instantanée sans compétences.",
        accentWord: "COMMENCEZ",
        backgroundColor: "bg-gradient-to-br from-[#11162d] to-[#1e112d]",
        backgroundType: "gradient",
        textPosition: "center",
        textStyle: "serif",
        animationType: "drift",
        assetKeywords: "energetic spark clean glowing particle space"
      },
      audio: {
        voiceName: "Zephyr",
        speechSpeed: 1,
        backgroundMusicVibe: "lofi",
        volume: 0.8
      },
      transition: "scale"
    }
  ]
};
