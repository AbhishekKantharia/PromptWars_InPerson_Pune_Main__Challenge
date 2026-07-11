"use client";

import {
  Home,
  LayoutDashboard,
  MessageSquareCode,
  FlameKindling,
  Users2,
  ListTodo,
  Tent,
  CloudLightning,
  HeartHandshake,
  ShieldAlert,
  Shield,
  Activity,
} from "lucide-react";

export type SidebarTab =
  | "home"
  | "dashboard"
  | "chat"
  | "sos"
  | "reports"
  | "prepare"
  | "shelters"
  | "weather"
  | "family"
  | "command"
  | "insurance"
  | "health";

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "home" as SidebarTab, label: "Home", icon: Home, labelHi: "मुख्य" },
    { id: "dashboard" as SidebarTab, label: "Dashboard", icon: LayoutDashboard, labelHi: "डैशबोर्ड" },
    { id: "chat" as SidebarTab, label: "Varsha AI Chat", icon: MessageSquareCode, labelHi: "वर्षा एआई" },
    { id: "sos" as SidebarTab, label: "Emergency SOS", icon: FlameKindling, labelHi: "आपातकालीन SOS" },
    { id: "reports" as SidebarTab, label: "Community Reports", icon: Users2, labelHi: "सामुदायिक रिपोर्ट" },
    { id: "prepare" as SidebarTab, label: "Preparedness Plan", icon: ListTodo, labelHi: "तैयारी योजना" },
    { id: "shelters" as SidebarTab, label: "Shelter Finder", icon: Tent, labelHi: "आश्रय खोजक" },
    { id: "weather" as SidebarTab, label: "Weather Intel", icon: CloudLightning, labelHi: "मौसम जानकारी" },
    { id: "family" as SidebarTab, label: "Family Safety", icon: HeartHandshake, labelHi: "परिवार सुरक्षा" },
    { id: "command" as SidebarTab, label: "Command Center", icon: ShieldAlert, labelHi: "कमांड सेंटर" },
    { id: "insurance" as SidebarTab, label: "Insurance & Relief", icon: Shield, labelHi: "बीमा व राहत" },
    { id: "health" as SidebarTab, label: "Health Center", icon: Activity, labelHi: "स्वास्थ्य केंद्र" },
  ];

  return (
    <aside
      className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-2 h-[calc(100vh-73px)] sticky top-[73px]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1" role="menubar">
        <span className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2" id="nav-label">
          Disaster Hub
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
              aria-label={`${item.label} — ${item.labelHi}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-sm group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/10 to-cyan-500/10 text-cyan-400 border border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                  isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
                aria-hidden="true"
              />
              <div>
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-[10px] text-slate-500 -mt-0.5">{item.labelHi}</span>
              </div>
              {isActive && <span className="sr-only">(current page)</span>}
            </button>
          );
        })}
      </div>
      <div className="pt-4 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-500 font-medium">MonsoonShield v1.0.0</p>
        <p className="text-[9px] text-slate-600 font-medium">© 2026 NDMA Coordinated</p>
      </div>
    </aside>
  );
}
