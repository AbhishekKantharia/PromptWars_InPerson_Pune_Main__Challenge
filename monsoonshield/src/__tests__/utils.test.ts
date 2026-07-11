import { describe, test, expect } from "vitest";
import {
  getRiskColor,
  getRiskBgColor,
  getRiskLabel,
  getSeverityColor,
  getAlertIcon,
  getShelterCapacityColor,
  formatTimeAgo,
  cn,
  LANGUAGES,
  EMERGENCY_CONTACTS,
} from "../lib/utils";

describe("MonsoonShield Utility Functions", () => {
  describe("Risk scoring display", () => {
    test("getRiskLabel returns correct labels for boundary values", () => {
      expect(getRiskLabel(100)).toBe("EXTREME");
      expect(getRiskLabel(75)).toBe("EXTREME");
      expect(getRiskLabel(74)).toBe("HIGH");
      expect(getRiskLabel(55)).toBe("HIGH");
      expect(getRiskLabel(54)).toBe("MODERATE");
      expect(getRiskLabel(35)).toBe("MODERATE");
      expect(getRiskLabel(34)).toBe("LOW");
      expect(getRiskLabel(0)).toBe("LOW");
    });

    test("getRiskColor returns valid Tailwind classes", () => {
      const red = getRiskColor(85);
      const amber = getRiskColor(60);
      const yellow = getRiskColor(45);
      const green = getRiskColor(20);
      expect(red).toBe("text-red-500");
      expect(amber).toBe("text-amber-500");
      expect(yellow).toBe("text-yellow-500");
      expect(green).toBe("text-green-500");
    });

    test("getRiskBgColor returns valid background classes", () => {
      expect(getRiskBgColor(85)).toContain("bg-red-500/10");
      expect(getRiskBgColor(60)).toContain("bg-amber-500/10");
      expect(getRiskBgColor(45)).toContain("bg-yellow-500/10");
      expect(getRiskBgColor(20)).toContain("bg-green-500/10");
    });
  });

  describe("Alert severity mapping", () => {
    test("getSeverityColor maps all severity levels", () => {
      expect(getSeverityColor("evacuate")).toContain("bg-red-50");
      expect(getSeverityColor("emergency")).toContain("bg-red-50");
      expect(getSeverityColor("warning")).toContain("bg-amber-50");
      expect(getSeverityColor("watch")).toContain("bg-yellow-50");
      expect(getSeverityColor("info")).toContain("bg-blue-50");
      expect(getSeverityColor("unknown")).toContain("bg-blue-50");
    });

    test("getAlertIcon returns correct emoji for all types", () => {
      expect(getAlertIcon("flood")).toBe("🌊");
      expect(getAlertIcon("cyclone")).toBe("🌀");
      expect(getAlertIcon("landslide")).toBe("⛰️");
      expect(getAlertIcon("health")).toBe("🏥");
      expect(getAlertIcon("road")).toBe("🚧");
      expect(getAlertIcon("power")).toBe("⚡");
      expect(getAlertIcon("unknown")).toBe("⚠️");
    });
  });

  describe("Shelter capacity", () => {
    test("getShelterCapacityColor correctly thresholds", () => {
      expect(getShelterCapacityColor(95, 100)).toBe("text-red-500");
      expect(getShelterCapacityColor(90, 100)).toBe("text-red-500");
      expect(getShelterCapacityColor(75, 100)).toBe("text-amber-500");
      expect(getShelterCapacityColor(70, 100)).toBe("text-amber-500");
      expect(getShelterCapacityColor(30, 100)).toBe("text-green-500");
      expect(getShelterCapacityColor(0, 100)).toBe("text-green-500");
    });
  });

  describe("Time formatting", () => {
    test("formatTimeAgo handles seconds", () => {
      const now = new Date();
      expect(formatTimeAgo(now)).toContain("s ago");
    });

    test("formatTimeAgo handles minutes", () => {
      const d = new Date(Date.now() - 120000);
      expect(formatTimeAgo(d)).toBe("2m ago");
    });

    test("formatTimeAgo handles hours", () => {
      const d = new Date(Date.now() - 7200000);
      expect(formatTimeAgo(d)).toBe("2h ago");
    });

    test("formatTimeAgo handles days", () => {
      const d = new Date(Date.now() - 172800000);
      expect(formatTimeAgo(d)).toBe("2d ago");
    });

    test("formatTimeAgo accepts string dates", () => {
      const d = new Date(Date.now() - 60000);
      expect(formatTimeAgo(d.toISOString())).toContain("m ago");
    });
  });

  describe("Utility helpers", () => {
    test("cn merges Tailwind classes correctly", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
      expect(cn("p-4", "p-8")).toBe("p-8");
      expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
    });

    test("LANGUAGES contains all 12 scheduled Indian languages", () => {
      expect(LANGUAGES.length).toBe(12);
      const codes = LANGUAGES.map((l) => l.code);
      expect(codes).toContain("en");
      expect(codes).toContain("hi");
      expect(codes).toContain("mr");
      expect(codes).toContain("bn");
      expect(codes).toContain("te");
      expect(codes).toContain("ta");
      expect(codes).toContain("gu");
      expect(codes).toContain("kn");
      expect(codes).toContain("ml");
      expect(codes).toContain("or");
      expect(codes).toContain("pa");
      expect(codes).toContain("ur");
    });

    test("EMERGENCY_CONTACTS includes critical numbers", () => {
      const numbers = EMERGENCY_CONTACTS.map((c) => c.number);
      expect(numbers).toContain("112");
      expect(numbers).toContain("108");
      expect(numbers).toContain("100");
      expect(numbers).toContain("101");
    });

    test("each emergency contact has name, number, and icon", () => {
      EMERGENCY_CONTACTS.forEach((contact) => {
        expect(contact.name).toBeTruthy();
        expect(contact.number).toBeTruthy();
        expect(contact.icon).toBeTruthy();
      });
    });
  });
});
