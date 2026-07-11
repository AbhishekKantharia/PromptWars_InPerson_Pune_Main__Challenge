"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar, { SidebarTab } from "@/components/layout/Sidebar";

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

export default function HomeApp() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("home");
  const [language, setLanguage] = useState("en");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

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
      {/* Navbar */}
      <Navbar
        currentLanguage={language}
        setLanguage={setLanguage}
        showEmergencyModal={showEmergencyModal}
        setShowEmergencyModal={setShowEmergencyModal}
      />

      {/* Main body: Sidebar + Screen */}
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 bg-slate-950/20 relative">
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
}
