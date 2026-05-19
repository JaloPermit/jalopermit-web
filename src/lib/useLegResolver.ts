// Live Google Maps geocoding + DirectionsService leg resolver.
// METAA-18: replaces the deterministic simulator with real geocode → route
// calls when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is configured. When the key is
// absent OR a leg fails to resolve confidently, the resolver returns
// `{resolved: false, ...}` so the panel can render the leg in red (0%
// confidence) per METAA-9 guardrail #2.

import { useCallback, useEffect, useState } from "react";

/** Minimal shape of the Maps SDK we depend on. Tests mock this surface. */
export interface MapsSdk {
  Geocoder: new () => { geocode: (req: { address: string }) => Promise<unknown> };
  DirectionsService: new () => {
    route: (req: unknown) => Promise<unknown>;
  };
  TravelMode: { DRIVING: string };
}

/** Shape returned to the router's resolveLeg callback. */
export type LegResolution = {
  resolved: boolean;
  placeId: string | null;
  note: string;
};

export type LegPair = { fromText: string; toText: string };

/**
 * Loader injection point — production code passes the real
 * `@googlemaps/js-api-loader` `Loader.load()` result; tests inject a stub.
 */
export type MapsLoader = () => Promise<MapsSdk | null>;

function readApiKey(): string | null {
  const key =
    typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null
      : null;
  if (typeof key === "string" && key.trim().length > 0) return key.trim();
  return null;
}

/** Default loader pulls from `@googlemaps/js-api-loader` when an API key is set. */
export const defaultMapsLoader: MapsLoader = async () => {
  const key = readApiKey();
  if (!key) return null;
  // Lazy-import so SSR / tests with no Maps key don't pay the cost.
  const mod = await import("@googlemaps/js-api-loader");
  // `libraries` is a string-literal union in @googlemaps/js-api-loader. We only
  // need the routes library; the loader options type is internal so we cast
  // through `LoaderOptions` rather than pulling in the full type surface.
  type LoaderOptions = ConstructorParameters<typeof mod.Loader>[0];
  const loader = new mod.Loader({
    apiKey: key,
    libraries: ["routes"] as unknown as LoaderOptions["libraries"],
  });
  const google = await loader.load();
  // The typings on @googlemaps/js-api-loader give back a `typeof google.maps` namespace.
  const maps = (google as unknown as { maps: MapsSdk }).maps;
  return maps;
};

export type UseLegResolverOptions = {
  /** Override loader for tests. */
  loader?: MapsLoader;
};

export type LegResolverState =
  | { kind: "uninitialized" }
  | { kind: "no_api_key" }
  | { kind: "loading" }
  | { kind: "ready"; sdk: MapsSdk }
  | { kind: "error"; message: string };

export function useLegResolver(options: UseLegResolverOptions = {}): {
  state: LegResolverState;
  resolveLeg: (pair: LegPair) => Promise<LegResolution>;
} {
  const [state, setState] = useState<LegResolverState>({ kind: "uninitialized" });
  const loader = options.loader ?? defaultMapsLoader;

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    loader()
      .then((sdk) => {
        if (cancelled) return;
        if (!sdk) {
          setState({ kind: "no_api_key" });
          return;
        }
        setState({ kind: "ready", sdk });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ kind: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [loader]);

  const resolveLeg = useCallback(
    async (pair: LegPair): Promise<LegResolution> => {
      if (state.kind !== "ready") {
        return {
          resolved: false,
          placeId: null,
          note:
            state.kind === "no_api_key"
              ? "Maps key not configured — leg flagged for trucker verification."
              : state.kind === "error"
                ? `Maps SDK load failed: ${state.message}`
                : "Maps SDK not ready yet.",
        };
      }

      try {
        const geocoder = new state.sdk.Geocoder();
        const fromGeo = (await geocoder.geocode({ address: pair.fromText })) as {
          results?: Array<{ place_id?: string }>;
        };
        const toGeo = (await geocoder.geocode({ address: pair.toText })) as {
          results?: Array<{ place_id?: string }>;
        };
        const fromPlace = fromGeo.results?.[0]?.place_id;
        const toPlace = toGeo.results?.[0]?.place_id;
        if (!fromPlace || !toPlace) {
          return {
            resolved: false,
            placeId: null,
            note: "Geocoding returned no confident match — leg flagged red.",
          };
        }
        const directions = new state.sdk.DirectionsService();
        const route = (await directions.route({
          origin: { placeId: fromPlace },
          destination: { placeId: toPlace },
          travelMode: state.sdk.TravelMode.DRIVING,
        })) as { routes?: Array<{ legs?: Array<{ start_location?: unknown }> }> };
        const hasLeg = (route.routes?.[0]?.legs?.length ?? 0) > 0;
        if (!hasLeg) {
          return {
            resolved: false,
            placeId: toPlace,
            note: "DirectionsService returned no usable route — leg flagged red.",
          };
        }
        return {
          resolved: true,
          placeId: toPlace,
          note: "Resolved via Google Maps DirectionsService.",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          resolved: false,
          placeId: null,
          note: `Maps resolution threw: ${message}`,
        };
      }
    },
    [state],
  );

  return { state, resolveLeg };
}
