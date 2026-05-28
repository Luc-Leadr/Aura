import { Plus, Trash, Clock, Smartphone, Monitor } from "lucide-react";
import { Project, Scene } from "../types";

interface TimelineProps {
  project: Project;
  activeSceneIndex: number;
  setActiveSceneIndex: (idx: number) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
}

export default function Timeline({
  project,
  activeSceneIndex,
  setActiveSceneIndex,
  onUpdateScenes
}: TimelineProps) {
  
  const totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0);

  const handleSceneDurationChange = (index: number, increment: boolean) => {
    const updated = [...project.scenes];
    const current = updated[index].duration;
    const nextVal = increment ? current + 1 : Math.max(2, current - 1);
    updated[index].duration = nextVal;
    onUpdateScenes(updated);
  };

  const handleAddScene = () => {
    // Duplicate the active scene or default a new one
    const active = project.scenes[activeSceneIndex] || project.scenes[0];
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      duration: 5,
      subtitle: "Nouvelle ligne de script ajoutée pour renforcer l'intention de communication de votre produit.",
      visual: {
        ...active.visual,
        title: "NOUVEAU MESSAGE",
        subtitle: "Ligne de soutien rédigée",
        accentWord: "MESSAGE"
      },
      audio: {
        ...active.audio
      },
      transition: "fade"
    };

    const updated = [...project.scenes];
    updated.splice(activeSceneIndex + 1, 0, newScene);
    onUpdateScenes(updated);
    setActiveSceneIndex(activeSceneIndex + 1);
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) return; // Must have at least 1 scene
    const updated = project.scenes.filter((_, i) => i !== index);
    onUpdateScenes(updated);
    setActiveSceneIndex(Math.max(0, index - 1));
  };

  return (
    <div id="aura-timeline" className="bg-white border-t border-slate-250 p-5 mt-auto flex flex-col gap-4 select-none shadow-md">
      {/* Header timeline specs */}
      <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Séquenceur de Scènes Storyboard
          </span>
          <span className="text-[10px] bg-white text-slate-600 px-2.5 py-0.5 rounded border border-slate-200 font-mono font-semibold">
            {project.scenes.length} CLIPS | {totalDuration} SECONDES
          </span>
        </div>
        
        <button
          id="btn-timeline-add-scene"
          onClick={handleAddScene}
          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Ajouter une scène
        </button>
      </div>

      {/* Main interactive horizontal track blocks */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        {project.scenes.map((scene, index) => {
          const isActive = index === activeSceneIndex;
          
          // Compute proportional width
          const proportionalWidth = (scene.duration / totalDuration) * 100;
          const minWidthPx = Math.max(160, proportionalWidth * 6);

          return (
            <div
              id={`timeline-scene-card-${index}`}
              key={scene.id}
              style={{ width: `${minWidthPx}px` }}
              className={`flex-shrink-0 cursor-pointer rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all relative ${
                isActive
                  ? 'bg-indigo-50/30 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setActiveSceneIndex(index)}
            >
              {/* Scene order index and delete */}
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  CLIP #{index + 1}
                </span>
                
                {project.scenes.length > 1 && (
                  <button
                    id={`btn-delete-scene-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(index);
                    }}
                    className="p-1 hover:bg-red-50 rounded transition-all text-slate-400 hover:text-red-600"
                    title="Supprimer la scène"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Subtitle / text preview label */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1">
                  {scene.visual.title || "Message vide"}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-normal">
                  {scene.subtitle}
                </p>
              </div>

              {/* Duration controller at base */}
              <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-200 shadow-inner">
                <span className="text-[9px] font-mono text-slate-600 font-bold">
                  {scene.duration}s
                </span>
                
                <div className="flex gap-1">
                  <button
                    id={`btn-scene-duration-dec-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSceneDurationChange(index, false);
                    }}
                    className="w-4 h-4 bg-slate-200 hover:bg-slate-300 border border-slate-250 text-slate-700 rounded flex items-center justify-center text-[10px] font-extrabold cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    id={`btn-scene-duration-inc-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSceneDurationChange(index, true);
                    }}
                    className="w-4 h-4 bg-slate-200 hover:bg-slate-300 border border-slate-250 text-slate-700 rounded flex items-center justify-center text-[10px] font-extrabold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Animated active slide light dot */}
              {isActive && (
                <div className="absolute top-1/2 -right-1.5 w-1 h-8 rounded-full bg-indigo-600 pointer-events-none transform -translate-y-1/2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
