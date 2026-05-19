import { describe, expect, it } from "vitest";

import {
  getAllWeighStations,
  getNearbyWeighStations,
  getWeighStationsForState,
} from "@/lib/weighStations";

describe("weighStations", () => {
  it("bundles at least 1 station per supported state", () => {
    for (const state of ["KS", "WI", "NE", "MO"] as const) {
      expect(getWeighStationsForState(state).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("getAllWeighStations covers every supported state", () => {
    const states = new Set(getAllWeighStations().map((s) => s.state));
    expect(states.has("KS")).toBe(true);
    expect(states.has("WI")).toBe(true);
    expect(states.has("NE")).toBe(true);
    expect(states.has("MO")).toBe(true);
  });

  it("filters stations by route leg substring match", () => {
    const matches = getNearbyWeighStations("KS", ["I-70 westbound", "K-18"]);
    expect(matches.map((m) => m.id)).toContain("ks-i70-topeka");
  });

  it("returns empty when no route leg references a known station", () => {
    expect(getNearbyWeighStations("KS", ["KS-92"])).toEqual([]);
  });
});
