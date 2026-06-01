import { useState } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  Download, 
  Check, 
  RefreshCw,
  Film,
  Database,
  SlidersHorizontal,
  Info,
  Folder,
  Settings
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import VideoPlayer from "./components/VideoPlayer";
import Timeline from "./components/Timeline";
import ControlPanel from "./components/ControlPanel";
import { DEFAULT_PROJECT, I18N_DICTS } from "./constants";
import { Project, ProjectSettings, Scene } from "./types";

export default function App() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // High-precision internationalization (i18n) controls
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [workingLanguage, setWorkingLanguage] = useState<'fr' | 'en'>('fr');

  // Strict onboarding/validation state
  const [hasGenerated, setHasGenerated] = useState(false);

  // Applet lifecycle state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [feedbackSlogan, setFeedbackSlogan] = useState<string>("Maximez l'impact de votre communication");
  const [feedbackTone, setFeedbackTone] = useState<string>("Sérieux, technologique et percutant");
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Video render Simulation modal
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepMessage, setExportStepMessage] = useState("");

  // Export location & metadata configuration settings
  const [showExportConfig, setShowExportConfig] = useState(false);
  const [exportDestination, setExportDestination] = useState<'downloads' | 'ask'>('downloads');
  const [exportFilename, setExportFilename] = useState("campagne-aura-motion.mp4");
  const [exportResolution, setExportResolution] = useState<'725p' | '1080p' | '4k'>('1080p');

  const [scrapedBrand, setScrapedBrand] = useState<{
    detectedTitle: string;
    suggestedSlogan: string;
    understandingSummary: string;
    suggestedPlatform: string;
    suggestedVisualTheme: string;
    suggestedTone: string;
    scrapedLogoUrl: string;
    extractedTopics: Array<{ id: string; title: string; description: string }>;
    primaryHeadings: string[];
    secondaryHeadings: string[];
    targetUrl?: string;
  } | null>(null);

  // Advanced layout choices: video-animated vs static-carousel vs linkedin-3-posts
  const [campaignType, setCampaignType] = useState<'video-animated' | 'static-carousel' | 'linkedin-3-posts'>('video-animated');
  const [suggestedLinkedinPost, setSuggestedLinkedinPost] = useState<string>("");
  const [suggestedLinkedinPosts, setSuggestedLinkedinPosts] = useState<string[]>([
    "📍 [Concept & Accroche Unique]\n\nVotre marque mérite une visibilité à la hauteur de son excellence.\n\nPourquoi se contenter de visuels classiques quand vous pouvez avoir une identité de marque animée qui capte l'attention dès la première seconde ? Aura simplifie votre production publicitaire.\n\n✨ Analyse de site dynamique\n✨ Scénarisation IA sans jargon\n✨ Voix off synchronisées et directes\n\nPrêt à transformer vos pages web en clips haut-de-gamme ? Essayez le co-pilote d'Aura dès maintenant !",
    "🚀 [Descript & Fonctionnalités Clés]\n\nInnover, c'est simplifier son message.\n\nComment Aura Motion Studio transforme-t-il la création ?\n\n1. Saisie de votre URL : Analyse de l'ADN sémantique du site.\n2. Storyboard validé : Sélection de tous vos thèmes clés réels.\n3. Rendu instantané : Animations soignées et voix-off adaptées.\n\nUne suite d'outils hautement optimisés pour les créateurs de produits, SaaS et pépites créatives.",
    "🌟 [Valeurs & Vision d'Entreprise]\n\nLa clarté s'oppose au bruit numérique.\n\nChez Aura, nous concevons des formats élégants, épurés et hautement lisibles. Aucun slop IA superflu, aucune fioriture tape-à-l'œil.\n\nChaque mot, chaque typographie et chaque transition est soigneusement calibrée pour asseoir l'autorité professionnelle de votre structure.\n\nQuelles sont vos valeurs clés pour cette saison ?"
  ]);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const t = I18N_DICTS[language];

  const handleUpdateSettings = (newSettings: ProjectSettings) => {
    setProject(prev => ({
      ...prev,
      settings: newSettings
    }));
  };

  const handleUpdateProject = (newProject: Project) => {
    setProject(newProject);
    setHasGenerated(true);
    setActiveSceneIndex(0);
    setCurrentTime(0);
  };

  const handleUpdateScenes = (newScenes: Scene[]) => {
    setProject(prev => ({
      ...prev,
      scenes: newScenes
    }));
    // clamp active index if necessary
    if (activeSceneIndex >= newScenes.length) {
      setActiveSceneIndex(Math.max(0, newScenes.length - 1));
    }
  };

  // Real-time Copilot adjustment trigger via `/api/adjust-storyboard`
  const handleAdjustStoryboard = async (feedback: string) => {
    setIsAdjusting(true);
    setGlobalError(null);
    try {
      const response = await fetch("/api/adjust-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: project.scenes,
          currentLinkedinPost: suggestedLinkedinPost,
          feedback,
          workingLanguage,
          visualTheme: project.settings.visualTheme
        })
      });

      if (!response.ok) {
        throw new Error(language === 'fr' 
          ? "Échec de l'ajustement interactif par Aura." 
          : "Standard Copilot adjustment call failed."
        );
      }

      const outcome = await response.json();
      if (outcome.scenes && outcome.scenes.length > 0) {
        const formattedScenes = outcome.scenes.map((scene: any, i: number) => ({
          id: `adj-scene-${i}-${Date.now()}`,
          duration: Number(scene.duration) || 5,
          subtitle: scene.subtitle || "",
          visual: {
            title: scene.visual?.title || "Aura Message",
            subtitle: scene.visual?.subtitle || "",
            accentWord: scene.visual?.accentWord || "",
            backgroundColor: scene.visual?.backgroundColor || "bg-gradient-to-br from-[#0f172a] to-[#1e293b]",
            backgroundType: scene.visual?.backgroundType || "gradient",
            textPosition: scene.visual?.textPosition || "center",
            textStyle: scene.visual?.textStyle || "minimal",
            animationType: scene.visual?.animationType || "fade",
            assetKeywords: scene.visual?.assetKeywords || "abstract tech",
            fontFamily: scene.visual?.fontFamily || "inter",
            customAccentColor: scene.visual?.customAccentColor
          },
          audio: {
            voiceName: scene.audio?.voiceName || "Zephyr",
            speechSpeed: scene.audio?.speechSpeed || 1,
            backgroundMusicVibe: scene.audio?.backgroundMusicVibe || "lofi",
            volume: 0.8
          },
          transition: scene.transition || "fade"
        }));

        setProject(prev => ({
          ...prev,
          scenes: formattedScenes
        }));

        if (outcome.suggestedLinkedinPosts && Array.isArray(outcome.suggestedLinkedinPosts) && outcome.suggestedLinkedinPosts.length > 0) {
          setSuggestedLinkedinPosts(outcome.suggestedLinkedinPosts);
          setSuggestedLinkedinPost(outcome.suggestedLinkedinPosts[0]);
        } else if (typeof outcome.suggestedLinkedinPost === 'string' && outcome.suggestedLinkedinPost.trim().length > 0) {
          setSuggestedLinkedinPost(outcome.suggestedLinkedinPost);
          const raw = outcome.suggestedLinkedinPost;
          const pieces = raw.split(/---|\n\s*---\s*\n/g).map(p => p.trim()).filter(Boolean);
          if (pieces.length >= 3) {
            setSuggestedLinkedinPosts(pieces.slice(0, 3));
          } else {
            const p1 = raw;
            const p2 = workingLanguage === 'fr'
              ? `🚀 [Innover par l'Offre]\n\nChaque thématique identifiée sur votre site possède une valeur intrinsèque.\n\nFocalisez l'attention de vos prospects sur vos fonctionnalités en rationalisant votre communication produit avec l'assistant Aura.\n\n${raw}`
              : `🚀 [Innover with Features]\n\nEvery unique perspective found on your website drives a business value.\n\nTarget your audience clearly by streamlining your product benefits with Aura.\n\n${raw}`;
            const p3 = workingLanguage === 'fr'
              ? `🌟 [Histoire de Marque & Convictions]\n\nDerrière chaque technologie ou service scanné se trouvent des valeurs humaines fortes et indiscutables.\n\nC'est cette clarté qui fédère vos équipes et vos clients les plus engagés.`
              : `🌟 [Our Grounding Values]\n\nBehind every piece of technology or service analyzed are true human convictions.\n\nIntegrity and precision build authentic professional standards. Join us!`;
            setSuggestedLinkedinPosts([p1, p2, p3]);
          }
        }

        if (outcome.suggestedSlogan) {
          setFeedbackSlogan(outcome.suggestedSlogan);
        }

        setActiveSceneIndex(0);
        setCurrentTime(0);
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Impossible d'appliquer la correction sémantique.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Triggers main server analysis & storyboard creation endpoint
  const handleGenerateStoryboard = async (payload: { prompt: string; url: string; scriptVibe: string; slideCount: number; workingLanguage: 'fr' | 'en' }) => {
    setIsGenerating(true);
    setGlobalError(null);
    
    const logsInitFr = [
      "Initié : Connexion sécurisée au moteur sémantique...",
      "Chargement du module d'analyse multilingue...",
      `Langue cible paramétrée : ${payload.workingLanguage === 'en' ? 'Anglais 🇬🇧' : 'Français 🇫🇷'}`
    ];
    const logsInitEn = [
      "Initiated: Securing semantic node connection...",
      "Booting multilingual text models...",
      `Target processing language set to: ${payload.workingLanguage === 'en' ? 'English 🇬🇧' : 'French 🇫🇷'}`
    ];

    setGenerationLogs(payload.workingLanguage === 'en' ? logsInitEn : logsInitFr);
    
    try {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      if (payload.url) {
        setGenerationLogs(prev => [
          ...prev, 
          language === 'fr' ? `Analyse active du site : ${payload.url}` : `Crawling target page: ${payload.url}`,
          language === 'fr' ? "Scraping du contenu textuel de la page principale..." : "Analyzing structural HTML node contents..."
        ]);
        await delay(700);
      }
      
      setGenerationLogs(prev => [
        ...prev, 
        language === 'fr' 
          ? `Traitement IA avec l'objectif : "${payload.prompt || 'Génération libre'}"` 
          : `Processing intent constraints: "${payload.prompt || 'Free Generation'}"`
      ]);
      await delay(700);

      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: payload.prompt,
          url: payload.url,
          aspectRatio: project.settings.aspectRatio,
          visualTheme: project.settings.visualTheme,
          scriptVibe: payload.scriptVibe,
          slideCount: payload.slideCount,
          workingLanguage: payload.workingLanguage
        })
      });

      if (!response.ok) {
        let serverErrorMessage = "";
        try {
          const rawText = await response.text();
          try {
            const errPayload = JSON.parse(rawText);
            if (errPayload && errPayload.error) {
              serverErrorMessage = `: ${errPayload.error}`;
            }
          } catch (_) {
            if (rawText) {
              const cleanText = rawText.replace(/<\/?[^>]+(>|$)/g, " ").trim().substring(0, 150);
              serverErrorMessage = `: ${cleanText}`;
            }
          }
        } catch (_) {}
        throw new Error(language === 'fr' 
          ? `Erreur de traitement (Serveur Code: ${response.status})${serverErrorMessage}` 
          : `Generation failed (Server Code: ${response.status})${serverErrorMessage}`
        );
      }

      const outcome = await response.json();
      
      if (outcome.scenes && outcome.scenes.length > 0) {
        // Refit response to local layout
        const formattedScenes = outcome.scenes.map((scene: any, i: number) => ({
          id: `ai-scene-${i}-${Date.now()}`,
          duration: Number(scene.duration) || 5,
          subtitle: scene.subtitle || "Message sous-titré généré par l'IA",
          visual: {
            title: scene.visual?.title || "Aura Message",
            subtitle: scene.visual?.subtitle || "",
            accentWord: scene.visual?.accentWord || "",
            backgroundColor: scene.visual?.backgroundColor || "bg-gradient-to-br from-[#0f172a] to-[#1e293b]",
            backgroundType: scene.visual?.backgroundType || "gradient",
            textPosition: scene.visual?.textPosition || "center",
            textStyle: scene.visual?.textStyle || "minimal",
            animationType: scene.visual?.animationType || "fade",
            assetKeywords: scene.visual?.assetKeywords || "abstract tech",
            fontFamily: scene.visual?.fontFamily || "inter",
            customAccentColor: scene.visual?.customAccentColor
          },
          audio: {
            voiceName: scene.audio?.voiceName || "Zephyr",
            speechSpeed: scene.audio?.speechSpeed || 1,
            backgroundMusicVibe: scene.audio?.backgroundMusicVibe || "lofi",
            volume: 0.8
          },
          transition: scene.transition || "fade"
        }));

        setScrapedBrand({
          detectedTitle: project.settings.name || outcome.suggestedSlogan || "Ma Marque",
          suggestedSlogan: outcome.suggestedSlogan || "",
          understandingSummary: outcome.detectedTone || "",
          suggestedPlatform: project.settings.platform || "tiktok",
          suggestedTone: outcome.detectedTone || "",
          suggestedVisualTheme: project.settings.visualTheme || "modern-dark",
          scrapedLogoUrl: outcome.scrapedLogoUrl || "",
          extractedTopics: outcome.scenes.map((s: any, idx: number) => ({
            id: `topic-${idx}`,
            title: s.visual?.title || "",
            description: s.subtitle || ""
          })),
          primaryHeadings: outcome.primaryHeadings || [],
          secondaryHeadings: outcome.secondaryHeadings || [],
          targetUrl: payload.url
        });

        const safeSlogan = typeof outcome.suggestedSlogan === 'string' ? outcome.suggestedSlogan : "";
        const safeTone = typeof outcome.detectedTone === 'string' ? outcome.detectedTone : "";
        const savedLogo = outcome.scrapedLogoUrl || project.settings.logoUrl;

        setProject({
          settings: {
            ...project.settings,
            name: safeSlogan ? `Aura - ${safeSlogan.substring(0, 15)}...` : project.settings.name,
            logoUrl: savedLogo
          },
          scenes: formattedScenes
        });

        if (outcome.suggestedLinkedinPosts && Array.isArray(outcome.suggestedLinkedinPosts) && outcome.suggestedLinkedinPosts.length > 0) {
          setSuggestedLinkedinPosts(outcome.suggestedLinkedinPosts);
          setSuggestedLinkedinPost(outcome.suggestedLinkedinPosts[0]);
        } else if (outcome.suggestedLinkedinPost) {
          setSuggestedLinkedinPost(outcome.suggestedLinkedinPost);
          const raw = outcome.suggestedLinkedinPost;
          const pieces = raw.split(/---|\n\s*---\s*\n/g).map(p => p.trim()).filter(Boolean);
          if (pieces.length >= 3) {
            setSuggestedLinkedinPosts(pieces.slice(0, 3));
          } else {
            const p1 = raw;
            const p2 = workingLanguage === 'fr'
              ? `🚀 [Innover par l'Offre]\n\nChaque thématique identifiée sur votre site possède une valeur intrinsèque.\n\nFocalisez l'attention de vos prospects sur vos fonctionnalités en rationalisant votre communication produit avec l'assistant Aura.\n\n${raw}`
              : `🚀 [Innover with Features]\n\nEvery unique perspective found on your website drives a business value.\n\nTarget your audience clearly by streamlining your product benefits with Aura.\n\n${raw}`;
            const p3 = workingLanguage === 'fr'
              ? `🌟 [Histoire de Marque & Convictions]\n\nDerrière chaque technologie ou service scanné se trouvent des valeurs humaines fortes et indiscutables.\n\nC'est cette clarté qui fédère vos équipes et vos clients les plus engagés.`
              : `🌟 [Our Grounding Values]\n\nBehind every piece of technology or service analyzed are true human convictions.\n\nIntegrity and precision build authentic professional standards. Join us!`;
            setSuggestedLinkedinPosts([p1, p2, p3]);
          }
        }

        if (savedLogo) {
          setGenerationLogs(prev => [...prev, language === 'fr' ? `✨ Logotype de marque scanné et intégré.` : `✨ Scraped brand logotype integrated successfully.`]);
        }

        if (safeSlogan) setFeedbackSlogan(safeSlogan);
        if (safeTone) setFeedbackTone(safeTone);

        setGenerationLogs(prev => [...prev, language === 'fr' ? "✨ Storyboard compilé avec succès." : "✨ Storyboard generated! Preparing video timeline."]);
        setActiveSceneIndex(0);
        setCurrentTime(0);
        setHasGenerated(true);
      } else {
        throw new Error(language === 'fr' ? "Aucun clip exploitable n'a été retourné." : "No scenes could be generated from requested URL.");
      }

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Impossible de contacter l'agent de génération.");
      setGenerationLogs(prev => [...prev, "❌ Échec de la génération."]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Rewrite / polish dialogue via server IA API
  const handlePolishWithAi = async (rawText: string): Promise<string> => {
    try {
      const response = await fetch("/api/polish-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, language: workingLanguage })
      });
      if (!response.ok) {
        throw new Error("Polish request failed");
      }
      const data = await response.json();
      return data.polishedText || rawText;
    } catch (e) {
      console.warn("Could not polish text, using raw input", e);
      return rawText;
    }
  };

  // Custom simulation of high end file compilation and download
  const handleSimulateExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStepMessage(language === 'fr' ? "Initialisation de l'encodeur publicitaire..." : "Initializing video compiler...");
    
    const stepsFr = [
      { prg: 15, msg: "Fusion des calques graphiques et dégradés CSS..." },
      { prg: 35, msg: "Génération automatique des pistes vocales en waves..." },
      { prg: 65, msg: "Synchronisation des sous-titres et micro-animations..." },
      { prg: 85, msg: "Compilation de la boucle musicale audio d'ambiance..." },
      { prg: 100, msg: "Vidéo publicitaire finalisée pour téléchargement !" }
    ];

    const stepsEn = [
      { prg: 15, msg: "Rendering dynamic canvas CSS background layers..." },
      { prg: 35, msg: "Synthesizing individual narration wave tracks..." },
      { prg: 65, msg: "Stretching text transition timings and keyframes..." },
      { prg: 85, msg: "Blending background music loops into Master track..." },
      { prg: 100, msg: "MP4 Video file container is ready for download!" }
    ];

    const steps = language === 'fr' ? stepsFr : stepsEn;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(async () => {
          setIsExporting(false);
          
          // Generate realistic text report inside mock video MP4 content to download
          const videoReportDetails = `AURA MOTION STUDIO - VIDEO EXPORT REPORT\n` +
            `=========================================\n` +
            `Campagne: ${project.settings.name}\n` +
            `Format d'aspect: ${project.settings.aspectRatio}\n` +
            `Qualité de Rendu: ${exportResolution}\n` +
            `Destination préférée: ${exportDestination === 'downloads' ? 'Dossier "Téléchargements" du PC' : 'Emplacement personnalisé choisi'}\n` +
            `Date d'exportation: ${new Date().toLocaleString()}\n\n` +
            `CONGESTION DE SÉQUENCES:\n` +
            project.scenes.map((s, i) => `[Séquence ${i + 1}] Durée: ${s.duration}s\n- Script Voix-Off: "${s.subtitle}"\n- Titre Affiché: "${s.visual.title}"\n- Slogan Accent: "${s.visual.accentWord || ''}"`).join("\n\n");

          const isMpeg = project.settings.exportFormat === 'mpeg';
          const extension = isMpeg ? '.mpg' : '.mp4';
          const mediaType = isMpeg ? 'video/mpeg' : 'video/mp4';
          const formatText = isMpeg ? 'MPEG (.mpg)' : 'MP4 (.mp4)';

          const blob = new Blob([videoReportDetails], { type: `${mediaType};charset=utf-8` });

          let baseName = exportFilename;
          if (baseName.toLowerCase().endsWith('.mp4')) {
            baseName = baseName.slice(0, -4);
          } else if (baseName.toLowerCase().endsWith('.mpg')) {
            baseName = baseName.slice(0, -4);
          } else if (baseName.toLowerCase().endsWith('.mpeg')) {
            baseName = baseName.slice(0, -5);
          }
          const clnFilename = `${baseName}${extension}`;

          let saveSuccess = false;
          if (exportDestination === 'ask') {
            try {
              // @ts-ignore
              if (window.showSaveFilePicker) {
                // @ts-ignore
                const fileHandle = await window.showSaveFilePicker({
                  suggestedName: clnFilename,
                  types: [{
                    description: `Vidéo ${formatText} publicitaire Aura`,
                    accept: { [mediaType]: [extension] }
                  }]
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                saveSuccess = true;
                setGenerationLogs(prev => [...prev, `💾 Vidéo [${clnFilename}] enregistrée manuellement à l'emplacement choisi par l'utilisateur.`]);
              }
            } catch (err) {
              console.warn("showSaveFilePicker restriction in sandbox, choosing fallbacks.", err);
            }
          }

          if (!saveSuccess) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = clnFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setGenerationLogs(prev => [...prev, `📥 Fichier [${clnFilename}] téléchargé avec succès.`]);
          }
        }, 1200);
        return;
      }

      setExportProgress(steps[currentStep].prg);
      setExportStepMessage(steps[currentStep].msg);
      currentStep++;
    }, 1100);
  };

  return (
    <div id="aura-master-studio" className="flex h-screen bg-slate-50 text-slate-800 flex-col overflow-hidden font-sans select-none">
      
      {/* Top Banner alert */}
      <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-2.5">
          <Film className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-black font-sans tracking-tight text-slate-800 uppercase">AURA MOTION STUDIO</span>
          <span className="text-[9px] bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-indigo-700 font-bold uppercase tracking-wider">
            {language === 'fr' ? 'CO-PILOTE IA' : 'AI CO-PILOT'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-250">
            <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{language === 'fr' ? 'TON DU PROJET' : 'PROJECT TONE'}:</span>
            <span className="font-bold text-slate-700 max-w-[125px] truncate">{feedbackTone}</span>
          </div>

          <button
            id="btn-global-export"
            onClick={() => {
              const slug = project.settings.name
                .toLowerCase()
                .replace(/[^a-z0-0]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') || "campagne-aura-motion";
              setExportFilename(`${slug}.mp4`);
              setShowExportConfig(true);
            }}
            disabled={isGenerating || isExporting || !hasGenerated || project.scenes.length === 0}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> {t.export_btn}
          </button>
        </div>
      </header>

      {/* Main workspace panels */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Campaign inputs / presets */}
        <Sidebar
          settings={project.settings}
          onUpdateSettings={handleUpdateSettings}
          onUpdateProject={handleUpdateProject}
          onGenerateStoryboard={handleGenerateStoryboard}
          isGenerating={isGenerating}
          language={language}
          setLanguage={setLanguage}
          workingLanguage={workingLanguage}
          setWorkingLanguage={setWorkingLanguage}
          onLoadPresetDemo={() => {
            setProject(DEFAULT_PROJECT);
            setHasGenerated(true);
          }}
          onAnalyzeWebsiteComplete={(data) => setScrapedBrand(data)}
          campaignType={campaignType}
          onUpdateCampaignType={setCampaignType}
          suggestedLinkedinPost={suggestedLinkedinPost}
          isAdjusting={isAdjusting}
          onAdjustStoryboard={handleAdjustStoryboard}
          hasGenerated={hasGenerated}
        />

        {/* Center Section: Video Preview Canvas + Log alerts + Séquence timeline */}
        <main className="flex-1 flex flex-col bg-slate-100 justify-between overflow-hidden relative border-r border-[#e5e7eb]">
          
          {/* Global error panel if exists */}
          {globalError && (
            <div className="m-4 p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-bold">Erreur de traitement sémantique</p>
                <p className="text-[11px] text-red-700 mt-0.5">{globalError}</p>
              </div>
            </div>
          )}

          {/* Format view selector tab bar on generation complete */}
          {hasGenerated && !isGenerating && (
            <div className="flex bg-white border-b border-slate-200 p-2.5 items-center justify-between font-sans select-none gap-4">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Format de Rendu</span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-200 font-mono uppercase">Multi-Output Active</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border">
                <button
                  type="button"
                  onClick={() => setCampaignType('video-animated')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                    campaignType === 'video-animated'
                      ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  🎥 {language === 'fr' ? 'Vidéo Animée Motion' : 'Animated Video'}
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType('static-carousel')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                    campaignType === 'static-carousel'
                      ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  🗂️ {language === 'fr' ? 'Carrousel Slides' : 'Slide Carousel'}
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType('linkedin-3-posts')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                    campaignType === 'linkedin-3-posts'
                      ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  ✍️ {language === 'fr' ? '3 Posts LinkedIn Rédigés' : '3 Draft LinkedIn Posts'}
                </button>
              </div>
            </div>
          )}

          {/* If generating, display a gorgeous abstract logs terminal screen */}
          {isGenerating ? (
            <div id="generation-loading-overlay" className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/95 backdrop-blur z-30 space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Analyse et Synthèse Sémantique</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  L'intelligence artificielle analyse le style de votre prompt, les accroches de votre site web pour générer le story-board publicitaire.
                </p>
              </div>

              {/* Progress dynamic debug logs */}
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto shadow-inner">
                {generationLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start animate-in slide-in-from-bottom-1 duration-155">
                    <span className="text-indigo-400 select-none">&gt;</span>
                    <span className={log.includes('❌') ? 'text-red-400 font-bold' : log.includes('✨') ? 'text-emerald-400 font-bold' : 'text-slate-305'}>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : campaignType === 'linkedin-3-posts' ? (
            <div id="linkedin-multiclass-preview" className="flex-1 flex flex-col p-6 bg-slate-100 overflow-y-auto min-h-[300px] gap-6 scrollbar-thin">
              <div className="border border-slate-200 bg-white/75 p-4 rounded-xl max-w-4xl mx-auto w-full text-center space-y-1">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono"> campagne éditoriale de 3 posts linkedin </p>
                <p className="text-[10px] text-slate-450 font-medium">Trois approches complémentaires rédigées par Aura à partir des thèmes validés sur votre site web.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
                {suggestedLinkedinPosts.map((postBody, postIdx) => (
                  <div key={postIdx} className="bg-white border border-slate-210 rounded-2xl shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition duration-200">
                    <div className="space-y-4">
                      {/* Brand Header */}
                      <div className="flex items-start gap-2.5">
                        {project.settings.logoUrl ? (
                          <div className="bg-white p-0.5 border rounded-md">
                            <img 
                              src={project.settings.logoUrl} 
                              alt="Company Logo" 
                              className="w-9 h-9 rounded object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-[11px] shrink-0">
                            {project.settings.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-left select-none overflow-hidden flex-1">
                          <div className="flex items-center gap-0.5">
                            <h4 className="text-[11px] font-black text-slate-800 truncate">
                              {project.settings.name.replace('Aura - ', '').split('...')[0] || "Aura ad campaign"}
                            </h4>
                            <span className="text-[9px] text-blue-500 font-bold">☑️</span>
                          </div>
                          <span className="text-[8.5px] text-slate-400 font-bold block truncate">
                            {feedbackSlogan || "Aura Production"}
                          </span>
                        </div>
                      </div>

                      {/* Post number indicator */}
                      <div className="flex justify-between items-center bg-slate-50 border px-2 py-1 rounded-lg text-[9px] font-bold font-mono">
                        <span className="text-indigo-600">POST DRAFT #{postIdx + 1}</span>
                        <span className="text-slate-400">
                          {postIdx === 0 ? "Problem & Hook" : postIdx === 1 ? "Feature Highlight" : "Values & CTA"}
                        </span>
                      </div>

                      {/* Editable Text Area */}
                      <div className="space-y-1 text-left">
                        <textarea
                          value={postBody}
                          onChange={(e) => {
                            const updated = [...suggestedLinkedinPosts];
                            updated[postIdx] = e.target.value;
                            setSuggestedLinkedinPosts(updated);
                            if (postIdx === 0) setSuggestedLinkedinPost(e.target.value);
                          }}
                          className="w-full bg-slate-50/75 hover:bg-slate-50 focus:bg-white text-slate-850 text-[11px] leading-relaxed p-3.5 border border-slate-205 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none h-[280px] transition font-sans resize-none font-medium text-left"
                        />
                      </div>
                    </div>

                    {/* Footer stats & copy button */}
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9.5px] text-slate-450 font-bold font-mono">
                        👍 {12 + postIdx * 14} • 💬 {2 + postIdx}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(postBody);
                          alert(language === 'fr' ? `Post #${postIdx + 1} copié !` : `Post #${postIdx + 1} copied!`);
                        }}
                        className="py-1 px-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>📋 {language === 'fr' ? 'Copier' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : campaignType === 'static-carousel' ? (
            <div id="static-carousel-preview" className="flex-1 flex flex-col p-6 bg-slate-100 overflow-y-auto min-h-[300px] scrollbar-thin select-none">
              <div className="border border-slate-200 bg-white/75 p-3.5 rounded-xl max-w-4xl mx-auto w-full text-center space-y-0.5 mb-6">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono"> carrousel de slides séquentielles </p>
                <p className="text-[10px] text-slate-450 font-medium">Visualisez l'exhaustivité de votre story-board sous forme de carrousel statique pour LinkedIn / Instagram.</p>
              </div>

              {/* Horizontal Scroll Deck */}
              <div className="flex gap-6 pb-4 overflow-x-auto w-full max-w-6xl mx-auto scrollbar-thin px-2 justify-center">
                {project.scenes.map((scene, idx) => {
                  const isLastScene = idx === project.scenes.length - 1;
                  return (
                    <div 
                      key={scene.id} 
                      onClick={() => setActiveSceneIndex(idx)}
                      className={`flex-shrink-0 w-[240px] aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden relative border-2 cursor-pointer transition ${
                        activeSceneIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-102' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {/* Slide Watermark label */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex justify-between items-center bg-black/45 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                        <span className="text-[7px] text-white/90 font-black truncate max-w-[70%]">
                          {project.settings.logoUrl ? "📁 " : "● "} {project.settings.name.replace('Aura - ', '').split('...')[0]}
                        </span>
                        <span className="text-[6.5px] px-1 py-0.2 rounded bg-indigo-500/80 text-white font-mono font-black shrink-0 uppercase">
                          Slide {idx + 1}
                        </span>
                      </div>

                      {/* Image representation / background */}
                      <div className="absolute inset-0 z-0">
                        <div className={`absolute inset-0 bg-cover bg-center ${scene.visual.backgroundColor}`} />
                        {scene.visual.backgroundType === 'image' && scene.visual.assetKeywords && (
                          <img
                            src={`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=70&sig=${encodeURIComponent(scene.visual.assetKeywords)}`}
                            alt="Visual element placeholder"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-20 filter blur-[1px]"
                          />
                        )}
                      </div>

                      {/* Slide Core Text Body */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center z-10 bg-black/30">
                        {scene.visual.subtitle && (
                          <span className="text-[6.5px] tracking-widest uppercase font-bold text-white/50 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 backdrop-blur-3xs mb-2 truncate max-w-full">
                            {scene.visual.subtitle}
                          </span>
                        )}
                        <h3 className="text-white font-black text-xs md:text-[13px] uppercase tracking-wide leading-tight drop-shadow-md">
                          {scene.visual.title}
                        </h3>
                        
                        {/* Highlights Indicator */}
                        {scene.visual.accentWord && (
                          <span className="text-[8px] bg-white/15 border border-white/10 text-white font-extrabold px-1.5 py-0.5 rounded mt-2 uppercase">
                            ✨ {scene.visual.accentWord}
                          </span>
                        )}

                        {/* Last Scene specific visual callout */}
                        {isLastScene && (
                          <div className="absolute bottom-3 left-3 right-3 bg-indigo-550 border border-indigo-400 py-1 px-2 rounded-lg text-[6.5px] font-black text-white uppercase text-center leading-normal animate-pulse">
                            🌟 {language === 'fr' ? 'Valeurs & Vision' : 'Values & Mission'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <VideoPlayer
              project={project}
              activeSceneIndex={activeSceneIndex}
              setActiveSceneIndex={setActiveSceneIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              hasGenerated={hasGenerated}
              setHasGenerated={setHasGenerated}
              onLoadPresetDemo={() => {
                setProject(DEFAULT_PROJECT);
                setHasGenerated(true);
              }}
              language={language}
            />
          )}

          {/* Bottom section: Sequence lists */}
          {hasGenerated && campaignType === 'video-animated' && project.scenes.length > 0 && (
            <Timeline
              project={project}
              activeSceneIndex={activeSceneIndex}
              setActiveSceneIndex={setActiveSceneIndex}
              onUpdateScenes={handleUpdateScenes}
              language={language}
            />
          )}
        </main>

        {/* Right Side: Specific Scene Details / Inspector */}
        <ControlPanel
          scene={hasGenerated && project.scenes.length > 0 ? project.scenes[activeSceneIndex] : (null as any)}
          onChangeScene={(updatedScene) => {
            const updated = [...project.scenes];
            updated[activeSceneIndex] = updatedScene;
            handleUpdateScenes(updated);
          }}
          onPolishWithAi={handlePolishWithAi}
          language={language}
          scrapedBrand={scrapedBrand}
        />
      </div>

      {/* Configuration d'Exportation */}
      {showExportConfig && (
        <div id="export-config-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-205 p-6 rounded-2xl shadow-2xl space-y-5 select-none animate-in scale-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Settings className="w-5 h-5 text-indigo-650" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Paramètres d'Exportation Globale</h3>
                <p className="text-[11px] text-slate-500 font-medium">Configurez le nom de l'annonce et l'emplacement de sauvegarde cible de votre PC</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Filename Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                  📁 Nom du Fichier Publicitaire
                </label>
                <input
                  id="export-filename-input"
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder="campagne-pub.mp4"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-medium shadow-sm font-mono"
                />
                <span className="text-[10px] text-slate-400 block leading-normal">
                  Idéal pour l'archivage de vos contenus d'entreprises (TikTok, Reels, LinkedIn). Doit se terminer par <code>.mp4</code>.
                </span>
              </div>

              {/* Destination Mode Choice: Standard PC downloads VS Prompt for Location */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                  📍 Dossier de destination sur le PC
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    id="dest-downloads-btn"
                    type="button"
                    onClick={() => setExportDestination('downloads')}
                    className={`p-3.5 rounded-xl border flex flex-col text-left transition relative cursor-pointer ${
                      exportDestination === 'downloads'
                        ? 'bg-indigo-50/75 border-indigo-550 ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Download className={`w-4 h-4 ${exportDestination === 'downloads' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-800">Espace Téléchargements PC</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal">
                      <strong>Prioritaire (Automatique).</strong> Envoie instantanément le conteneur MP4 dans le dossier des téléchargements système de votre ordinateur.
                    </span>
                    {exportDestination === 'downloads' && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </button>

                  <button
                    id="dest-ask-btn"
                    type="button"
                    onClick={() => setExportDestination('ask')}
                    className={`p-3.5 rounded-xl border flex flex-col text-left transition relative cursor-pointer ${
                      exportDestination === 'ask'
                        ? 'bg-indigo-50/75 border-indigo-550 ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Folder className={`w-4 h-4 ${exportDestination === 'ask' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-800">Choisir à l'export (Dialogue)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal">
                      <strong>Demander l'emplacement.</strong> Ouvre une boîte de dialogue système (File Picker) pour désigner un dossier de travail personnalisé.
                    </span>
                    {exportDestination === 'ask' && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Resolution options */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                  ⚡ Résolution & Qualité de Rendu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '725p', label: '720p HD Compact', desc: 'Rendu Rapide Standard' },
                    { id: '1080p', label: '1080p Full HD Pro', desc: 'Fidélité Réseaux (Recommandée)' },
                    { id: '4k', label: 'Ultra HD 4K Master', desc: 'Qualité Dalle Pro' }
                  ].map((res) => {
                    const active = exportResolution === res.id;
                    return (
                      <button
                        id={`res-btn-${res.id}`}
                        key={res.id}
                        type="button"
                        onClick={() => setExportResolution(res.id as any)}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                          active
                            ? 'bg-indigo-50 border-indigo-250 text-indigo-700 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-5'
                        }`}
                      >
                        <span className="text-xs font-bold block">{res.label}</span>
                        <span className="text-[8px] text-slate-400 block tracking-normal">{res.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-100">
              <button
                id="btn-export-abort"
                type="button"
                onClick={() => setShowExportConfig(false)}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="btn-export-confirm"
                type="button"
                onClick={() => {
                  setShowExportConfig(false);
                  handleSimulateExport();
                }}
                className="flex-1 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Compiler & Exporter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Exporting Modal */}
      {isExporting && (
        <div id="export-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl space-y-5 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Film className="w-5 h-5 text-indigo-650" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Exportation du Rendu Publicitaire</h3>
                <p className="text-xs text-slate-500 font-medium">Compilation de la vidéo de communication</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">{exportStepMessage}</span>
                <span className="text-indigo-650 font-bold">{exportProgress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-105 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                <div 
                  style={{ width: `${exportProgress}%` }}
                  className="h-full bg-indigo-600 transition-all duration-300 rounded"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center">
              Le processeur assemble vos styles graphiques locaux, les transitions de sous-titres et déclenche la transcodation du conteneur vidéo final (${exportResolution}).
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
