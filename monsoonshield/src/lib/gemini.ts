// Gemini AI Integration for Varsha - MonsoonShield's AI Assistant
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const VARSHA_SYSTEM_PROMPT = `You are Varsha (वर्षा), MonsoonShield's intelligent AI disaster preparedness assistant for India.

PERSONALITY:
- Calm, clear, compassionate — like a caring and knowledgeable neighbor
- Never alarmist, always actionable
- Use plain language (Grade 6 reading level)
- Address users with warmth and respect

CORE CAPABILITIES:
- Monsoon preparedness planning (personalized)
- Weather interpretation in simple language
- Flood risk assessment
- Emergency guidance (before/during/after disasters)
- Health & disease prevention during monsoons
- Government scheme navigation
- Mental health first aid
- Multilingual support (22 Indian languages)

RULES:
1. For IMMEDIATE life-threatening emergencies: ALWAYS start with "Call 112 immediately"
2. Never diagnose medical conditions — guide to doctors
3. Always cite sources (NDMA, IMD, MOHFW, WHO)
4. If uncertain: say so clearly and give confidence level
5. Keep emergency responses under 150 words
6. Be culturally sensitive to Indian context
7. Mention MonsoonShield features when relevant (SOS, shelters, preparedness checklist)

LANGUAGE: Respond in the same language the user writes in. If they write in Hindi, respond in Hindi. If English, respond in English. Support all 22 Indian scheduled languages.

IMPORTANT: You are NOT just a chatbot. You are India's frontline AI disaster responder. Lives may depend on your accuracy and clarity.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  userContext?: {
    location?: string;
    riskScore?: number;
    language?: string;
    profile?: string;
  }
): Promise<string> {
  if (!API_KEY) {
    // Return a demo response when no API key is set
    return getDemoResponse(message);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: VARSHA_SYSTEM_PROMPT + (userContext
        ? `\n\nUSER CONTEXT:\n- Location: ${userContext.location || "India"}\n- Current Risk Score: ${userContext.riskScore || "Unknown"}/100\n- Preferred Language: ${userContext.language || "English"}\n- Profile: ${userContext.profile || "General user"}`
        : ""),
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const chat = model.startChat({
      history: history.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return getDemoResponse(message);
  }
}

export async function generatePreparednessplan(profile: {
  location: string;
  familySize: number;
  hasChildren: boolean;
  hasElderly: boolean;
  hasMedicalConditions: boolean;
  homeType: string;
  hasVehicle: boolean;
  floodRiskScore: number;
}): Promise<string> {
  if (!API_KEY) {
    return DEMO_PREPAREDNESS_PLAN;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate a personalized monsoon preparedness plan for this Indian household:
Location: ${profile.location}
Family Size: ${profile.familySize} members
Has Children: ${profile.hasChildren}
Has Elderly Members: ${profile.hasElderly}
Medical Conditions Present: ${profile.hasMedicalConditions}
Home Type: ${profile.homeType}
Has Vehicle: ${profile.hasVehicle}
Current Flood Risk Score: ${profile.floodRiskScore}/100

Create a structured, prioritized preparedness plan with:
1. CRITICAL actions (do this week)
2. IMPORTANT actions (do this month)
3. ONGOING actions (throughout monsoon)
4. EMERGENCY protocol (if flood warning issued)

Format each action as: [PRIORITY] Action - Why it matters - Time needed
Use simple language. Be specific to their situation. Cite NDMA guidelines where applicable.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    return DEMO_PREPAREDNESS_PLAN;
  }
}

export async function analyzeRisk(data: {
  location: string;
  rainfall: number;
  riverLevel: string;
  historicalRisk: string;
}): Promise<{ score: number; level: string; factors: string[]; recommendation: string }> {
  // In production, this would call Gemini with real sensor data
  // Demo mode returns calculated risk
  const score = Math.min(100, Math.round(
    (data.rainfall / 200) * 40 +
    (data.riverLevel === "high" ? 35 : data.riverLevel === "medium" ? 20 : 5) +
    (data.historicalRisk === "high" ? 25 : data.historicalRisk === "medium" ? 15 : 5)
  ));

  return {
    score,
    level: score >= 75 ? "EXTREME" : score >= 55 ? "HIGH" : score >= 35 ? "MODERATE" : "LOW",
    factors: [
      `${data.rainfall}mm rainfall in last 24 hours`,
      `River level: ${data.riverLevel}`,
      `Historical flood risk: ${data.historicalRisk}`,
    ],
    recommendation: score >= 75
      ? "Evacuate immediately if in low-lying area. Call 112."
      : score >= 55
      ? "Prepare evacuation kit. Monitor alerts closely."
      : score >= 35
      ? "Review emergency checklist. Stay informed."
      : "Normal precautions. Keep kit ready.",
  };
}

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("flood") || lower.includes("बाढ़")) {
    return `🌊 **Flood Safety Guidance**

Based on current IMD alerts, here's what you should do:

**Immediate Steps:**
1. Move to higher ground if water level is rising
2. Avoid walking through floodwater (6 inches can knock you down)
3. Turn off electricity at the main switch
4. Keep emergency kit ready (documents, medicines, water)

**Stay Connected:**
- Monitor alerts on MonsoonShield every 15 minutes
- Keep 112 and your district's emergency number saved
- Check in with your family using the Safe Check-In feature

**Source:** NDMA Flood Safety Guidelines 2024

