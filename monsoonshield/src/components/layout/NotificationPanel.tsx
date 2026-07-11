"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCheck, AlertTriangle, Shield, Users, Info, Heart, ChevronRight } from "lucide-react";
import { useAuth, Notification } from "@/lib/AuthContext";

import { SidebarTab } from "./Sidebar";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: SidebarTab) => void;
}

export default function NotificationPanel({ isOpen, onClose, onNavigate }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!isOpen) return null;

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert": return <AlertTriangle className="h-4 w-4" />;
      case "sos": return <Shield className="h-4 w-4" />;
      case "community": return <Users className="h-4 w-4" />;
      case "family": return <Heart className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityStyle = (severity: Notification["severity"]) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 border-red-500/30 text-red-400";
      case "high": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "medium": return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      default: return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  const formatTime = (date: Date) => {
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {f === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Bell className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-3.5 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                    !n.read ? "bg-slate-800/20" : ""
                  }`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.actionTab && onNavigate) {
                      onNavigate(n.actionTab as SidebarTab);
                      onClose();
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${getSeverityStyle(n.severity)}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-white" : "text-slate-300"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatTime(n.timestamp)}
                        </span>
                        {n.actionLabel && (
                          <span className="flex items-center gap-0.5 text-[10px] text-cyan-400 font-semibold">
                            {n.actionLabel}
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
