import type { PermitState } from "./permits";

export interface WeighStation {
  id: string;
  state: PermitState;
  name: string;
  /** Approximate position on the rendered route map (normalised 0..1). */
  x: number;
  y: number;
}

// Seed feed — replaced with FMCSA POE data in a follow-up child issue.
const STATIONS: WeighStation[] = [
  { id: "ks-i70-topeka", state: "KS", name: "I-70 Topeka POE", x: 0.18, y: 0.22 },
  { id: "ks-i70-bonner", state: "KS", name: "I-70 Bonner Springs POE", x: 0.66, y: 0.27 },
  { id: "wi-i94-pleasant-prairie", state: "WI", name: "I-94 Pleasant Prairie", x: 0.74, y: 0.34 },
  { id: "wi-i43-beloit", state: "WI", name: "I-43 Beloit POE", x: 0.52, y: 0.40 },
  { id: "ne-i80-waverly", state: "NE", name: "I-80 Waverly Scales", x: 0.34, y: 0.55 },
  { id: "ne-i80-sidney", state: "NE", name: "I-80 Sidney Scales", x: 0.10, y: 0.62 },
  { id: "mo-i70-foristell", state: "MO", name: "I-70 Foristell Scales", x: 0.71, y: 0.71 },
  { id: "mo-i29-platte", state: "MO", name: "I-29 Platte City Scales", x: 0.22, y: 0.78 },
];

export function getAllWeighStations(): WeighStation[] {
  return STATIONS;
}

export function getWeighStationsForState(state: PermitState): WeighStation[] {
  return STATIONS.filter((station) => station.state === state);
}

export function getNearbyWeighStations(
  state: PermitState,
  legTexts: readonly string[],
): WeighStation[] {
  const candidates = getWeighStationsForState(state);
  const upper = legTexts.map((t) => t.toUpperCase());
  return candidates.filter((station) =>
    upper.some((label) =>
      station.name
        .toUpperCase()
        .split(/\s+/)
        .some((tok) => tok.length >= 3 && label.includes(tok)),
    ),
  );
}
