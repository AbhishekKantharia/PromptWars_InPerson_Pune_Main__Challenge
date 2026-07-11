import { describe, test, expect } from "vitest";
import { analyzeRisk, sendMessage } from "../lib/gemini";

describe("MonsoonShield Gemini API Proxy", () => {
  test("sendMessage returns fallback flood response when API unavailable", async () => {
    const response = await sendMessage("My street is flooding, what to do?", []);
    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
  });

  test("sendMessage returns emergency response for SOS keywords", async () => {
    const response = await sendMessage("help me emergency", []);
    expect(response).toContain("112");
  });

  test("sendMessage handles Hindi input", async () => {
    const response = await sendMessage("बाढ़ आ रही है", []);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  test("analyzeRisk computes extreme risk correctly", async () => {
    const result = await analyzeRisk({
      location: "Pune",
      rainfall: 250,
      riverLevel: "high",
      historicalRisk: "high",
    });
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe("EXTREME");
    expect(result.recommendation).toContain("Evacuate");
    expect(result.factors).toHaveLength(3);
  });

  test("analyzeRisk computes low risk correctly", async () => {
    const result = await analyzeRisk({
      location: "Pune",
      rainfall: 10,
      riverLevel: "low",
      historicalRisk: "low",
    });
    expect(result.score).toBeLessThan(35);
    expect(result.level).toBe("LOW");
    expect(result.recommendation).toContain("Normal");
  });

  test("analyzeRisk computes moderate risk correctly", async () => {
    const result = await analyzeRisk({
      location: "Mumbai",
      rainfall: 80,
      riverLevel: "medium",
      historicalRisk: "medium",
    });
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(75);
    expect(result.level).toMatch(/MODERATE|HIGH/);
  });

  test("analyzeRisk score never exceeds 100", async () => {
    const result = await analyzeRisk({
      location: "Chennai",
      rainfall: 500,
      riverLevel: "high",
      historicalRisk: "high",
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test("sendMessage handles shelter query", async () => {
    const response = await sendMessage("find nearest shelter locations", []);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  test("sendMessage handles health query", async () => {
    const response = await sendMessage("mosquito dengue malaria prevention", []);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  test("sendMessage handles preparedness query", async () => {
    const response = await sendMessage("prepare emergency kit checklist", []);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  test("sendMessage handles government scheme query", async () => {
    const response = await sendMessage("government relief compensation insurance", []);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });

  test("sendMessage with user context does not crash", async () => {
    const response = await sendMessage("hello", [], {
      location: "Pune",
      riskScore: 58,
      language: "en",
      familySize: 4,
      hasChildren: true,
      hasElderly: false,
      hasMedical: false,
    });
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  });
});
