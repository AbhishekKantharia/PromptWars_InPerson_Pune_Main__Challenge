import { describe, test, expect } from "vitest";
import {
  getRiskColor,
  getRiskBgColor,
  getRiskLabel,
  getSeverityColor,
  getAlertIcon,
  getShelterCapacityColor,
} from "../lib/utils";

describe("MonsoonShield Utility Functions", () => {
  test("getRiskLabel returns correct safety level based on score", () => {
    expect(getRiskLabel(85)).toBe("EXTREME");
    expect(getRiskLabel(60)).toBe("HIGH");
    expect(getRiskLabel(45)).toBe("MODERATE");
    expect(getRiskLabel(20)).toBe("LOW");
  });

  test("getRiskColor returns correct class name for text coloring", () => {
    expect(getRiskColor(85)).toBe("text-red-500");
    expect(getRiskColor(60)).toBe("text-amber-500");
    expect(getRiskColor(45)).toBe("text-yellow-500");
    expect(getRiskColor(20)).toBe("text-green-500");
  });

  test("getRiskBgColor returns correct translucent styling for alert container backgrounds", () => {
    expect(getRiskBgColor(85)).toContain("bg-red-500/10");
    expect(getRiskBgColor(60)).toContain("bg-amber-500/10");
    expect(getRiskBgColor(45)).toContain("bg-yellow-500/10");
    expect(getRiskBgColor(20)).toContain("bg-green-500/10");
  });

  test("getSeverityColor maps severity level to warning borders", () => {
    expect(getSeverityColor("evacuate")).toContain("bg-red-50");
    expect(getSeverityColor("warning")).toContain("bg-amber-50");
    expect(getSeverityColor("watch")).toContain("bg-yellow-50");
    expect(getSeverityColor("info")).toContain("bg-blue-50");
  });

  test("getAlertIcon matches meteorological event categories", () => {
    expect(getAlertIcon("flood")).toBe("🌊");
    expect(getAlertIcon("cyclone")).toBe("🌀");
    expect(getAlertIcon("health")).toBe("🏥");
    expect(getAlertIcon("road")).toBe("🚧");
    expect(getAlertIcon("lightning")).toBe("⚠️");
  });

  test("getShelterCapacityColor flags near-full capacities", () => {
    // 95% occupancy -> red
    expect(getShelterCapacityColor(95, 100)).toBe("text-red-500");
    // 75% occupancy -> amber
    expect(getShelterCapacityColor(75, 100)).toBe("text-amber-500");
    // 30% occupancy -> green
    expect(getShelterCapacityColor(30, 100)).toBe("text-green-500");
  });
});
