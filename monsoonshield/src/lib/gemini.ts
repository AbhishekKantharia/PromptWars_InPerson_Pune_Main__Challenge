// Gemini AI Integration for Varsha — Client-side proxy (API key stays server-side only)

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  _streaming?: boolean;
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
  },
  onChunk?: (text: string) => void,
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.map(m => ({ role: m.role, content: m.content })), context: userContext }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return "⚠️ AI service quota temporarily reached. Please try again in a few minutes, or call 1078 (Flood Helpline) for immediate help.\n\n📞 Emergency: 112 | Flood Helpline: 1078";
      }
      console.error("Chat API error:", res.status);
      return getDemoResponse(message, userContext);
    }

    const reader = res.body?.getReader();
    if (!reader) return getDemoResponse(message, userContext);

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.done) break;
          if (parsed.error) return parsed.error;
          if (parsed.t) {
            fullText += parsed.t;
            onChunk?.(fullText);
          }
        } catch { /* skip malformed */ }
      }
    }

    return fullText || getDemoResponse(message, userContext);
  } catch (error) {
    console.error("Chat API error:", error);
    return getDemoResponse(message, userContext);
  }
}

export async function generateBriefing(context?: {
  location?: string;
  language?: string;
  lat?: string;
  lng?: string;
}): Promise<string> {
  try {
    const res = await fetch("/api/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return "⚠️ AI service quota temporarily reached. Your briefing will be available again in a few minutes.\n\nPlease check IMD (mausam.imd.gov.in) or call 1078 (Flood Helpline) for the latest information.\n📞 Emergency: 112 | Flood Helpline: 1078";
      }
      return getDemoBriefing(context);
    }
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
}, onChunk?: (text: string) => void): Promise<string> {
  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return "⚠️ AI service quota temporarily reached. Your plan will be available again in a few minutes.\n\n📞 Emergency: 112 | Flood Helpline: 1078";
      }
      return getFallbackPlan(profile);
    }

    // Check if it's a streaming response or JSON error
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      const reader = res.body?.getReader();
      if (!reader) return getFallbackPlan(profile);

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) break;
            if (parsed.error) return parsed.error;
            if (parsed.t) {
              fullText += parsed.t;
              onChunk?.(fullText);
            }
          } catch { /* skip */ }
        }
      }
      return fullText || getFallbackPlan(profile);
    }

    // Fallback: plain text response (cached)
    const text = await res.text();
    return text || getFallbackPlan(profile);
  } catch {
    return getFallbackPlan(profile);
  }
}

