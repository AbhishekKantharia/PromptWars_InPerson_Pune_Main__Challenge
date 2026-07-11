// Gemini AI Integration for Varsha — Client-side proxy (API key stays server-side only)

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
    familySize?: number;
    hasChildren?: boolean;
    hasElderly?: boolean;
    hasMedical?: boolean;
  }
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.map(m => ({ role: m.role, content: m.content })), context: userContext }),
    });

    if (!res.ok) {
      console.error("Chat API error:", res.status);
      return getDemoResponse(message, userContext);
    }

    const data = await res.json();
    return data.reply || getDemoResponse(message, userContext);
  } catch (error) {
    console.error("Chat API error:", error);
    return getDemoResponse(message, userContext);
  }
}

export async function generateBriefing(context?: {
  location?: string;
  riskScore?: number;
  weather?: string;
  alerts?: string[];
  language?: string;
}): Promise<string> {
  try {
    const res = await fetch("/api/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
    });

    if (!res.ok) return getDemoBriefing(context);
    const data = await res.json();
    return data.briefing || getDemoBriefing(context);
  } catch {
    return getDemoBriefing(context);
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
  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) return DEMO_PREPAREDNESS_PLAN;
    const data = await res.json();
    return data.plan || DEMO_PREPAREDNESS_PLAN;
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

function getDemoBriefing(context?: { location?: string; riskScore?: number; weather?: string; language?: string }): string {
  if (context?.language === "hi") {
    return `⚠️ [डेमो मोड — लाइव डेटा उपलब्ध नहीं]

आज ${context?.location || "पुणे"} में भारी बारिश की चेतावनी है। जोखिम स्तर ${context?.riskScore || 58}/100 (उच्च) है।

⚠️ मुख्य जोखिम: मूल नदी खतरे के स्तर पर है (82%)। निचले इलाकों में बाढ़ का खतरा।

📌 आज की कार्रवाई: यदि आप नदी के किनारे या निचले इलाके में रहते हैं, तो ऊंचे स्थान पर जाने की तैयारी करें। आपातकालीन किट तैयार रखें।

🌤️ कल का पूर्वानुमान: मध्यम बारिश संभव। स्थिति में सुधार की उम्मीद।

📞 आपातकालीन: 112 (राष्ट्रीय) | 1078 (बाढ़ हेल्पलाइन)
स्रोत: IMD, NDMA | MonsoonShield AI Briefing`;
  }

  return `⚠️ [DEMO MODE — Live data unavailable]

Good morning! Here's your daily monsoon briefing for ${context?.location || "Pune, Maharashtra"}.

🌧️ **Current Situation:** Heavy rainfall continues across Pune district. The Mula river is at 82% danger level — this is the highest risk factor today. Current conditions: 24°C, 89% humidity, 68mm rainfall recorded.

⚠️ **Key Risk:** With an Orange Alert active and the river approaching critical levels, low-lying areas near Wakad, Hinjewadi, and Baner face elevated flood risk. Power outages are likely in affected zones.

📌 **Today's Action:** If you're in a low-lying area, prepare your evacuation kit NOW. Ensure your phone is charged, documents are in a waterproof bag, and your family knows the meeting point. Use MonsoonShield's SOS button if water enters your home.

🌤️ **Tomorrow's Outlook:** Rainfall expected to moderate to 20-40mm. River levels may stabilize if upstream discharge reduces. Stay alert through tomorrow evening.

📞 Emergency: 112 (National) | 1078 (Flood Helpline)
*Source: IMD Orange Alert Data, CWC River Telemetry, NDMA Guidelines | Generated by Varsha AI*
⚠️ This is a demo response. For live data, enable the AI backend.`;
}

