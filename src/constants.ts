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
    accentColor: "text-[#ef4444] bg-[#ef4444]/15 border-[#ef4444]",
    font: "font-mono",
    styleDescription: "Light theme high-contrast. Bold, solid borders, offset labels. Heavy visual contrast."
  },
  {
    id: "sunset-glow",
    name: "Sunset Vibe",
    className: "theme-sunset-glow",
    bgGradient: "bg-gradient-to-tr from-[#1f0d3d] via-[#4a1240] to-[#f43f5e]",
    textColor: "text-stone-50",
    accentColor: "text-amber-300 bg-amber-500/15 border-amber-400/40",
    font: "font-sans",
    styleDescription: "Vibrant sunset gradients from deep space purple to glowing rose with amber. Captivating vlog feel."
  },
  {
    id: "forest-abyss",
    name: "Emerald Guild",
    className: "theme-forest-abyss",
    bgGradient: "bg-gradient-to-br from-[#021e17] via-[#052e16] to-[#011400]",
    textColor: "text-emerald-50",
    accentColor: "text-lime-400 bg-lime-500/10 border-lime-400/30",
    font: "font-sans",
    styleDescription: "Deep luxury botanical greens with rich lime gold highlights. Prestigious and earthy."
  },
  {
    id: "ocean-breeze",
    name: "Aqua Sparkle",
    className: "theme-ocean-breeze",
    bgGradient: "bg-gradient-to-br from-[#051c33] via-[#07365c] to-[#0d9488]",
    textColor: "text-cyan-50",
    accentColor: "text-teal-300 bg-teal-500/15 border-teal-400/25",
    font: "font-sans",
    styleDescription: "Refreshing deep marine gradient to turquoise. Professional, calm, and fresh."
  },
  {
    id: "royal-velvet",
    name: "Royal Velvet",
    className: "theme-royal-velvet",
    bgGradient: "bg-gradient-to-br from-[#120524] via-[#250d4f] to-[#be123c]",
    textColor: "text-rose-50",
    accentColor: "text-amber-400 bg-amber-500/10 border-amber-400/20",
    font: "font-sans",
    styleDescription: "Regal burgundy to deep plum with high contrast golden accents. Luxurious."
  },
  {
    id: "sandstone-luxury",
    name: "Sandstone Craft",
    className: "theme-sandstone",
    bgGradient: "bg-gradient-to-br from-[#fbfaf8] via-[#f1eeeb] to-[#e4ded9]",
    textColor: "text-stone-900",
    accentColor: "text-indigo-650 bg-indigo-500/10 border-indigo-500/20",
    font: "font-serif",
    styleDescription: "Crisp organic cream stone light theme. Pairs elegant serif with high-contrast text tags."
  }
];

export interface FontPreset {
  id: string;
  name: string;
  family: string;
}

export const FONTS: FontPreset[] = [
  { id: "inter", name: "Inter (Modern & Neutral)", family: "'Inter', sans-serif" },
  { id: "space-grotesk", name: "Space Grotesk (Tech & Futuristic)", family: "'Space Grotesk', sans-serif" },
  { id: "playfair", name: "Playfair Display (Premium Serif)", family: "'Playfair Display', serif" },
  { id: "outfit", name: "Outfit (Geometric & Smooth)", family: "'Outfit', sans-serif" },
  { id: "syne", name: "Syne (Expressive Art & Bold)", family: "'Syne', sans-serif" },
  { id: "plus-jakarta", name: "Plus Jakarta (Clear Startup Sans)", family: "'Plus Jakarta Sans', sans-serif" },
  { id: "fira-code", name: "Fira Code (Brutalist Code Mono)", family: "'Fira Code', monospace" }
];

export interface RoyaltyFreeTrack {
  id: string;
  name: string;
  genre: string;
  url: string;
  recommendedFor: string;
  recommendedForEn: string;
}

