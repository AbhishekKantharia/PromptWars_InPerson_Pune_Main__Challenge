"use client";

import React, { useState, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar, { SidebarTab } from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import LoginScreen from "@/components/screens/LoginScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

// Screens
import HomeScreen from "@/components/screens/HomeScreen";
import DashboardScreen from "@/components/screens/DashboardScreen";
import ChatScreen from "@/components/screens/ChatScreen";
import SosScreen from "@/components/screens/SosScreen";
import ReportsScreen from "@/components/screens/ReportsScreen";
import PrepareScreen from "@/components/screens/PrepareScreen";
import SheltersScreen from "@/components/screens/SheltersScreen";
import WeatherScreen from "@/components/screens/WeatherScreen";
import FamilyScreen from "@/components/screens/FamilyScreen";
import CommandScreen from "@/components/screens/CommandScreen";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SidebarTab>("home");
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen setActiveTab={setActiveTab} setShowEmergencyModal={setShowEmergencyModal} />;
      case "dashboard":
        return <DashboardScreen setActiveTab={setActiveTab} language={language} />;
      case "chat":
        return <ChatScreen language={language} />;
      case "sos":
        return <SosScreen />;
      case "reports":
        return <ReportsScreen />;
      case "prepare":
        return <PrepareScreen />;
      case "shelters":
        return <SheltersScreen />;
      case "weather":
        return <WeatherScreen />;
      case "family":
        return <FamilyScreen />;
      case "command":
        return <CommandScreen />;
      default:
        return <HomeScreen setActiveTab={setActiveTab} setShowEmergencyModal={setShowEmergencyModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        currentLanguage={language}
        setLanguage={setLanguage}
        showEmergencyModal={showEmergencyModal}
        setShowEmergencyModal={setShowEmergencyModal}
        onNavigate={setActiveTab}
      />
      <div className="flex-1 flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <main className="flex-1 bg-slate-950/20 relative pb-20 md:pb-0">
          <Suspense fallback={<LoadingScreen />}>
            {renderActiveScreen()}
          </Suspense>
        </main>
      </div>
      {/* Mobile Bottom Nav */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function HomeApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
