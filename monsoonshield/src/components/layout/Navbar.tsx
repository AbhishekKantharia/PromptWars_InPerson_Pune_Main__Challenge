"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield, Phone, Globe, ChevronDown, Bell, X, LogOut
} from "lucide-react";
import { LANGUAGES, EMERGENCY_CONTACTS } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import NotificationPanel from "./NotificationPanel";
import { SidebarTab } from "./Sidebar";

interface NavbarProps {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  showEmergencyModal: boolean;
  setShowEmergencyModal: (show: boolean) => void;
  onNavigate?: (tab: SidebarTab) => void;
}

export default function Navbar({
  currentLanguage,
  setLanguage,
  showEmergencyModal,
  setShowEmergencyModal,
  onNavigate,
}: NavbarProps) {
  const { user, logout, unreadCount } = useAuth();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <Link className="flex items-center gap-2 cursor-pointer" href="/">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide text-white">MonsoonShield</span>
            <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">वर्षा कवच</span>
          </div>
        </a>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Helpline */}
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
              onClick={() => { setShowLangDropdown(!showLangDropdown); setShowNotifications(false); setShowProfile(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-sm font-medium border border-slate-700/50 transition-all duration-200"
            >
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>{currentLang?.native || "English"}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-80 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-700/50 transition-colors ${
                      currentLanguage === lang.code ? "text-cyan-400 bg-cyan-500/10" : "text-slate-300"
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-[10px] text-slate-500">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowLangDropdown(false); setShowProfile(false); }}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowLangDropdown(false); setShowNotifications(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name || "User"}</span>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-bold text-white">{user?.name || "User"}</p>
                  <p className="text-[11px] text-slate-400">+91 {user?.phone || "XXXXX XXXXX"}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{user?.location || "India"}</p>
                </div>
                <button
                  onClick={() => { logout(); setShowProfile(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigate={onNavigate}
      />

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEmergencyModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Emergency Helplines</h2>
                  <p className="text-xs text-slate-400">Tap any number to call directly</p>
                </div>
              </div>
              <button onClick={() => setShowEmergencyModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg">
                      {contact.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.number}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                    CALL
                  </div>
        </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