export const ROYALTY_FREE_TRACKS: RoyaltyFreeTrack[] = [
  { 
    id: "lofi", 
    name: "☕ Lofi Sunset Cafe Beats", 
    genre: "Chill Lofi", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    recommendedFor: "Culinaire, cafés, artisanat, bien-être et blogs décontractés.",
    recommendedForEn: "Culinary, cafes, craftsmanship, wellness, and casual vlogs."
  },
  { 
    id: "techno", 
    name: "⚡ Cyberpunk Horizon Pulse", 
    genre: "Tech & Electro Synthwave", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    recommendedFor: "Logiciels, SaaS, intelligence artificielle et web3/crypto.",
    recommendedForEn: "Software, SaaS, AI, and crypto/tech startups."
  },
  { 
    id: "acoustic", 
    name: "🎸 Organic Summer Indie Breeze", 
    genre: "Acoustic / Folk Uplifting", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    recommendedFor: "Écologie, produits biologiques, boutiques artisanales normales.",
    recommendedForEn: "Ecology, green products, local stores, organic lifestyle."
  },
  { 
    id: "corporate", 
    name: "📈 Success Growth Momentum", 
    genre: "Uplifting Happy Corporate", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    recommendedFor: "B2B, agences de conseil, immobilier, formation et LinkedIn.",
    recommendedForEn: "B2B, marketing consulting, real estate, education, and LinkedIn."
  },
  { 
    id: "cinematic", 
    name: "🎬 Majestic Cinematic Ambient Space", 
    genre: "Orchestral / Modern Cinematic", 
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    recommendedFor: "Produits de luxe, storytelling de marque premium, promotion d'agence.",
    recommendedForEn: "Luxury catalog, premium brand storytelling, agency, real estate."
  }
];

export const MUSIC_VIBES = ROYALTY_FREE_TRACKS.map(t => ({ 
  id: t.id, 
  name: t.name, 
  sfxName: t.id, 
  url: t.url, 
  frequency: 100 
}));

