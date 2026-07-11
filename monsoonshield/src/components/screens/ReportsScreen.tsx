"use client";

import { useState } from "react";
import { CheckCircle, Image as ImageIcon, MapPin, Plus, ThumbsUp } from "lucide-react";
import { MOCK_COMMUNITY_REPORTS } from "@/lib/mockData";

export default function ReportsScreen() {
  const [reports, setReports] = useState(MOCK_COMMUNITY_REPORTS);
  const [showForm, setShowForm] = useState(false);

  // New report form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("road_blocked");
  const [description, setDescription] = useState("");
  const [reporter, setReporter] = useState("");

  const handleUpvote = (id: string) => {
    setReports((prev) =>
      prev.map((rep) => (rep.id === id ? { ...rep, upvotes: rep.upvotes + 1 } : rep))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newReport = {
      id: `rep-${Date.now()}`,
      type: category,
      title,
      description,
      reporter: reporter || "Anonymous",
      lat: 18.5204 + (Math.random() - 0.5) * 0.05,
      lng: 73.8567 + (Math.random() - 0.5) * 0.05,
      upvotes: 1,
      verified: false,
      timestamp: "Just now",
      photo: true,
      urgent: category === "need_help",
    };

    setReports([newReport, ...reports]);
    setShowForm(false);
    // Reset form
    setTitle("");
    setCategory("road_blocked");
    setDescription("");
    setReporter("");
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "road_blocked": return "🚧 Road Blocked";
      case "flood_warning": return "🌊 Flood Inundation";
      case "need_help": return "🆘 Need Emergency Help";
      case "resource_available": return "🍱 Relief Resource";
      default: return "⚠️ Hazard Warning";
    }
  };

  const getCategoryBgColor = (type: string) => {
    switch (type) {
      case "need_help": return "bg-red-500/10 border-red-500/20 text-red-400";
      case "resource_available": return "bg-green-500/10 border-green-500/20 text-green-400";
      case "road_blocked": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            👥 Community & Citizen Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">Crowd-sourced, verified ground truth</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-1 text-sm py-2"
        >
          <Plus className="h-4 w-4" />
          <span>Submit Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Form Overlay / Panel */}
        {showForm && (
          <div className="lg:col-span-3 glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-1.5">
              📣 File a Hyperlocal Situation Report
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Wakad underpass flooded"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm text-white"
                  >
                    <option value="road_blocked">🚧 Road Blocked / Waterlogged</option>
                    <option value="flood_warning">🌊 Flood Level Warning</option>
                    <option value="need_help">🆘 Stranded / Need Rescue Help</option>
                    <option value="resource_available">🍱 Relief Resource (Food/Water/Shelter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Description & Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific landmarks, height of water, safety concerns, or available capacity..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-sm text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-750 flex items-center justify-center gap-1 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" /> Add Photo (AI Analyzed)
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-750 flex items-center justify-center gap-1 transition-colors"
                  >
                    <MapPin className="h-4 w-4" /> Tag Current GPS
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 border-t border-slate-850 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-xs font-bold text-white shadow-md"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports feed list */}
        <div className="lg:col-span-2 space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="glass-card p-5 border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryBgColor(rep.type)}`}>
                    {getCategoryLabel(rep.type)}
                  </span>
                  {rep.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      <CheckCircle className="h-3 w-3" /> VERIFIED
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{rep.timestamp}</span>
              </div>

              <div>
                <h4 className="font-bold text-white text-md leading-tight">{rep.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{rep.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-850 pt-3 text-xs">
                <div className="text-slate-500 font-medium">
                  By: <span className="text-slate-400 font-semibold">{rep.reporter}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpvote(rep.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 font-semibold transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Confirm Valid ({rep.upvotes})</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Side Panel Map placeholder */}
        <div className="glass-card p-5 border-slate-800 h-[450px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Incident Map
            </h3>
            <span className="block text-[10px] text-slate-500">Crowd-sourced coordinates around Pune</span>
          </div>

          {/* Map box simulation */}
          <div className="flex-1 my-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-center relative overflow-hidden">
            {/* Grid simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
            <div className="relative z-10 space-y-2">
              <MapPin className="h-10 w-10 text-cyan-400 mx-auto animate-bounce" />
              <span className="block text-xs font-semibold text-slate-400">Map Rendering Simulated</span>
              <span className="block text-[10px] text-slate-500 font-mono">Location center: Pune, Wakad</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-850 pt-3">
            ℹ️ Coordinates are cross-referenced with Municipal sensor grids to detect anomaly reports.
          </div>
        </div>
      </div>
    </div>
  );
}
