import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MonsoonShield — AI-Powered Monsoon Preparedness & Disaster Response Portal",
    template: "%s | MonsoonShield",
  },
  description: "India's AI-Native Disaster Shield. Personalized monsoon preparedness plans, real-time weather alerts, emergency SOS with NDRF dispatch, flood-safe evacuation routing, community reporting, and AI-powered health advisories — all grounded in NDMA guidelines and powered by Google Gemini AI.",
  keywords: [
    "monsoon preparedness", "disaster response", "flood safety", "emergency SOS",
    "NDRF", "SDRF", "NDMA", "India weather", "Pune flood", "monsoon safety",
    "AI disaster preparedness", "Gemini AI", "emergency helpline", "flood alerts",
    "cyclone warning", "dengue prevention", "monsoon health", "evacuation plan",
    "community disaster response", "real-time weather India", "IMD alerts",
    "family safety", "emergency kit", "disaster preparedness India",
  ],
  authors: [{ name: "MonsoonShield Team" }],
  creator: "MonsoonShield",
  publisher: "MonsoonShield",
  metadataBase: new URL("https://monsoonshield-kappa.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://monsoonshield-kappa.vercel.app",
    siteName: "MonsoonShield",
    title: "MonsoonShield — AI-Powered Monsoon Preparedness & Disaster Response",
    description: "India's AI-Native Disaster Shield. Personalized monsoon preparedness, real-time alerts, emergency SOS, and community coordination powered by Google Gemini AI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MonsoonShield — AI-Powered Monsoon Preparedness Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MonsoonShield — AI-Powered Monsoon Preparedness",
    description: "India's AI-Native Disaster Shield. 100M+ households protected. 22 Indian languages. Powered by Google Gemini AI.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "application-name": "MonsoonShield",
    "msapplication-TileColor": "#0F172A",
    "theme-color": "#2563EB",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MonsoonShield",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web",
              description: "AI-Powered Monsoon Preparedness & Disaster Response Portal for India",
              url: "https://monsoonshield-kappa.vercel.app",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              featureList: [
                "Real-time monsoon alerts and weather intelligence",
                "AI-powered flood risk assessment",
                "Emergency SOS with NDRF dispatch",
                "Personalized disaster preparedness plans",
                "Community hazard reporting",
                "Emergency shelter finder",
                "Family safety check-in system",
                "Multilingual support in 22 Indian languages",
              ],
              inLanguage: ["en", "hi", "mr", "bn", "te", "ta", "gu", "kn", "ml", "or", "pa", "ur"],
              provider: {
                "@type": "Organization",
                name: "MonsoonShield",
                url: "https://monsoonshield-kappa.vercel.app",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