export const SAMPLE_SOURCE_EXAMPLES = [
  {
    title: "EcoBottle - Sustainable Hydration",
    url: "https://www.ecobottle-demo-web.com",
    prompt: "An elegant launch ad for EcoBottle. Highlight the 24-hour temperature lock and the ocean-bound plastic recycling pledge. Keep it green, clean, and inspiring.",
    vibe: "Inspiring & Ecological",
    theme: "forest-abyss"
  },
  {
    title: "SaaS DevFlow - Rapid Iteration Platform",
    url: "https://www.devflow-example-cloud.io",
    prompt: "Show developer pain: slow CI builds. Introduce DevFlow as the fast, instant caching layer boosting deployment, reducing hosting costs. Target CTOs/Engineers.",
    vibe: "Energetic & Tech product overview",
    theme: "neon-pulse"
  },
  {
    title: "Le Grub Co-Living Culinary",
    url: "https://www.le-grub.com",
    prompt: "A beautiful sensory highlight of Le Grub culinary space featuring gourmet coworking kitchens, certified artisan events, and organic local shared plates.",
    vibe: "Premium commercial lifestyle",
    theme: "sandstone-luxury"
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
    logoUrl: "", 
    avatarUrl: "", 
    avatarStyle: "none", 
    avatarPresetName: "",
    platform: "tiktok",
    slideCount: 4,
    workingLanguage: "fr",
    interfaceLanguage: "fr"
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
        assetKeywords: "tech analytics graph sleek motion lines",
        fontFamily: "space-grotesk"
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
        assetKeywords: "digital waves node abstract wireframe",
        fontFamily: "space-grotesk"
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
        assetKeywords: "sound wave pattern ring radar visualizer",
        fontFamily: "space-grotesk"
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
        assetKeywords: "energetic spark clean glowing particle space",
        fontFamily: "space-grotesk"
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

export const I18N_DICTS = {
  fr: {
    title: "Aura Motion Studio Dashboard",
    tagline: "générateur de vidéo publicitaire intelligente",
    creative_mode: "Mode Créatif Actif",
    detected_tone: "TON SÉMANTIQUE:",
    export_btn: "Exporter la Vidéo publicitaire",
    tab_create: "Création",
    tab_ready: "Campagnes Prêtes",
    tab_report: "Rapport & Canvas",
    advisor_welcome_title: "🤖 Assistant Aura : Bienvenue !",
    advisor_welcome_desc: "Sélectionnez votre plateforme, entrez l'adresse URL de votre site et choisissez les services.",
    suggest_example_btn: "💡 Proposer un exemple crafté",
    step_platform: "📌 Format & Plateforme de diffusion",
    step_slides: "🔢 Nombre de séquences (Slides)",
    slides_recommended: "Chaque service ou argument clé correspondra à une diapositive dédiée.",
    step_analyze: "🌐 1. Analyser un site internet",
    input_url_placeholder: "ex: ma-marque-responsable.fr",
    detect_btn: "Détecter",
    analyzing_text: "Scannage sémantique de l'URL en cours...",
    analyzing_desc: "Extraction sémantique fine des thèmes réels du site par l'IA.",
    checked_topics_title: "🔎 ÉTAPE DE VALIDATION des clips déduits par l'IA",
    topics_all_check: "Tout cocher",
    topics_all_uncheck: "Tout décocher",
    slogan_label: "Accroche phare :",
    step_prompt: "📝 2. Consignes & Instructions complémentaires",
    textarea_prompt_placeholder: "Rédigez ici ou laissez l'IA composer à partir des sujets du site web cochés ci-dessus...",
    prompt_help: "Vous n'avez pas besoin de rédiger : les thèmes se synchronisent automatiquement.",
    voice_vibe_label: "🎙️ Choix du Vibe & Voix Off",
    palette_label: "🎨 Palette Graphique",
    ratio_label: "Format d'Aspect manuel",
    logo_label: "Logo Officiel de votre Marque",
    logo_success: "Logo chargé avec succès",
    logo_sub: "Dimensions préservées • Affichage HD encadré",
    logo_drag_placeholder: "Glissez votre logo ou Cliquez ici",
    logo_drag_sub: "Formats acceptés : PNG, JPEG, JPG",
    logo_url_option: "Ou coller une URL de logo existante",
    logo_url_placeholder: "Collez l'URL de votre logo externe...",
    talking_presenter_label: "Présentateur (Avatar Parlant)",
    talking_presenter_desc: "Ajoutez un visage animé synchronisé aux paroles pour personnifier votre communication.",
    avatar_none: "Aucun",
    avatar_bubble: "Bulle",
    avatar_split: "Split",
    avatar_podcast: "Podcast",
    preset_presenter_label: "Présentateur Pro",
    custom_avatar_url: "Ou URL de votre photo",
    btn_generate_storyboard: "Générer le Motion Design IA",
    btn_generating_storyboard: "Génération du Storyboard IA...",
    empty_scenes_title: "Aucun Storyboard n'a encore été généré pour ce projet",
    empty_scenes_desc: "Conformément au fonctionnement de Descript, entrez une URL de site web pour permettre à l'IA d'en déduire des séquences clés réelles. Validez ensuite les séquences proposées, puis cliquez sur 'Générer le Motion Design' pour fabriquer la vidéo publicitaire et ses voix-off sur-mesure.",
    load_demo_action: "Ou charger un projet de démonstration d'exemple",
    render_viewer_title: "Lecteur de Rendu Temps-Réel",
    scene_number: "SCÈNE",
    timeline_title: "Séquenceur de Scènes Storyboard",
    timeline_info: "CLIPS | SECONDES",
    btn_add_scene: "Ajouter une scène",
    btn_hear_voice: "🗣️ Entendre la voix off IA (TTS)",
    btn_hearing_voice: "Audio IA en cours...",
    music_vibe_label: "Musique d'ambiance",
    music_vibe_none: "sans musique",
    inspect_sec: "Inspecteur de Séquence",
    script_read_label: "🗣️ Texte Lu par la voix off IA",
    script_improve_btn: "Améliorer IA",
    script_improving_text: "Optimisation...",
    display_heading_sec: "Slogan / Texte Surligné",
    main_title_label: "Titre Principal",
    sub_title_label: "Sous-Titre / Sur-Titre",
    highlight_accent_label: "Mot à Surligner (Accents)",
    animations_sec: "Animations & Position",
    text_dir_label: "Cadrage du Texte",
    text_style_label: "Style Typographique",
    text_anim_label: "Transition d'Entrée",
    background_sec: "Fond d'Habillage Visuel",
    bg_gradient_btn: "Dégradé Uni",
    bg_image_btn: "Image Art Abstrait",
    bg_keywords_label: "Mots-clés de l'Illustration",
    bg_custom_gradient: "Dégradé Custom Tailwind ou Couleur Hex",
    audio_sec: "Paramètres Audio",
    voice_profile_label: "Profil de Voix off Gemini",
    music_local_label: "Musique d'accompagnement TikTok",
    sound_vol_label: "Volume Effets & Voix",
    font_sec: "Polices & Typographies",
    font_family_label: "Famille de Police (Google Fonts)",
    accent_color_label: "Couleur d'Accent personnalisée",
    lang_content_label: "🌍 Langue de travail (Script IA)",
    expert_reco: "Recommandation musicale :",
    expert_reco_desc: "Recommandé pour votre thématique et le ton détecté.",
    timeline_header_label: "Séquenceur de Scènes Storyboard",
    timeline_add_btn: "Ajouter une scène",
    clip_card_order: "CLIP"
  },
  en: {
    title: "Aura Motion Studio Dashboard",
    tagline: "intelligent ad video generator stream",
    creative_mode: "Active Creative Mode",
    detected_tone: "SEMANTIC TONE:",
    export_btn: "Export Advertising Video",
    tab_create: "Creation",
    tab_ready: "Ready Campaigns",
    tab_report: "Report & Canvas",
    advisor_welcome_title: "🤖 Aura Assistant: Welcome!",
    advisor_welcome_desc: "Select your target platform, enter your website URL and choose the services.",
    suggest_example_btn: "💡 Suggest crafted example",
    step_platform: "📌 Format & Distribution Platform",
    step_slides: "🔢 Number of Sequences (Slides)",
    slides_recommended: "Each service or key statement will correspond to a dedicated slide.",
    step_analyze: "🌐 1. Analyze a Website",
    input_url_placeholder: "e.g. my-sustainable-brand.com",
    detect_btn: "Detect",
    analyzing_text: "Semantic scanning of URL in progress...",
    analyzing_desc: "Polished AI semantic extraction of real topics from the website.",
    checked_topics_title: "🔎 VALIDATION STEP of clips deduced by AI",
    topics_all_check: "Check All",
    topics_all_uncheck: "Uncheck All",
    slogan_label: "Key Slogan:",
    step_prompt: "📝 2. Prompt & Additional Instructions",
    textarea_prompt_placeholder: "Write here or let the AI compose from the checked topics above...",
    prompt_help: "No need to write: topics synchronize automatically if you analyzed a website.",
    voice_vibe_label: "🎙️ Script Vibe & Voice Over style",
    palette_label: "🎨 Visual Palette",
    ratio_label: "Manual Aspect Ratio",
    logo_label: "Official Brand Logo",
    logo_success: "Logo loaded successfully",
    logo_sub: "Dimensions preserved • Framed HD display",
    logo_drag_placeholder: "Drag your logo or Click here",
    logo_drag_sub: "Accepted formats: PNG, JPEG, JPG",
    logo_url_option: "Or paste an existing logo URL",
    logo_url_placeholder: "Paste external logo URL...",
    talking_presenter_label: "Talking Presenter Avatar",
    talking_presenter_desc: "Add an animated face synchronized to words to personify your communication.",
    avatar_none: "None",
    avatar_bubble: "Bubble",
    avatar_split: "Split",
    avatar_podcast: "Podcast",
    preset_presenter_label: "Pro Presenter",
    custom_avatar_url: "Or custom photo URL",
    btn_generate_storyboard: "Generate AI Motion Design",
    btn_generating_storyboard: "Generating AI Storyboard...",
    empty_scenes_title: "No Storyboard Generated Yet for This Project",
    empty_scenes_desc: "True to the Descript experience, enter a website URL to let the AI deduce real key sequences first. Validate the proposed items, then click 'Generate Motion Design' to craft the publicist video and its voiceover.",
    load_demo_action: "Or load a beautiful demonstration project",
    render_viewer_title: "Real-Time Render Player",
    scene_number: "SCENE",
    timeline_title: "Storyboard Scenes Sequencer",
    timeline_info: "CLIPS | SECONDS",
    btn_add_scene: "Add a scene",
    btn_hear_voice: "🗣️ Hear IA voiceover (TTS)",
    btn_hearing_voice: "Generating voice audio...",
    music_vibe_label: "Backing Music",
    music_vibe_none: "no music",
    inspect_sec: "Sequence Inspector",
    script_read_label: "🗣️ Text spoken by voiceover IA",
    script_improve_btn: "Polish AI",
    script_improving_text: "Optimizing...",
    display_heading_sec: "Screen Subtitles / Slogans",
    main_title_label: "Primary Title",
    sub_title_label: "Sub-Title / Over-Title",
    highlight_accent_label: "Word to Highlight (Accent)",
    animations_sec: "Animations & Placement",
    text_dir_label: "Text Position",
    text_style_label: "Typography Style",
    text_anim_label: "Entrance Transition",
    background_sec: "Background Layer",
    bg_gradient_btn: "Solid Gradient",
    bg_image_btn: "Abstract Art Image",
    bg_keywords_label: "Visual Art Keywords",
    bg_custom_gradient: "Custom Tailwind Gradient or Hex Color",
    audio_sec: "Audio Parameters",
    voice_profile_label: "Gemini Voiceover Profile",
    music_local_label: "TikTok Background Music Track",
    sound_vol_label: "Effects & Voice Volume",
    font_sec: "Fonts & Typography",
    font_family_label: "Font Family (Google Fonts)",
    accent_color_label: "Custom Accent / Highlight Color",
    lang_content_label: "🌍 Working Language (AI Script Target)",
    expert_reco: "Music Recommendation:",
    expert_reco_desc: "Highly tailored track according to website theme and tone.",
    timeline_header_label: "Storyboard Scenes Sequencer",
    timeline_add_btn: "Add a scene",
    clip_card_order: "CLIP"
  }
};
