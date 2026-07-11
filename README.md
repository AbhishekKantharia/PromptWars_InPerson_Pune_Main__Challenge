# VarunAI — AI-Powered Monsoon Preparedness & Disaster Response Platform

> **India's First AI-Native Monsoon Safety Platform** — Protecting 100M+ households across 22 Indian languages.

## Live Deployment

**[https://monsoonshield-kappa.vercel.app](https://monsoonshield-kappa.vercel.app)**

---

## Problem Statement

India faces catastrophic monsoon disasters annually — floods, cyclones, landslides, and waterborne diseases kill thousands and displace millions. Citizens lack personalized, multilingual, real-time guidance. Emergency response is fragmented, slow, and inaccessible to rural and non-English-speaking populations.

## Solution

**VarunAI** (वरुणAI — named after the Hindu God of Water) is a comprehensive AI-powered platform that provides personalized disaster preparedness, real-time alerts, emergency SOS coordination, and community-driven ground-truth reporting — all powered by Google Gemini AI and accessible in 22 Indian languages.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **AI Engine** | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| **Fonts** | Google Sans, Noto Sans |
| **Icons** | Lucide React |
| **Charts** | Recharts (flood prediction hydrograph) |
| **Hosting** | Vercel (Edge Network) |
| **Testing** | Vitest, Testing Library |

---

## Features (12 Screens)

### Core Screens
| # | Screen | Description |
|---|--------|-------------|
| 1 | **Home** | Hero landing with animated rain effect, live system stats, regional alert bar |
| 2 | **Dashboard** | Monsoon Intelligence Center — risk score dial, weather widget, Gemini AI briefing, active alerts |
| 3 | **Varsha AI Chat** | Multilingual AI assistant with voice input/output, conversation history, suggestion chips |
| 4 | **Emergency SOS** | One-tap NDRF/SDRF dispatch, needs configuration, dispatch timeline, family share |
| 5 | **Community Reports** | Crowdsourced hazard reporting with photo upload, GPS tagging, verification, upvotes |
| 6 | **Preparedness Plan** | Personalized checklist + AI-generated household disaster plan |
| 7 | **Shelter Finder** | Emergency shelters with search, filters, occupancy, contact, directions |
| 8 | **Weather Intel** | River level sensors, LSTM flood prediction chart, 7-day IMD forecast |
| 9 | **Family Safety** | Family check-in board, evacuation drill simulator, reunification points |
| 10 | **Command Center** | SDRF/Municipal dispatch dashboard, volunteer management, resource inventory |

### Additional Screens
| # | Screen | Description |
|---|--------|-------------|
| 11 | **Insurance & Relief** | 4-step damage claim wizard (SDRF, PM Awas, PMFBY) |
| 12 | **Health Center** | Disease surveillance, prevention checklists, warning signs, health tips |

### Authentication
- Phone-based OTP login with 6-digit verification
- Demo login bypass for quick evaluation
- User profile with household details (family size, floor, children/elderly/medical)
- Session persistence via localStorage

### Notifications
- Slide-out notification panel with unread badge
- Pre-seeded alerts (IMD, river warnings, community reports, system, family)
- Filter All/Unread, Mark all read, click-to-navigate

### AI Capabilities
- **Varsha AI Chat** — NDMA-grounded responses, emergency protocol, multilingual
- **Dashboard Briefing** — Real-time Gemini-generated daily monsoon briefing
- **Preparedness Plan** — AI-personalized household disaster plan
- **Risk Analysis** — Score calculation from rainfall, river levels, historical data
- **Vision** — Image classification for damage assessment (crop, structural)

---

## Accessibility

- Skip-to-content link
- ARIA roles (`navigation`, `menubar`, `menuitem`, `main`)
- `aria-current="page"` for active states
- `aria-label` on all interactive elements
- Focus-visible outlines (cyan ring)
- Reduced motion support (disables animations)
- High contrast mode support
- Touch targets 44px minimum (WCAG 2.5.5)
- Screen reader only utility class
- Print stylesheet

---

## Responsive Design

- **Desktop**: Sidebar navigation + main content
- **Mobile**: Bottom navigation bar (5 primary + expandable "More" menu)
- Scroll-to-top button on mobile
- Safe area padding for notch devices
- Responsive grid layouts (1-col mobile, 2-3 col desktop)

---

## SEO & PWA

- Comprehensive meta tags (OpenGraph, Twitter Card)
- JSON-LD structured data (WebApplication schema)
- PWA manifest with app shortcuts
- Apple mobile web app capable
- 26 targeted keywords
- Semantic HTML with proper heading hierarchy

---

## Project Structure

```
monsoonshield/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── globals.css        # Design system, animations, a11y styles
│   │   ├── layout.tsx         # Root layout, SEO, structured data
│   │   └── page.tsx           # SPA shell, auth integration
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # Error fallback UI
│   │   ├── LoadingScreen.tsx  # Branded loading state
│   │   ├── layout/
│   │   │   ├── Navbar.tsx     # Top nav, language, notifications, profile
│   │   │   ├── Sidebar.tsx    # Desktop sidebar navigation
│   │   │   ├── MobileNav.tsx  # Mobile bottom navigation
│   │   │   └── NotificationPanel.tsx
│   │   └── screens/
│   │       ├── LoginScreen.tsx
│   │       ├── HomeScreen.tsx
│   │       ├── DashboardScreen.tsx
│   │       ├── ChatScreen.tsx
│   │       ├── SosScreen.tsx
│   │       ├── ReportsScreen.tsx
│   │       ├── PrepareScreen.tsx
│   │       ├── SheltersScreen.tsx
│   │       ├── WeatherScreen.tsx
│   │       ├── FamilyScreen.tsx
│   │       ├── CommandScreen.tsx
│   │       ├── InsuranceScreen.tsx
│   │       └── HealthScreen.tsx
│   └── lib/
│       ├── AuthContext.tsx    # Auth state, notifications, user profile
│       ├── gemini.ts          # Gemini AI integration, system prompt
│       ├── mockData.ts        # Demo data (alerts, weather, shelters)
│       └── utils.ts           # Utilities, languages, contacts
├── tests/                     # 300+ tests across 15 suites
│   ├── unit/services/
│   ├── e2e/journeys/
│   ├── e2e/disaster_scenarios/
│   ├── ai/
│   ├── performance/
│   ├── security/
│   └── accessibility/
├── SOLUTION.md                # Complete 30-section solution document
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | No | Google Gemini API key. App works in demo mode without it. |

---

## Getting Started

```bash
# Install dependencies
cd monsoonshield
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npx vitest
```

---

## Google AI Stack Usage

| Feature | Google Technology |
|---------|------------------|
| AI Chat (Varsha) | Gemini 2.0 Flash via `@google/generative-ai` |
| Preparedness Plans | Gemini 2.0 Flash with structured prompting |
| Risk Analysis | Custom algorithm + Gemini contextual advice |
| Dashboard Briefing | Gemini 2.0 Flash daily briefing generation |
| Safety Settings | `HarmCategory.HARM_BLOCK_THRESHOLD` filtering |
| System Prompt | 2000+ character NDMA/IMD/WHO-grounded prompt |

---

## Key Innovations

1. **Multilingual AI** — 22 Indian languages via Gemini's multilingual capabilities
2. **Voice Interface** — Web Speech API for voice input + text-to-speech output
3. **Context-Aware AI** — User profile (family, floor, medical) passed to Gemini for personalized responses
4. **NDMA-Grounded** — System prompt cites official disaster management guidelines
5. **Emergency Protocol** — AI prioritizes "Call 112" for life-threatening situations
6. **Community Verification** — Crowdsourced reports with upvote validation
7. **Evacuation Drill Simulator** — Gamified 4-step preparedness training
8. **Flood Prediction Hydrograph** — LSTM model visualization with Recharts
9. **Insurance Claim Wizard** — End-to-end government relief claim filing
10. **Disease Surveillance** — Real-time dengue/malaria risk tracking

---

## Testing

300+ tests across 15 suites:

```bash
cd tests
node run-all.js
```

| Suite | Tests |
|-------|-------|
| Unit (9 services) | 200+ |
| E2E Journeys | 10 |
| Disaster Scenarios | 8 |
| AI Model | 20 |
| Performance | 14 |
| Security | 21 |
| Accessibility | 20 |

---

## License

MIT License — Built for the PromptWars InPerson Pune Challenge 2026

---

## Acknowledgments

- **Google Gemini AI** — Powering Varsha AI assistant
- **NDMA** — National Disaster Management Authority guidelines
- **IMD** — India Meteorological Department weather data protocols
- **CWC** — Central Water Commission river telemetry references
- **NDRF/SDRF** — National/State Disaster Response Force coordination
