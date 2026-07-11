"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, Phone, Lock, User, ChevronRight, Loader2, CheckCircle2, MapPin, Users, Home, Baby, Heart, Car, Globe } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { LANGUAGES } from "@/lib/utils";

export default function LoginScreen() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOtpDemo, setShowOtpDemo] = useState(false);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="raindrop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 mb-4">
            <Shield className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MonsoonShield</h1>
          <p className="text-cyan-400 text-sm font-semibold tracking-wider mt-1">वर्षा कवच</p>
          <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto">
            AI-Powered Monsoon Preparedness & Disaster Response
          </p>
        </div>

        <div className="glass-card p-6 space-y-6">
          {auth.loginStep === "phone" && (
            <PhoneStep
              phoneNumber={auth.phoneNumber}
              setPhoneNumber={auth.setPhoneNumber}
              setLoginStep={auth.setLoginStep}
              generateOTP={auth.generateOTP}
              setError={setError}
              setOtpTimer={setOtpTimer}
              setShowOtpDemo={setShowOtpDemo}
              error={error}
            />
          )}

          {auth.loginStep === "otp" && (
            <OTPStep
              otpValue={auth.otpValue}
              setOtpValue={auth.setOtpValue}
              phoneNumber={auth.phoneNumber}
              verifyOTP={auth.verifyOTP}
              setLoginStep={auth.setLoginStep}
              setError={setError}
              error={error}
              otpTimer={otpTimer}
              generateOTP={auth.generateOTP}
              setOtpTimer={setOtpTimer}
              showOtpDemo={showOtpDemo}
              otpGenerated={auth.otpGenerated}
            />
          )}

          {auth.loginStep === "profile" && (
            <ProfileStep onComplete={auth.completeProfile} />
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Protected by NDMA guidelines &bull; Google Gemini AI &bull; End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

function PhoneStep({
  phoneNumber,
  setPhoneNumber,
  setLoginStep,
  generateOTP,
  setError,
  setOtpTimer,
  setShowOtpDemo,
  error,
}: {
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  setLoginStep: (v: "phone" | "otp" | "profile" | "done") => void;
  generateOTP: () => string;
  setError: (v: string) => void;
  setOtpTimer: (v: number) => void;
  setShowOtpDemo: (v: boolean) => void;
  error: string;
}) {
  const handleSendOTP = () => {
    setError("");
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length !== 10 || !/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6-9");
      return;
    }
    const otp = generateOTP();
    if (!otp) {
      setError("Please wait before requesting another OTP");
      return;
    }
    setShowOtpDemo(true);
    setOtpTimer(30);
    setLoginStep("otp");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Sign in with Phone</h2>
        <p className="text-sm text-slate-400 mt-1">
          We&apos;ll send a 6-digit OTP to verify your number
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
          <Phone className="h-4 w-4" />
          <span className="text-sm font-medium">+91</span>
        </div>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98765 43210"
          className="w-full pl-20 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-lg tracking-widest placeholder-slate-600 font-mono"
          maxLength={10}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
        />
      </div>

      {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

      <button
        onClick={handleSendOTP}
        disabled={phoneNumber.replace(/\D/g, "").length < 10}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock className="h-4 w-4" />
        Send OTP
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="text-center">
        <button
          onClick={() => {
            setPhoneNumber("9876543210");
            const otp = generateOTP();
            setShowOtpDemo(true);
            setOtpTimer(30);
            setLoginStep("otp");
          }}
          className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
        >
          Quick demo login (skip OTP)
        </button>
      </div>
    </div>
  );
}

function OTPStep({
  otpValue,
  setOtpValue,
  phoneNumber,
  verifyOTP,
  setLoginStep,
  setError,
  error,
  otpTimer,
  generateOTP,
  setOtpTimer,
  showOtpDemo,
  otpGenerated,
}: {
  otpValue: string;
  setOtpValue: (v: string) => void;
  phoneNumber: string;
  verifyOTP: () => boolean;
  setLoginStep: (v: "phone" | "otp" | "profile" | "done") => void;
  setError: (v: string) => void;
  error: string;
  otpTimer: number;
  generateOTP: () => string;
  setOtpTimer: (v: number) => void;
  showOtpDemo: boolean;
  otpGenerated: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = otpValue.split("");
    newOtp[index] = value;
    const joined = newOtp.join("").slice(0, 6);
    setOtpValue(joined);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtpValue(pasted);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    setError("");
    if (!/^\d{6}$/.test(otpValue)) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    if (verifyOTP()) {
      setLoginStep("profile");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleResend = () => {
    const otp = generateOTP();
    if (otp) {
      setOtpTimer(30);
      setOtpValue("");
    } else {
      setError("Please wait before requesting another OTP");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Enter OTP</h2>
        <p className="text-sm text-slate-400 mt-1">
          6-digit code sent to <span className="text-white font-medium">+91 {phoneNumber}</span>
        </p>
      </div>

      {showOtpDemo && (
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
          <span className="font-bold">Demo OTP:</span> <span className="font-mono text-sm tracking-widest">{otpGenerated}</span>
        </div>
      )}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="tel"
            maxLength={1}
            value={otpValue[i] || ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-13 text-center text-lg font-bold rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white font-mono"
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-xs font-medium text-center">{error}</p>}

      <button
        onClick={handleVerify}
        disabled={otpValue.length !== 6}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        Verify & Continue
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => setLoginStep("phone")}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Change number
        </button>
        {otpTimer > 0 ? (
          <span className="text-slate-500">Resend OTP in {otpTimer}s</span>
        ) : (
          <button onClick={handleResend} className="text-cyan-400 hover:text-cyan-300">
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileStep({ onComplete }: { onComplete: (p: Partial<any>) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Pune, Maharashtra");
  const [familySize, setFamilySize] = useState(4);
  const [floor, setFloor] = useState("ground");
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    onComplete({
      name: name || "MonsoonShield User",
      location,
      familySize,
      floor,
      hasChildren,
      hasElderly,
      hasMedical,
      hasVehicle,
      preferredLanguage: language,
      avatar: "",
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Set Up Your Profile</h2>
        <p className="text-sm text-slate-400 mt-1">
          Help Varsha AI personalize your monsoon safety plan
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-sm placeholder-slate-600"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Your Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Preferred Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-sm appearance-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Family Size</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={familySize}
                onChange={(e) => setFamilySize(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-sm appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">Home Floor</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500/50 text-white text-sm appearance-none"
              >
                <option value="ground">Ground Floor</option>
                <option value="1">1st Floor</option>
                <option value="2">2nd Floor</option>
                <option value="3+">3rd Floor or above</option>
                <option value="basement">Basement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-2 block">Household Conditions</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Children", icon: Baby, value: hasChildren, set: setHasChildren },
                { label: "Elderly", icon: Heart, value: hasElderly, set: setHasElderly },
                { label: "Medical Needs", icon: Heart, value: hasMedical, set: setHasMedical },
                { label: "Vehicle", icon: Car, value: hasVehicle, set: setHasVehicle },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.set(!item.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    item.value
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
