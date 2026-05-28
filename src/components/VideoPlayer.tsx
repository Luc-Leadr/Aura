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
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, Scene, VisualConfig } from "../types";
import { VISUAL_THEMES } from "../constants";

interface VideoPlayerProps {
  project: Project;
  activeSceneIndex: number;
  setActiveSceneIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number; // in seconds
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}

export default function VideoPlayer({
  project,
  activeSceneIndex,
  setActiveSceneIndex,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime
}: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingTts, setIsGeneratingTts] = useState<string | null>(null);
  const [ttsAudioCache, setTtsAudioCache] = useState<Record<string, HTMLAudioElement>>({});
  const [currentNarratorVoiceUrl, setCurrentNarratorVoiceUrl] = useState<string | null>(null);
  
  // Audio synthesis state for music loops
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalId = useRef<any>(null);
  const activeOscillators = useRef<OscillatorNode[]>([]);

  const totalDuration = project.scenes.reduce((acc, scene) => acc + scene.duration, 0);
  const currentScene = project.scenes[activeSceneIndex];
  
  // Find preset settings matching current theme
  const themePreset = VISUAL_THEMES.find(t => t.id === project.settings.visualTheme) || VISUAL_THEMES[0];

  // Map progress time to correct scene
  useEffect(() => {
    if (!isPlaying) return;

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
        for (let i = 0; i < project.scenes.length; i++) {
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
  }, [isPlaying, totalDuration, activeSceneIndex, project.scenes]);

  // Sythesize sound effects and ambient track loops relative to settings
  useEffect(() => {
    if (isPlaying && !isMuted) {
      startSynthMusicVibe(currentScene?.audio.backgroundMusicVibe || 'none');
    } else {
      stopSynthMusicVibe();
    }

    return () => stopSynthMusicVibe();
  }, [isPlaying, isMuted, currentScene?.audio.backgroundMusicVibe]);

  // Custom synth loop logic
  const startSynthMusicVibe = (vibe: string) => {
    stopSynthMusicVibe();
    if (vibe === 'none') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate soft musical chords/pulses
      let chordNotes = [220, 261.63, 329.63, 392.00]; // A minor default
      let rhythmSpeed = 1000; // ms
      
      if (vibe === 'lofi') {
        chordNotes = [196.00, 246.94, 293.66, 369.99]; // Gmaj7
        rhythmSpeed = 800;
      } else if (vibe === 'techno') {
        chordNotes = [110, 130, 146, 164]; // Fast electronic
        rhythmSpeed = 300;
      } else if (vibe === 'cinematic') {
        chordNotes = [146.83, 220.00, 277.18, 440.00]; // Dmaj7 majestic drone
        rhythmSpeed = 2000;
      } else if (vibe === 'corporate') {
        chordNotes = [261.63, 329.63, 392.00, 523.25]; // C Major bright
        rhythmSpeed = 600;
      }

      let step = 0;
      musicIntervalId.current = setInterval(() => {
        if (!ctx || ctx.state === 'suspended') return;
        
        try {
          // Play oscillator wave
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Select note from chord based on step
          const noteFreq = chordNotes[step % chordNotes.length];
          osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);
          
          if (vibe === 'techno') {
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } else if (vibe === 'lofi') {
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
          } else {
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2);
          }

          step++;
        } catch (err) {
          console.error("Audio synth scheduler failed", err);
        }
      }, rhythmSpeed);

    } catch (e) {
      console.warn("Could not start Web Audio synthesis on this browser:", e);
    }
  };

  const stopSynthMusicVibe = () => {
    if (musicIntervalId.current) {
      clearInterval(musicIntervalId.current);
      musicIntervalId.current = null;
    }
    activeOscillators.current.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    activeOscillators.current = [];
  };

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
      console.error("TTS generation error:", err);
      // Fallback: browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = "fr-FR";
         utterance.rate = currentScene.audio.speechSpeed;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsGeneratingTts(null);
    }
  };

  const handleSeek = (percentage: number) => {
    const targetSeconds = (percentage / 100) * totalDuration;
    setCurrentTime(targetSeconds);

    // Map to scene index
    let accum = 0;
    let targetIndex = 0;
    for (let i = 0; i < project.scenes.length; i++) {
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
      case 'middle-left': return "justify-center items-start pl-8 text-left";
      case 'middle-right': return "justify-center items-end pr-8 text-right";
      case 'center':
      default:
        return "justify-center items-center text-center";
    }
  };

  // Map text style variants
  const getTextStyleClasses = (style: string) => {
    switch (style) {
      case 'impact':
        return "font-black tracking-tighter uppercase text-3xl md:text-4xl text-neutral-50 drop-shadow-md";
      case 'bordered':
        return "font-extrabold tracking-tight text-3xl border-y border-white/20 py-3 text-white drop-shadow-sm";
      case 'cyber':
        return "font-mono font-bold tracking-tight text-2xl text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.4)]";
      case 'serif':
        return "font-serif italic tracking-wide text-2xl text-amber-100 drop-shadow-lg";
      case 'duotone':
        return "font-sans font-black tracking-tight text-3xl text-slate-200 bg-clip-text bg-gradient-to-r from-violet-200 to-indigo-100";
      case 'minimal':
      default:
        return "font-sans font-medium tracking-normal text-2xl text-slate-100";
    }
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

  const getAccentWordMarkup = (text: string | undefined | null, accent?: string | null, textStyle?: string) => {
    if (!text) return <span></span>;
    if (!accent || !text.toLowerCase().includes(accent.toLowerCase())) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${accent})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part && part.toLowerCase() === accent.toLowerCase() ? (
            <span 
              key={i} 
              className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-400 border-b-2 border-fuchsia-500/40 relative px-1 mx-0.5 rounded ${
                textStyle === 'cyber' ? 'shadow-fuchsia-500/20' : ''
              }`}
            >
              {part}
            </span>
          ) : part
        )}
      </span>
    );
  };

  // Generate dynamic stock background matching keywords elegantly
  const getBackgroundUrl = (keywords?: string) => {
    if (!keywords) return null;
    const term = encodeURIComponent(keywords.trim().replace(/\s+/g, '-'));
    return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80&sig=${term.length}`;
  };

  return (
    <div id="aura-video-container" className="flex-1 flex flex-col bg-slate-100 select-none p-6 justify-between items-center overflow-hidden">
      {/* Studio Banner */}
      <div className="w-full flex justify-between items-center bg-white border border-slate-200/85 px-4 py-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-slate-700 font-bold">Lecteur de Rendu Temps-Réel</span>
          <span className="text-slate-400 font-medium">| Scene {activeSceneIndex + 1}/{project.scenes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {project.settings.aspectRatio === '9:16' ? (
            <span className="text-[10px] bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-1 rounded inline-flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Smartphone className="w-3 h-3" /> TikTok & Shorts Custom Canvas
            </span>
          ) : (
            <span className="text-[10px] bg-indigo-50 border border-indigo-100/80 text-indigo-700 px-2 py-1 rounded inline-flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Monitor className="w-3 h-3" /> Landscape Campaign Canvas
            </span>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport with chassis */}
      <div className="flex-1 flex items-center justify-center py-4 w-full relative">
        <div 
          id="player-chassis"
          style={{ transition: 'all 0.4s ease-out' }}
          className={`relative overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 flex flex-col justify-between ${
            project.settings.aspectRatio === '9:16'
              ? 'w-[270px] h-[480px] rounded-[36px] border-[10px] border-slate-800 shadow-slate-900/40 ring-4 ring-slate-200'
              : 'w-[480px] h-[270px] rounded-2xl border-[6px] border-slate-800 shadow-slate-900/30'
          }`}
        >
          {/* Theme Gradient / Image Background */}
          <div className={`absolute inset-0 z-0 ${currentScene?.visual?.backgroundColor || themePreset.bgGradient}`}>
            {currentScene?.visual?.backgroundType === 'image' && currentScene?.visual?.assetKeywords && (
              <img
                src={`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=480&q=80&sig=${encodeURIComponent(currentScene.visual.assetKeywords)}`}
                alt="Motion Background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-20 filter blur-[2px] transition-all"
              />
            )}
            {/* Ambient Animated Particles / Circles for Motion visual */}
            <div className="absolute inset-0 mix-blend-overlay opacity-30 z-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/40 filter blur-3xl animate-[pulse_6s_infinite]" />
              <div className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full bg-violet-600/40 filter blur-3xl animate-[pulse_5s_infinite]" />
            </div>
          </div>

          {/* Slogan Watermark label */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-black/15 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/5">
            <span className="text-[9px] font-mono font-bold text-white/50 tracking-widest uppercase">
              {project.settings.name}
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
              SCENE {activeSceneIndex + 1}
            </span>
          </div>

          {/* Active Canvas Scene Renderer */}
          <div className={`w-full h-full flex flex-col relative p-6 z-10 select-none ${getPositionClasses(currentScene?.visual?.textPosition || 'center')}`}>
            <AnimatePresence mode="wait">
              {currentScene && (
                <motion.div
                  key={currentScene.id}
                  {...getAnimationProps(currentScene.visual?.animationType || "fade")}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full space-y-3.5 z-10"
                >
                  {/* Category Helper Badge */}
                  {currentScene.visual?.subtitle && (
                    <div className="inline-block">
                      <span className={`text-[10px] tracking-widest uppercase py-1 px-3.5 rounded-full border border-white/10 text-white/70 bg-white/5 backdrop-blur-sm ${themePreset.font}`}>
                        {currentScene.visual.subtitle}
                      </span>
                    </div>
                  )}

                  {/* Heavy Impact Title */}
                  <h2 className={`${getTextStyleClasses(currentScene.visual?.textStyle || "minimal")} ${themePreset.font} leading-snug`}>
                    {getAccentWordMarkup(
                      currentScene.visual?.title, 
                      currentScene.visual?.accentWord, 
                      currentScene.visual?.textStyle
                    )}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated sound waves bar */}
            {isPlaying && (
              <div className="absolute bottom-16 left-0 right-0 z-10 flex items-center justify-center gap-1 pointer-events-none opacity-45">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/80 rounded-full"
                    style={{
                      height: `${10 + Math.random() * 25}px`,
                      transition: 'height 0.1s ease-in-out',
                      animation: `pulse ${0.3 + i * 0.1}s infinite alternate`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Interactive Dynamic Subtitles Panel */}
          <div className="w-full bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4 text-center z-10 select-none border-t border-white/5">
            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed drop-shadow italic px-2">
              「 {currentScene?.subtitle} 」
            </p>
          </div>
        </div>
      </div>

      {/* Control Actions Panel & Time scrubber */}
      <div className="w-full space-y-4 pt-2">
        {/* Scrubber timeline */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
            <span>{formatTimer(currentTime)}</span>
            <span className="text-slate-400">Durée Totale : {formatTimer(totalDuration)}</span>
          </div>
          
          <div 
            id="timeline-scrubber-track"
            onClick={(e) => {
              const bounds = e.currentTarget.getBoundingClientRect();
              const percentage = ((e.clientX - bounds.left) / bounds.width) * 100;
              handleSeek(percentage);
            }}
            className="h-2.5 w-full bg-slate-200 rounded-lg cursor-pointer overflow-hidden border border-slate-300 group relative shadow-inner"
          >
            {/* Filled current timeline progress bar */}
            <div 
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              className="absolute left-0 top-0 h-full bg-indigo-600 transition-all rounded-r"
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
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              id="btn-play-pause"
              onClick={togglePlayback}
              className={`p-3 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isPlaying 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/10' 
                  : 'bg-slate-100 text-slate-705 hover:bg-slate-200 border border-slate-205'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            
            <button
              id="btn-reset-player"
              onClick={resetPlayer}
              title="Reset Player"
              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* AI Narration Voice Activator */}
          <button
            id="btn-trigger-speech"
            onClick={handlePlayNarratorSpeech}
            disabled={isGeneratingTts !== null}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            {isGeneratingTts === currentScene?.id ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Audio IA en cours...
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-indigo-600" />
                🗣️ Entendre la voix off IA (TTS)
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            {/* Music Loop Type Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-[10px] text-slate-600 font-bold uppercase tracking-wider font-mono shadow-sm">
              <Music className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span className="capitalize">{currentScene?.audio.backgroundMusicVibe || 'sans musique'}</span>
            </div>

            <button
              id="btn-toggle-mute"
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-205 rounded-lg text-slate-605 hover:text-slate-800 transition-all cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-650" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
