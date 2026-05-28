import { useState } from "react";
import { 
  Type, 
  Settings, 
  Wand2, 
  Music, 
  Image as ImageIcon, 
  Layout, 
  Sliders,
  AlignLeft,
  RefreshCw,
  Plus
} from "lucide-react";
import { Scene, VisualConfig, AudioConfig, TextPosition, TextStyle, AnimationType } from "../types";
import { VISUAL_THEMES } from "../constants";

interface ControlPanelProps {
  scene: Scene;
  onChangeScene: (s: Scene) => void;
  onPolishWithAi: (text: string) => Promise<string>;
}

export default function ControlPanel({
  scene,
  onChangeScene,
  onPolishWithAi
}: ControlPanelProps) {
  const [isPolishing, setIsPolishing] = useState(false);

  if (!scene) {
    return (
      <aside className="w-[320px] bg-slate-50 border-l border-slate-200 p-5 flex flex-col items-center justify-center text-slate-400">
        <Settings className="w-8 h-8 opacity-25 animate-spin text-slate-400" />
        <p className="text-xs mt-2 text-center font-medium">Aucun clip sélectionné</p>
      </aside>
    );
  }

  const updateVisual = (key: keyof VisualConfig, value: any) => {
    onChangeScene({
      ...scene,
      visual: {
        ...scene.visual,
        [key]: value
      }
    });
  };

  const updateAudio = (key: keyof AudioConfig, value: any) => {
    onChangeScene({
      ...scene,
      audio: {
        ...scene.audio,
        [key]: value
      }
    });
  };

  const handleOptimiseScript = async () => {
    try {
      setIsPolishing(true);
      const polished = await onPolishWithAi(scene.subtitle);
      onChangeScene({
        ...scene,
        subtitle: polished
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <aside id="aura-control-panel" className="w-[330px] bg-white border-l border-slate-205 flex flex-col h-full overflow-hidden select-none">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-650" /> Inspecteur de Séquence
        </h3>
        <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          actif
        </span>
      </div>

      {/* Control Elements Scroll wrapper */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 bg-white">
        
        {/* Subtitle Voice-Over text narrative editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-550 flex items-center gap-1.5">
              🗣️ Texte Lu par la voix off IA
            </label>
            <button
              id="btn-polish-with-ai"
              onClick={handleOptimiseScript}
              disabled={isPolishing}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-slate-300 transition shadow-xs cursor-pointer"
              title="Optimiser le style du script narratif"
            >
              <Wand2 className="w-3 h-3" /> {isPolishing ? 'Optimisation...' : 'Améliorer IA'}
            </button>
          </div>
          <textarea
            id="input-scene-subtitle"
            value={scene.subtitle}
            onChange={(e) => onChangeScene({ ...scene, subtitle: e.target.value })}
            rows={3}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none leading-relaxed resize-none shadow-sm"
            placeholder="Saisissez la voix-off qui sera lue..."
          />
        </div>

        {/* Display Typography overlays block */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-600" /> Slogan Visible à L'Écran
          </h4>
          
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Titre Principal</span>
            <input
              id="input-scene-visual-title"
              type="text"
              value={scene.visual.title}
              onChange={(e) => updateVisual('title', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sous-Titre / Sur-Titre</span>
            <input
              id="input-scene-visual-subtitle"
              type="text"
              value={scene.visual.subtitle || ""}
              onChange={(e) => updateVisual('subtitle', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mot à Surligner (Accents)</span>
            <input
              id="input-scene-visual-accentword"
              type="text"
              value={scene.visual.accentWord || ""}
              onChange={(e) => updateVisual('accentWord', e.target.value)}
              className="w-full bg-white border border-slate-200 text-indigo-600 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold text-indigo-600 shadow-sm"
            />
          </div>
        </div>

        {/* Stylization properties (Typeface style, Transition animation...) */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-indigo-600" /> Animations & Position
          </h4>

          {/* Alignment */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cadrage du Texte</span>
            <select
              id="select-text-position"
              value={scene.visual.textPosition}
              onChange={(e) => updateVisual('textPosition', e.target.value as TextPosition)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="center">↕️ Centré Milieu</option>
              <option value="bottom">⬇️ Centré Bas</option>
              <option value="top">⬆️ Centré Haut</option>
              <option value="middle-left">⬅️ Aligné Gauche (Milieu)</option>
              <option value="middle-right">➡️ Aligné Droite (Milieu)</option>
            </select>
          </div>

          {/* TextStyle dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Style Typographique</span>
            <select
              id="select-text-style"
              value={scene.visual.textStyle}
              onChange={(e) => updateVisual('textStyle', e.target.value as TextStyle)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="minimal">Minimalist Standard</option>
              <option value="impact">Impact Majuscule (Bold)</option>
              <option value="bordered">Encadré Lignes (Modern)</option>
              <option value="cyber">Glow Cyberpunk (Mono)</option>
              <option value="serif">Élégant Serif (Italic)</option>
              <option value="duotone">Gradient Double Ton (Aesthetic)</option>
            </select>
          </div>

          {/* Animation Entry option */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Transition d'Entrée</span>
            <select
              id="select-animation-type"
              value={scene.visual.animationType}
              onChange={(e) => updateVisual('animationType', e.target.value as AnimationType)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="fade">Fondu Doux (Fade)</option>
              <option value="slide-up">Glissement Vertical (Slide-up)</option>
              <option value="pop-in">Zoom Rebond (Pop-in)</option>
              <option value="reveal">Balayage Masque (Reveal)</option>
              <option value="drift">Dérive Latérale (Drift)</option>
            </select>
          </div>
        </div>

        {/* Visual asset background layer */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Fond d'Habillage Visuel
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="bg-type-gradient"
              onClick={() => updateVisual('backgroundType', 'gradient')}
              className={`py-1.5 rounded text-[10px] font-bold transition cursor-pointer ${
                scene.visual.backgroundType === 'gradient'
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Dégradé Uni
            </button>
            <button
              id="bg-type-image"
              onClick={() => updateVisual('backgroundType', 'image')}
              className={`py-1.5 rounded text-[10px] font-bold transition cursor-pointer ${
                scene.visual.backgroundType === 'image'
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Image Art Abstrait
            </button>
          </div>

          {scene.visual.backgroundType === 'image' && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mots-clés de l'Illustration</span>
              <input
                id="input-asset-keywords"
                type="text"
                value={scene.visual.assetKeywords || ""}
                onChange={(e) => updateVisual('assetKeywords', e.target.value)}
                placeholder="ex: tech network circuit glowing"
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Custom Gradient Tailwind (Optionnel)</span>
            <input
              id="input-gradient-builder"
              type="text"
              value={scene.visual.backgroundColor}
              onChange={(e) => updateVisual('backgroundColor', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2 px-3 text-[10px] font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Audio Synthesis Settings Panel (Voice options) */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-600" /> Paramètres Audio
          </h4>

          {/* Voice select dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Profil de Voix off Gemini</span>
            <select
              id="select-voice-name"
              value={scene.audio.voiceName}
              onChange={(e) => updateAudio('voiceName', e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="Zephyr">🌪️ Zephyr (Chaud & Naturel)</option>
              <option value="Kore">✨ Kore (Énergique & Rythmé)</option>
              <option value="Fenrir">🌲 Fenrir (Profond & Captivant)</option>
              <option value="Puck">🧚 Puck (Amical & Enthusiast)</option>
              <option value="Charon">🎓 Charon (Corporate & Pédagogique)</option>
            </select>
          </div>

          {/* Music track vibe option */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Musique d'ambiance locale</span>
            <select
              id="select-music-vibe"
              value={scene.audio.backgroundMusicVibe}
              onChange={(e) => updateAudio('backgroundMusicVibe', e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            >
              <option value="none">🔇 Sans musique de fond</option>
              <option value="lofi">☕ Lofi Chill</option>
              <option value="techno">⚡ Techno Pulsation</option>
              <option value="cinematic">🎬 Nappe Cinématique</option>
              <option value="corporate">📈 Success Corporate</option>
            </select>
          </div>

          {/* Volume slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              <span>Volume Effets & Voix</span>
              <span className="text-indigo-650">{Math.round(scene.audio.volume * 100)}%</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scene.audio.volume}
              onChange={(e) => updateAudio('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-slate-300 shadow-inner"
            />
          </div>
        </div>

      </div>
    </aside>
  );
}
