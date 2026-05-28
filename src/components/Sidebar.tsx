import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  Link2, 
  FileText, 
  Sliders, 
  Play, 
  Check, 
  Smartphone, 
  Monitor, 
  Video,
  Languages,
  Smile, 
  Upload, 
  Plus,
  User,
  Tags,
  Instagram,
  HelpCircle,
  Music,
  Tv,
  Globe,
  Trash2
} from "lucide-react";
import { SAMPLE_SOURCE_EXAMPLES, VISUAL_THEMES, PRESET_AVATARS } from "../constants";
import { ProjectSettings, AspectRatio } from "../types";

interface SidebarProps {
  settings: ProjectSettings;
  onUpdateSettings: (s: ProjectSettings) => void;
  onGenerateStoryboard: (payload: { prompt: string; url: string; scriptVibe: string; slideCount: number }) => Promise<void>;
  isGenerating: boolean;
}

export default function Sidebar({
  settings,
  onUpdateSettings,
  onGenerateStoryboard,
  isGenerating
}: SidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [scriptVibe, setScriptVibe] = useState("energetic marketing");
  const [activeTab, setActiveTab] = useState<'create' | 'examples' | 'settings'>('create');
  
  // Local drag-and-drop states
  const [dragActive, setDragActive] = useState(false);
  const [showUrlLogoInput, setShowUrlLogoInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default parameters if undefined (protective layer)
  const activePlatform = settings.platform || 'tiktok';
  const activeSlideCount = settings.slideCount || 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateStoryboard({ 
      prompt, 
      url, 
      scriptVibe,
      slideCount: activeSlideCount
    });
  };

  const handleSelectPlatform = (plat: 'tiktok' | 'instagram' | 'linkedin') => {
    let targetRatio: AspectRatio = '9:16';
    let suggestedVibe = 'energetic marketing';
    
    if (plat === 'linkedin') {
      targetRatio = '16:9';
      suggestedVibe = 'educational explainer';
    } else if (plat === 'instagram') {
      targetRatio = '1:1';
      suggestedVibe = 'inspiring brand story';
    } else {
      targetRatio = '9:16';
      suggestedVibe = 'energetic marketing';
    }

    setScriptVibe(suggestedVibe);
    onUpdateSettings({
      ...settings,
      platform: plat,
      aspectRatio: targetRatio
    });
  };

  // Local Logo file loader handler
  const handleLogoFile = (file: File) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({
          ...settings,
          logoUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const suggestIdea = () => {
    setUrl("https://www.mon-atelier-artisan.fr");
    setPrompt("Présenter notre service d'ebenisterie locale responsable. 3 points clés à souligner : bois de forêts certifiées locales, restauration artisanale haut de gamme, et livraison bas-carbone sur-mesure.");
    setScriptVibe("inspiring brand story");
    onUpdateSettings({
      ...settings,
      platform: "instagram",
      aspectRatio: "1:1",
      slideCount: 4,
      visualTheme: "warm-editorial"
    });
  };

  // Dynamic advisor intelligence according to client input
  const getAiOpinion = () => {
    if (!url.trim() && !prompt.trim()) {
      return {
        title: "🤖 Assistant Aura : Bienvenue !",
        text: "Sélectionnez votre plateforme cible (TikTok, Instagram ou LinkedIn), puis entrez l'adresse de votre site web pour concevoir vos diapositives.",
        color: "bg-indigo-50 border-indigo-200 text-indigo-950",
        icoClass: "text-indigo-600 bg-indigo-100"
      };
    }
    
    if (url.trim() && !prompt.trim()) {
      return {
        title: "🔎 Site Web Synchronisé !",
        text: "Génial ! L'IA va lire son contenu en direct. Ajoutez une courte consigne d'écriture dans le champ d'en-dessous pour cibler vos attentes.",
        color: "bg-emerald-50 border-emerald-250 text-emerald-950",
        icoClass: "text-emerald-700 bg-emerald-100"
      };
    }
    
    if (!url.trim() && prompt.trim()) {
      return {
        title: "💡 Astuce Charte Graphique",
        text: "Votre texte est prêt. Saviez-vous qu'en ajoutant l'URL de votre site internet, notre moteur de scraping peut en extraire automatiquement la palette de couleurs et le logo ?",
        color: "bg-amber-50 border-amber-250 text-amber-950",
        icoClass: "text-amber-700 bg-amber-100/80"
      };
    }

    // Both url and prompt exist
    if (activePlatform === 'linkedin') {
      return {
        title: "💼 Recommandation d'expert (LinkedIn)",
        text: "Pour maximiser la conversion sur LinkedIn, préférez le format Paysage (16:9) ou Carré (1:1), et utilisez un ton d'écriture 'Éducateur & Pédagogique' !",
        color: "bg-blue-50 border-blue-200 text-blue-950",
        icoClass: "text-blue-700 bg-blue-100"
      };
    }

    if (activePlatform === 'tiktok') {
      return {
        title: "⚡ Recommandation d'expert (TikTok)",
        text: "Sur TikTok, l'attention se gagne en 2 secondes ! Raccourcissez à 15 secondes max (3-4 slides) et adoptez un ton 'Vendeur & Énergique'.",
        color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-950",
        icoClass: "text-fuchsia-700 bg-fuchsia-100"
      };
    }

    return {
      title: "📸 Recommandation d'expert (Instagram)",
      text: "Le format Carré (1:1) s'insère à la perfection dans les flux de marque Instagram. Utilisez un ton 'Inspirant' combiné avec des thèmes colorés chauds.",
      color: "bg-purple-50 border-purple-200 text-purple-950",
      icoClass: "text-purple-700 bg-purple-100"
    };
  };

  const aiOpinion = getAiOpinion();

  const loadExample = (ex: typeof SAMPLE_SOURCE_EXAMPLES[0]) => {
    setUrl(ex.url);
    setPrompt(ex.prompt);
    setScriptVibe(ex.vibe);
    onUpdateSettings({
      ...settings,
      visualTheme: ex.theme as any,
      slideCount: 4,
      platform: "instagram",
      aspectRatio: "1:1"
    });
  };

  return (
    <aside id="aura-sidebar" className="w-[380px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
        <div id="sidebar-logo" className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center shadow-sm">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
            Aura Motion
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
              v2.5
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">générateur de vidéo publicitaire intelligente</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 text-xs px-4 bg-slate-50">
        <button
          id="tab-create"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'create' 
              ? 'text-indigo-600 border-indigo-600' 
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Création
        </button>
        <button
          id="tab-examples"
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'examples' 
              ? 'text-indigo-600 border-indigo-600' 
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Campagnes Prêtes
        </button>
        <button
          id="tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'settings' 
              ? 'text-indigo-600 border-indigo-600' 
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Rapport & Canvas
        </button>
      </div>

      {/* Dynamic Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 🤖 Dynamic AI Optimization Assistant */}
            <div id="ai-advisor-panel" className={`p-4 rounded-xl border transition-all duration-300 shadow-xs flex gap-3 ${aiOpinion.color}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm font-bold animate-pulse ${aiOpinion.icoClass}`}>
                🤖
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider">{aiOpinion.title}</h4>
                <p className="text-[11px] leading-relaxed font-medium">{aiOpinion.text}</p>
                
                {!url.trim() && !prompt.trim() && (
                  <button
                    id="btn-suggest-idea"
                    type="button"
                    onClick={suggestIdea}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded-md transition shadow-xs cursor-pointer"
                  >
                    💡 Proposer un exemple crafté
                  </button>
                )}
              </div>
            </div>

            {/* 🌟 Étape 1 : Choix de la plateforme au démarrage */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                📌 1. Choisir la Plateforme de Diffusion
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tiktok', label: 'TikTok Reels', icon: Smartphone, desc: '9:16 Vertical', color: 'hover:border-rose-300' },
                  { id: 'instagram', label: 'Instagram', icon: Instagram, desc: '1:1 Carré', color: 'hover:border-purple-300' },
                  { id: 'linkedin', label: 'LinkedIn B2B', icon: Monitor, desc: '16:9 Paysage', color: 'hover:border-blue-300' }
                ].map((p) => {
                  const active = activePlatform === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      id={`platform-btn-${p.id}`}
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlatform(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition cursor-pointer relative ${p.color} ${
                        active
                          ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="text-[10px] font-extrabold block text-slate-800 leading-none">{p.label}</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 block leading-none">{p.desc}</span>
                      {active && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 📊 Étape 1.5: Choisir de combien de services on souhaite parler */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-[11px]">
                <label className="font-extrabold text-slate-500 uppercase tracking-wider">
                  🔢 Nombre de services (Slides)
                </label>
                <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {activeSlideCount} Slides
                </span>
              </div>
              <input
                id="input-slide-count-slider"
                type="range"
                min="3"
                max="6"
                step="1"
                value={activeSlideCount}
                onChange={(e) => onUpdateSettings({ ...settings, slideCount: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-bold px-1 uppercase tracking-tight">
                <span>3 (Rapide)</span>
                <span>4 (Recommandé)</span>
                <span>5</span>
                <span>6 (Exhaustif)</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Chaque service ou argument clé de votre site correspondra à une diapositive dédiée de <strong>{Math.max(3, Math.floor(18 / activeSlideCount))}s</strong> pour une vidéo percutante de 15 à 20 secondes.
              </p>
            </div>

            {/* 🌐 Étape 2: Analyser un Site Web (URL) */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" /> 2. Analyser un Site Web (Optionnel)
              </label>
              <div className="relative">
                <input
                  id="input-url"
                  type="text"
                  placeholder="ex: www.ma-marque-responsable.fr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
                />
                <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                Notre serveur va inspecter l'adresse de votre site pour en extraire l'essence et le logo.
              </p>
            </div>

            {/* 📝 Étape 3: Description ou Texte de Base */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> 3. Objectif de la Vidéo & Description
              </label>
              <textarea
                id="input-prompt"
                placeholder="Décrivez votre produit, vos services à mettre en avant ou copiez-collez l'accroche de votre campagne..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-2.5 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed shadow-sm font-medium"
              />
            </div>

            {/* Style de Script */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                🎙️ Choix du Vibe & Voix Off
              </label>
              <select
                id="select-script-vibe"
                value={scriptVibe}
                onChange={(e) => setScriptVibe(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm font-medium"
              >
                <option value="energetic marketing">⚡ Vendeur & Énergique (Shorts/TikTok)</option>
                <option value="educational explainer">🎓 Éducateur & Pédagogique (LinkedIn/Youtube)</option>
                <option value="inspiring brand story">🌟 Inspirant & Storytelling de Marque</option>
                <option value="relaxed corporate">💼 Professionnel Calme & Raisonné</option>
                <option value="dramatic presentation">🎭 Théâtral & Cinématographique</option>
              </select>
            </div>

            {/* Theme Visual Fast Selection */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[11px] font-extrabold text-slate-405 uppercase tracking-wider">
                🎨 Palette Graphique
              </label>
              <div className="grid grid-cols-5 gap-2">
                {VISUAL_THEMES.map((theme) => {
                  const isActive = settings.visualTheme === theme.id;
                  return (
                    <button
                      id={`theme-btn-${theme.id}`}
                      key={theme.id}
                      type="button"
                      title={theme.name}
                      onClick={() => onUpdateSettings({ ...settings, visualTheme: theme.id as any })}
                      className={`h-7 rounded-md transition-all relative border cursor-pointer flex items-center justify-center ${theme.bgGradient} ${
                        isActive ? 'border-indigo-600 ring-2 ring-indigo-600/20 scale-105 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 font-semibold italic">
                {VISUAL_THEMES.find(t => t.id === settings.visualTheme)?.styleDescription}
              </p>
            </div>

            {/* Aspect Ratio Options (secondary manual choice) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider">Format d'Aspect manuel</span>
                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-extrabold font-mono uppercase">{settings.aspectRatio}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '9:16', label: 'Vertical (9:16)', desc: 'Reels / TikTok' },
                  { id: '1:1', label: 'Carré (1:1)', desc: 'Insta / LinkedIn' },
                  { id: '16:9', label: 'Paysage (16:9)', desc: 'LinkedIn / Web' }
                ].map((ratio) => {
                  const isActive = settings.aspectRatio === ratio.id;
                  return (
                    <button
                      id={`ratio-btn-${ratio.id.replace(':', '-')}`}
                      key={ratio.id}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, aspectRatio: ratio.id as any })}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer flex flex-col justify-center items-center ${
                        isActive
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-705 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-extrabold block leading-none">{ratio.label}</span>
                      <span className="text-[7px] text-slate-400 mt-0.5 block tracking-normal leading-none">{ratio.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo de l'Entreprise avec Téléchargement Local & Drag and Drop */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Logo Officiel de votre Marque</span>
                <span className="text-[9px] text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">Local PNG/JPG</span>
              </label>
              
              {settings.logoUrl ? (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-205 p-3 rounded-xl">
                  <div className="relative flex items-center justify-center bg-white border border-slate-200 rounded-lg p-1.5 w-14 h-14 shadow-xs flex-shrink-0">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo Marque" 
                      className="max-full max-h-full object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">Logo chargé avec succès</p>
                    <p className="text-[9px] text-slate-400">Dimensions préservées • Affichage HD encadré</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, logoUrl: "" })}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition cursor-pointer"
                    title="Supprimer le logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div 
                  id="logo-drag-container"
                  onDragEnter={handleLogoDrag}
                  onDragOver={handleLogoDrag}
                  onDragLeave={handleLogoDrag}
                  onDrop={handleLogoDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/40' 
                      : 'border-slate-250 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="logo-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoInputChange}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5 animate-bounce" />
                  <p className="text-[11px] font-bold text-slate-800">Glissez votre logo ou Cliquez ici</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Formats acceptés : PNG, JPEG, JPG</p>
                </div>
              )}

              {/* URL fallback action toggle */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowUrlLogoInput(!showUrlLogoInput)}
                  className="text-[9px] text-indigo-600 hover:underline font-bold"
                >
                  {showUrlLogoInput ? "Masquer l'option URL" : "Ou coller une URL de logo existante"}
                </button>
              </div>

              {showUrlLogoInput && (
                <div className="pt-1.5">
                  <input
                    id="input-logo-url-backup"
                    type="text"
                    placeholder="Collez l'URL de votre logo externe..."
                    value={settings.logoUrl || ""}
                    onChange={(e) => onUpdateSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Avatar Présentateur / Personnification */}
            <div className="space-y-3.5 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Présentateur (Avatar Parlant)
                </label>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Ajoutez un visage animé synchronisé aux paroles pour personnifier votre communication.
                </p>
              </div>

              {/* Presenter Visual Types */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'none', label: 'Aucun' },
                  { id: 'floating', label: 'Bulle' },
                  { id: 'split-screen', label: 'Split' },
                  { id: 'podcast-bubble', label: 'Podcast' }
                ].map((style) => {
                  const isActive = (settings.avatarStyle || 'none') === style.id;
                  return (
                    <button
                      id={`avatar-style-${style.id}`}
                      key={style.id}
                      type="button"
                      onClick={() => onUpdateSettings({ 
                        ...settings, 
                        avatarStyle: style.id as any,
                        // If turning on and no preset is selected, default to Sarah
                        avatarUrl: style.id !== 'none' && !settings.avatarUrl ? PRESET_AVATARS[0].imageUrl : settings.avatarUrl,
                        avatarPresetName: style.id !== 'none' && !settings.avatarPresetName ? PRESET_AVATARS[0].name : settings.avatarPresetName
                      })}
                      className={`py-1.5 rounded text-[10px] font-bold border transition-all text-center cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>

              {/* If Presenter is enabled, show avatar profile selection & customs */}
              {settings.avatarStyle && settings.avatarStyle !== 'none' && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/65 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Présentateur Pro</span>
                  
                  {/* Grid of presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_AVATARS.map((av) => {
                      const isActive = (settings.avatarPresetName === av.name) || (settings.avatarUrl === av.imageUrl);
                      return (
                        <button
                          id={`btn-preset-av-${av.id}`}
                          key={av.id}
                          type="button"
                          onClick={() => onUpdateSettings({
                            ...settings,
                            avatarUrl: av.imageUrl,
                            avatarPresetName: av.name
                          })}
                          className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-white border-indigo-500/80 ring-2 ring-indigo-500/10' 
                              : 'hover:bg-white border-transparent'
                          }`}
                        >
                          <img 
                            src={av.imageUrl} 
                            alt={av.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-250 shadow-sm"
                          />
                          <span className="text-[8px] font-bold text-slate-700 text-center truncate w-full">{av.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Or Custom Avatar URL */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Ou URL de votre photo</span>
                    <input
                      id="input-custom-avatar"
                      type="text"
                      placeholder="Collez l'URL d'un visage..."
                      value={settings.avatarUrl || ""}
                      onChange={(e) => onUpdateSettings({ 
                        ...settings, 
                        avatarUrl: e.target.value,
                        avatarPresetName: "Custom"
                      })}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-1 px-2 text-[10px] focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Generation Call */}
            <button
              id="btn-generate-storyboard"
              type="submit"
              disabled={isGenerating || (!prompt.trim() && !url.trim())}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white shadow-md bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer ${
                isGenerating 
                  ? 'opacity-80 cursor-not-allowed' 
                  : 'hover:shadow-indigo-500/10'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Génération du Storyboard IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer le Motion Design IA
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-4">
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">Note pratique</span>
              <p className="text-[11px] text-indigo-950/80 mt-1 leading-relaxed">
                Cliquez sur l'une des campagnes modélisées ci-dessous. Le système configurera l'outil de création et lancera la génération automatique.
              </p>
            </div>
            
            <div className="space-y-3.5">
              {SAMPLE_SOURCE_EXAMPLES.map((ex, index) => (
                <button
                  id={`example-card-${index}`}
                  key={index}
                  onClick={() => loadExample(ex)}
                  className="w-full text-left bg-white border border-slate-200 p-4 rounded-xl transition-all hover:border-slate-300 hover:scale-[1.01] active:scale-[0.99] group space-y-2.5 shadow-sm cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {ex.title}
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-medium">
                      {ex.vibe}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {ex.prompt}
                  </p>
                  <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5 overflow-hidden">
                    <Link2 className="w-3 h-3 flex-shrink-0 text-indigo-600/85" />
                    <span className="truncate">{ex.url}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5 text-xs text-slate-600">
            <h3 className="font-bold text-slate-700 tracking-wider uppercase text-xs">Spécifications de l'Outil</h3>
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-inner">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Modèle Utilisé (Script)</span>
                <p className="text-xs text-slate-800 font-semibold">Gemini 3.5 Flash</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Synthèse Vocale (Voice-Over)</span>
                <p className="text-xs text-slate-800 font-semibold">Gemini 3.1 TTS Preview</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Accroche & Intelligence Web</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Extraction HTML + Grounding de Recherche Google Search intégré si l'adresse est active.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-700">Format d'exportation final</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="export-canvas"
                  onClick={() => onUpdateSettings({ ...settings, exportFormat: 'web-canvas' })}
                  className={`p-2.5 rounded border text-center font-medium cursor-pointer transition-all ${
                    settings.exportFormat === 'web-canvas'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  Interactive Player
                </button>
                <button
                  id="export-mp4"
                  onClick={() => onUpdateSettings({ ...settings, exportFormat: 'mp4' })}
                  className={`p-2.5 rounded border text-center font-medium cursor-pointer transition-all ${
                    settings.exportFormat === 'mp4'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  Fichier MP4 (Shorts)
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed text-center pt-4">
              Ce mini-studio compile vos options directement sur le canvas HTML5 de l'iFrame, garantissant un rendu fluide et adaptable à toutes les résolutions.
            </p>
          </div>
        )}

      </div>
    </aside>
  );
}
