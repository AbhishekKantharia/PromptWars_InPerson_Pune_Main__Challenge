import { describe, test, expect } from "vitest";
import { VARSHA_SYSTEM_PROMPT, analyzeRisk, sendMessage } from "../lib/gemini";

describe("MonsoonShield Varsha AI Assistant", () => {
  test("VARSHA_SYSTEM_PROMPT incorporates mandatory safety constraints", () => {
    expect(VARSHA_SYSTEM_PROMPT).toContain("112");
    expect(VARSHA_SYSTEM_PROMPT).toContain("NDMA");
    expect(VARSHA_SYSTEM_PROMPT).toContain("citation");
    expect(VARSHA_SYSTEM_PROMPT).toContain("medical");
  });

  test("analyzeRisk computes threat scores accurately based on inputs", async () => {
    // Heavy rainfall + high river level -> Extreme/High Risk
    const extremeRisk = await analyzeRisk({
      location: "Pune",
      rainfall: 250,
      riverLevel: "high",
      historicalRisk: "high",
    });
    expect(extremeRisk.score).toBeGreaterThanOrEqual(75);
    expect(extremeRisk.level).toBe("EXTREME");
    expect(extremeRisk.recommendation).toContain("Evacuate");

    // Moderate rainfall + normal river level -> Moderate Risk
    const normalRisk = await analyzeRisk({
      location: "Pune",
      rainfall: 50,
      riverLevel: "low",
      historicalRisk: "low",
    });
    expect(normalRisk.score).toBeLessThan(55);
    expect(normalRisk.level).toBe("LOW");
    expect(normalRisk.recommendation).toContain("precautions");
  });

  test("sendMessage returns appropriate fallback responses in absence of API keys", async () => {
    const floodResponse = await sendMessage("My street is flooding, what to do?", []);
    expect(floodResponse).toContain("Flood Safety Guidance");
    expect(floodResponse).toContain("112");
    expect(floodResponse).toContain("NDMA");

    const shelterResponse = await sendMessage("find nearest shelter locations", []);
    expect(shelterResponse).toContain("emergency shelters");
    expect(shelterResponse).toContain("capacity");

    const healthResponse = await sendMessage("mosquito dengue malaria prevention", []);
    expect(healthResponse).toContain("health advisory");
    expect(healthResponse).toContain("mosquito");
  });
});
