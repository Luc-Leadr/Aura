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
  Trash2,
  RefreshCw
} from "lucide-react";
import { SAMPLE_SOURCE_EXAMPLES, VISUAL_THEMES, PRESET_AVATARS, I18N_DICTS } from "../constants";
import { Project, Scene, ProjectSettings, AspectRatio } from "../types";

interface SidebarProps {
  settings: ProjectSettings;
  onUpdateSettings: (s: ProjectSettings) => void;
  onUpdateProject?: (p: Project) => void;
  onGenerateStoryboard: (payload: { prompt: string; url: string; scriptVibe: string; slideCount: number; workingLanguage: 'fr' | 'en' }) => Promise<void>;
  isGenerating: boolean;
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  workingLanguage: 'fr' | 'en';
  setWorkingLanguage: (lang: 'fr' | 'en') => void;
  onLoadPresetDemo: () => void;
  onAnalyzeWebsiteComplete?: (data: any) => void;
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
  onAnalyzeWebsiteComplete
}: SidebarProps) {
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [scriptVibe, setScriptVibe] = useState("energetic marketing");
  const [activeTab, setActiveTab] = useState<'create' | 'examples' | 'settings'>('create');
  
  // Website auto-proposition states
  const [analysisResult, setAnalysisResult] = useState<{
    detectedTitle: string;
    suggestedSlogan: string;
    understandingSummary: string;
    suggestedPlatform: 'tiktok' | 'instagram' | 'linkedin';
    suggestedVisualTheme: string;
    suggestedTone: string;
    scrapedLogoUrl: string;
    extractedTopics: Array<{ id: string; title: string; description: string; selected: boolean }>;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Local drag-and-drop states
  const [dragActive, setDragActive] = useState(false);
  const [showUrlLogoInput, setShowUrlLogoInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI COMPANION STATES ---
  const [isCompanionActive, setIsCompanionActive] = useState(true);
  const [companionStep, setCompanionStep] = useState<1 | 2 | 3 | 4>(1);
  const [companionStatusMsg, setCompanionStatusMsg] = useState("");
  const [companionUrlInput, setCompanionUrlInput] = useState("");
  const [companionManualInputText, setCompanionManualInputText] = useState("");
  const [companionHasUrl, setCompanionHasUrl] = useState<boolean | null>(null);
  const [companionCustomObjective, setCompanionCustomObjective] = useState("");
  const [companionAnswers, setCompanionAnswers] = useState({
    objective: "",
    url: "",
    manualText: "",
    theme: "stark-monochrome"
  });

  // Translation helpers
  const t = I18N_DICTS[language];

  // Default parameters if undefined
  const activePlatform = settings.platform || 'tiktok';
  const activeSlideCount = settings.slideCount || 4;

  const handleAnalyzeWebsite = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl || targetUrl.trim().length < 3) {
      setAnalysisError(language === 'fr' ? "Veuillez saisir une adresse URL valide." : "Please enter a valid URL address.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), language: workingLanguage })
      });
      if (!response.ok) {
        let errorMsg = language === 'fr' 
          ? "L'analyse du site a échoué. Vérifiez que l'URL est correcte et accessible."
          : "Analyzing webpage failed. Verify URL is correct and reachable.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      if (data && data.extractedTopics) {
        setAnalysisResult({
          detectedTitle: data.detectedTitle || "Ma Marque",
          suggestedSlogan: data.suggestedSlogan || "",
          understandingSummary: data.understandingSummary || "",
          suggestedPlatform: (data.suggestedPlatform === "tiktok" || data.suggestedPlatform === "instagram" || data.suggestedPlatform === "linkedin") ? data.suggestedPlatform : "instagram",
          suggestedVisualTheme: data.suggestedVisualTheme || "modern-dark",
          suggestedTone: data.suggestedTone || "energetic marketing",
          scrapedLogoUrl: data.scrapedLogoUrl || "",
          extractedTopics: data.extractedTopics.map((topic: any) => ({
            ...topic,
            selected: true
          }))
        });

        if (onAnalyzeWebsiteComplete) {
          onAnalyzeWebsiteComplete({
            ...data,
            targetUrl: targetUrl.trim()
          });
        }

        // Push recommendations directly into active project settings
        const proposedPlatform = data.suggestedPlatform || 'instagram';
        let targetRatio: AspectRatio = '1:1';
        if (proposedPlatform === 'linkedin') targetRatio = '16:9';
        else if (proposedPlatform === 'tiktok') targetRatio = '9:16';

        const suggestedThemeId = data.suggestedVisualTheme || "modern-dark";
        const selectedThemePreset = VISUAL_THEMES.find(vt => vt.id === suggestedThemeId) || VISUAL_THEMES[0];

        // Dynamically build premium draft scenes based on crawled H1 & topics before launching final AI generation
        const proposedScenes: Scene[] = data.extractedTopics.map((topic: any, i: number) => ({
          id: `draft-scene-${i}-${Date.now()}`,
          duration: 5,
          subtitle: topic.description || "Présentation de notre concept phare",
          visual: {
            title: topic.title || "Innovation Aura",
            subtitle: data.detectedTitle || "Ma Marque",
            accentWord: topic.title ? topic.title.split(' ')[0] : "Aura",
            backgroundColor: selectedThemePreset.bgGradient,
            backgroundType: "gradient",
            textPosition: "center",
            textStyle: suggestedThemeId === "stark-monochrome" ? "impact" : "bordered",
            animationType: suggestedThemeId === "stark-monochrome" ? "reveal" : "drift",
            assetKeywords: topic.title || "abstract minimalist",
            fontFamily: selectedThemePreset.font || "inter",
            customAccentColor: ""
          },
          audio: {
            voiceName: "Zephyr",
            speechSpeed: 1,
            backgroundMusicVibe: "lofi",
            volume: 0.8
          },
          transition: "fade"
        }));

        if (onUpdateProject) {
          onUpdateProject({
            settings: {
              ...settings,
              name: data.detectedTitle || settings.name,
              platform: proposedPlatform,
              aspectRatio: targetRatio,
              visualTheme: suggestedThemeId,
              logoUrl: data.scrapedLogoUrl || settings.logoUrl,
              slideCount: data.extractedTopics.length,
              workingLanguage: workingLanguage,
              interfaceLanguage: language
            },
            scenes: proposedScenes
          });
        } else {
          onUpdateSettings({
            ...settings,
            name: data.detectedTitle || settings.name,
            platform: proposedPlatform,
            aspectRatio: targetRatio,
            visualTheme: suggestedThemeId,
            logoUrl: data.scrapedLogoUrl || settings.logoUrl,
            slideCount: data.extractedTopics.length,
            workingLanguage: workingLanguage,
            interfaceLanguage: language
          });
        }

        setScriptVibe(data.suggestedTone || "energetic marketing");
        
        // Build clear description prompt based on working language preferred
        const bulletPoints = data.extractedTopics.map((t: any) => `- ${t.title}: ${t.description}`).join("\n");
        setPrompt(`Slogan: ${data.suggestedSlogan || ""}\n\nThèmes sélectionnés à aborder:\n${bulletPoints}`);
      } else {
        throw new Error(language === 'fr' ? "Aucun sujet exploitable n'a été extrait." : "No usable topics extracted from the webpage.");
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Error analyzing website.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTopic = (id: string) => {
    if (!analysisResult) return;
    const updatedTopics = analysisResult.extractedTopics.map(t => {
      if (t.id === id) {
        return { ...t, selected: !t.selected };
      }
      return t;
    });
    setAnalysisResult({
      ...analysisResult,
      extractedTopics: updatedTopics
    });

    const checkedTopics = updatedTopics.filter(t => t.selected);
    onUpdateSettings({
      ...settings,
      slideCount: Math.max(1, checkedTopics.length)
    });

    const bulletPoints = checkedTopics.map((t: any) => `- ${t.title}: ${t.description}`).join("\n");
    setPrompt(`Slogan: ${analysisResult.suggestedSlogan || ""}\n\nThèmes sélectionnés à aborder:\n${bulletPoints}`);
  };

  const toggleAllTopics = (select: boolean) => {
    if (!analysisResult) return;
    const updatedTopics = analysisResult.extractedTopics.map(t => ({ ...t, selected: select }));
    setAnalysisResult({
      ...analysisResult,
      extractedTopics: updatedTopics
    });
    const checkedTopics = updatedTopics.filter(t => t.selected);
    onUpdateSettings({
      ...settings,
      slideCount: Math.max(1, checkedTopics.length)
    });
    const bulletPoints = checkedTopics.map((t: any) => `- ${t.title}: ${t.description}`).join("\n");
    setPrompt(`Slogan: ${analysisResult.suggestedSlogan || ""}\n\nThèmes sélectionnés à aborder:\n${bulletPoints}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateStoryboard({ 
      prompt, 
      url, 
      scriptVibe,
      slideCount: activeSlideCount,
      workingLanguage
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
    if (language === 'fr') {
      setUrl("https://www.le-grub.com");
      setPrompt("Présenter l'ADN créatif du co-coding Culinaire Le Grub. Mettre en valeur l'espace atelier partagé par des chefs labellisés, les plaques de cuisson partagées et de délicieux plats du terroir.");
      setScriptVibe("inspiring brand story");
      onUpdateSettings({
        ...settings,
        platform: "instagram",
        aspectRatio: "1:1",
        slideCount: 4,
        visualTheme: "sandstone-luxury"
      });
    } else {
      setUrl("https://www.le-grub.com");
      setPrompt("Highlight the creative DNA of Le Grub Culinary Workspace. Showcase the shared designer atelier kitchen utilized by culinary artisans and certified terroir organic plates.");
      setScriptVibe("inspiring brand story");
      onUpdateSettings({
        ...settings,
        platform: "instagram",
        aspectRatio: "1:1",
        slideCount: 4,
        visualTheme: "sandstone-luxury"
      });
    }
  };

  const loadExample = (ex: any) => {
    setUrl(ex.url);
    setPrompt(ex.prompt);
    setScriptVibe(ex.vibe === "Inspiring & Ecological" ? "inspiring brand story" : "energetic marketing");
    onUpdateSettings({
      ...settings,
      visualTheme: ex.theme,
      platform: ex.theme === "neon-pulse" ? "tiktok" : "instagram",
      aspectRatio: ex.theme === "neon-pulse" ? "9:16" : "1:1"
    });
    setActiveTab('create');
  };

  const getThemeNameLocal = (themeId: string) => {
    const matched = VISUAL_THEMES.find(v => v.id === themeId);
    return matched ? matched.name : themeId;
  };

  return (
    <aside id="aura-sidebar" className="w-[380px] bg-white border-r border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Upper Brand panel & Language Pickers */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 select-none flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-indigo-650 rounded-lg text-white">
                <Video className="w-5 h-5" />
              </span>
              <h1 className="text-sm font-black font-sans tracking-tight text-slate-800 uppercase">
                AURA MOTION
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              {t.tagline}
            </p>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-0.5 rounded border border-emerald-200">
            {t.creative_mode}
          </span>
        </div>

        {/* Dynamic Dual Language Switcher controls */}
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-2">
          {/* Interface Lang */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-indigo-500" /> Language UI
            </span>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={() => setLanguage('fr')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${language === 'fr' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-205 text-slate-600'}`}
              >
                FR 🇫🇷
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-205 text-slate-600'}`}
              >
                EN 🇬🇧
              </button>
            </div>
          </div>

          {/* Working Script generation Lang */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-500" /> Langue de Travail (Script IA)
            </span>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={() => setWorkingLanguage('fr')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${workingLanguage === 'fr' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-205 text-slate-600'}`}
              >
                FR 🥖
              </button>
              <button 
                type="button"
                onClick={() => setWorkingLanguage('en')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${workingLanguage === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-205 text-slate-600'}`}
              >
                EN 🗽
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list Bar */}
      <div className="flex border-b border-slate-100 select-none text-xs">
        <button
          id="btn-tab-create"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-705'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t.tab_create}
        </button>
        <button
          id="btn-tab-examples"
          onClick={() => setActiveTab('examples')}
          className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'examples'
              ? 'border-indigo-600 text-indigo-705'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {t.tab_ready}
        </button>
        <button
          id="btn-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-705'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          {t.tab_report}
        </button>
      </div>

      {/* Primary content area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* COMPANION TOGGLE BAR */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-[10px] uppercase font-bold select-none tracking-tight">
              <button
                type="button"
                onClick={() => setIsCompanionActive(true)}
                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 cursor-pointer transition ${
                  isCompanionActive 
                    ? 'bg-white text-indigo-750 shadow-xs border border-indigo-200/40 font-black' 
                    : 'text-slate-500 hover:text-slate-850 font-semibold'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                {language === 'fr' ? '🎯 Co-Pilote (Brief IA)' : '🎯 AI Co-Pilot Brief'}
              </button>
              <button
                type="button"
                onClick={() => setIsCompanionActive(false)}
                className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1 cursor-pointer transition ${
                  !isCompanionActive 
                    ? 'bg-white text-indigo-750 shadow-xs border border-indigo-200/40 font-black' 
                    : 'text-slate-500 hover:text-slate-850 font-semibold'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                {language === 'fr' ? '⚙️ Manuel Classique' : '⚙️ Custom/Manual'}
              </button>
            </div>

            {isCompanionActive ? (
              <div className="space-y-4 font-sans select-none animate-in fade-in duration-300">
                {/* Header / Intro Card */}
                <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white relative flex-shrink-0 font-bold border border-indigo-400">
                      🤖
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black tracking-tight uppercase">Aura Co-Pilote</h3>
                      <p className="text-[9px] text-slate-450 font-medium">Brief interactif & épuré</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanionStep(1);
                      setCompanionAnswers({
                        objective: "",
                        url: "",
                        manualText: "",
                        theme: "stark-monochrome"
                      });
                      setCompanionUrlInput("");
                      setCompanionManualInputText("");
                      setCompanionHasUrl(null);
                      setUrl("");
                      setPrompt("");
                      setAnalysisResult(null);
                    }}
                    className="text-[9px] text-indigo-400 hover:text-indigo-305 font-bold flex items-center gap-1 bg-white/5 py-1 px-2 rounded-md hover:bg-white/10 cursor-pointer"
                  >
                    🔄 {language === 'fr' ? 'Recommencer' : 'Reset'}
                  </button>
                </div>

                {/* MESSAGE LIST THREAD */}
                <div className="space-y-4 pr-0.5">
                  {/* --- STEP 1: WELCOME & OBJECTIVE --- */}
                  <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] flex-shrink-0 border">🤖</div>
                    <div className="bg-slate-50 border border-slate-200/75 p-3 rounded-2xl rounded-tl-none max-w-[88%] text-[11px] leading-relaxed font-semibold text-slate-800 space-y-2">
                      <p>
                        {language === 'fr' 
                          ? "Bonjour ! Je suis l'agent co-pilote d'Aura. 🫡 Avant de générer votre storyboard publicitaire, faisons ensemble un rapide brief afin de cibler l'essentiel de votre message."
                          : "Hello! I am Aura's campaign advisor. 🫡 Let's map your key messaging to keep the video extremely clean, uncluttered, and readable."}
                      </p>
                      <p className="font-extrabold text-indigo-950">
                        {language === 'fr'
                          ? "Quel est l'objectif premier de cette vidéo publicitaire ?"
                          : "What is the primary objective of this ad campaign?"}
                      </p>
                    </div>
                  </div>

                  {/* Step 1 Output / Choices */}
                  {companionStep === 1 ? (
                    <div className="pl-8 space-y-2 animate-in fade-in duration-200">
                      <div className="flex flex-col gap-1.5">
                        {[
                          { 
                            id: 'saas_product', 
                            labelFr: "🚀 Promouvoir un produit ou SaaS (Énergique)", 
                            labelEn: "🚀 Sell a product or SaaS (Punchy)",
                            objectiveFr: "Promouvoir notre produit SaaS de manière percutante avec un rythme intense et des bénéfices clairs.",
                            objectiveEn: "Promote a SaaS product with a high-converting, energetic commercial rhythm.",
                            platform: 'tiktok' as const,
                            vibe: 'energetic marketing'
                          },
                          { 
                            id: 'concept_explainer', 
                            labelFr: "🎓 Expliquer un concept ou service (Didactique)", 
                            labelEn: "🎓 Explain a complex service or concept (Clean)",
                            objectiveFr: "Présentation claire, épurée et didactique de notre fonctionnement sans jargon inutile.",
                            objectiveEn: "Clear, clean, didactic breakdown of our operations without complex fluff.",
                            platform: 'linkedin' as const,
                            vibe: 'educational explainer'
                          },
                          { 
                            id: 'brand_story', 
                            labelFr: "🌟 Storytelling & Valeurs de marque (Inspirant)", 
                            labelEn: "🌟 Build trust / Brand Values (Inspiring)",
                            objectiveFr: "Histoire inspirante transmettant la vision et l'excellence humaine de notre marque.",
                            objectiveEn: "Inspiring brand vision showcasing our values and professional standards.",
                            platform: 'instagram' as const,
                            vibe: 'inspiring brand story'
                          }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const chosenObj = language === 'fr' ? opt.objectiveFr : opt.objectiveEn;
                              setCompanionAnswers(prev => ({ ...prev, objective: chosenObj }));
                              setPrompt(chosenObj);
                              handleSelectPlatform(opt.platform);
                              setScriptVibe(opt.vibe);
                              setCompanionStep(2);
                            }}
                            className="w-full text-left p-2.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 rounded-xl text-xs font-black text-slate-705 transition cursor-pointer flex justify-between items-center"
                          >
                            <span>{language === 'fr' ? opt.labelFr : opt.labelEn}</span>
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono truncate">{opt.platform}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom target input for customized needs */}
                      <div className="pt-1 flex gap-1.5">
                        <input
                          type="text"
                          placeholder={language === 'fr' ? "Ou saisissez votre objectif sur-mesure..." : "Or type a custom marketing goal..."}
                          value={companionCustomObjective}
                          onChange={(e) => setCompanionCustomObjective(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && companionCustomObjective.trim()) {
                              e.preventDefault();
                              setCompanionAnswers(prev => ({ ...prev, objective: companionCustomObjective.trim() }));
                              setPrompt(companionCustomObjective.trim());
                              setCompanionStep(2);
                            }
                          }}
                          className="flex-1 bg-white border border-slate-205 text-slate-800 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                        <button
                          type="button"
                          disabled={!companionCustomObjective.trim()}
                          onClick={() => {
                            setCompanionAnswers(prev => ({ ...prev, objective: companionCustomObjective.trim() }));
                            setPrompt(companionCustomObjective.trim());
                            setCompanionStep(2);
                          }}
                          className="px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-40"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 items-start mt-0.5 animate-in fade-in duration-200">
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed font-semibold max-w-[80%] flex flex-col items-end shadow-xs">
                        <p>{companionAnswers.objective}</p>
                        <button
                          type="button"
                          onClick={() => setCompanionStep(1)}
                          className="text-[8px] uppercase font-bold text-indigo-200 mt-1.5 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          ✏️ {language === 'fr' ? 'Modifier' : 'Modify'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- STEP 2: CONTENT SOURCE --- */}
                  {companionStep >= 2 && (
                    <div className="space-y-3.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] flex-shrink-0 border">🤖</div>
                        <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-2xl rounded-tl-none max-w-[88%] text-[11px] leading-relaxed font-semibold text-slate-800 space-y-2">
                          <p>
                            {language === 'fr'
                              ? "C'est noté, l'IA ajustera la force du message en ce sens."
                              : "Great focus! The AI will refine titles around this."}
                          </p>
                          <p className="font-extrabold text-indigo-950">
                            {language === 'fr'
                              ? "Disposez-vous d'une adresse de site internet à analyser pour extraire des détails réels (produits, caractéristiques) ? Ou préférez-vous me décrire manuellement votre offre ?"
                              : "Do you have a website URL to extract real, clean facts from? Or do you prefer typing a manual presentation of your product?"}
                          </p>
                        </div>
                      </div>

                      {companionStep === 2 ? (
                        <div className="pl-8 space-y-3 animate-in fade-in duration-200">
                          {companionHasUrl === null && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompanionHasUrl(true);
                                }}
                                className="flex-1 py-3 px-2 bg-white border border-slate-200 hover:border-indigo-500 rounded-xl text-3xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center leading-snug"
                              >
                                🌐 {language === 'fr' ? 'Analyser mon site web' : 'Analyze my website'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompanionHasUrl(false);
                                }}
                                className="flex-1 py-3 px-2 bg-white border border-slate-200 hover:border-indigo-500 rounded-xl text-3xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center leading-snug"
                              >
                                ✍️ {language === 'fr' ? 'Saisir descriptif libre' : 'Describe manually'}
                              </button>
                            </div>
                          )}

                          {/* URL SCAN SUBWIDGET */}
                          {companionHasUrl === true && (
                            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-205">
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder={language === 'fr' ? "ex: talkandpost.bemotion.tv" : "e.g. talkandpost.bemotion.tv"}
                                  value={companionUrlInput}
                                  onChange={(e) => setCompanionUrlInput(e.target.value)}
                                  className="flex-1 bg-white border border-slate-205 text-slate-800 rounded-lg py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && companionUrlInput.trim().length > 3) {
                                      e.preventDefault();
                                      setUrl(companionUrlInput.trim());
                                      handleAnalyzeWebsite(companionUrlInput.trim());
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={isAnalyzing || companionUrlInput.trim().length < 3}
                                  onClick={() => {
                                    setUrl(companionUrlInput.trim());
                                    handleAnalyzeWebsite(companionUrlInput.trim());
                                  }}
                                  className="px-3 bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                                >
                                  {isAnalyzing ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    language === 'fr' ? "Scanner" : "Scan"
                                  )}
                                </button>
                              </div>

                              {isAnalyzing && (
                                <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-150 flex items-center gap-2 animate-pulse">
                                  <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin flex-shrink-0" />
                                  <div className="text-[10px]">
                                    <span className="font-extrabold text-indigo-900 block">{language === 'fr' ? "Scanning du site en cours..." : "Scanning webpage..."}</span>
                                    <span className="text-slate-500 font-semibold">{language === 'fr' ? "Extraction intelligente sans blabla d'IA." : "Extracting real headings."}</span>
                                  </div>
                                </div>
                              )}

                              {analysisError && (
                                <div className="bg-red-50 text-red-700 p-2.5 rounded border border-red-105 text-[10px] space-y-1">
                                  <p>{analysisError}</p>
                                  <button 
                                    type="button" 
                                    onClick={() => setCompanionHasUrl(false)} 
                                    className="text-indigo-600 underline text-[9px] font-bold"
                                  >
                                    {language === 'fr' ? "Basculer en mode descriptif simple" : "Switch to manual description text"}
                                  </button>
                                </div>
                              )}

                              {analysisResult && (
                                <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-xl space-y-2 animate-in fade-in duration-200">
                                  <span className="text-[8px] font-mono font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-1.5 py-0.5 rounded">
                                    ✔ {language === 'fr' ? "Détails Réels Extraits" : "Real details verified"}
                                  </span>
                                  <div className="text-[10px] text-slate-700 space-y-1 font-semibold leading-normal">
                                    <p>🏷️ <strong>{language === 'fr' ? 'Marque :' : 'Brand :'}</strong> {analysisResult.detectedTitle}</p>
                                    <p>⚡ <strong>{language === 'fr' ? 'Slogan :' : 'Slogan :'}</strong> &ldquo;{analysisResult.suggestedSlogan}&rdquo;</p>
                                    <p className="text-slate-500 italic mt-1 font-normal line-clamp-2">“{analysisResult.understandingSummary}”</p>
                                  </div>

                                  <div className="border-t border-slate-200/50 pt-2 flex justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCompanionHasUrl(null)}
                                      className="text-[9px] text-slate-500 hover:underline cursor-pointer"
                                    >
                                      ❌ Changer d'URL
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCompanionAnswers(prev => ({ ...prev, url: companionUrlInput.trim() }));
                                        setCompanionStep(3);
                                      }}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md cursor-pointer"
                                    >
                                      {language === 'fr' ? "Valider & Continuer ➡️" : "Confirm & Continue ➡️"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* MANUAL FREE TEXT SUBWIDGET */}
                          {companionHasUrl === false && (
                            <div className="space-y-1.5 animate-in slide-in-from-bottom-2 duration-200">
                              <textarea
                                placeholder={language === 'fr' ? "Mettez ici vos mots clés, caractéristiques authentiques (ex: 'Écriture Ghostwriting', 'Calendrier de Publication', 'Planificateur LinkedIn')..." : "Enter your features, real facts (e.g. 'LinkedIn publishing calendar', 'automated caching layers')..."}
                                value={companionManualInputText}
                                onChange={(e) => setCompanionManualInputText(e.target.value)}
                                rows={3}
                                className="w-full bg-white border border-slate-205 text-slate-850 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500 leading-normal font-semibold"
                              />
                              <div className="flex justify-between items-center mt-1">
                                <button
                                  type="button"
                                  onClick={() => setCompanionHasUrl(null)}
                                  className="text-[9px] text-slate-500 hover:underline cursor-pointer"
                                >
                                  ⬅️ Retour
                                </button>
                                <button
                                  type="button"
                                  disabled={companionManualInputText.trim().length < 5}
                                  onClick={() => {
                                    setCompanionAnswers(prev => ({ ...prev, url: "", manualText: companionManualInputText.trim() }));
                                    setPrompt(companionManualInputText.trim());
                                    setCompanionStep(3);
                                  }}
                                  className="py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-40"
                                >
                                  {language === 'fr' ? "Valider" : "Confirm"}
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Go back */}
                          <div className="pt-2">
                            <button 
                              type="button" 
                              onClick={() => setCompanionStep(1)} 
                              className="text-[9px] text-slate-550 hover:underline cursor-pointer font-bold"
                            >
                              ⬅️ {language === 'fr' ? "Retourner à l'étape 1" : "Back to step 1"}
                            </button>
                          </div>
                        </div>
                      ) : (
                    <div className="flex justify-end gap-2 items-start mt-0.5 animate-in fade-in duration-200">
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed font-semibold max-w-[80%] flex flex-col items-end shadow-xs">
                        {companionAnswers.url ? (
                          <p>🌐 {language === 'fr' ? `Site analysé : ${companionAnswers.url}` : `Scanned site: ${companionAnswers.url}`}</p>
                        ) : (
                          <p className="line-clamp-2 italic">&ldquo;{companionAnswers.manualText}&rdquo;</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCompanionStep(2);
                            setCompanionHasUrl(null);
                          }}
                          className="text-[8px] uppercase font-bold text-indigo-200 mt-1.5 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          ✏️ {language === 'fr' ? 'Modifier' : 'Modify'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- STEP 3: STYLE & SLOP REDUCTION --- */}
              {companionStep >= 3 && (
                <div className="space-y-3.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] flex-shrink-0 border">🤖</div>
                    <div className="bg-slate-50 border border-slate-200/85 p-3 rounded-2xl rounded-tl-none max-w-[88%] text-[11px] leading-relaxed font-semibold text-slate-800 space-y-2">
                      <p>
                        {language === 'fr'
                          ? "Superbe. Pour garantir que la vidéo soit d'une lisibilité immédiate, l'IA va optimiser l'affichage avec des contrastes exceptionnels."
                          : "Got it. To ensure outstanding readability on screens, the IA will set ultra high contrast layouts."}
                      </p>
                      <p className="font-extrabold text-indigo-950">
                        {language === 'fr'
                          ? "Quel style graphique et colorimétrique préférez-vous appliquer pour cette campagne ?"
                          : "Which visual style preset aligns closest with your branding?"}
                      </p>
                    </div>
                  </div>

                  {companionStep === 3 ? (
                    <div className="pl-8 space-y-2 animate-in fade-in duration-200">
                      <div className="flex flex-col gap-2">
                        {/* Stark monochrome choice */}
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ ...settings, visualTheme: 'stark-monochrome' });
                            setCompanionAnswers(prev => ({ ...prev, theme: 'stark-monochrome' }));
                            setCompanionStep(4);
                          }}
                          className="w-full text-left p-3 bg-[#0c0c0e] hover:bg-[#111115] border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-3 text-white"
                        >
                          <div className="w-4 h-4 rounded-full bg-white flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-black tracking-tight block">⚫ MINIMAL STARK (Noir & Blanc)</span>
                            <span className="text-[9px] text-slate-400 font-semibold block leading-tight mt-0.5">
                              {language === 'fr' ? "Inspiré des studios de design haut de gamme. Lisibilité maximale sans pollution visuelle." : "Inspired by luxury motion agencies. Extreme clarity, zero distraction."}
                            </span>
                          </div>
                        </button>

                        {/* Modern dark choice */}
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ ...settings, visualTheme: 'modern-dark' });
                            setCompanionAnswers(prev => ({ ...prev, theme: 'modern-dark' }));
                            setCompanionStep(4);
                          }}
                          className="w-full text-left p-3 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-900 hover:border-indigo-700 hover:from-slate-850 hover:to-indigo-900 rounded-xl transition cursor-pointer flex items-center gap-3 text-white"
                        >
                          <div className="w-4 h-4 rounded-full bg-emerald-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-black tracking-tight block">🔵 MODERN STUDIO (Bleu & Émeraude)</span>
                            <span className="text-[9px] text-slate-350 font-semibold block leading-tight mt-0.5">
                              {language === 'fr' ? "Look cinématique profond avec subtiles accentuations menthe émeraude." : "Deep cinematic dark blues with sleek mint emerald highlight tags."}
                            </span>
                          </div>
                        </button>
                      </div>

                      <div className="pt-1 text-left">
                        <button 
                          type="button" 
                          onClick={() => setCompanionStep(2)} 
                          className="text-[9px] text-slate-500 hover:underline cursor-pointer"
                        >
                          ⬅️ Modifier l'étape précédente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 items-start mt-0.5 animate-in fade-in duration-200">
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed font-semibold max-w-[80%] flex flex-col items-end shadow-xs">
                        <p>🎨 {companionAnswers.theme === 'stark-monochrome' 
                          ? (language === 'fr' ? 'Minimal Stark (Noir & Blanc)' : 'Minimal Stark (Black & White)')
                          : (language === 'fr' ? 'Modern Studio (Bleu & Émeraude)' : 'Modern Studio (Blue & Emerald)')}</p>
                        <button
                          type="button"
                          onClick={() => setCompanionStep(3)}
                          className="text-[8px] uppercase font-bold text-indigo-400 mt-1.5 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          ✏️ {language === 'fr' ? 'Modifier' : 'Modify'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- STEP 4: FINAL RECAP & LAUNCH BUTTON --- */}
              {companionStep >= 4 && (
                <div className="space-y-3.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] flex-shrink-0 border">🤖</div>
                    <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl rounded-tl-none max-w-[88%] text-[11px] leading-relaxed font-semibold text-slate-800 space-y-3_5">
                      <p className="font-extrabold text-slate-900 leading-normal">
                        {language === 'fr'
                          ? "Tout est reconfiguré de manière optimale ! ✨ J'ai synthétisé les critères créatifs de votre projet pour garantir un rendu publicitaire à haut taux de conversion."
                          : "Perfect! All settings are reconfigured optimally. ✨ I streamlined the creative constraints to ensure a high-converting output."}
                      </p>

                      <div className="bg-white/80 border border-slate-200 p-2.5 rounded-lg text-[10px] space-y-1.5 font-bold text-slate-600 block shadow-2xs">
                        <div className="flex justify-between border-b pb-1">
                          <span>🏷️ {language === 'fr' ? 'Nom Projet :' : 'Brand Name :'}</span>
                          <span className="text-slate-850 truncate max-w-[140px]">{settings.name || "Aura ad video"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span>📦 {language === 'fr' ? 'Canal / Format :' : 'Target Format :'}</span>
                          <span className="text-indigo-650 font-mono capitalize">{activePlatform} ({settings.aspectRatio})</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span>🎨 {language === 'fr' ? 'Palette épurée :' : 'Sleek Aesthetic :'}</span>
                          <span className="text-slate-850">{getThemeNameLocal(settings.visualTheme)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⏱️ {language === 'fr' ? 'Séquences :' : 'Scenes count :'}</span>
                          <span className="text-slate-850 font-mono">{activeSlideCount || 4} clips</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 italic font-semibold leading-relaxed">
                        {language === 'fr' 
                          ? "💡 L'IA a banni tous les clichés marketing habituels pour se concentrer uniquement sur vos forces clefs. Le storyboard final sera épuré et facile à mémoriser."
                          : "💡 All generic marketing clichés are blocked. Your ad will be uncluttered, and focus on your core features."}
                      </p>

                      {/* Launch call triggers isGenerating state */}
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => {
                          onGenerateStoryboard({ 
                            prompt, 
                            url, 
                            scriptVibe,
                            slideCount: activeSlideCount,
                            workingLanguage
                          });
                        }}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-md bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer ${
                          isGenerating ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-indigo-500/15'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            {language === 'fr' ? 'Génération du storyboard...' : 'Generating ad...'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                            {language === 'fr' ? '🚀 GENERER LE MOTION DESIGN' : '🚀 GENERATE MOTION DESIGN'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form id="aura-creative-form" onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
                {/* Quick onboard hints or custom suggestion widget */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {t.advisor_welcome_title}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {t.advisor_welcome_desc}
                  </p>
                  <button
                    type="button"
                    onClick={suggestIdea}
                    className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    {t.suggest_example_btn}
                  </button>
                </div>

                {/* Platform & format selector row */}
                <div className="space-y-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {t.step_platform}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tiktok', label: 'TikTok/Reels', ratio: '9:16' },
                      { id: 'instagram', label: 'Insta Grid', ratio: '1:1' },
                      { id: 'linkedin', label: 'LinkedIn', ratio: '16:9' }
                    ].map((item) => {
                      const isActive = activePlatform === item.id;
                      return (
                        <button
                          id={`platform-choice-${item.id}`}
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectPlatform(item.id as any)}
                          className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-650 text-white font-bold scale-[1.01] shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold">{item.label}</span>
                          <span className="text-[8px] opacity-75 font-mono font-medium">{item.ratio}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1: Analyze Website & Extract Core Sequences (The Descript feature) */}
                <div id="step-analyze-container" className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider block">
                    {t.step_analyze}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                        <Link2 className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="input-website-url"
                        type="text"
                        placeholder={t.input_url_placeholder}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm font-medium"
                      />
                    </div>
                    <button
                      id="btn-analyze-website"
                      type="button"
                      onClick={() => handleAnalyzeWebsite()}
                      disabled={isAnalyzing}
                      className="px-3 bg-slate-800 hover:bg-slate-905 text-white text-xs font-bold rounded-lg hover:shadow-xs transition flex items-center gap-1 cursor-pointer flex-shrink-0 disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        t.detect_btn
                      )}
                    </button>
                  </div>

                  {isAnalyzing && (
                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-150 flex items-center gap-2.5 animate-pulse">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin flex-shrink-0" />
                      <div>
                        <h5 className="text-[11px] font-bold text-indigo-900">{t.analyzing_text}</h5>
                        <p className="text-[9px] text-indigo-950/70">{t.analyzing_desc}</p>
                      </div>
                    </div>
                  )}

                  {analysisError && (
                    <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-[10px] border border-red-100 font-medium">
                      {analysisError}
                    </div>
                  )}

                  {/* DESCRIPT-LIKE EXPLICIT VALIDATION CHANNELS / SEQUENCE VERIFICATION STEP */}
                  {analysisResult && (
                    <div className="bg-slate-50/40 p-3 border border-slate-200 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                      
                      {/* AI Brand Comprehension Summary Box */}
                      {analysisResult.understandingSummary && (
                        <div className="bg-indigo-50/60 border border-indigo-150 p-3 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-indigo-850">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider font-sans">
                              {language === 'fr' ? "SYNTHÈSE DE COMPRÉHENSION IA" : "AI COMPREHENSION WRAPUP"}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed font-semibold text-indigo-950">
                            {analysisResult.understandingSummary}
                          </p>
                          
                          {/* Grid of chosen charters */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-indigo-100 text-[10px]">
                            <div className="flex flex-col">
                              <span className="text-indigo-500 text-[8px] font-extrabold uppercase font-mono tracking-tight">
                                {language === 'fr' ? "Charte Graphique Auto" : "Auto Visual Palette"}
                              </span>
                              <span className="font-extrabold text-indigo-900 truncate">
                                🎨 {VISUAL_THEMES.find(vt => vt.id === analysisResult.suggestedVisualTheme)?.name || analysisResult.suggestedVisualTheme}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-indigo-500 text-[8px] font-extrabold uppercase font-mono tracking-tight">
                                {language === 'fr' ? "Cadrage & Ton" : "Framing & Tone"}
                              </span>
                              <span className="font-extrabold text-indigo-900 truncate capitalize">
                                📣 {analysisResult.suggestedPlatform} • {analysisResult.suggestedTone.replace('marketing', '').replace('explainer', '').replace('story', '')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b border-slate-205 pb-1.5">
                        <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-tight">
                          {t.checked_topics_title}
                        </span>
                      </div>

                      <div className="flex gap-2 text-[9px] font-bold">
                        <button 
                          type="button" 
                          onClick={() => toggleAllTopics(true)} 
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          {t.topics_all_check}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          type="button" 
                          onClick={() => toggleAllTopics(false)} 
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          {t.topics_all_uncheck}
                        </button>
                      </div>

                      {/* Checkbox loop of topics deduced by AI */}
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                        {analysisResult.extractedTopics.map((topic) => (
                          <div 
                            id={`topic-item-${topic.id}`}
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={`p-2 border rounded-lg cursor-pointer transition flex items-start gap-2.5 ${
                              topic.selected
                                ? 'bg-emerald-50/20 border-emerald-500/55 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              topic.selected 
                                ? 'bg-emerald-500 border-emerald-600 text-white' 
                                : 'border-slate-300 bg-white'
                            }`}>
                              {topic.selected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0 leading-tight">
                              <h4 className={`text-[11px] font-extrabold truncate ${topic.selected ? 'text-emerald-950 font-bold' : 'text-slate-400 font-medium'}`}>
                                {topic.title}
                              </h4>
                              <p className="text-[9px] mt-0.5 text-slate-500 leading-normal line-clamp-2">
                                {topic.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Extracted slogan placeholder */}
                      {analysisResult.suggestedSlogan && (
                        <div className="bg-white border border-slate-150 p-2 rounded-lg space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">{t.slogan_label}</span>
                          <p className="text-[11px] font-extrabold italic text-indigo-900 leading-tight">
                            &ldquo;{analysisResult.suggestedSlogan}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Custom objectives and Prompt constraints */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider block">
                    {t.step_prompt}
                  </label>
                  <textarea
                    id="textarea-prompt-objective"
                    placeholder={t.textarea_prompt_placeholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm font-medium leading-relaxed resize-none"
                  />
                  <p className="text-[9px] text-slate-400">
                    {t.prompt_help}
                  </p>
                </div>

                {/* Script Vibe Choice */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    {t.voice_vibe_label}
                  </label>
                  <select
                    id="select-script-vibe"
                    value={scriptVibe}
                    onChange={(e) => setScriptVibe(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm font-medium"
                  >
                    <option value="energetic marketing">{language === 'fr' ? '⚡ Vendeur & Énergique (Shorts/TikTok)' : '⚡ Sales & Energetic (Shorts/TikTok)'}</option>
                    <option value="educational explainer">{language === 'fr' ? '🎓 Éducateur & Pédagogique (LinkedIn)' : '🎓 Educator & Explainer (LinkedIn)'}</option>
                    <option value="inspiring brand story">{language === 'fr' ? '🌟 Inspirant & Storytelling de Marque' : '🌟 Inspiring & Brand Storytelling'}</option>
                    <option value="relaxed corporate">{language === 'fr' ? '💼 Professionnel Calme & Raisonné' : '💼 Focused Pro & Quiet corporate'}</option>
                    <option value="dramatic presentation">{language === 'fr' ? '🎭 Théâtral & Cinématographique' : '🎭 Intense & Cinematic'}</option>
                  </select>
                </div>

                {/* Slide Count selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-slate-420 uppercase tracking-wider">
                      {t.step_slides}
                    </label>
                    <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {activeSlideCount} Clips
                    </span>
                  </div>
                  <input
                    id="slider-slide-count"
                    type="range"
                    min={3}
                    max={6}
                    step={1}
                    value={activeSlideCount}
                    onChange={(e) => onUpdateSettings({ ...settings, slideCount: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    {t.slides_recommended}
                  </p>
                </div>

                {/* Quick Palette select */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-extrabold text-slate-405 uppercase tracking-wider">
                    {t.palette_label}
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
                          onClick={() => onUpdateSettings({ ...settings, visualTheme: theme.id })}
                          className={`h-7 rounded-md transition-all relative border cursor-pointer flex items-center justify-center ${theme.bgGradient} ${
                            isActive ? 'border-indigo-600 ring-2 ring-indigo-600/20 scale-105 shadow-sm' : 'border-slate-200 hover:border-slate-305'
                          }`}
                        >
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold italic">
                    {VISUAL_THEMES.find(t => t.id === settings.visualTheme)?.styleDescription}
                  </p>
                </div>

                {/* Custom Logo Uploader section */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{t.logo_label}</span>
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
                        <p className="text-[11px] font-bold text-slate-800 truncate">{t.logo_success}</p>
                        <p className="text-[9px] text-slate-400">{t.logo_sub}</p>
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
                      <p className="text-[11px] font-bold text-slate-800">{t.logo_drag_placeholder}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{t.logo_drag_sub}</p>
                    </div>
                  )}

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowUrlLogoInput(!showUrlLogoInput)}
                      className="text-[9px] text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      {showUrlLogoInput ? "Masquer l'option URL" : t.logo_url_option}
                    </button>
                  </div>

                  {showUrlLogoInput && (
                    <div className="pt-1.5">
                      <input
                        id="input-logo-url-backup"
                        type="text"
                        placeholder={t.logo_url_placeholder}
                        value={settings.logoUrl || ""}
                        onChange={(e) => onUpdateSettings({ ...settings, logoUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Talking Presenter Layout option */}
                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> {t.talking_presenter_label}
                    </label>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      {t.talking_presenter_desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 font-sans">
                    {[
                      { id: 'none', label: t.avatar_none },
                      { id: 'floating', label: t.avatar_bubble },
                      { id: 'split-screen', label: t.avatar_split },
                      { id: 'podcast-bubble', label: t.avatar_podcast }
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
                            avatarUrl: style.id !== 'none' && !settings.avatarUrl ? PRESET_AVATARS[0].imageUrl : settings.avatarUrl,
                            avatarPresetName: style.id !== 'none' && !settings.avatarPresetName ? PRESET_AVATARS[0].name : settings.avatarPresetName
                          })}
                          className={`py-1.5 rounded text-[10px] font-bold border transition-all text-center cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-705 shadow-sm font-black'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>

                  {settings.avatarStyle && settings.avatarStyle !== 'none' && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/65 animate-in fade-in duration-200">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">{t.preset_presenter_label}</span>
                      
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

                      <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{t.custom_avatar_url}</span>
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
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-1 px-2 text-[10px] focus:ring-1 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
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
                      {t.btn_generating_storyboard}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t.btn_generate_storyboard}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-4 font-sans select-none">
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">Note pratique</span>
              <p className="text-[11px] text-indigo-950/80 mt-1 leading-relaxed font-semibold">
                {language === 'fr' 
                  ? "Sélectionnez un projet clé modélisé ci-dessous. Le système configurera l'URL, déduira ses thèmes uniques et remplira les consignes pour une génération clé-en-main."
                  : "Select a key project modeled below. The system will pre-configure URL and prompt so you can easily validate and test."}
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
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-medium font-bold">
                      {ex.vibe}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {ex.prompt}
                  </p>
                  <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5 overflow-hidden font-medium">
                    <Link2 className="w-3 h-3 flex-shrink-0 text-indigo-650" />
                    <span className="truncate">{ex.url}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5 text-xs text-slate-600 font-sans select-none">
            <h3 className="font-bold text-slate-700 tracking-wider uppercase text-xs">Spécifications de l'Outil</h3>
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Modèle Utilisé (Script)</span>
                <p className="text-xs text-slate-800 font-semibold text-emerald-700">Gemini 3.5 Flash & 3.1 Flash-Lite Fallback</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Synthèse Vocale (Voice-Over)</span>
                <p className="text-xs text-slate-800 font-semibold">Gemini 3.1 TTS Preview Audio Pipeline</p>
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
                  className={`p-2.5 rounded border text-center font-bold cursor-pointer transition-all ${
                    settings.exportFormat === 'web-canvas'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  Interactive Player
                </button>
                <button
                  id="export-mp4"
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, exportFormat: 'mp4' })}
                  className={`p-2.5 rounded border text-center font-bold cursor-pointer transition-all ${
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