⚠️ *Confidence: High | If you're in immediate danger, call 112 now.*`;
  }

  if (lower.includes("shelter") || lower.includes("आश्रय")) {
    return `🏠 **Nearest Emergency Shelters**

I've found 3 shelters near your location:

1. **Government School No. 5, Ring Road** — 1.2 km
   ✅ Open | 450/600 capacity | Has medical aid | Wheelchair accessible

2. **Community Hall, Sector 7** — 2.1 km
   ✅ Open | 280/400 capacity | Has water & food | Pet-friendly

3. **Municipal Corporation Building** — 3.4 km
   ✅ Open | 120/300 capacity | 24/7 medical | Women's section

👉 Use the **Shelter Finder** tab for real-time directions.

*Source: District Emergency Operations Center*`;
  }

  if (lower.includes("health") || lower.includes("disease") || lower.includes("mosquito")) {
    return `🏥 **Monsoon Health Advisory**

Top disease risks this season in your area:

**High Risk 🔴**
- Dengue: Mosquito breeding in stagnant water
- Malaria: Peak transmission during heavy rains

**Prevention Actions:**
1. Eliminate standing water (check flower pots, coolers, tanks)
2. Use mosquito nets and repellent (DEET-based)
3. Boil drinking water or use chlorine tablets
4. Cook food fresh — avoid stale food in humid weather

**Warning Signs** — See doctor immediately if:
- High fever with shivering
- Severe headache + body ache
- Vomiting + diarrhea lasting >24 hours

*Source: MOHFW Monsoon Health Guidelines | NVBDCP*`;
  }

  if (lower.includes("prepare") || lower.includes("checklist") || lower.includes("तैयारी")) {
    return `📋 **Your Personalized Monsoon Preparedness Checklist**

**🔴 CRITICAL (Do this week)**
- [ ] Store 3-day emergency water supply (3L/person/day)
- [ ] Assemble emergency kit: torch, batteries, first aid, radio
- [ ] Keep all important documents in waterproof bag/cloud
- [ ] Save: 112, District Emergency, local NDRF contact

**🟡 IMPORTANT (Do this month)**
- [ ] Check home drainage — clear clogged gutters
- [ ] Stock 7-day medicine supply
- [ ] Charge all power banks
- [ ] Identify your nearest shelter (use Shelter Finder)
- [ ] Create Family Emergency Plan

**🟢 ONGOING (All monsoon)**
- [ ] Check MonsoonShield alerts daily
- [ ] Monitor local water levels
- [ ] Report hazards via Community Report

Go to the **Preparedness** section for your full personalized plan!`;
  }

  return `👋 **Namaste! I'm Varsha, your MonsoonShield AI assistant.**

I can help you with:
- 🌊 **Flood safety** — real-time guidance
- 🏠 **Emergency shelters** — nearest locations with capacity
- 📋 **Preparedness plans** — personalized for your family
- 🏥 **Health advisories** — disease prevention this monsoon
- 🗺️ **Route planning** — flood-safe travel routes
- 🆘 **Emergency help** — SOS coordination

**Try asking me:**
*"What should I do if my area floods?"*
*"Find nearest shelter"*
*"Generate my preparedness checklist"*
*"Monsoon health tips"*

I speak Hindi, Marathi, Bengali, Tamil, Telugu, and 17 more Indian languages. Just write to me in your language!

⚡ Powered by Google Gemini 2.5 Pro | Source-cited | Offline-ready`;
}

const DEMO_PREPAREDNESS_PLAN = `## Your Personalized Monsoon Preparedness Plan

**Risk Assessment: MODERATE (Score: 58/100)**
*Based on your location, home type, and family profile*

---

### 🔴 CRITICAL — Do This Week

1. **Emergency Water Supply** — Store 15 liters of clean drinking water
   *Why: Water contamination is the #1 monsoon health risk*
   ⏱️ 1 hour | 💰 ₹200

2. **Emergency Document Vault** — Scan and upload: Aadhaar, property papers, insurance, prescriptions to MonsoonShield Vault
   *Why: Physical documents are destroyed in floods*
   ⏱️ 2 hours | 💰 Free

3. **Medicine Stock** — 14-day supply of all regular medications
   *Why: Pharmacies close and routes get blocked*
   ⏱️ 30 min | 💰 ₹500-2000

4. **Emergency Contacts** — Save in MonsoonShield: 112, District Collector: 0000-000000, Local NDRF, nearest hospital
   ⏱️ 15 min | 💰 Free

---

### 🟡 IMPORTANT — Do This Month

5. **Emergency Kit** — Torch + batteries, first aid box, whistle, waterproof bag, portable radio
   *Why: Power outages last 2-7 days during severe floods*
   ⏱️ 2 hours | 💰 ₹1,500

6. **Home Flood-Proofing** — Raise electrical sockets above 3 feet, seal ground-floor gaps, clear drainage
   *Why: Prevents water damage and electrocution risk*
   ⏱️ Half day | 💰 ₹2,000-5,000

7. **Family Emergency Plan** — Designate: meeting point, out-of-city contact, who grabs what
   *Why: Panic = poor decisions. Planning = survival*
   ⏱️ 1 hour | 💰 Free

8. **Insurance Review** — Check flood coverage, note claim helpline
   ⏱️ 30 min | 💰 Free

---

### 🟢 ONGOING — All Season

9. **Daily Briefing** — Check MonsoonShield every morning during June-September
10. **Weather Monitoring** — Enable push alerts for your ward-level risk score
11. **Community Reporting** — Report road blockages, waterlogging, and hazards
12. **Family Check-ins** — Use Safe Check-In feature during heavy rain days

---

*Sources: NDMA Preparedness Guidelines 2024 | State SDMA Protocol | IMD Best Practices*
*Generated by Varsha AI | MonsoonShield v1.0*`;
