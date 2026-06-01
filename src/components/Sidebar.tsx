import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  Link2, 
  FileText, 
  Sliders, 
  Check, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Globe, 
  Languages,
  ArrowRight,
  Heart
} from "lucide-react";
import { SAMPLE_SOURCE_EXAMPLES, VISUAL_THEMES, I18N_DICTS } from "../constants";
import { ProjectSettings, AspectRatio } from "../types";

interface SidebarProps {
  settings: ProjectSettings;
  onUpdateSettings: (s: ProjectSettings) => void;
  onUpdateProject?: (p: any) => void;
  onGenerateStoryboard: (payload: { 
    prompt: string; 
    url: string; 
    scriptVibe: string; 
    slideCount: number; 
    workingLanguage: 'fr' | 'en'; 
    campaignType: 'video-animated' | 'static-carousel' | 'linkedin-3-posts' 
  }) => Promise<void>;
  isGenerating: boolean;
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  workingLanguage: 'fr' | 'en';
  setWorkingLanguage: (lang: 'fr' | 'en') => void;
  onLoadPresetDemo: () => void;
  onAnalyzeWebsiteComplete?: (data: any) => void;
  campaignType: 'video-animated' | 'static-carousel' | 'linkedin-3-posts';
  onUpdateCampaignType: (t: 'video-animated' | 'static-carousel' | 'linkedin-3-posts') => void;
  suggestedLinkedinPost: string;
  isAdjusting: boolean;
  onAdjustStoryboard: (feedback: string) => Promise<any>;
  hasGenerated: boolean;
}

