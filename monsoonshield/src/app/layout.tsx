import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonsoonShield — AI-Powered Monsoon Preparedness & Disaster Response Portal",
  description: "Grounded in NDMA guidelines, providing personalized preparedness plans, weather-aware evacuation routing, and real-time community response coordination.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
        {children}
      </body>
    </html>
  );
}
