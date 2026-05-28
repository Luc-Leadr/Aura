import React, { useState } from "react";
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
  Languages
} from "lucide-react";
import { 
  Smile, 
  Upload, 
  Plus,
  User,
  Tags
} from "lucide-react";
import { SAMPLE_SOURCE_EXAMPLES, VISUAL_THEMES, PRESET_AVATARS } from "../constants";
import { ProjectSettings, AspectRatio } from "../types";

interface SidebarProps {
  settings: ProjectSettings;
  onUpdateSettings: (s: ProjectSettings) => void;
  onGenerateStoryboard: (payload: { prompt: string; url: string; scriptVibe: string }) => Promise<void>;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateStoryboard({ prompt, url, scriptVibe });
  };

  const loadExample = (ex: typeof SAMPLE_SOURCE_EXAMPLES[0]) => {
    setUrl(ex.url);
    setPrompt(ex.prompt);
    setScriptVibe(ex.vibe);
    onUpdateSettings({
      ...settings,
      visualTheme: ex.theme as any
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vibe Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Ton et Style Script
              </label>
              <select
                id="select-script-vibe"
                value={scriptVibe}
                onChange={(e) => setScriptVibe(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2.5 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
              >
                <option value="energetic marketing">⚡ Vendeur & Énergique (Shorts/TikTok)</option>
                <option value="educational explainer">🎓 Éducateur & Pédagogique (LinkedIn/Youtube)</option>
                <option value="inspiring brand story">🌟 Inspirant & Storytelling de Marque</option>
                <option value="relaxed corporate">💼 Professionnel Calme & Raisonné</option>
                <option value="dramatic presentation">🎭 Théâtral & Cinématographique</option>
              </select>
            </div>

            {/* Source Web Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-indigo-600" /> Analyser un Site Web (URL)
              </label>
              <div className="relative">
                <input
                  id="input-url"
                  type="text"
                  placeholder="ex: www.ma-marque-responsable.fr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
                />
                <Link2 className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Le serveur va lire les textes principaux du site pour s'imprégner de sa charte, son style et du ton utilisé.
              </p>
            </div>

            {/* Custom Prompt / Context text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Description ou Texte de Base
              </label>
              <textarea
                id="input-prompt"
                placeholder="Décrivez votre produit, vos services, ou copiez-collez l'accroche de votre campagne..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed shadow-sm"
              />
            </div>

            {/* Theme Visual Fast Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Palette Graphique Directe
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
              <p className="text-[10px] text-slate-500 font-medium italic">
                {VISUAL_THEMES.find(t => t.id === settings.visualTheme)?.styleDescription}
              </p>
            </div>

            {/* Aspect Ratio Switch */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Format d'Affichage
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="ratio-portrait"
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, aspectRatio: '9:16' })}
                  className={`py-2 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settings.aspectRatio === '9:16'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-705 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-605 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Portrait (9:16 Shorts/TikTok)
                </button>
                <button
                  id="ratio-landscape"
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, aspectRatio: '16:9' })}
                  className={`py-2 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settings.aspectRatio === '16:9'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-705 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-605 hover:text-slate-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-indigo-600" /> Paysage (16:9 LinkedIn/Web)
                </button>
              </div>
            </div>

            {/* Logo de l'Entreprise */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Logo de la Marque</span>
                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold uppercase">Auto-Scrapé / Custom</span>
              </label>
              
              <div className="flex gap-2">
                <input
                  id="input-logo-url"
                  type="text"
                  placeholder="Collez l'URL de votre logo..."
                  value={settings.logoUrl || ""}
                  onChange={(e) => onUpdateSettings({ ...settings, logoUrl: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-lg py-2 px-3 text-xs placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm"
                />
                
                {settings.logoUrl && (
                  <div className="relative flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg p-1.5 w-9 h-9 flex-shrink-0">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <button 
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, logoUrl: "" })}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                S'affichera de manière professionnelle au coin du plan pour asseoir la légitimité commerciale.
              </p>
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
