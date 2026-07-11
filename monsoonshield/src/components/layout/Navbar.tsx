"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Phone, Globe, User, Bell, ChevronDown } from "lucide-react";
import { LANGUAGES, EMERGENCY_CONTACTS } from "@/lib/utils";

interface NavbarProps {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  showEmergencyModal: boolean;
  setShowEmergencyModal: (show: boolean) => void;
}

export default function Navbar({
  currentLanguage,
  setLanguage,
  showEmergencyModal,
  setShowEmergencyModal,
}: NavbarProps) {
  const pathname = usePathname();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const activeLang = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-wide text-white">MonsoonShield</span>
          <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">
            वर्षा कवच
          </span>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Urgent Emergency Helpline */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-red-900/30 pulse-red"
        >
          <Phone className="h-4 w-4" />
          <span>Helpline 112</span>
        </button>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-sm font-medium border border-slate-700/50 transition-all duration-200"
          >
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>{activeLang.native}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-50">
              <div className="py-1 max-h-60 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${
                      currentLanguage === lang.code ? "text-cyan-400 font-semibold bg-slate-700/50" : "text-slate-300"
                    }`}
                  >
                    {lang.native} ({lang.name})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-slate-850" />
          </button>
        </div>

        {/* User Profile */}
        <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-700 hover:text-white transition-colors">
          <User className="h-5 w-5" />
        </div>
      </div>

      {/* Emergency Helpline Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">🆘</span> Emergency Helpline Directory
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Immediate connection numbers. Tap to copy/dial. Available 24/7.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {EMERGENCY_CONTACTS.map((contact) => (
                <a
                  key={contact.name}
                  href={`tel:${contact.number}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-left transition-all duration-200"
                >
                  <span className="text-xl">{contact.icon}</span>
                  <div>
                    <span className="block text-xs text-slate-400 font-medium">{contact.name}</span>
                    <span className="block text-sm font-bold text-white">{contact.number}</span>
                  </div>
                </a>
              ))}
            </div>
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700/50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
