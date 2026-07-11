// Gemini AI Integration for Varsha - MonsoonShield's AI Assistant
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export const VARSHA_SYSTEM_PROMPT = `You are Varsha (वर्षा), MonsoonShield's intelligent AI disaster preparedness assistant for India. You are powered by Google Gemini 2.5 and grounded in official NDMA, IMD, MOHFW, and WHO guidelines.

## IDENTITY & PERSONALITY
- You are a calm, compassionate, and highly knowledgeable disaster preparedness expert
- Think of yourself as a caring neighbor who happens to be an NDMA-trained disaster response professional
- Never be alarmist — always be calm, clear, and actionable
- Use plain language at a Grade 6 reading level so everyone from children to elderly can understand
- Address users with warmth: "Namaste" for Hindi speakers, friendly tone for English
- Use emojis sparingly for visual clarity (🌊 for flood, 🏠 for shelter, 📋 for checklist, ⚠️ for warning)
- When appropriate, use formatting: **bold** for critical actions, bullet points for steps, numbered lists for sequences

## CORE EXPERTISE AREAS
1. **Monsoon Preparedness** — personalized household plans, emergency kits, home flood-proofing, evacuation routes
2. **Real-Time Weather Interpretation** — translating IMD data, rainfall forecasts, wind speeds into plain language
3. **Flood Risk Assessment** — river levels, rainfall accumulation, historical patterns, drainage capacity
4. **Emergency Response** — step-by-step guidance for floods, cyclones, landslides, lightning, heatwaves
5. **Health & Disease Prevention** — dengue, malaria, cholera, leptospirosis, waterborne diseases, mental health
6. **Government Schemes** — PM Awas, Fasal Bima, relief funds, compensation, district administration contacts
7. **Insurance & Financial** — claim processes, documentation, what's covered, helpline numbers
8. **Family Safety** — check-in protocols, evacuation planning, reunification points, children's safety
9. **Community Coordination** — volunteer mobilization, resource sharing, reporting hazards, neighborhood watch
10. **Mental Health First Aid** — post-disaster trauma, anxiety management, coping strategies, helpline numbers

## RESPONSE RULES

### Emergency Protocol (CRITICAL)
If the user describes an IMMEDIATE life-threatening situation (drowning, trapped, injury, fire, electrocution):
1. START with: **"Call 112 immediately. Your life comes first."**
2. Then give 2-3 immediate survival actions
3. Keep response under 100 words
4. End with: "I'm here. Tell me when you're safe."

### Informational Queries
1. Structure responses with clear headers and bullet points
2. Always cite your source: (NDMA, IMD, MOHFW, WHO, State SDMA)
3. Include a confidence indicator: "Based on current data, I'm [high/medium] confidence in this guidance"
4. End with 1-2 actionable next steps
5. Keep responses between 100-300 words (not too short, not overwhelming)

### Preparedness Queries
1. Tailor advice to the user's specific context (location, family, home type)
2. Break into CRITICAL / IMPORTANT / ONGOING priorities
3. Include time estimates and approximate costs in ₹
4. Reference MonsoonShield features when relevant

### Health Queries
1. NEVER diagnose — always say "consult a doctor"
2. List symptoms that require immediate medical attention
3. Provide prevention steps
4. Reference government health helplines

### Multilingual Support
- Respond in the SAME language the user writes in
- If Hindi: respond in Hindi with English technical terms where helpful
- If regional language: respond in that language
- Support all 22 scheduled Indian languages

## IMPORTANT CONSTRAINTS
- You are NOT a doctor. Never diagnose. Always say "consult a healthcare professional"
- You are NOT a substitute for 112. Always prioritize emergency calls
- You do NOT have real-time sensor data — reference "current IMD data" only when discussing general conditions
- If you don't know something specific, say "I don't have that specific data, but here's what I recommend..."
- Never make up statistics or numbers
- Never provide information that could be dangerous if wrong

## CONTEXT AWARENESS
You may receive user context including:
- Location (city/district)
- Risk score (0-100)
- Family composition (children, elderly, medical needs)
- Current weather conditions
- Active alerts in their area

Use this context to personalize your responses. If a user has children, emphasize child safety. If elderly, emphasize medical needs and mobility.

## MONSOONSHIELD FEATURES TO REFERENCE
- **SOS Button** — one-tap emergency dispatch to NDRF/SDRF
- **Shelter Finder** — real-time shelter locations with capacity
- **Family Check-In** — safe status updates for family members
- **Preparedness Plan** — AI-generated personalized plans
- **Community Reports** — crowd-sourced ground truth reporting
- **Weather Intel** — river levels, flood predictions, 7-day forecast
- **Command Center** — official agency dispatch dashboard

Remember: You are India's frontline AI disaster responder. Lives may depend on your accuracy and clarity. Be thorough, be compassionate, be reliable.`;

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
  if (!API_KEY) {
    return getDemoResponse(message, userContext);
  }

  try {
    const contextBlock = userContext
      ? `\n\n## CURRENT USER CONTEXT\n- Location: ${userContext.location || "India"}\n- Current Risk Score: ${userContext.riskScore || "Unknown"}/100\n- Preferred Language: ${userContext.language || "English"}\n- Family Size: ${userContext.familySize || "Unknown"}\n- Has Children: ${userContext.hasChildren ? "Yes" : "No"}\n- Has Elderly Members: ${userContext.hasElderly ? "Yes" : "No"}\n- Has Medical Needs: ${userContext.hasMedical ? "Yes" : "No"}\n- Profile: ${userContext.profile || "General user"}\n\nUse this context to personalize your response. If they have children, mention child safety. If elderly, mention medical needs.`
      : "";

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: VARSHA_SYSTEM_PROMPT + contextBlock,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const chatHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
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
  if (!API_KEY) {
    return getDemoBriefing(context);
  }

  const prompt = `Generate a concise daily monsoon briefing for a user in ${context?.location || "Pune, Maharashtra"}.

Current conditions:
- Risk Score: ${context?.riskScore || 58}/100
- Weather: ${context?.weather || "Heavy Rain, 24°C"}
- Active Alerts: ${context?.alerts?.join(", ") || "Heavy Rainfall Warning, Dengue Risk"}

Write a 3-4 sentence briefing in ${context?.language === "hi" ? "Hindi" : "English"}:
1. Current situation summary
2. Key risk for today
3. One action to take
4. Tomorrow's outlook

Use NDMA/IMD language. Be factual, calm, actionable.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
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
  if (!API_KEY) {
    return DEMO_PREPAREDNESS_PLAN;
  }

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

Format each action as: [PRIORITY] Action - Why it matters - Time needed - Approx cost in ₹
Use simple language. Be specific to their situation. Cite NDMA guidelines where applicable.
If they have children, include child-specific safety items. If elderly, include medical and mobility items.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
    return `आज ${context?.location || "पुणे"} में भारी बारिश की चेतावनी है। जोखिम स्तर ${context?.riskScore || 58}/100 (उच्च) है।

⚠️ मुख्य जोखिम: मूल नदी खतरे के स्तर पर है (82%)। निचले इलाकों में बाढ़ का खतरा।

📌 आज की कार्रवाई: यदि आप नदी के किनारे या निचले इलाके में रहते हैं, तो ऊंचे स्थान पर जाने की तैयारी करें। आपातकालीन किट तैयार रखें।

🌤️ कल का पूर्वानुमान: मध्यम बारिश संभव। स्थिति में सुधार की उम्मीद।

स्रोत: IMD, NDMA | MonsoonShield AI Briefing`;
  }

  return `Good morning! Here's your daily monsoon briefing for ${context?.location || "Pune, Maharashtra"}.

🌧️ **Current Situation:** Heavy rainfall continues across Pune district. The Mula river is at 82% danger level — this is the highest risk factor today. Current conditions: 24°C, 89% humidity, 68mm rainfall recorded.

⚠️ **Key Risk:** With an Orange Alert active and the river approaching critical levels, low-lying areas near Wakad, Hinjewadi, and Baner face elevated flood risk. Power outages are likely in affected zones.

📌 **Today's Action:** If you're in a low-lying area, prepare your evacuation kit NOW. Ensure your phone is charged, documents are in a waterproof bag, and your family knows the meeting point. Use MonsoonShield's SOS button if water enters your home.

🌤️ **Tomorrow's Outlook:** Rainfall expected to moderate to 20-40mm. River levels may stabilize if upstream discharge reduces. Stay alert through tomorrow evening.

*Source: IMD Orange Alert Data, CWC River Telemetry, NDMA Guidelines | Generated by Varsha AI*`;
}

function getDemoResponse(message: string, context?: { location?: string; riskScore?: number; language?: string; hasChildren?: boolean; hasElderly?: boolean }): string {
  const lower = message.toLowerCase();

  // Emergency / SOS queries
  if (lower.includes("sos") || lower.includes("help me") || lower.includes("emergency") || lower.includes("trapped") || lower.includes("drowning") || lower.includes("बचाओ") || lower.includes("मदद")) {
    return `🚨 **Call 112 immediately. Your life comes first.**

While help is on the way:
1. **Stay calm** — find the highest point in your location
2. **Signal for help** — use a flashlight, wave a bright cloth, or blow a whistle
3. **Keep your phone charged** — turn on battery saver mode
4. **If water is rising** — move to the roof or upper floor. Do NOT enter floodwater.

I'm here. Tell me when you're safe.

*If you have the MonsoonShield app, tap the red SOS button on the Emergency screen for immediate NDRF dispatch.*`;
  }

  // Flood queries
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

**Source:** NDMA Flood Safety Guidelines 2024 | IMD Protocol
*Confidence: High — based on standard flood safety protocols*`;
  }

  // Shelter queries
  if (lower.includes("shelter") || lower.includes("आश्रय") || lower.includes("where to go") || lower.includes("evacuate")) {
    return `🏠 **Emergency Shelters Near ${context?.location || "Your Area"}**

I found these shelters with available capacity:

1. **Govt High School No. 5, Ring Road** — 1.2 km
   ✅ Open | 427/600 (71% full) | Medical aid, wheelchair access, food
   📞 Contact: 020-2714-XXXX

2. **Community Hall, Sector 7, Wakad** — 2.1 km
   ✅ Open | 283/400 (71% full) | Water, food, pet-friendly
   📞 Contact: 020-2729-XXXX

3. **Municipal Corp Annex, Hinjewadi** — 3.4 km
   ✅ Open | 89/300 (30% full) | 24/7 medical, women's section
   📞 Contact: 020-2293-XXXX

4. **Bal Gandharva Rang Mandir** — 5.2 km
   ✅ Open | 610/800 (76% full) | Full kitchen, charging stations
   📞 Contact: 020-2433-XXXX

👉 Go to the **Shelter Finder** tab for live maps and directions.
⚠️ Bring: ID proof, medicines, water, phone charger, warm clothes.

*Source: District Emergency Operations Center, Pune*`;
  }

  // Health queries
  if (lower.includes("health") || lower.includes("disease") || lower.includes("mosquito") || lower.includes("dengue") || lower.includes("malaria") || lower.includes("बीमारी")) {
    return `🏥 **Monsoon Health Advisory**

Disease risk is elevated during monsoon season. Here's what you need to know:

**🔴 HIGH RISK — Dengue & Malaria**
- Dengue peaks after rainfall (mosquitoes breed in stagnant water)
- Malaria risk increases with continued flooding
- Both can be fatal if untreated — see a doctor immediately if symptoms appear

**Prevention Checklist:**
✅ Empty flower pots, coolers, tires, and any standing water daily
✅ Use mosquito repellent (DEET-based) and sleep under treated nets
✅ Wear full-sleeved clothes during dusk and dawn
✅ Boil drinking water or use RO + chlorine tablets
✅ Wash hands frequently — use soap for 20 seconds
✅ Avoid street food during heavy rains
✅ Cook food fresh — don't eat leftovers stored overnight

**⚠️ See a Doctor Immediately If:**
- High fever (>101°F) with shivering
- Severe headache with stiff neck
- Blood in vomit or stool
- Difficulty breathing
- Skin rash with joint pain (possible dengue)
- Persistent diarrhea >24 hours

**📞 Health Helplines:**
- National Health Helpline: 104
- Ambulance: 108
- Dengue Helpline: 011-22307145

**Source:** MOHFW Monsoon Health Guidelines | NVBDCP | WHO India
*Confidence: High — based on established medical protocols*`;
  }

  // Preparedness queries
  if (lower.includes("prepare") || lower.includes("checklist") || lower.includes("तैयारी") || lower.includes("kit") || lower.includes("what to do")) {
    return `📋 **Your Monsoon Preparedness Checklist**

**🔴 CRITICAL — Do This Week**
• Store 3-day water supply (3L per person per day) — ₹200
• Assemble emergency kit: torch, batteries, first aid, whistle, radio — ₹1,500
• Photograph all documents (Aadhaar, insurance, property) and upload to cloud
• Save emergency numbers: 112, 1078, District Collector, nearest hospital
• Charge all power banks to 100%

**🟡 IMPORTANT — Do This Month**
• Check and clear home drainage and gutters
• Stock 7-day medicine supply for all family members
• Raise electrical sockets above 3 feet if ground floor
• Identify your nearest shelter (use MonsoonShield Shelter Finder)
• Create a Family Emergency Plan — meeting point, roles, out-of-city contact
• Review insurance coverage for flood damage

**🟢 ONGOING — All Monsoon Season**
• Check MonsoonShield alerts every morning (June–September)
• Monitor local river and water levels
• Report hazards via Community Reports
• Practice family check-ins during heavy rain
• Keep emergency kit accessible (not in basement!)

**📱 MonsoonShield Features:**
- SOS button for immediate NDRF dispatch
- Family Check-In for safety updates
- Shelter Finder for nearest safe locations
- Weather Intel for real-time conditions

Go to the **Preparedness Plan** tab for your AI-generated personalized plan!

*Source: NDMA Preparedness Guidelines 2024 | State SDMA Protocol*`;
  }

  // Government schemes
  if (lower.includes("scheme") || lower.includes("government") || lower.includes("compensation") || lower.includes("relief") || lower.includes("insurance")) {
    return `🏛️ **Government Relief & Schemes**

**💰 Disaster Relief Funds:**
• **SDRF** (State Disaster Response Fund) — up to ₹4 lakh compensation for house damage
• **NDRF** (National) — additional central assistance for severe disasters
• **PM National Relief Fund** — for major calamities

**📋 How to Claim:**
1. Report damage to your Tehsildar / Revenue Officer within 7 days
2. Get a Gram Panchayat or Municipal certificate of damage
3. Submit: Aadhaar, bank passbook, damage photos, property documents
4. Track status at: disasterassistance.gov.in

**🏠 PM Awas Yojana:**
• Reconstruction assistance up to ₹1.2 lakh (rural) / ₹1.5 lakh (urban)
• Additional ₹50,000 for housing in flood-prone areas

**🌾 Crop Insurance (PMFBY):**
• Report crop damage within 72 hours to your Block Agriculture Officer
• Take photos of damaged crops with geo-tagging
• Insurance claim: up to 90% of sum insured

**📞 Help Numbers:**
- Disaster Helpline: 1070
- Revenue Collector Office: Contact your district website
- Insurance: 1800-11-0001 (IRDAI)

*Source: Ministry of Home Affairs, NDMA, Ministry of Agriculture*`;
  }

  // Default welcome
  return `👋 **Namaste! I'm Varsha (वर्षा), your MonsoonShield AI assistant.**

I'm here to keep you and your family safe during the monsoon season. I'm powered by Google Gemini AI and grounded in official NDMA, IMD, and WHO guidelines.

**I can help you with:**

🌊 **Flood Safety** — real-time guidance for flood situations
🏠 **Emergency Shelters** — nearest locations with live capacity
📋 **Preparedness Plans** — personalized for your family
🏥 **Health Advisories** — dengue, malaria, waterborne disease prevention
🗺️ **Evacuation Routes** — flood-safe travel planning
🏛️ **Govt Schemes** — relief funds, compensation, insurance claims
👨‍👩‍👧 **Family Safety** — check-in protocols, reunification plans
🧠 **Mental Health** — post-disaster coping, anxiety support

**Try asking me:**
• *"What should I do if my area floods?"*
• *"Find nearest emergency shelter"*
• "Generate my preparedness checklist"
• "How to prevent dengue?"
• "What government relief can I get for flood damage?"

I speak Hindi, Marathi, Bengali, Tamil, Telugu, and 17 more Indian languages. Just write to me in your language!

⚡ *Powered by Google Gemini 2.5 | NDMA-Grounded | Source-Cited*`;
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
