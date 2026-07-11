"use client";

import React, { useState, useEffect } from "react";
import {
  Home, LayoutDashboard, MessageSquare, AlertTriangle, Users,
  ListTodo, Tent, CloudLightning, HeartHandshake, ShieldAlert,
  ChevronUp
} from "lucide-react";
import { SidebarTab } from "./Sidebar";

interface MobileNavProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}

const NAV_ITEMS: { tab: SidebarTab; label: string; icon: React.ElementType; critical?: boolean }[] = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { tab: "chat", label: "AI Chat", icon: MessageSquare },
  { tab: "sos", label: "SOS", icon: AlertTriangle, critical: true },
  { tab: "reports", label: "Reports", icon: Users },
  { tab: "prepare", label: "Prepare", icon: ListTodo },
  { tab: "shelters", label: "Shelters", icon: Tent },
  { tab: "weather", label: "Weather", icon: CloudLightning },
  { tab: "family", label: "Family", icon: HeartHandshake },
  { tab: "command", label: "Command", icon: ShieldAlert },
];

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [showMore, setShowMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const primaryItems = NAV_ITEMS.slice(0, 5);
  const secondaryItems = NAV_ITEMS.slice(5);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-pb" role="navigation" aria-label="Mobile navigation">
        <div className="flex items-center justify-around px-2 py-1">
          {primaryItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-[56px] ${
                activeTab === item.tab
                  ? item.critical
                    ? "text-red-400"
                    : "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              aria-label={item.label}
              aria-current={activeTab === item.tab ? "page" : undefined}
            >
              <div className={`p-1.5 rounded-lg ${
                activeTab === item.tab
                  ? item.critical
                    ? "bg-red-500/10"
                    : "bg-cyan-500/10"
                  : ""
              }`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.critical && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-slate-500 hover:text-slate-300 transition-all min-w-[56px]"
            aria-label="More options"
            aria-expanded={showMore}
          >
            <div className={`p-1.5 rounded-lg ${showMore ? "bg-slate-700" : ""}`}>
              <ChevronUp className={`h-5 w-5 transition-transform ${showMore ? "rotate-180" : ""}`} />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

        {/* Expanded More Menu */}
        {showMore && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 grid grid-cols-5 gap-2">
            {secondaryItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => { setActiveTab(item.tab); setShowMore(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === item.tab
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                }`}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-50 md:hidden h-10 w-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shadow-lg flex items-center justify-center transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}