function getFallbackPlan(profile: {
  location: string;
  familySize: number;
  hasChildren: boolean;
  hasElderly: boolean;
  hasMedicalConditions: boolean;
  homeType: string;
  hasVehicle: boolean;
  floodRiskScore: number;
}): string {
  const familySize = profile.familySize || 4;
  const waterLiters = familySize * 3 * 3;
  const riskLabel = profile.floodRiskScore >= 75 ? "EXTREME" : profile.floodRiskScore >= 55 ? "HIGH" : profile.floodRiskScore >= 35 ? "MODERATE" : "LOW";

  const childNote = profile.hasChildren ? "\n- Keep a whistle for each child. Store children's favorite items in emergency bag to keep them calm." : "";
  const elderNote = profile.hasElderly ? "\n- Pre-pack 1-week supply of all medications. Arrange wheelchair/walker access to upper floor. Keep a printed list of all medicines." : "";
  const medicalNote = profile.hasMedicalConditions ? "\n- Carry 2-week medicine supply in waterproof bag. Keep doctor's emergency number saved. Carry prescription copies." : "";
  const vehicleNote = profile.hasVehicle ? "\n- Keep vehicle fueled above half-tank all season. Park on high ground if flood warning issued. Vehicle can transport elderly/children to safety." : "\n- No vehicle: pre-arrange neighbor/relative with vehicle for evacuation. Locate nearest public transport route to shelter.";

  return `## Personalized Monsoon Preparedness Plan
**Location:** ${profile.location}
**Household:** ${familySize} members | ${profile.homeType.replace("_", " ")} | Risk: ${riskLabel} (${profile.floodRiskScore}/100)

---

### 🔴 CRITICAL — Do This Week

1. **Emergency Water Supply** — Store ${waterLiters}L clean drinking water (${familySize} people x 3L x 3 days). Use food-grade containers. Cost: ~₹200-400 (estimated)
2. **Emergency Kit** — Pack waterproof bag: torch + extra batteries, first aid box, whistle, power bank, phone charger, ₹5000 cash, photocopies of Aadhaar + insurance. Cost: ~₹1500-2500 (estimated)
3. **Medicine Stock** — ${profile.hasMedicalConditions ? "2-week" : "1-week"} supply of all regular prescriptions. Keep in waterproof container. Cost: varies by medication
4. **Document Vault** — Photograph Aadhaar, ration card, insurance policies, property documents. Upload to cloud (Google Drive/WhatsApp to family). Cost: Free
5. **Emergency Contacts** — Save in phone: 112 (National Emergency), 1078 (Flood Helpline), 108 (Ambulance), 104 (Health Helpline), District Collector Office${childNote}${elderNote}${medicalNote}

---

### 🟡 IMPORTANT — Do This Month

6. **Home Flood-Proofing** — ${profile.homeType === "ground_floor" || profile.homeType === "basement" ? "Raise electrical sockets above expected water level. Install one-way valve on drainage. Seal gaps in walls/floors with waterproof sealant." : "Check balcony drains are clear. Ensure water doesn't enter from windows during heavy rain."} Cost: ~₹500-2000 (estimated)
7. **Family Emergency Plan** — Designate meeting point (relative's house on higher ground). Set up family group chat. Practice evacuation route with all members including children.
8. **Insurance Review** — Check if home insurance covers flood damage. Note claim process. Keep IRDAI helpline: 1800-11-0001. Cost: Free to check
9. **Neighborhood Coordination** — Share emergency numbers with 2-3 neighbors. Identify who has a vehicle, who has medical training, who has a generator.

---

### 🟢 ONGOING — Throughout Monsoon

10. **Daily Routine** — Check MonsoonShield alerts every morning. Check IMD (mausam.imd.gov.in) if no alerts.
11. **Water Management** — Keep rooftops and drains clear. Empty flower pots, coolers, tires (dengue prevention).${vehicleNote}
12. **Family Check-ins** — Use MonsoonShield Safe Check-In during heavy rain events. Confirm all family members are safe.

---

### 🚨 IF FLOOD WARNING ISSUESD

1. Turn off electricity at main switch immediately — electrocution is the #1 flood killer
2. Move to highest floor/roof with emergency kit
3. Do NOT walk through flowing water (6 inches can knock you down)
4. Call 112 or use MonsoonShield SOS button
5. ${profile.hasVehicle ? "Move vehicle to high ground BEFORE water rises" : "Call neighbor/relative with vehicle for evacuation"}
6. ${profile.hasChildren ? "Keep children together, give each a whistle to blow if separated" : ""}${profile.hasElderly ? "Assist elderly members first — carry medications and documents" : ""}

---

📞 Emergency: 112 | Flood Helpline: 1078 | Ambulance: 108 | Health: 104
*Sources: NDMA Guidelines, IMD Protocol, MonsoonShield AI*
*Note: This is a fallback plan. For a fully personalized AI plan, Gemini quota may need to refresh (20 requests/day).*
`;
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

function getDemoBriefing(context?: { location?: string; language?: string }): string {
  if (context?.language === "hi") {
    return `⚠️ [डेमो मोड — लाइव डेटा उपलब्ध नहीं]

आज ${context?.location || "पुणे"} में मौसम की स्थिति के बारे में लाइव डेटा अभी उपलब्ध नहीं है।

⚠️ कृपया IMD वेबसाइट (mausam.imd.gov.in) या NDMA SACHET ऐप पर नवीनतम मौसम अलर्ट देखें।

📞 आपातकालीन: 112 (राष्ट्रीय) | 1078 (बाढ़ हेल्पलाइन)
स्रोत: IMD, NDMA | MonsoonShield AI Briefing`;
  }

  return `⚠️ [DEMO MODE — Live data unavailable]

Live weather and alert data could not be fetched. Please check:
- IMD: mausam.imd.gov.in
- NDMA SACHET app for real-time alerts
- Flood Helpline: 1078

📞 Emergency: 112 (National) | 1078 (Flood Helpline)
*Source: Open-Meteo, NDMA SACHET | Generated by Varsha AI*
⚠️ This is a fallback response. The live data APIs may be temporarily unavailable.`;
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
*If you have the MonsoonShield app, tap the red SOS button on the Emergency screen for immediate NDRF dispatch.*`;
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
*Note: This is a local fallback response. For live AI guidance, the Varsha AI backend may be temporarily unavailable.*`;
  }

  if (lower.includes("shelter") || lower.includes("आश्रय") || lower.includes("where to go") || lower.includes("evacuate")) {
    return `🏠 **Emergency Shelters Near ${context?.location || "Your Area"}**

I don't have live shelter data via public APIs, but here's how to find one:

**How to find shelters:**
1. Check the **Shelter Finder** tab in MonsoonShield for registered shelters
2. Call **1078** (Flood Helpline) for nearest shelter locations
3. Contact your **District Collector Office** or **Municipal Corporation**
4. Check NDMA SACHET app for shelter updates

**When evacuating, bring:**
• ID proof (Aadhaar, voter ID)
• Medicines (1-week supply)
• Water and dry food
• Phone charger / power bank
• Warm clothes and blanket
• Important documents in waterproof bag

📞 Emergency: 112 | Flood Helpline: 1078
*Source: NDMA Guidelines*`;
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

**Source:** MOHFW Monsoon Health Guidelines | WHO India`;
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

*Source: NDMA Preparedness Guidelines*`;
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

*Source: Ministry of Home Affairs, NDMA*`;
  }

  return `👋 **Namaste! I'm Varsha (वर्षा), your MonsoonShield AI assistant.**

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
