import { describe, expect, it } from "vitest";
import {
  getSportCapabilities,
  isSupportedSportName,
  isValidCapabilityKey,
  RATING_SCALE,
  SPORT_CAPABILITIES,
} from "./sportConfig";

describe("Sport capability configuration", () => {
  it("defines the approved Tennis capabilities", () => {
    expect(SPORT_CAPABILITIES.Tennis.map((item) => item.capabilityKey)).toEqual([
      "forehand",
      "backhand",
      "serve",
      "volley",
      "agility",
      "eyeHandCoordination",
      "stamina",
    ]);
  });

  it("defines the approved Ski capabilities", () => {
    expect(SPORT_CAPABILITIES.Ski.map((item) => item.capabilityKey)).toEqual([
      "control",
      "turning",
      "balance",
      "edges",
      "movement",
      "terrainIndependence",
    ]);
  });

  it("provides human-readable labels for every capability", () => {
    expect(getSportCapabilities("Tennis")).toContainEqual({
      capabilityKey: "eyeHandCoordination",
      label: "Eye-hand coordination",
    });
    expect(getSportCapabilities("Ski")).toContainEqual({
      capabilityKey: "terrainIndependence",
      label: "Terrain independence",
    });
  });

  it("defines the shared rating scale", () => {
    expect(RATING_SCALE).toEqual([
      { rating: 1, label: "Introduced" },
      { rating: 2, label: "Developing" },
      { rating: 3, label: "Functional" },
      { rating: 4, label: "Consistent" },
      { rating: 5, label: "Advanced / Independent" },
    ]);
  });

  it("accepts valid capability keys for their Sport", () => {
    expect(isValidCapabilityKey("Tennis", "forehand")).toBe(true);
    expect(isValidCapabilityKey("Ski", "balance")).toBe(true);
  });

  it("rejects invalid and cross-Sport capability keys", () => {
    expect(isValidCapabilityKey("Tennis", "control")).toBe(false);
    expect(isValidCapabilityKey("Ski", "serve")).toBe(false);
    expect(isValidCapabilityKey("Tennis", "unknown")).toBe(false);
  });

  it("handles unsupported Sports without throwing", () => {
    expect(isSupportedSportName("Snowboard")).toBe(false);
    expect(getSportCapabilities("Snowboard")).toEqual([]);
    expect(isValidCapabilityKey("Snowboard", "balance")).toBe(false);
  });
});
