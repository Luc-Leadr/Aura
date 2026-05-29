import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Mic, 
  Music, 
  RefreshCw,
  Sparkles,
  Smartphone,
  Monitor,
  Instagram,
  Network,
  CheckCircle,
  HelpCircle,
  PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, Scene, VisualConfig } from "../types";
import { VISUAL_THEMES, FONTS, ROYALTY_FREE_TRACKS, I18N_DICTS } from "../constants";

interface VideoPlayerProps {
  project: Project;
  activeSceneIndex: number;
  setActiveSceneIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number; // in seconds
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  hasGenerated: boolean;
  setHasGenerated: (val: boolean) => void;
  onLoadPresetDemo: () => void;
  language: 'fr' | 'en';
}

export default function VideoPlayer({
  project,
  activeSceneIndex,
  setActiveSceneIndex,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  hasGenerated,
  setHasGenerated,
  onLoadPresetDemo,
  language
}: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingTts, setIsGeneratingTts] = useState<string | null>(null);
  const [ttsAudioCache, setTtsAudioCache] = useState<Record<string, HTMLAudioElement>>({});
  
  // Audio player reference for royalty-free tracks
  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null);

  const t = I18N_DICTS[language || 'fr'];

  // Safe checks
  const scenesCount = project.scenes.length;
  const totalDuration = scenesCount > 0 ? project.scenes.reduce((acc, scene) => acc + scene.duration, 0) : 0;
  const currentScene = scenesCount > 0 ? project.scenes[activeSceneIndex] : null;
  
  // Find preset settings matching current theme
  const themePreset = VISUAL_THEMES.find(t => t.id === project.settings.visualTheme) || VISUAL_THEMES[0];

  // Map progress time to correct scene
  useEffect(() => {
    if (!isPlaying || !hasGenerated || scenesCount === 0) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        let nextTime = prev + 0.1;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          nextTime = 0;
          setActiveSceneIndex(0);
          return 0;
        }

        // Detect current scene index
        let accumulated = 0;
        let foundIndex = 0;
        for (let i = 0; i < scenesCount; i++) {
          accumulated += project.scenes[i].duration;
          if (nextTime < accumulated) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex !== activeSceneIndex) {
          setActiveSceneIndex(foundIndex);
        }

        return nextTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, activeSceneIndex, project.scenes, hasGenerated, scenesCount]);

  // Handle Playback of Real Royalty-Free Background music
  useEffect(() => {
    if (!bgMusicAudioRef.current) {
      bgMusicAudioRef.current = new Audio();
      bgMusicAudioRef.current.loop = true;
    }

    const audioObj = bgMusicAudioRef.current;
    
    if (!hasGenerated || scenesCount === 0 || !currentScene) {
      audioObj.pause();
      return;
    }

    const musicVibeId = currentScene.audio.backgroundMusicVibe || 'none';
    const activeTrack = ROYALTY_FREE_TRACKS.find(tr => tr.id === musicVibeId);

    if (activeTrack && isPlaying && !isMuted) {
      // If song changed
      if (audioObj.src !== activeTrack.url) {
        audioObj.src = activeTrack.url;
        audioObj.currentTime = 0;
      }
      
      // Safety calculation for volume
      const rawVol = currentScene.audio.volume !== undefined ? currentScene.audio.volume : 0.8;
      audioObj.volume = Math.max(0, Math.min(1, rawVol * 0.35)); // scale slightly lower than spoken voice-over for perfect mixing

      audioObj.play().catch(e => {
        console.warn("Audio autoplay blocked by browser sandbox until click", e.message);
      });
    } else {
      audioObj.pause();
    }

    return () => {
      audioObj.pause();
    };
  }, [isPlaying, isMuted, currentScene?.audio.backgroundMusicVibe, currentScene?.audio.volume, hasGenerated, scenesCount, currentScene]);

  // Speak narration currently requested via real Server-Side Text-To-Speech (Gemini TTS API)
  const handlePlayNarratorSpeech = async () => {
    if (!currentScene) return;
    const sceneId = currentScene.id;
    const speechText = currentScene.subtitle;
    const speakerVoice = currentScene.audio.voiceName;

    // Check cache
    const cacheKey = `${sceneId}_${speakerVoice}_${speechText}`;
    if (ttsAudioCache[cacheKey]) {
      const audioObj = ttsAudioCache[cacheKey];
      audioObj.currentTime = 0;
      audioObj.volume = currentScene.audio.volume;
      audioObj.play();
      return;
    }

    try {
      setIsGeneratingTts(sceneId);
      const response = await fetch("/api/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: speechText,
          voiceName: speakerVoice
        })
      });

      if (!response.ok) {
        throw new Error("Failed to call voice synthesis endpoint.");
      }

      const outcome = await response.json();
      if (outcome.audioData) {
        // Convert to binary blob URL
        const binary = atob(outcome.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const voiceUrl = URL.createObjectURL(blob);

        const newAudio = new Audio(voiceUrl);
        newAudio.volume = currentScene.audio.volume;
        
        // Save to cache & play
        setTtsAudioCache(prev => ({
          ...prev,
          [cacheKey]: newAudio
        }));

        newAudio.play();
      }
    } catch (err: any) {
      console.error("TTS generation error, using browser web voiceover fallback:", err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = language === 'fr' ? "fr-FR" : "en-US";
        utterance.rate = currentScene.audio.speechSpeed;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsGeneratingTts(null);
    }
  };

  const handleSeek = (percentage: number) => {
    if (scenesCount === 0) return;
    const targetSeconds = (percentage / 100) * totalDuration;
    setCurrentTime(targetSeconds);

    // Map to scene index
    let accum = 0;
    let targetIndex = 0;
    for (let i = 0; i < scenesCount; i++) {
      accum += project.scenes[i].duration;
      if (targetSeconds <= accum) {
        targetIndex = i;
        break;
      }
    }
    setActiveSceneIndex(targetIndex);
  };

  const formatTimer = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remaining = (secs % 60).toFixed(1);
    return `${minutes.toString().padStart(2, '0')}:${remaining.padStart(4, '0')}`;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPlayer = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveSceneIndex(0);
  };

  // Map position settings to layout styles
  const getPositionClasses = (pos: string) => {
    switch (pos) {
      case 'top': return "justify-start pt-16 items-center text-center";
      case 'bottom': return "justify-end pb-16 items-center text-center";
      case 'middle-left': return "justify-center items-start pl-8 text-left animate-in slide-in-from-left-4";
      case 'middle-right': return "justify-center items-end pr-8 text-right animate-in slide-in-from-right-4";
      case 'center':
      default:
        return "justify-center items-center text-center";
    }
  };

  // Map text style variants
  const getTextStyleClasses = (style: string) => {
    const isMonochrome = project.settings.visualTheme === 'stark-monochrome';
    switch (style) {
      case 'impact':
        return "font-black tracking-tighter uppercase text-3xl md:text-4xl text-neutral-50 drop-shadow-md";
      case 'bordered':
        return "font-extrabold tracking-tight text-3xl border-y border-white/20 py-3 text-white drop-shadow-sm";
      case 'cyber':
        return isMonochrome
          ? "font-mono font-bold tracking-tight text-2xl text-white border-2 border-white/30 px-3 py-1 bg-white/5 uppercase"
          : "font-mono font-bold tracking-tight text-2xl text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.4)]";
      case 'serif':
        return isMonochrome
          ? "font-serif italic tracking-wide text-2xl text-white"
          : "font-serif italic tracking-wide text-2xl text-amber-100 drop-shadow-lg";
      case 'duotone':
        return isMonochrome
          ? "font-sans font-black tracking-tight text-3xl text-slate-100 bg-clip-text bg-gradient-to-r from-white to-neutral-400 text-transparent"
          : "font-sans font-black tracking-tight text-3xl text-slate-200 bg-clip-text bg-gradient-to-r from-violet-200 to-indigo-100";
      case 'minimal':
      default:
        return "font-sans font-medium tracking-normal text-2xl text-slate-100";
    }
  };

  // Choose Font Family dynamically
  const getSelectedFontFamily = () => {
    if (!currentScene) return "inherit";
    const lookupId = currentScene.visual.fontFamily || "inter";
    const found = FONTS.find(f => f.id === lookupId);
    return found ? found.family : "inherit";
  };

  // Define Framer Motion animation properties based on settings
  const getAnimationProps = (anim: string) => {
    switch (anim) {
      case 'slide-up':
        return { initial: { opacity: 0, y: 35 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -25 } };
      case 'pop-in':
        return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } };
      case 'expand':
        return { initial: { opacity: 0, width: 0, overflow: 'hidden' }, animate: { opacity: 1, width: "100%" }, exit: { opacity: 0, x: -10 } };
      case 'drift':
        return { initial: { opacity: 0, x: -40, scale: 0.96 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 40 } };
      case 'reveal':
        return { initial: { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }, animate: { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }, exit: { opacity: 0 } };
      case 'fade':
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    }
  };

  // Re-architect highlight structure to support Custom accent color hex choice!
  const getAccentWordMarkup = (text: string | undefined | null, accent?: string | null, textStyle?: string) => {
    if (!text) return <span key="empty"></span>;
    if (!accent || !text.toLowerCase().includes(accent.toLowerCase())) {
      return <span key="plain">{text}</span>;
    }
    
    const escapedAccent = accent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedAccent})`, 'gi'));
    const customAccentColor = currentScene?.visual.customAccentColor;

    return (
      <span key="segmented">
        {parts.map((part, i) => {
          if (!part) return null;
          const isAccent = part.toLowerCase() === accent.toLowerCase();
          if (isAccent) {
            let standardClasses = "";
            let inlineOverrideStyle = customAccentColor 
              ? { color: customAccentColor, borderBottomColor: customAccentColor } 
              : {};

            if (customAccentColor) {
              standardClasses = "border-b-2 font-black relative px-1 mx-0.5";
            } else {
              // Dynamically select theme presets in harmony with brand codes
              const currentThemeId = project.settings.visualTheme;
              if (currentThemeId === 'stark-monochrome') {
                standardClasses = "font-black text-white border-b-2 border-white bg-white/10 px-1.5 py-0.5 mx-0.5 rounded";
              } else if (currentThemeId === 'modern-dark') {
                standardClasses = "font-black text-emerald-400 border-b-2 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 mx-0.5 rounded";
              } else if (currentThemeId === 'warm-editorial') {
                standardClasses = "font-serif italic text-amber-300 border-b border-amber-500/40 bg-amber-500/5 px-1.5 py-0.5 mx-0.5 rounded";
              } else if (currentThemeId === 'clean-corporate') {
                standardClasses = "font-black text-sky-450 border-b-2 border-sky-400/20 bg-sky-500/5 px-1.5 py-0.5 mx-0.5 rounded";
              } else if (currentThemeId === 'brutalist-yellow') {
                standardClasses = "font-mono font-black text-red-650 bg-red-500/10 border-2 border-red-600 px-1.5 py-0.5 mx-0.5 uppercase";
              } else {
                // Keep energetic colorful glow only for neon-pulse or sunset-glow
                standardClasses = "font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-400 border-b-2 border-fuchsia-500/40 relative px-1 mx-0.5 rounded";
              }
            }

            return (
              <span 
                key={`accent-${i}`} 
                style={inlineOverrideStyle}
                className={`${standardClasses} ${textStyle === 'cyber' ? 'shadow-fuchsia-500/20' : ''}`}
              >
                {part}
              </span>
            );
          } else {
            return (
              <span key={`text-${i}`}>{part}</span>
            );
          }
        })}
      </span>
    );
  };

  return (
    <div id="aura-video-container" className="flex-1 flex flex-col bg-slate-100 select-none p-5 justify-between items-center overflow-hidden h-full">
      
      {/* Studio Banner */}
      <div className="w-full flex justify-between items-center bg-white border border-slate-200/85 px-4 py-2.5 rounded-xl shadow-sm select-none">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-slate-700 font-bold font-sans uppercase tracking-tight text-[10px]">{t.render_viewer_title}</span>
          {hasGenerated && (
            <span className="text-slate-400 font-bold font-mono text-[10px]">| {t.scene_number} {activeSceneIndex + 1}/{scenesCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2 select-none">
          {project.settings.aspectRatio === '9:16' ? (
            <span className="text-[9px] bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <Smartphone className="w-3 h-3" /> 9:16 Portrait
            </span>
          ) : project.settings.aspectRatio === '1:1' ? (
            <span className="text-[9px] bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <Instagram className="w-3 h-3" /> 1:1 Square
            </span>
          ) : (
            <span className="text-[9px] bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-0.5 rounded inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <Monitor className="w-3 h-3" /> 16:9 Landscape
            </span>
          )}
        </div>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 flex items-center justify-center py-2.5 w-full relative">
        <div 
          id="player-chassis"
          style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          className={`relative overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between ${
            project.settings.aspectRatio === '9:16'
              ? 'w-[250px] h-[440px] rounded-[32px] border-[8px] border-slate-900 shadow-xl ring-4 ring-slate-200'
              : project.settings.aspectRatio === '1:1'
              ? 'w-[340px] h-[340px] rounded-2xl border-[6px] border-slate-900 shadow-xl ring-4 ring-slate-100'
              : 'w-[450px] h-[250px] rounded-xl border-[6px] border-slate-900 shadow-xl'
          }`}
        >
          {/* CRITICAL CONDITIONAL RENDER : DESCRIPT-STYLE ONBOARDING USER TO DEFINE AN URL FIRST */}
          {!hasGenerated || scenesCount === 0 ? (
            <div className="absolute inset-0 z-40 bg-zinc-950 p-5 flex flex-col justify-between text-zinc-100 font-sans">
              
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Descript Blueprint
                </span>
                <span className="text-[8px] bg-white/10 text-white font-mono px-2 py-0.5 rounded">
                  v2.8
                </span>
              </div>

              {/* Central onboarding checklist walkthrough explaining how to extract */}
              <div className="my-auto space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {t.empty_scenes_title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed px-1">
                    {t.empty_scenes_desc}
                  </p>
                </div>

                <div className="space-y-2.5 max-w-[280px] mx-auto text-left py-2 border-t border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-black flex items-center justify-center text-indigo-400">1</span>
                    <span className="text-[10px] text-zinc-300 font-semibold">{language === 'fr' ? 'Entrez l\'URL de votre marque' : 'Paste brand website URL'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-black flex items-center justify-center text-emerald-400">2</span>
                    <span className="text-[10px] text-zinc-300 font-semibold">{language === 'fr' ? 'Sélectionnez/Validez vos services' : 'Validate extracted key sequences'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-black flex items-center justify-center text-amber-400">3</span>
                    <span className="text-[10px] text-zinc-300 font-semibold">{language === 'fr' ? 'Lancez la fabrication IA' : 'Generate ad storyboard video'}</span>
                  </div>
                </div>
              </div>

              {/* Loaded fast Demo Action button */}
              <button
                type="button"
                id="btn-onboard-demo"
                onClick={() => {
                  onLoadPresetDemo();
                  setHasGenerated(true);
                }}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-lg shadow-indigo-505/20 hover:scale-[1.01]"
              >
                <PlayCircle className="w-3.5 h-3.5 fill-current" />
                {t.load_demo_action}
              </button>
            </div>
          ) : (
            <>
              {/* Theme Gradient / Solid / Image Background */}
              <div 
                className="absolute inset-0 z-0 transition-colors duration-455"
                style={
                  currentScene?.visual.backgroundType === 'solid' || currentScene?.visual.backgroundColor.startsWith("#")
                    ? { backgroundColor: currentScene.visual.backgroundColor }
                    : {}
                }
              >
                {/* Tailwind linear gradients resolver */}
                {!(currentScene?.visual.backgroundType === 'solid' || currentScene?.visual.backgroundColor.startsWith("#")) && (
                  <div className={`absolute inset-0 ${currentScene?.visual?.backgroundColor || themePreset.bgGradient}`} />
                )}

                {currentScene?.visual?.backgroundType === 'image' && currentScene?.visual?.assetKeywords && (
                  <img
                    src={`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80&sig=${encodeURIComponent(currentScene.visual.assetKeywords)}`}
                    alt="Motion Background"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-20 filter blur-[2px] transition-all"
                  />
                )}
                {/* Ambient Animated Particles / Circles for Motion visual */}
                <div className="absolute inset-0 mix-blend-overlay opacity-30 z-0 overflow-hidden pointer-events-none">
                  <div className={`absolute -top-12 -left-12 w-48 h-48 rounded-full filter blur-3xl ${
                    project.settings.visualTheme === 'stark-monochrome' ? 'bg-white/10' : 'bg-indigo-500/40'
                  }`} />
                  <div className={`absolute -bottom-16 -right-16 w-52 h-52 rounded-full filter blur-3xl ${
                    project.settings.visualTheme === 'stark-monochrome' ? 'bg-neutral-500/10' : 'bg-violet-600/40'
                  }`} />
                </div>
              </div>

              {/* Slogan Watermark label */}
              <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-black/35 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden max-w-[70%]">
                  {project.settings.logoUrl ? (
                    <img 
                      src={project.settings.logoUrl} 
                      alt="Logo" 
                      className="h-3.5 object-contain rounded opacity-90 brightness-110"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      project.settings.visualTheme === 'stark-monochrome' ? 'bg-white' : 'bg-indigo-500'
                    }`} />
                  )}
                  <span className="text-[8px] font-mono font-bold text-white/80 tracking-widest uppercase truncate">
                    {project.settings.name}
                  </span>
                </div>
                <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-white/15 text-white font-mono font-bold flex-shrink-0">
                  {t.scene_number} {activeSceneIndex + 1}
                </span>
              </div>

              {/* Active Canvas Scene Renderer */}
              <div 
                style={{ fontFamily: getSelectedFontFamily() }}
                className={`w-full h-full flex flex-col relative p-6 z-10 select-none ${getPositionClasses(currentScene?.visual?.textPosition || 'center')}`}
              >
                <AnimatePresence mode="wait">
                  {currentScene && (
                    <motion.div
                      key={currentScene.id}
                      {...getAnimationProps(currentScene.visual?.animationType || "fade")}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-full space-y-3.5 z-10"
                    >
                      {/* Secondary helper category badge */}
                      {currentScene.visual?.subtitle && (
                        <div className="inline-block">
                          <span className="text-[9px] tracking-wider uppercase py-1 px-3 rounded-full border border-white/10 text-white/85 bg-white/5 backdrop-blur-sm">
                            {currentScene.visual.subtitle}
                          </span>
                        </div>
                      )}

                      {/* Heavy Impact Title with custom Typography */}
                      <h2 className={`${getTextStyleClasses(currentScene.visual?.textStyle || "minimal")} leading-snug`}>
                        {getAccentWordMarkup(
                          currentScene.visual?.title, 
                          currentScene.visual?.accentWord, 
                          currentScene.visual?.textStyle
                        )}
                      </h2>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Presenter Avatars Overlays */}
                {project.settings.avatarStyle === 'floating' && project.settings.avatarUrl && (
                  <div className="absolute bottom-16 right-5 z-20 flex items-end gap-3 max-w-[85%] animate-in slide-in-from-right-3 duration-350">
                    {/* Glowing speech bubble of the AI Host */}
                    {isPlaying && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`bg-black/85 backdrop-blur-md text-white text-[9px] font-semibold py-1.5 px-3 rounded-2xl rounded-tr-none border max-w-[150px] leading-snug shadow-2xl text-left ${
                          project.settings.visualTheme === 'stark-monochrome' ? 'border-white/20' : 'border-indigo-550/35'
                        }`}
                      >
                        <p className="line-clamp-2 italic">
                          &ldquo;{currentScene?.subtitle.split(' ').slice(0, 8).join(' ') || "..."}...&rdquo;
                        </p>
                        <span className={`text-[6.5px] uppercase font-bold mt-1 block tracking-wider ${
                          project.settings.visualTheme === 'stark-monochrome' ? 'text-white' : 'text-indigo-400'
                        }`}>
                          {language === 'fr' ? '• Parole Active' : '• Active Speech'}
                        </span>
                      </motion.div>
                    )}
                    
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <motion.div 
                          className={`absolute -inset-1 rounded-full ${
                            project.settings.visualTheme === 'stark-monochrome'
                              ? 'bg-gradient-to-tr from-neutral-600 via-neutral-300 to-white'
                              : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                          }`}
                          animate={isPlaying ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <img 
                          src={project.settings.avatarUrl} 
                          alt="Presenter" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-950 shadow-2xl relative"
                        />
                        {/* Tiny active pulse indicator */}
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-950"></span>
                        </span>
                      </div>
                      <span className="text-[7.5px] bg-slate-950 text-white font-extrabold py-0.5 px-2 rounded-full mt-1.5 border border-white/10 uppercase tracking-widest shadow-lg leading-none">
                        {project.settings.avatarPresetName || "Présentateur"}
                      </span>
                    </div>
                  </div>
                )}

                {project.settings.avatarStyle === 'split-screen' && project.settings.avatarUrl && (
                  <div className="absolute bottom-16 left-4 right-4 z-20 flex justify-center animate-in slide-in-from-bottom-2 duration-350">
                    <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-2xl border border-white/15 w-full max-w-[240px] shadow-2xl">
                      <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 blur-xs" />
                        <img 
                          src={project.settings.avatarUrl} 
                          alt="Presenter" 
                          className="w-9 h-9 rounded-full object-cover border-2 border-slate-900 relative"
                        />
                        {/* Real dynamic speaking dots indicator */}
                        {isPlaying && (
                          <div className="absolute bottom-0 right-0 flex gap-0.5 bg-slate-900 border border-white/20 rounded-full px-1 py-0.5 scale-90">
                            <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                          </div>
                        )}
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                        <p className="text-[10px] font-black text-white truncate uppercase tracking-wider">
                          {project.settings.avatarPresetName || "Emma"}
                        </p>
                        <p className="text-[7.5px] text-zinc-400 font-bold tracking-tight">
                          {language === 'fr' ? '🔑 Ambassadeur de marque' : '🔑 Brand spokesperson'}
                        </p>
                        {isPlaying && (
                          <span className="text-[6.5px] font-mono text-emerald-400 block font-black uppercase tracking-widest mt-0.5 animate-pulse">
                            • {language === 'fr' ? 'NARRATION ACTIVE' : 'NARRATION ACTIVE'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {project.settings.avatarStyle === 'podcast-bubble' && project.settings.avatarUrl && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-15 flex flex-col items-center justify-center animate-in scale-in duration-300 pointer-events-none">
                    <div className="relative">
                      {/* Bouncing radar rings of speaking energy */}
                      {[...Array(isPlaying ? 3 : 1)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute -inset-4 rounded-full border border-indigo-400/40"
                          initial={{ scale: 0.9, opacity: 0.7 }}
                          animate={isPlaying ? { scale: 1.8, opacity: 0 } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: "easeOut" }}
                        />
                      ))}
                      
                      {/* Stylized circular image container with colored border shadow */}
                      <div className="relative">
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 blur-sm animate-pulse" />
                        <img
                          src={project.settings.avatarUrl}
                          alt="Host"
                          className="w-16 h-16 rounded-full object-cover border-4 border-slate-950 shadow-2xl relative"
                        />
                      </div>
                      
                      {/* Interactive microphone badge on avatar */}
                      <span className="absolute -bottom-1 -right-1 bg-indigo-650 text-white p-1 rounded-full border border-slate-950 shadow">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping absolute inset-0 m-auto" />
                        <svg className="w-3 h-3 text-red-400 fill-current" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </span>
                    </div>

                    <div className="mt-3.5 bg-slate-950/90 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/10 shadow-lg text-center">
                      <span className="text-[10px] font-black text-amber-400 tracking-wider uppercase block">
                        🎙️ {project.settings.avatarPresetName || "Hôte"}
                      </span>
                      <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest block mt-0.5 font-mono">
                        {language === 'fr' ? 'NARRATEUR CHALEUREUX' : 'ORGANIC SPEAKER'}
                      </span>
                    </div>

                    {/* Left/Right floating stereo audio waves bouncing in real time while playing */}
                    {isPlaying && (
                      <div className="absolute -bottom-6 flex items-center justify-center gap-1.5">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-gradient-to-t from-indigo-500 to-amber-400 rounded-full"
                            animate={{ height: [8, 22, 8] }}
                            transition={{ duration: 0.4 + i * 0.08, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated sound waves bar */}
                {isPlaying && (
                  <div className="absolute bottom-16 left-0 right-0 z-10 flex items-center justify-center gap-1 pointer-events-none opacity-45">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-white/80 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 20}px`,
                          transition: 'height 0.1s ease-in-out',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitles Overlay */}
              <div className="w-full bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 text-center z-10 border-t border-white/5 select-none">
                <p className="text-[10px] text-zinc-200 font-medium leading-relaxed drop-shadow italic px-2">
                  &ldquo;{currentScene?.subtitle}&rdquo;
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Control Actions Panel & Time scrubber */}
      {hasGenerated && scenesCount > 0 && (
        <div className="w-full space-y-3.5 pt-1 animate-in fade-in duration-300">
          {/* Scrubber timeline */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold select-none">
              <span>{formatTimer(currentTime)}</span>
              <span className="text-slate-400">{language === 'fr' ? 'Durée Totale' : 'Total duration'} : {formatTimer(totalDuration)}</span>
            </div>
            
            <div 
              id="timeline-scrubber-track"
              onClick={(e) => {
                const bounds = e.currentTarget.getBoundingClientRect();
                const percentage = ((e.clientX - bounds.left) / bounds.width) * 100;
                handleSeek(percentage);
              }}
              className="h-2 w-full bg-slate-205 rounded-lg cursor-pointer overflow-hidden border border-slate-300 relative shadow-inner"
            >
              {/* Filled current timeline progress bar */}
              <div 
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                className="absolute left-0 top-0 h-full bg-indigo-650 transition-all rounded-r"
              />
              
              {/* Visual dividers for each scene duration */}
              {project.scenes.map((scene, i) => {
                let accum = 0;
                for (let idx = 0; idx < i; idx++) accum += project.scenes[idx].duration;
                const leftPercent = (accum / totalDuration) * 100;
                return (
                  <div 
                    key={scene.id}
                    style={{ left: `${leftPercent}%` }}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-900/30 z-20"
                  />
                );
              })}
            </div>
          </div>

          {/* Playback Controls button grid */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm select-none">
            <div className="flex items-center gap-2">
              <button
                id="btn-play-pause"
                onClick={togglePlayback}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-50 text-slate-705 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
              
              <button
                id="btn-reset-player"
                onClick={resetPlayer}
                title="Reset Player"
                className="p-2.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transitions cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Narration Voice Activator */}
            <button
              id="btn-trigger-speech"
              onClick={handlePlayNarratorSpeech}
              disabled={isGeneratingTts !== null}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
            >
              {isGeneratingTts === currentScene?.id ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                  {language === 'fr' ? 'Audio en cours...' : 'Synthesizing voice...'}
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 text-indigo-650" />
                  {t.btn_hear_voice}
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              {/* Music Loop Type Indicator */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[9px] text-indigo-900 font-mono font-extrabold shadow-inner max-w-[120px] truncate">
                <Music className="w-3 h-3 text-indigo-600 animate-pulse" />
                <span className="capitalize">{currentScene?.audio?.backgroundMusicVibe || 'sans musique'}</span>
              </div>

              <button
                id="btn-toggle-mute"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 transitions cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-slate-650" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
