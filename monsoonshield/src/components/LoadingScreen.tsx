"use client";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" role="status" aria-label="Loading">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 rounded-2xl border-2 border-cyan-400/30 mx-auto animate-spin" style={{ borderTopColor: "transparent" }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">MonsoonShield</h2>
          <p className="text-xs text-slate-400 mt-1">Loading your disaster preparedness portal...</p>
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-8 rounded-full bg-cyan-500/30"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
