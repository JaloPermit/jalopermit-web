// Types mirroring the jalopermit-api permits library response shape.
// Kept narrow to what the verification panel actually renders so it stays
// independent of internal API additions.

export type PermitState = "KS" | "WI" | "NE" | "MO";

export type RouteLegKind =
  | "origin"
  | "destination"
  | "highway"
  | "ramp"
  | "exit"
  | "turn"
  | "milepost"
  | "instruction"
  | "border";

export interface RouteLeg {
  index: number;
  kind: RouteLegKind;
  text: string;
}

export interface ParsedPermit {
  state: PermitState;
  permitNumber: string;
  origin: string;
  destination: string;
  legs: RouteLeg[];
}

export type DecisionSeverity = "info" | "warning" | "blocker";
export type DecisionOutcome = "approve" | "verify" | "reject";

export interface DecisionFinding {
  ruleId: string;
  severity: DecisionSeverity;
  legIndex: number;
  message: string;
}

export interface LegConfidence {
  legIndex: number;
  confidence: number;
  placeId?: string;
  note?: string;
}

export interface RouterDecision {
  state: PermitState;
  outcome: DecisionOutcome;
  findings: DecisionFinding[];
  legs: LegConfidence[];
  overallConfidence: number;
  permitNumber: string;
}

export interface VerifyResponse {
  state: PermitState;
  permit: ParsedPermit;
  decision: RouterDecision;
}

export type VerifyHeaders = Record<string, string>;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Call /v1/permits/verify on the jalopermit-api service. The verification
 * panel uses this in "live" mode; tests pass an injected fetch implementation.
 */
export async function verifyPermit(
  text: string,
  headers: VerifyHeaders = {},
  fetchImpl: typeof fetch = fetch,
): Promise<VerifyResponse> {
  const res = await fetchImpl(`${API_BASE}/v1/permits/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new VerifyError(errBody.error ?? `verify failed: ${res.status}`, res.status);
  }
  return (await res.json()) as VerifyResponse;
}

export class VerifyError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "VerifyError";
    this.status = status;
  }
}
