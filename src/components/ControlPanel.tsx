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
  Plus,
  Palette,
  Eye,
  Type as FontIcon
} from "lucide-react";
import { Scene, VisualConfig, AudioConfig, TextPosition, TextStyle, AnimationType } from "../types";
import { VISUAL_THEMES, FONTS, ROYALTY_FREE_TRACKS, I18N_DICTS } from "../constants";

interface ControlPanelProps {
  scene: Scene;
  onChangeScene: (s: Scene) => void;
  onPolishWithAi: (text: string) => Promise<string>;
  language: 'fr' | 'en';
}

export default function ControlPanel({
  scene,
  onChangeScene,
  onPolishWithAi,
  language
}: ControlPanelProps) {
  const [isPolishing, setIsPolishing] = useState(false);
  const t = I18N_DICTS[language || 'fr'];

  if (!scene) {
    return (
      <aside className="w-[330px] bg-slate-50 border-l border-slate-200 p-5 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Settings className="w-8 h-8 opacity-25 animate-spin text-slate-400" />
        <p className="text-xs mt-2 text-center font-bold">
          {language === 'fr' ? 'Aucun clip sélectionné' : 'No clip selected'}
        </p>
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

  // Convert Hex background setup to usable solid string
  const handleSolidColorPick = (colorVal: string) => {
    onChangeScene({
      ...scene,
      visual: {
        ...scene.visual,
        backgroundType: 'solid',
        backgroundColor: colorVal
      }
    });
  };

  return (
    <aside id="aura-control-panel" className="w-[335px] bg-white border-l border-slate-205 flex flex-col h-full overflow-hidden select-none font-sans">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-650" /> {t.inspect_sec}
        </h3>
        <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
          {language === 'fr' ? 'Éditeur en Direct' : 'Live Editor'}
        </span>
      </div>

      {/* Control Elements Scroll wrapper */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 bg-white">
        
        {/* Subtitle Voice-Over text narrative editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5 font-mono">
              {t.script_read_label}
            </label>
            <button
              id="btn-polish-with-ai"
              onClick={handleOptimiseScript}
              disabled={isPolishing}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition shadow-xs cursor-pointer"
              title="Optimiser le style du script narratif"
            >
              <Wand2 className="w-3 h-3" /> {isPolishing ? t.script_improving_text : t.script_improve_btn}
            </button>
          </div>
          <textarea
            id="input-scene-subtitle"
            value={scene.subtitle}
            onChange={(e) => onChangeScene({ ...scene, subtitle: e.target.value })}
            rows={3}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none leading-relaxed resize-none shadow-sm font-medium"
            placeholder="Saisissez la voix-off qui sera lue..."
          />
        </div>

        {/* Display Typography overlays block */}
        <div className="space-y-3.5 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
            <Type className="w-3.5 h-3.5 text-indigo-650" /> {t.display_heading_sec}
          </h4>
          
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.main_title_label}</span>
            <input
              id="input-scene-visual-title"
              type="text"
              value={scene.visual.title}
              onChange={(e) => updateVisual('title', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.sub_title_label}</span>
            <input
              id="input-scene-visual-subtitle"
              type="text"
              value={scene.visual.subtitle || ""}
              onChange={(e) => updateVisual('subtitle', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm font-medium"
            />
          </div>

          <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-150 space-y-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">{t.highlight_accent_label}</span>
            <input
              id="input-scene-visual-accentword"
              type="text"
              value={scene.visual.accentWord || ""}
              onChange={(e) => updateVisual('accentWord', e.target.value)}
              className="w-full bg-white border border-slate-200 text-indigo-600 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold shadow-xs"
            />

            {/* Custom Interactive Color Picker for Highlight Word! */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase">{t.accent_color_label}</span>
              <div className="flex items-center gap-1.5">
                <input 
                  id="picker-custom-accent"
                  type="color"
                  value={scene.visual.customAccentColor || "#ef4444"}
                  onChange={(e) => updateVisual('customAccentColor', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                />
                <button
                  type="button"
                  onClick={() => updateVisual('customAccentColor', undefined)}
                  className="text-[8px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded font-bold"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Font Family Choice - Extremely requested feature */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
            <FontIcon className="w-3.5 h-3.5 text-indigo-650" /> {t.font_sec}
          </label>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.font_family_label}</span>
            <select
              id="select-scene-font-family"
              value={scene.visual.fontFamily || "inter"}
              onChange={(e) => updateVisual('fontFamily', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
            >
              {FONTS.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stylization properties (Typeface style, Transition animation...) */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
            <Layout className="w-3.5 h-3.5 text-indigo-650" /> {t.animations_sec}
          </h4>

          {/* Alignment */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.text_dir_label}</span>
            <select
              id="select-text-position"
              value={scene.visual.textPosition}
              onChange={(e) => updateVisual('textPosition', e.target.value as TextPosition)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
            >
              <option value="center">↕️ {language === 'fr' ? 'Centré Milieu' : 'Centered Middle'}</option>
              <option value="bottom">⬇️ {language === 'fr' ? 'Centré Bas' : 'Centered Bottom'}</option>
              <option value="top">⬆️ {language === 'fr' ? 'Centré Haut' : 'Centered Top'}</option>
              <option value="middle-left">⬅️ {language === 'fr' ? 'Aligné Gauche' : 'Aligned Left'}</option>
              <option value="middle-right">➡️ {language === 'fr' ? 'Aligné Droite' : 'Aligned Right'}</option>
            </select>
          </div>

          {/* TextStyle dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.text_style_label}</span>
            <select
              id="select-text-style"
              value={scene.visual.textStyle}
              onChange={(e) => updateVisual('textStyle', e.target.value as TextStyle)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
            >
              <option value="minimal">Minimalist Standard</option>
              <option value="impact">Impact Heavy Caps</option>
              <option value="bordered">Bordered Outline Line</option>
              <option value="cyber">Cyberpunk Electric Glow</option>
              <option value="serif">Editorial Elegant Serif</option>
              <option value="duotone">Duotone Gradient Tag</option>
            </select>
          </div>

          {/* Animation Entry option */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.text_anim_label}</span>
            <select
              id="select-animation-type"
              value={scene.visual.animationType}
              onChange={(e) => updateVisual('animationType', e.target.value as AnimationType)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
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
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-650" /> {t.background_sec}
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="bg-type-gradient"
              type="button"
              onClick={() => updateVisual('backgroundType', 'gradient')}
              className={`py-1.5 rounded text-[10px] font-bold transition cursor-pointer ${
                scene.visual.backgroundType === 'gradient'
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.bg_gradient_btn}
            </button>
            <button
              id="bg-type-image"
              type="button"
              onClick={() => updateVisual('backgroundType', 'image')}
              className={`py-1.5 rounded text-[10px] font-bold transition cursor-pointer ${
                scene.visual.backgroundType === 'image'
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.bg_image_btn}
            </button>
          </div>

          {scene.visual.backgroundType === 'image' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-155">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.bg_keywords_label}</span>
              <input
                id="input-asset-keywords"
                type="text"
                value={scene.visual.assetKeywords || ""}
                onChange={(e) => updateVisual('assetKeywords', e.target.value)}
                placeholder="ex: tech network circuit glowing"
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm"
              />
            </div>
          )}

          {/* Dynamic Background Custom Color pickers to allow "forced modification" */}
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              {t.bg_custom_gradient}
            </span>
            
            <div className="flex gap-2">
              <input
                id="input-gradient-builder"
                type="text"
                value={scene.visual.backgroundColor}
                onChange={(e) => updateVisual('backgroundColor', e.target.value)}
                placeholder="from-slate-900 to-indigo-950"
                className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-lg py-1 px-2.5 text-[10px] font-mono focus:ring-1 focus:ring-indigo-500/20 focus:outline-none shadow-xs"
              />
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <input 
                  id="picker-custom-bg"
                  type="color"
                  value={scene.visual.backgroundColor.startsWith("#") ? scene.visual.backgroundColor : "#0f172a"}
                  onChange={(e) => handleSolidColorPick(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0"
                  title="Force Single Solid Hex Color"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings Panel */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
            <Music className="w-3.5 h-3.5 text-indigo-650" /> {t.audio_sec}
          </h4>

          {/* Voice select dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{t.voice_profile_label}</span>
            <select
              id="select-voice-name"
              value={scene.audio.voiceName}
              onChange={(e) => updateAudio('voiceName', e.target.value as any)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
            >
              <option value="Zephyr">🌪️ Zephyr ({language === 'fr' ? 'Chaud & Naturel' : 'Warm & Deep'})</option>
              <option value="Kore">✨ Kore ({language === 'fr' ? 'Énergique & Rythmé' : 'Fast & Energetic'})</option>
              <option value="Fenrir">🌲 Fenrir ({language === 'fr' ? 'Profond & Captivant' : 'Heavy & Majestic'})</option>
              <option value="Puck">🧚 Puck ({language === 'fr' ? 'Amical & Enthousiaste' : 'Bright & friendly'})</option>
              <option value="Charon">🎓 Charon ({language === 'fr' ? 'Corporate & Pédagogique' : 'Clear & Educator'})</option>
            </select>
          </div>

          {/* Music track selection targeting Royalty-Free music loop playlist */}
          <div className="space-y-2.5 bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-100/80">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              {t.music_local_label}
            </span>
            <select
              id="select-music-vibe"
              value={scene.audio.backgroundMusicVibe}
              onChange={(e) => updateAudio('backgroundMusicVibe', e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-semibold"
            >
              <option value="none">🔇 {t.music_vibe_none}</option>
              {ROYALTY_FREE_TRACKS.map(track => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>

            {/* Custom Interactive Music advisor recommendation */}
            {scene.audio.backgroundMusicVibe !== "none" && (
              <div className="pt-1.5 border-t border-indigo-100/50">
                <span className="text-[9px] text-indigo-950 font-extrabold uppercase tracking-tight block">
                  {t.expert_reco}
                </span>
                <p className="text-[9px] text-indigo-900/80 leading-normal font-semibold mt-0.5 whitespace-pre-wrap">
                  {language === 'fr' 
                    ? ROYALTY_FREE_TRACKS.find(tr => tr.id === scene.audio.backgroundMusicVibe)?.recommendedFor 
                    : ROYALTY_FREE_TRACKS.find(tr => tr.id === scene.audio.backgroundMusicVibe)?.recommendedForEn
                  }
                </p>
              </div>
            )}
          </div>

          {/* Volume slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
              <span>{t.sound_vol_label}</span>
              <span className="text-indigo-650 font-black">{Math.round(scene.audio.volume * 100)}%</span>
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
