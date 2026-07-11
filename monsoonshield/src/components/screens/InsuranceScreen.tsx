"use client";

import { useState } from "react";
import {
  Camera, MapPin, CheckCircle2, Upload,
  Phone, AlertTriangle, ChevronRight, Shield
} from "lucide-react";

const CLAIM_TYPES = [
  { id: "house", label: "House Damage", icon: "🏠", description: "Structural damage to your home" },
  { id: "crop", label: "Crop Damage", icon: "🌾", description: "Agricultural crop loss" },
  { id: "vehicle", label: "Vehicle Damage", icon: "🚗", description: "Vehicle damage from flood/cyclone" },
  { id: "livestock", label: "Livestock Loss", icon: "🐄", description: "Death or injury to livestock" },
];

const CLAIM_STEPS = [
  { step: 1, title: "Select Type", desc: "Choose the type of damage", done: true },
  { step: 2, title: "Upload Evidence", desc: "Photos and documents", done: false },
  { step: 3, title: "Location & Details", desc: "Where and when it happened", done: false },
  { step: 4, title: "Submit Claim", desc: "Review and submit to authorities", done: false },
];

export default function InsuranceScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ description: "", date: "", location: "" });
  const [submitted, setSubmitted] = useState(false);
  const [claimId, setClaimId] = useState("");

  const handleSubmit = () => {
    setClaimId(`CLM-${Date.now().toString().slice(-6)}`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Claim Submitted Successfully</h2>
          <p className="text-sm text-slate-400">
            Your claim has been registered with the District Disaster Management Authority.
          </p>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Claim ID</span>
              <span className="text-white font-mono font-bold">{claimId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Type</span>
              <span className="text-white">{CLAIM_TYPES.find((c) => c.id === selectedType)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <span className="text-amber-400 font-semibold">Under Review</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Expected Response</span>
              <span className="text-white">7-14 working days</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
            <Shield className="h-4 w-4 inline mr-1" />
            Reference: NDMA Disaster Relief Fund Protocol | SDRF Guidelines
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setSelectedType(null); }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm"
          >
            File Another Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📋 Insurance & Relief Claims
          </h2>
          <p className="text-xs text-slate-400 mt-1">File damage claims for government relief compensation</p>
        </div>
        <a href="tel:1070" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          <Phone className="h-3.5 w-3.5" />
          Disaster Helpline 1070
        </a>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CLAIM_STEPS.map((s) => (
          <div key={s.step} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
              step >= s.step
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                step > s.step ? "bg-green-500 text-white" : step === s.step ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-400"
              }`}>
                {step > s.step ? "✓" : s.step}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {s.step < 4 && <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Select Damage Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CLAIM_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setStep(2); }}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedType === type.id
                    ? "bg-cyan-500/10 border-cyan-500/40"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="text-3xl">{type.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{type.label}</p>
                  <p className="text-xs text-slate-400">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Upload Evidence</h3>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
            <Camera className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Tap to take photos or upload from gallery</p>
            <p className="text-xs text-slate-600 mt-1">JPEG, PNG up to 10MB each. Geo-tagged photos preferred.</p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">Tip: Take photos of the damage from multiple angles. Include nearby landmarks for location verification.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-700">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Location & Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Damage Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the damage in detail..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-sm text-white placeholder-slate-600 h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Date of Incident</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ward/Area, Pune"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-sm text-white placeholder-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-700">Back</button>
            <button onClick={() => setStep(4)} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold">Review Claim</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Review & Submit</h3>
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Damage Type</span><span className="text-white">{CLAIM_TYPES.find((c) => c.id === selectedType)?.icon} {CLAIM_TYPES.find((c) => c.id === selectedType)?.label}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Date</span><span className="text-white">{formData.date || "Today"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Location</span><span className="text-white">{formData.location || "Pune, Maharashtra"}</span></div>
            <div className="text-sm"><span className="text-slate-400">Description</span><p className="text-white mt-1">{formData.description || "No description provided"}</p></div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 space-y-1">
            <p>By submitting, you confirm that the information is accurate. False claims may result in penalty under IPC Section 193.</p>
            <p>Reference: SDRF/SDRF Relief Guidelines 2024 | PM National Relief Fund</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-700">Back</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              Submit Claim
            </button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase">Available Relief Schemes</h4>
          <div className="space-y-1.5 text-xs text-slate-400">
            <p>• SDRF — Up to ₹4 lakh for house damage</p>
            <p>• PM Awas — Reconstruction ₹1.2-1.5 lakh</p>
            <p>• PMFBY — Crop insurance up to 90% sum insured</p>
          </div>
        </div>
        <div className="glass-card p-4 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase">Required Documents</h4>
          <div className="space-y-1.5 text-xs text-slate-400">
            <p>• Aadhaar Card</p>
            <p>• Bank Passbook</p>
            <p>• Property/Purchase Documents</p>
            <p>• Geo-tagged Damage Photos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
