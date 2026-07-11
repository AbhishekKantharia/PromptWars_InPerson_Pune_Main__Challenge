"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  location: string;
  familySize: number;
  floor: string;
  hasChildren: boolean;
  hasElderly: boolean;
  hasMedical: boolean;
  hasVehicle: boolean;
  preferredLanguage: string;
  avatar: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loginStep: "phone" | "otp" | "profile" | "done";
  phoneNumber: string;
  otpValue: string;
  otpGenerated: string;
  setPhoneNumber: (phone: string) => void;
  setOtpValue: (otp: string) => void;
  setLoginStep: (step: "phone" | "otp" | "profile" | "done") => void;
  generateOTP: () => string;
  verifyOTP: () => boolean;
  completeProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

export interface Notification {
  id: string;
  type: "alert" | "sos" | "community" | "system" | "family";
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionTab?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const DEFAULT_USER: UserProfile = {
  id: "user_001",
  name: "",
  phone: "",
  location: "Pune, Maharashtra",
  familySize: 4,
  floor: "ground",
  hasChildren: false,
  hasElderly: false,
  hasMedical: false,
  hasVehicle: false,
  preferredLanguage: "en",
  avatar: "",
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "alert",
    title: "IMD Orange Alert — Pune",
    message: "Heavy rainfall expected (64.5-115.5mm) in Pune district. Avoid low-lying areas.",
    severity: "high",
    timestamp: new Date(Date.now() - 15 * 60000),
    read: false,
    actionLabel: "View Dashboard",
    actionTab: "dashboard",
  },
  {
    id: "n2",
    type: "alert",
    title: "Mula River Rising — DANGER",
    message: "Mula river at 82% danger level. Residents near riverbanks should evacuate.",
    severity: "critical",
    timestamp: new Date(Date.now() - 8 * 60000),
    read: false,
    actionLabel: "Find Shelters",
    actionTab: "shelters",
  },
  {
    id: "n3",
    type: "community",
    title: "Community Report Verified",
    message: "NH48 waterlogging report confirmed by 12 citizens. Road impassable.",
    severity: "medium",
    timestamp: new Date(Date.now() - 45 * 60000),
    read: false,
    actionLabel: "View Reports",
    actionTab: "reports",
  },
  {
    id: "n4",
    type: "system",
    title: "Varsha AI Briefing Ready",
    message: "Your daily monsoon briefing has been generated. Check your dashboard.",
    severity: "low",
    timestamp: new Date(Date.now() - 120 * 60000),
    read: true,
    actionLabel: "Open Dashboard",
    actionTab: "dashboard",
  },
  {
    id: "n5",
    type: "family",
    title: "Family Check-In Reminder",
    message: "2 family members haven't checked in today. Send a safety reminder.",
    severity: "medium",
    timestamp: new Date(Date.now() - 180 * 60000),
    read: false,
    actionLabel: "Family Safety",
    actionTab: "family",
  },
];

let notifCounter = 100;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loginStep, setLoginStep] = useState<"phone" | "otp" | "profile" | "done">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpGenerated, setOtpGenerated] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ms_user") : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsAuthenticated(true);
        setLoginStep("done");
      } catch { /* ignore */ }
    }
  }, []);

  const generateOTP = useCallback(() => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setOtpGenerated(otp);
    return otp;
  }, []);

  const verifyOTP = useCallback(() => {
    return otpValue === otpGenerated && otpGenerated.length === 6;
  }, [otpValue, otpGenerated]);

  const completeProfile = useCallback((partial: Partial<UserProfile>) => {
    const newUser = { ...DEFAULT_USER, ...partial, id: `user_${Date.now()}` };
    setUser(newUser);
    setIsAuthenticated(true);
    setLoginStep("done");
    if (typeof window !== "undefined") {
      localStorage.setItem("ms_user", JSON.stringify(newUser));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setLoginStep("phone");
    setPhoneNumber("");
    setOtpValue("");
    setOtpGenerated("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("ms_user");
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    notifCounter++;
    const newNotif: Notification = {
      ...n,
      id: `n_${notifCounter}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loginStep,
        phoneNumber,
        otpValue,
        otpGenerated,
        setPhoneNumber,
        setOtpValue,
        setLoginStep,
        generateOTP,
        verifyOTP,
        completeProfile,
        logout,
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        addNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
