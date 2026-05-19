import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { MapsSdk } from "../lib/useLegResolver";
import { useLegResolver } from "../lib/useLegResolver";

/**
 * Mocks the minimal Maps SDK shape `useLegResolver` consumes.
 * Each helper takes a list of (address → placeId) tuples for the geocoder and
 * a boolean for whether DirectionsService returns a usable route.
 */
function makeStubSdk(opts: {
  geocode: (address: string) => string | null;
  routeHasLeg: boolean;
}): MapsSdk {
  const Geocoder = function (this: object) {
    this;
  } as unknown as MapsSdk["Geocoder"];
  Geocoder.prototype.geocode = async (req: { address: string }) => {
    const placeId = opts.geocode(req.address);
    if (!placeId) return { results: [] };
    return { results: [{ place_id: placeId }] };
  };

  const DirectionsService = function (this: object) {
    this;
  } as unknown as MapsSdk["DirectionsService"];
  DirectionsService.prototype.route = async () => {
    if (!opts.routeHasLeg) return { routes: [] };
    return { routes: [{ legs: [{ start_location: {} }] }] };
  };

  return {
    Geocoder,
    DirectionsService,
    TravelMode: { DRIVING: "DRIVING" },
  };
}

describe("useLegResolver", () => {
  it("falls back to no_api_key when loader returns null and resolveLeg returns red", async () => {
    const loader = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("no_api_key"));
    const resolution = await act(async () =>
      result.current.resolveLeg({ fromText: "Topeka, KS", toText: "Salina, KS" }),
    );
    expect(resolution.resolved).toBe(false);
    expect(resolution.placeId).toBeNull();
    expect(resolution.note).toMatch(/Maps key not configured/);
  });

  it("ready + happy path returns resolved=true and the destination placeId", async () => {
    const sdk = makeStubSdk({
      geocode: (addr) => (addr.startsWith("Topeka") ? "ks_topeka_place" : "ks_salina_place"),
      routeHasLeg: true,
    });
    const loader = vi.fn().mockResolvedValue(sdk);
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("ready"));
    const resolution = await result.current.resolveLeg({
      fromText: "Topeka, KS",
      toText: "Salina, KS",
    });
    expect(resolution.resolved).toBe(true);
    expect(resolution.placeId).toBe("ks_salina_place");
    expect(resolution.note).toMatch(/Google Maps DirectionsService/);
  });

  it("geocode miss on either end → not resolved, leg flagged red", async () => {
    const sdk = makeStubSdk({
      geocode: (addr) => (addr.startsWith("Topeka") ? "ks_topeka_place" : null),
      routeHasLeg: true,
    });
    const loader = vi.fn().mockResolvedValue(sdk);
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("ready"));
    const resolution = await result.current.resolveLeg({
      fromText: "Topeka, KS",
      toText: "Nowhere, KS",
    });
    expect(resolution.resolved).toBe(false);
    expect(resolution.note).toMatch(/Geocoding returned no confident match/);
  });

  it("DirectionsService returning no legs → not resolved, leg flagged red", async () => {
    const sdk = makeStubSdk({
      geocode: (addr) => (addr.startsWith("Topeka") ? "ks_topeka_place" : "ks_salina_place"),
      routeHasLeg: false,
    });
    const loader = vi.fn().mockResolvedValue(sdk);
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("ready"));
    const resolution = await result.current.resolveLeg({
      fromText: "Topeka, KS",
      toText: "Salina, KS",
    });
    expect(resolution.resolved).toBe(false);
    expect(resolution.note).toMatch(/no usable route/);
  });

  it("loader rejection → error state, resolveLeg surfaces error reason", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("error"));
    const resolution = await result.current.resolveLeg({
      fromText: "Topeka, KS",
      toText: "Salina, KS",
    });
    expect(resolution.resolved).toBe(false);
    expect(resolution.note).toMatch(/Maps SDK load failed: network down/);
  });

  it("thrown error during geocode → resolved=false with note surfacing the throw", async () => {
    const Geocoder = function () {
      // intentionally empty
    } as unknown as MapsSdk["Geocoder"];
    Geocoder.prototype.geocode = async () => {
      throw new Error("geocode boom");
    };
    const DirectionsService = function () {
      // intentionally empty
    } as unknown as MapsSdk["DirectionsService"];
    DirectionsService.prototype.route = async () => ({ routes: [] });
    const sdk: MapsSdk = {
      Geocoder,
      DirectionsService,
      TravelMode: { DRIVING: "DRIVING" },
    };
    const loader = vi.fn().mockResolvedValue(sdk);
    const { result } = renderHook(() => useLegResolver({ loader }));
    await waitFor(() => expect(result.current.state.kind).toBe("ready"));
    const resolution = await result.current.resolveLeg({
      fromText: "Topeka, KS",
      toText: "Salina, KS",
    });
    expect(resolution.resolved).toBe(false);
    expect(resolution.note).toMatch(/Maps resolution threw: geocode boom/);
  });
});