export default function Sidebar({
  settings,
  onUpdateSettings,
  onUpdateProject,
  onGenerateStoryboard,
  isGenerating,
  language,
  setLanguage,
  workingLanguage,
  setWorkingLanguage,
  onLoadPresetDemo,
  onAnalyzeWebsiteComplete,
  campaignType,
  onUpdateCampaignType,
  isAdjusting,
  onAdjustStoryboard,
  hasGenerated
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'examples' | 'adjust'>('create');
  
  // Primary input states
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [scriptVibe, setScriptVibe] = useState("energetic marketing");
  const [dragActive, setDragActive] = useState(false);
  const [showUrlLogoInput, setShowUrlLogoInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced analysis tracking
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Chat message logs for adjustment copilot
  const [copilotFeedbackInput, setCopilotFeedbackInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'aura'; text: string; timestamp: string }>>([
    {
      sender: 'aura',
      text: language === 'fr'
        ? "Qu'aimeriez-vous réajuster ? Écrivez par exemple : 'Rend le titre de la slide 2 plus créatif' ou 'Traduis le post 1 en anglais' et je m'en occupe à la volée."
        : "What would you like to edit? Type a feedback like 'Make the heading of slide 2 much shorter' or 'Translate post 3' and I'll adapt it instantly.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Combined Language Handler setting BOTH App Language and AI Content Target
  const handleLanguageSwitch = (lang: 'fr' | 'en') => {
    setLanguage(lang);
    setWorkingLanguage(lang);
  };

  const t = I18N_DICTS[language];

  // Helper getters
  const activeSlideCount = settings.slideCount || 4;

  const handleAnalyzeWebsite = async () => {
    if (!url || url.trim().length < 3) {
      setAnalysisError(language === 'fr' ? "Indiquez l'URL du site web de votre client." : "Please input your client website URL.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), language: workingLanguage })
      });
      if (!response.ok) {
        throw new Error(language === 'fr' ? "Impossible de scanner l'URL." : "Failed to scan the target URL.");
      }
      const data = await response.json();
      if (data && data.extractedTopics) {
        // Feed scraped components back automatically
        const suggestedTheme = data.suggestedVisualTheme || "modern-dark";
        
        let targetRatio: AspectRatio = "1:1";
        if (data.suggestedPlatform === "linkedin") targetRatio = "16:9";
        else if (data.suggestedPlatform === "tiktok") targetRatio = "9:16";

        onUpdateSettings({
          ...settings,
          name: data.detectedTitle || settings.name,
          platform: data.suggestedPlatform || settings.platform,
          aspectRatio: targetRatio,
          visualTheme: suggestedTheme,
          logoUrl: data.scrapedLogoUrl || settings.logoUrl,
          slideCount: data.extractedTopics.length,
          workingLanguage: workingLanguage,
          interfaceLanguage: language
        });

        if (onAnalyzeWebsiteComplete) {
          onAnalyzeWebsiteComplete(data);
        }

        setScriptVibe(data.suggestedTone || "energetic marketing");
        
        // Output clean human bullet points directly into editable guidelines
        const buls = data.extractedTopics.map((t: any) => `- ${t.title}: ${t.description}`).join("\n");
        setPrompt(`Slogan: ${data.suggestedSlogan || ""}\n\nThèmes identifiés sur le site:\n${buls}`);

        // Automatically switch format to premium Carousel to avoid motion video defaults
        if (campaignType === 'video-animated') {
          onUpdateCampaignType('static-carousel');
        }
      } else {
        throw new Error("No topics extracted.");
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Analyse interrompue.");
    } finally {
      setIsAnalyzing(false);
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
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLaunchCampaign = () => {
    onGenerateStoryboard({
      prompt: prompt || (language === 'fr' ? "Créer une présentation de marque moderne" : "Generate sleek brand outline"),
      url,
      scriptVibe,
      slideCount: activeSlideCount,
      workingLanguage,
      campaignType: campaignType === 'video-animated' ? 'static-carousel' : campaignType
    });
  };

  const handleSendCopilotAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotFeedbackInput.trim()) return;

    const userMsg = copilotFeedbackInput.trim();
    setCopilotFeedbackInput("");
    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      await onAdjustStoryboard(userMsg);
      setChatMessages(prev => [...prev, {
        sender: 'aura',
        text: language === 'fr' 
          ? "J'ai appliqué vos corrections avec succès sur l'ensemble de la campagne ! ✨ Le rendu visuel et textuel est à jour." 
          : "Successfully optimized the slides & LinkedIn copy according to your requests! ✨ The visual feed updated.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        sender: 'aura',
        text: `Error refining feedback: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return (
    <aside id="aura-sidebar-renovated" className="w-[390px] bg-white border-r border-slate-200 flex flex-col overflow-hidden h-full">
      
      {/* GLOBAL DUAL LANGUAGE SELECTOR WITH FLAGS */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-3 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h1 className="text-xs font-black tracking-tight text-slate-800 uppercase font-sans">
              Aura Campaign Studio
            </h1>
          </div>
          <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            {language === 'fr' ? 'Sémantique Active' : 'Semantic Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-3xs">
          <button
            type="button"
            onClick={() => handleLanguageSwitch('fr')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              language === 'fr' 
                ? 'bg-slate-900 text-white shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Français</span>
            <span className="text-xs">🇫🇷</span>
          </button>
          <button
            type="button"
            onClick={() => handleLanguageSwitch('en')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              language === 'en' 
                ? 'bg-slate-900 text-white shadow-sm font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>English</span>
            <span className="text-xs">🇬🇧</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-100 text-xs font-bold select-none bg-white">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'create'
              ? 'border-indigo-650 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {language === 'fr' ? 'Campagne' : 'Campaign'}
        </button>

        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'examples'
              ? 'border-indigo-650 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {language === 'fr' ? 'Démos' : 'Demos'}
        </button>

        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'adjust'
              ? 'border-indigo-650 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          {language === 'fr' ? 'Ajustements IA' : 'AI Polishing'}
        </button>
      </div>

      {/* TAB CONTENTS CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4">
        
        {/* TAB 1: CREATE CAMPAGNE */}
        {activeTab === 'create' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* SPECIAL CASE CLIENT WEBSITE URL */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
              <label htmlFor="client-url-input" className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center justify-between">
                <span>🌐 {language === 'fr' ? "SITE INTERNET DU CLIENT" : "CLIENT'S WEBSITE"}</span>
                <span className="text-[9px] font-bold text-indigo-700 font-sans">Mandatory *</span>
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Link2 className="w-3.5 h-3.5 text-indigo-505" />
                  </span>
                  <input
                    id="client-url-input"
                    type="text"
                    placeholder="ex: ma-marque-responsable.fr"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAnalyzeWebsite();
                      }
                    }}
                    className="w-full bg-white border border-slate-210 text-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-3xs font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeWebsite}
                  disabled={isAnalyzing || url.trim().length < 3}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[10.5px] font-extrabold rounded-lg hover:shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    language === 'fr' ? "Scanner" : "Scan"
                  )}
                </button>
              </div>

              {analysisError && (
                <p className="text-[9.5px] text-red-650 bg-red-50 border border-red-200 px-2 py-1 rounded font-semibold">
                  ⚠️ {analysisError}
                </p>
              )}

              {/* BRAND LOGO DRAG 'N' DROP */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                  🖼️ {language === 'fr' ? "Logo Officiel de votre Marque" : "Official Brand Logo"}
                </span>

                {settings.logoUrl ? (
                  <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl shadow-3xs">
                    <div className="relative flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg p-1 w-9 h-9 flex-shrink-0 overflow-hidden">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo Marque" 
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-black text-slate-800 truncate">
                        {language === 'fr' ? "Logo Intégré" : "Logo Connected"}
                      </p>
                      <p className="text-[8.5px] text-slate-450 truncate">
                        {language === 'fr' ? "S'affiche en haut de chaque fiche" : "Visible inside social slides"}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, logoUrl: "" })}
                      className="p-1.5 bg-red-50 hover:bg-red-150 text-red-650 rounded-lg transition cursor-pointer"
                      title={language === 'fr' ? "Retirer" : "Remove"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragEnter={handleLogoDrag}
                    onDragOver={handleLogoDrag}
                    onDragLeave={handleLogoDrag}
                    onDrop={handleLogoDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                      dragActive 
                        ? 'border-indigo-500 bg-indigo-50/50' 
                        : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                      onChange={handleLogoInputChange}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-indigo-500 mx-auto mb-1 animate-bounce" />
                    <p className="text-[10px] font-bold text-slate-700">
                      {language === 'fr' ? "Sélectionner ou Glisser le logo" : "Upload or drag your brand logo"}
                    </p>
                    <p className="text-[8px] text-slate-400 mt-0.5">
                      PNG, JPG, SVG transparents • Max 2Mo
                    </p>
                  </div>
                )}

                {/* LOGO URL OPTIONAL INPUT */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowUrlLogoInput(!showUrlLogoInput)}
                    className="text-[9px] text-indigo-650 hover:underline font-extrabold cursor-pointer"
                  >
                    {showUrlLogoInput ? (language === 'fr' ? "Masquer saisie URL" : "Hide URL option") : (language === 'fr' ? "Ou lier par URL d'image" : "Or link from image URL")}
                  </button>
                </div>

                {showUrlLogoInput && (
                  <input
                    type="text"
                    placeholder="https://mon-site.com/images/logo.png"
                    value={settings.logoUrl || ""}
                    onChange={(e) => onUpdateSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full bg-white border border-slate-205 text-slate-800 rounded-md py-1 px-2 text-[9.5px] focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                )}
              </div>
            </div>

            {/* FORMAT DE CAMPAGNE (STATIC CAROUSEL VS LINKEDIN POSTS) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                ✨ {language === 'fr' ? "FORMAT DE PRODUCTION DESIGN" : "PRODUCTION DESIGN FORMAT"}
              </label>

              <div className="grid grid-cols-2 gap-2 text-center">
                {/* Format 1: Carousel Slides */}
                <button
                  type="button"
                  onClick={() => onUpdateCampaignType('static-carousel')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer h-[84px] ${
                    campaignType === 'static-carousel' || campaignType === 'video-animated'
                      ? 'bg-slate-900 border-slate-950 text-white font-black shadow-sm'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">🗂️</span>
                  <span className="text-[10px] font-black leading-none truncate w-full">
                    {language === 'fr' ? 'Séquence Carrousel' : 'Slide Deck'}
                  </span>
                  <span className={`text-[7px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                    campaignType === 'static-carousel' || campaignType === 'video-animated' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    PDF / SLIDES
                  </span>
                </button>

                {/* Format 2: LinkedIn social posts */}
                <button
                  type="button"
                  onClick={() => onUpdateCampaignType('linkedin-3-posts')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer h-[84px] ${
                    campaignType === 'linkedin-3-posts'
                      ? 'bg-slate-900 border-slate-950 text-white font-black shadow-sm'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">✍️</span>
                  <span className="text-[10px] font-black leading-none truncate w-full">
                    {language === 'fr' ? 'Campagne 3 Posts' : 'LinkedIn Posts Pack'}
                  </span>
                  <span className={`text-[7px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                    campaignType === 'linkedin-3-posts' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    SOCIAL COPY
                  </span>
                </button>
              </div>

              <p className="text-[9.5px] text-slate-450 leading-relaxed font-semibold text-center mt-1">
                {campaignType === 'linkedin-3-posts'
                  ? (language === 'fr' ? "Génère 3 posts d'influence complémentaires (Problème, Caractéristiques, Vision)." : "Drafts 3 tailored business posts (Friction, Product depth, Culture & Vision).")
                  : (language === 'fr' ? "Construit une suite de fiches visuelles structurées à fort engagement (type PDF)." : "Builds sequence pages mapped closely onto details crawled from the URL.")}
              </p>
            </div>

            {/* AI INSTRUCTIONS / THEMATIQUES */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
              <label htmlFor="prompt-guidelines-textarea" className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">
                📝 {language === 'fr' ? "OBJECTIFS & SPECIFICATIONS DE L'IA" : "AI BRIEF & TARGET SPECIFICATION"}
              </label>

              <textarea
                id="prompt-guidelines-textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={language === 'fr' 
                  ? "Indiquez l'audience cible, l'offre ou la promotion, ou laissez l'IA composer automatiquement suite au scan du site web du client..." 
                  : "State custom keywords, targets or services, or let the AI draft automatically after the client web scan completed..."}
                className="w-full bg-white border border-slate-210 text-slate-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-3xs font-semibold leading-relaxed"
              />
              <p className="text-[9px] text-slate-450 font-semibold leading-normal">
                💡 {language === 'fr' ? "Plus vos thèmes sont précis, plus le rendu sera aligné à la marque." : "Detailed topics ensure absolute alignment with customer's existing identity."}
              </p>
            </div>

            {/* SLIDES COUNT & VISUAL PALETTE STYLES */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-4 shadow-2xs">
              
              {/* SLIDES COUNT SLIDER */}
              {campaignType !== 'linkedin-3-posts' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                      🔢 {language === 'fr' ? "Nombre de Slides" : "Number of Slides"}
                    </span>
                    <span className="text-[11px] font-black font-mono text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
                      {activeSlideCount} slides
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={6}
                    step={1}
                    value={activeSlideCount}
                    onChange={(e) => onUpdateSettings({ ...settings, slideCount: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                  <p className="text-[9px] text-slate-450 leading-none">
                    {language === 'fr' ? "L'IA composera exactement le nombre de fiches requis." : "Each slide details one major service aspect."}
                  </p>
                </div>
              )}

              {/* PALETTE THEMES SELECTOR */}
              <div className="space-y-1.5">
                <label htmlFor="theme-select-sidebar" className="text-[11px] font-black text-slate-800 uppercase tracking-widest block">
                  🎨 {language === 'fr' ? "Style Épuré & Palette" : "Sleek Palette Style"}
                </label>
                <div className="relative">
                  <select
                    id="theme-select-sidebar"
                    value={settings.visualTheme || "modern-dark"}
                    onChange={(e) => onUpdateSettings({ ...settings, visualTheme: e.target.value })}
                    className="w-full bg-white border border-slate-215 rounded-lg py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-3xs font-semibold cursor-pointer text-slate-800 appearance-none"
                  >
                    {VISUAL_THEMES.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 text-xs font-bold">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* GENERATE ACTION BUTTON */}
            <button
              id="btn-sidebar-generate-action"
              type="button"
              disabled={isGenerating || isAnalyzing}
              onClick={handleLaunchCampaign}
              className={`w-full py-4 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 text-white shadow-md bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer select-none ${
                (isGenerating || isAnalyzing) ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'fr' ? "Rédaction sémantique en cours..." : "Generating social campaigns..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {language === 'fr' ? "🚀 GÉNÉRER LA CAMPAGNE SÉMANTIQUE" : "🚀 GENERATE BRAND CAMPAIGN"}
                  </span>
                </>
              )}
            </button>

          </div>
        )}

        {/* TAB 2: EXAMPLES */}
        {activeTab === 'examples' && (
          <div className="space-y-3.5 animate-in fade-in duration-150 text-left">
            <div className="border border-indigo-100 bg-indigo-50/50 p-3.5 rounded-xl space-y-1 select-none">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                💡 {language === 'fr' ? 'Démonstrations de Marques' : 'Pre-Engineered Examples'}
              </h3>
              <p className="text-[10px] text-indigo-850 font-semibold leading-relaxed">
                {language === 'fr' 
                  ? "Sélectionnez une enseigne culinaire, RSE, ou technologique ci-dessous pour apprécier la fidélité de l'app." 
                  : "Pick a demo below and test how the generator instantly maps client products to structural slide layouts."}
              </p>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_SOURCE_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setUrl(ex.url);
                    setPrompt(ex.prompt);
                    onUpdateSettings({
                      ...settings,
                      visualTheme: ex.theme,
                      name: ex.title.split(' - ')[0]
                    });
                    setActiveTab('create');
                  }}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-350 p-3 rounded-xl transition text-left cursor-pointer space-y-1.5 shadow-3xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800">{ex.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono underline truncate leading-none">{ex.url}</p>
                  <p className="text-[9.5px] text-slate-500 italic font-semibold line-clamp-2 leading-normal">"{ex.prompt}"</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ADJUST (COPILOT ADJUSTMENT THREAD) */}
        {activeTab === 'adjust' && (
          <div className="space-y-4 animate-in fade-in duration-150 flex flex-col h-full text-left">
            
            <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl space-y-1 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                🤖 {language === 'fr' ? 'Co-Pilote Aura : Instructions directes' : 'Co-Pilot Conversational tuning'}
              </h3>
              <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed">
                {language === 'fr' 
                  ? "Refaites des passes d'IA en transmettant de simples retours rédigés en français (couleurs, slogans, textes)." 
                  : "Refine slide copies, colors, or highlighted headers with smart chat guidelines."}
              </p>
            </div>

            {/* CHAT MESSAGES THREAD */}
            <div className="flex-1 min-h-[160px] max-h-[300px] overflow-y-auto space-y-2.5 border-b border-t border-slate-150 py-2.5 pr-1 scrollbar-thin">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-semibold ${
                    msg.sender === 'user' 
                      ? 'bg-slate-900 border border-black text-white rounded-tr-none' 
                      : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    <p>{msg.text}</p>
                    <span className="text-[7.5px] opacity-60 text-right block mt-1 font-mono font-medium">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* MESSAGE INPUT SUBMIT FORM */}
            <form onSubmit={handleSendCopilotAdjustment} className="flex gap-2">
              <input
                type="text"
                value={copilotFeedbackInput}
                onChange={(e) => setCopilotFeedbackInput(e.target.value)}
                placeholder={language === 'fr' ? "ex: Traduis le post 1 en anglais..." : "e.g. Translate post 1..."}
                disabled={isAdjusting || !hasGenerated}
                className="flex-1 bg-white border border-slate-215 rounded-xl py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-3xs font-semibold disabled:opacity-45"
              />
              <button
                type="submit"
                disabled={isAdjusting || !copilotFeedbackInput.trim() || !hasGenerated}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition disabled:opacity-35 cursor-pointer flex-shrink-0"
              >
                {isAdjusting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  language === 'fr' ? "Appliquer" : "Apply"
                )}
              </button>
            </form>

            {!hasGenerated && (
              <p className="text-[9.5px] text-amber-600 bg-amber-55/10 border border-amber-500/15 p-2 rounded-lg font-semibold select-none text-center">
                📊 {language === 'fr' ? "Déclenchez d'abord l'analyse et la génération de campagne." : "Generate a campaign ad first to enable conversation adjustments."}
              </p>
            )}
          </div>
        )}

      </div>

      {/* FOOTER SECTION */}
      <footer className="p-3 border-t border-slate-100 bg-slate-50/50 select-none text-center text-[9px] font-mono font-semibold text-slate-400 flex items-center justify-center gap-1">
        <span>Made with</span>
        <Heart className="w-3 h-3 text-rose-500" />
        <span>for Client Success & Growth</span>
      </footer>

    </aside>
  );
}
