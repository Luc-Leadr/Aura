import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught rendering error in Aura Studio:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold tracking-tight text-white">Anomalie d'affichage détectée</h2>
              <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto text-slate-400">
                Aura Studio a intercepté un dysfonctionnement de rendu qui aurait normalement provoqué une page blanche. 
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-red-400 text-left overflow-x-auto max-h-32">
                <span className="text-slate-500 select-none font-bold mr-1">&gt; ERROR:</span>
                {this.state.error.message || "Unknown rendering exception"}
                {this.state.error.stack && (
                  <pre className="text-slate-600 mt-2 text-[8px] leading-tight overflow-x-auto">
                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser le Studio
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="py-2.5 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" /> Page d'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
