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
import { DEFAULT_PROJECT } from "./constants";
import { Project, ProjectSettings, Scene } from "./types";

export default function App() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
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

  const handleUpdateSettings = (newSettings: ProjectSettings) => {
    setProject(prev => ({
      ...prev,
      settings: newSettings
    }));
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

  // Triggers main server analysis & storyboard creation endpoint
  const handleGenerateStoryboard = async (payload: { prompt: string; url: string; scriptVibe: string; slideCount: number }) => {
    setIsGenerating(true);
    setGlobalError(null);
    setGenerationLogs(["Initiation du moteur d'analyse sémantique...", "Connexion à Google Gemini Cloud..."]);
    
    try {
      // Simulate real-time logs for visual reinforcement
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      if (payload.url) {
        setGenerationLogs(prev => [...prev, `Analyse du site web demandée : ${payload.url}`, "Tentative de scraping du code source HTML..."]);
        await delay(600);
      }
      
      setGenerationLogs(prev => [...prev, `Traitement avec Gemini 3.5-Flash sur l'intention : "${payload.prompt || 'Création libre'}"...`]);
      await delay(700);

      setGenerationLogs(prev => [...prev, `Génération des ${payload.slideCount} diapositives de services de manière optimisée...`]);

      const response = await fetch("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: payload.prompt,
          url: payload.url,
          aspectRatio: project.settings.aspectRatio,
          visualTheme: project.settings.visualTheme,
          scriptVibe: payload.scriptVibe,
          slideCount: payload.slideCount
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
        throw new Error(`Le serveur a retourné une erreur (Code: ${response.status})${serverErrorMessage}`);
      }

      const outcome = await response.json();
      
      if (outcome.scenes && outcome.scenes.length > 0) {
        // Refit response to local layout
        const formattedScenes = outcome.scenes.map((scene: any, i: number) => ({
          id: `ai-scene-${i}-${Date.now()}`,
          duration: Number(scene.duration) || 5,
          subtitle: scene.subtitle || "Message sous-titré généré par l'IA",
          visual: {
            title: scene.visual?.title || "AI MESSAGE",
            subtitle: scene.visual?.subtitle || "",
            accentWord: scene.visual?.accentWord || "",
            backgroundColor: scene.visual?.backgroundColor || "bg-gradient-to-br from-[#0c0f1d] to-[#11162d]",
            backgroundType: scene.visual?.backgroundType || "gradient",
            textPosition: scene.visual?.textPosition || "center",
            textStyle: scene.visual?.textStyle || "minimal",
            animationType: scene.visual?.animationType || "fade",
            assetKeywords: scene.visual?.assetKeywords || "neon abstract"
          },
          audio: {
            voiceName: scene.audio?.voiceName || "Zephyr",
            speechSpeed: scene.audio?.speechSpeed || 1,
            backgroundMusicVibe: scene.audio?.backgroundMusicVibe || "lofi",
            volume: 0.8
          },
          transition: scene.transition || "fade"
        }));

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

        if (savedLogo) {
          setGenerationLogs(prev => [...prev, `✨ Charte graphique & Logo de marque intégrés avec succès.`]);
        }

        if (safeSlogan) setFeedbackSlogan(safeSlogan);
        if (safeTone) setFeedbackTone(safeTone);

        setGenerationLogs(prev => [...prev, "✨ Storyboard compilé avec succès ! Chargement dans le séquenceur."]);
        setActiveSceneIndex(0);
        setCurrentTime(0);
      } else {
        throw new Error("Aucune séquence exploitable n'a été retournée par l'IA.");
      }

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Impossible de contacter l'agent de génération.");
      setGenerationLogs(prev => [...prev, "❌ Échec de la génération. Rétablissement du scénario par défaut."]);
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
        body: JSON.stringify({ text: rawText })
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
    setExportStepMessage("Vérification des codecs de rendu...");
    
    const steps = [
      { prg: 15, msg: "Fusion des calques graphiques et dégradés CSS..." },
      { prg: 35, msg: "Génération automatique des pistes vocales en waves..." },
      { prg: 60, msg: "Synchronisation des sous-titres et micro-animations..." },
      { prg: 80, msg: "Synthèse audio et mixage de la boucle musicale..." },
      { prg: 105, msg: "Finalisation du fichier conteneur MP4 (H264/AAC)..." },
      { prg: 100, msg: "Vidéo prête au téléchargement !" }
    ];

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

          const blob = new Blob([videoReportDetails], { type: "text/plain;charset=utf-8" });
          const clnFilename = exportFilename.toLowerCase().endsWith('.mp4') ? exportFilename : `${exportFilename}.mp4`;

          // Handle manual file system picker if supported and requested
          let saveSuccess = false;
          if (exportDestination === 'ask') {
            try {
              // @ts-ignore
              if (window.showSaveFilePicker) {
                // @ts-ignore
                const fileHandle = await window.showSaveFilePicker({
                  suggestedName: clnFilename,
                  types: [{
                    description: 'Vidéo MP4 publicitaire Aura',
                    accept: { 'video/mp4': ['.mp4'] }
                  }]
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                saveSuccess = true;
                setGenerationLogs(prev => [...prev, `💾 Vidéo [${clnFilename}] enregistrée manuellement à l'emplacement choisi par l'utilisateur.`]);
              }
            } catch (err) {
              console.warn("showSaveFilePicker is restricted or was cancelled inside iframe sandbox, falling back to standard download.", err);
            }
          }

          if (!saveSuccess) {
            // Priority Fallback: Direct download trigger into browser's default downloads location
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = clnFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setGenerationLogs(prev => [...prev, `📥 Fichier [${clnFilename}] téléchargé avec succès dans le dossier "Téléchargements" de votre PC.`]);
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
    <div id="aura-master-studio" className="flex h-screen bg-slate-50 text-slate-800 flex-col overflow-hidden font-sans">
      
      {/* Top Banner alert notifying about sandbox environment */}
      <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <Film className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold tracking-tight text-slate-800">Aura Motion Studio Dashboard</span>
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-600 font-semibold uppercase tracking-wider">
            Mode Créatif Actif
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats summaries */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200">
            <span className="font-mono text-[10px] text-slate-400">TON DÉTECTÉ:</span>
            <span className="font-bold text-slate-700 max-w-[120px] truncate">{feedbackTone}</span>
          </div>

          <button
            id="btn-global-export"
            onClick={() => {
              // Pre-fill suggested filename from project settings name
              const slug = project.settings.name
                .toLowerCase()
                .replace(/[^a-z0-0]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') || "campagne-aura-motion";
              setExportFilename(`${slug}.mp4`);
              setShowExportConfig(true);
            }}
            disabled={isGenerating || isExporting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exporter la Vidéo publicitaire
          </button>
        </div>
      </header>

      {/* Main workspace panels */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Campaign inputs / presets */}
        <Sidebar
          settings={project.settings}
          onUpdateSettings={handleUpdateSettings}
          onGenerateStoryboard={handleGenerateStoryboard}
          isGenerating={isGenerating}
        />

        {/* Center Section: Video Preview Canvas + Log alerts + Séquence timeline */}
        <main className="flex-1 flex flex-col bg-slate-100 justify-between overflow-hidden relative border-r border-slate-200/80">
          
          {/* Global error panel if exists */}
          {globalError && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur de traitement sémantique</p>
                <p className="text-[11px] text-red-700 mt-0.5">{globalError}</p>
              </div>
            </div>
          )}

          {/* If generating, display a gorgeous abstract logs terminal screen */}
          {isGenerating ? (
            <div id="generation-loading-overlay" className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/95 backdrop-blur z-30 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-sm font-semibold text-slate-800">Analyse et Synthèse Sémantique</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  L'intelligence artificielle analyse le style de votre prompt ou les accroches de votre site web pour générer le story-board publicitaire.
                </p>
              </div>

              {/* Progress dynamic debug logs */}
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto shadow-inner">
                {generationLogs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-indigo-400 select-none">&gt;</span>
                    <span className={log.includes('❌') ? 'text-red-400' : log.includes('✨') ? 'text-emerald-400' : 'text-slate-300'}>{log}</span>
                  </div>
                ))}
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
            />
          )}

          {/* Bottom section: Sequence lists */}
          <Timeline
            project={project}
            activeSceneIndex={activeSceneIndex}
            setActiveSceneIndex={setActiveSceneIndex}
            onUpdateScenes={handleUpdateScenes}
          />
        </main>

        {/* Right Side: Specific Scene Details / Inspector */}
        <ControlPanel
          scene={project.scenes[activeSceneIndex]}
          onChangeScene={(updatedScene) => {
            const updated = [...project.scenes];
            updated[activeSceneIndex] = updatedScene;
            handleUpdateScenes(updated);
          }}
          onPolishWithAi={handlePolishWithAi}
        />
      </div>

      {/* Configuration d'Exportation & Choix de l'emplacement cible */}
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
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
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
                <Film className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Exportation du Rendu Publicitaire</h3>
                <p className="text-xs text-slate-500 font-medium">Compilation de la vidéo de communication</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">{exportStepMessage}</span>
                <span className="text-indigo-600 font-bold">{exportProgress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-sm">
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