function getDemoResponse(message: string, context?: { location?: string; riskScore?: number; language?: string; hasChildren?: boolean; hasElderly?: boolean }): string {
  const lower = message.toLowerCase();

  if (lower.includes("sos") || lower.includes("help me") || lower.includes("emergency") || lower.includes("trapped") || lower.includes("drowning") || lower.includes("बचाओ") || lower.includes("मदद")) {
    return `🚨 **Call 112 immediately. Your life comes first.**

While help is on the way:
1. **Stay calm** — find the highest point in your location
2. **Signal for help** — use a flashlight, wave a bright cloth, or blow a whistle
3. **Keep your phone charged** — turn on battery saver mode
4. **If water is rising** — move to the roof or upper floor. Do NOT enter floodwater.

I'm here. Tell me when you're safe.

📞 Emergency: 112 (National) | 1078 (Flood Helpline)
*If you have the MonsoonShield app, tap the red SOS button on the Emergency screen for immediate NDRF dispatch.*
⚠️ Demo mode — for live AI guidance, enable the backend.`;
  }

  if (lower.includes("flood") || lower.includes("बाढ़") || lower.includes("paani") || lower.includes("water level")) {
    const childNote = context?.hasChildren ? "\n\n👶 **With Children:** Keep children away from windows. Carry a whistle for each child. If wading through water, hold children above water level." : "";
    const elderNote = context?.hasElderly ? "\n\n👴 **With Elderly Members:** Help them wear shoes with grip. Carry a chair or stool for resting during evacuation. Keep a week's medicine supply ready." : "";

    return `🌊 **Flood Safety — What You Need to Know**

Based on current IMD alerts for ${context?.location || "your area"}, here's your action plan:

**🔴 IF WATER IS ENTERING YOUR HOME:**
1. Turn off electricity at the main switch — electrocution is the #1 flood killer
2. Move to the highest floor or roof immediately
3. Take your emergency kit: phone, charger, documents (in waterproof bag), medicines, water
4. Call 112 or tap the SOS button in MonsoonShield

**🟡 IF YOU'RE SAFE BUT IN A RISK ZONE:**
1. Monitor water levels every 30 minutes
2. Keep vehicles on high ground
3. Fill bathtubs and large containers with clean water (supply may be cut)
4. Move important items to upper floors
5. Stay away from drains and manholes

**🟢 AFTER FLOODWATER RECEDES:**
1. Don't enter your home until authorities say it's safe
2. Check for structural damage before entering
3. Don't use electrical appliances until checked by an electrician
4. Boil all drinking water for at least 10 minutes

**📞 Emergency Numbers:** 112 (National), 1078 (Flood Helpline), District Collector Office${childNote}${elderNote}

**Source:** NDMA Flood Safety Guidelines | IMD Protocol
*Confidence: High — based on standard flood safety protocols*
⚠️ Demo mode — for live AI guidance, enable the backend.`;
  }

  if (lower.includes("shelter") || lower.includes("आश्रय") || lower.includes("where to go") || lower.includes("evacuate")) {
    return `🏠 **Emergency Shelters Near ${context?.location || "Your Area"}**

Available shelters with current capacity:

1. **Government High School No. 5** — Plot 45, Ring Road, Shivajinagar — 1.2 km
   ✅ Open | 427/600 (71% full) | Medical, wheelchair access, food
   📞 020-12345678 | Managed by: District Administration

2. **Community Hall Sector 7** — Hinjewadi Phase 1 — 2.1 km
   ✅ Open | 283/400 (71% full) | Water, food, pet-friendly
   📞 020-87654321 | Managed by: NGO — Goonj Pune Chapter

3. **Municipal Corporation Annex** — Deccan Gymkhana — 3.4 km
   ✅ Open | 89/300 (30% full) | 24/7 medical, women's section
   📞 020-11223344 | Managed by: Pune Municipal Corporation

4. **Bal Gandharva Rang Mandir** — Jangli Maharaj Road — 4.8 km
   ⚠️ Almost Full | 610/800 (76% full) | Medical, food, power
   📞 020-55667788 | Managed by: SDRF Maharashtra

👉 Go to the **Shelter Finder** tab for live maps and directions.
⚠️ Bring: ID proof, medicines, water, phone charger, warm clothes.

*Source: District Emergency Operations Center*
⚠️ Demo mode — data is from mock records. For live capacity, enable the backend.`;
  }

  if (lower.includes("health") || lower.includes("disease") || lower.includes("mosquito") || lower.includes("dengue") || lower.includes("malaria") || lower.includes("बीमारी")) {
    return `🏥 **Monsoon Health Advisory**

Disease risk is elevated during monsoon season.

**Prevention Checklist:**
✅ Empty flower pots, coolers, tires, and any standing water daily
✅ Use mosquito repellent and sleep under treated nets
✅ Boil drinking water or use RO + chlorine tablets
✅ Wash hands frequently — use soap for 20 seconds
✅ Avoid street food during heavy rains

**📞 Health Helplines:**
- National Health Helpline: 104
- Ambulance: 108

**Source:** MOHFW Monsoon Health Guidelines | WHO India
⚠️ Demo mode — for live AI guidance, enable the backend.`;
  }

  if (lower.includes("prepare") || lower.includes("checklist") || lower.includes("तैयारी") || lower.includes("kit") || lower.includes("what to do")) {
    return `📋 **Your Monsoon Preparedness Checklist**

**🔴 CRITICAL — Do This Week**
• Store 3-day water supply (3L per person per day)
• Assemble emergency kit: torch, batteries, first aid, whistle, radio
• Photograph all documents and upload to cloud
• Save emergency numbers: 112, 1078, District Collector

**🟡 IMPORTANT — Do This Month**
• Check and clear home drainage and gutters
• Stock 7-day medicine supply for all family members
• Identify your nearest shelter

**🟢 ONGOING — All Monsoon Season**
• Check MonsoonShield alerts every morning
• Monitor local river and water levels
• Report hazards via Community Reports

*Source: NDMA Preparedness Guidelines*
⚠️ Demo mode — for live AI guidance, enable the backend.`;
  }

  if (lower.includes("scheme") || lower.includes("government") || lower.includes("compensation") || lower.includes("relief") || lower.includes("insurance")) {
    return `🏛️ **Government Relief & Schemes**

**💰 Disaster Relief Funds:**
• **SDRF** — compensation available for house damage (amount varies by state)
• **PM National Relief Fund** — for major calamities

**📋 How to Claim:**
1. Report damage to your Tehsildar within 7 days
2. Get a damage certificate
3. Submit: Aadhaar, bank passbook, damage photos

**📞 Help Numbers:**
- Disaster Helpline: 1070
- Insurance: 1800-11-0001 (IRDAI)

*Source: Ministry of Home Affairs, NDMA*
⚠️ Demo mode — for live AI guidance, enable the backend.`;
  }

  return `👋 **Namaste! I'm Varsha (वर्षा), your MonsoonShield AI assistant.**

⚠️ **Demo Mode Active** — The AI backend is not configured. Responses below are based on mock data for demonstration purposes only.

I can help you with:
🌊 **Flood Safety** — real-time guidance
🏠 **Emergency Shelters** — nearest locations
📋 **Preparedness Plans** — personalized
🏥 **Health Advisories** — dengue, malaria prevention
🏛️ **Govt Schemes** — relief funds, insurance

**Try asking me:**
• "What should I do if my area floods?"
• "Find nearest emergency shelter"
• "How to prevent dengue?"

⚡ *Powered by Google Gemini | NDMA-Grounded*
📞 Emergency: 112 (National) | 1078 (Flood Helpline)`;
}

