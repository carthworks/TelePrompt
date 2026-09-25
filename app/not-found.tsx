import Link from "next/link";
import { Monitor, ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-gray-900/80 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
          <Monitor className="w-8 h-8" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-gray-200 mb-3">Script Track Not Found</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          The requested prompter cue or path doesn&apos;t exist. Return to the main studio cockpit to load your scripts or resume live speech playback.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center space-x-2 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Studio Cockpit</span>
        </Link>
      </div>

      <div className="mt-8 text-xs text-gray-600 flex items-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>TelePrompt Pro Studio • All-In-One Architecture</span>
      </div>
    </div>
  );
}