const DEMO_PREPAREDNESS_PLAN = `⚠️ [DEMO MODE — AI backend not configured]

## Your Personalized Monsoon Preparedness Plan

**Risk Assessment: MODERATE (Score: 58/100)**

---

### 🔴 CRITICAL — Do This Week

1. **Emergency Water Supply** — Store 15 liters of clean drinking water
2. **Emergency Document Vault** — Scan and upload critical documents
3. **Medicine Stock** — 14-day supply of all regular medications
4. **Emergency Contacts** — Save: 112, 1078, District Collector, nearest hospital

---

### 🟡 IMPORTANT — Do This Month

5. **Emergency Kit** — Torch + batteries, first aid box, whistle, waterproof bag
6. **Home Flood-Proofing** — Raise electrical sockets, seal gaps, clear drainage
7. **Family Emergency Plan** — Meeting point, out-of-city contact
8. **Insurance Review** — Check flood coverage

---

### 🟢 ONGOING — All Season

9. **Daily Briefing** — Check MonsoonShield every morning
10. **Weather Monitoring** — Enable push alerts
11. **Community Reporting** — Report hazards
12. **Family Check-ins** — Use Safe Check-In during heavy rain

---

📞 Emergency: 112 (National) | 1078 (Flood Helpline) | 108 (Ambulance)

*Sources: NDMA Guidelines | State SDMA Protocol*
*Generated by Varsha AI | MonsoonShield v1.0*
⚠️ This is a demo response. For a personalized AI plan, configure the Gemini API backend.`;
