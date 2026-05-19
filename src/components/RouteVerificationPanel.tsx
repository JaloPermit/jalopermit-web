"use client";

import { useMemo, useState } from "react";
import {
  VerifyError,
  verifyPermit,
  type LegConfidence,
  type ParsedPermit,
  type RouterDecision,
  type VerifyResponse,
} from "@/lib/permits";
import {
  getNearbyWeighStations,
  getWeighStationsForState,
} from "@/lib/weighStations";

interface PanelProps {
  /** Initial textarea contents — useful for the demo page seed. */
  defaultText?: string;
  /** Optional injectable verifier — tests pass a stub. */
  verifier?: (text: string) => Promise<VerifyResponse>;
  /** Default tenant headers — page can set fleet/admin/etc. */
  tenantHeaders?: Record<string, string>;
}

interface PanelState {
  permit: ParsedPermit | null;
  decision: RouterDecision | null;
  error: string | null;
  loading: boolean;
}

function colorForConfidence(confidence: number): string {
  if (confidence === 0) return "#dc2626";
  if (confidence < 0.7) return "#f59e0b";
  return "#16a34a";
}

function colorForOutcome(outcome: RouterDecision["outcome"]): string {
  if (outcome === "approve") return "#16a34a";
  if (outcome === "verify") return "#f59e0b";
  return "#dc2626";
}

export function RouteVerificationPanel({
  defaultText = "",
  verifier,
  tenantHeaders = { "X-Tenant-Id": "demo-tenant", "X-Tenant-Role": "fleet" },
}: PanelProps) {
  const [permitText, setPermitText] = useState<string>(defaultText);
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(true);
  const [state, setState] = useState<PanelState>({
    permit: null,
    decision: null,
    error: null,
    loading: false,
  });

  const weighStations = useMemo(() => {
    if (!state.permit) return [];
    const labels = state.permit.legs.map((leg) => leg.text);
    const nearby = getNearbyWeighStations(state.permit.state, labels);
    if (nearby.length > 0) return nearby;
    return getWeighStationsForState(state.permit.state);
  }, [state.permit]);

  async function runVerification(): Promise<void> {
    setState({ permit: null, decision: null, error: null, loading: true });
    try {
      const out = await (verifier
        ? verifier(permitText)
        : verifyPermit(permitText, tenantHeaders));
      setState({ permit: out.permit, decision: out.decision, error: null, loading: false });
    } catch (err) {
      const message =
        err instanceof VerifyError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Verification failed.";
      setState({ permit: null, decision: null, error: message, loading: false });
    }
  }

  return (
    <section
      data-testid="route-verification-panel"
      style={{ marginTop: "1.5rem", color: "#0f172a" }}
    >
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label
            htmlFor="permit-text"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Permit text
          </label>
          <textarea
            id="permit-text"
            value={permitText}
            onChange={(e) => setPermitText(e.target.value)}
            rows={14}
            data-testid="permit-text-input"
            style={{
              width: "100%",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
            }}
          />
          <div style={{ marginTop: "0.5rem" }}>
            <label>
              <input
                type="checkbox"
                checked={overlayEnabled}
                onChange={(e) => setOverlayEnabled(e.target.checked)}
                data-testid="overlay-toggle"
              />{" "}
              Weigh-station overlay
            </label>
          </div>
          <button
            type="button"
            onClick={() => void runVerification()}
            disabled={state.loading || permitText.trim().length === 0}
            data-testid="run-verification"
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: state.loading ? "#475569" : "#0f172a",
              color: "#fff",
              borderRadius: 6,
              border: "none",
              cursor: state.loading ? "wait" : "pointer",
            }}
          >
            {state.loading ? "Verifying…" : "Verify route"}
          </button>
        </div>

        <div>
          <h2 style={{ marginTop: 0 }}>Decision</h2>
          {state.error && (
            <div
              role="alert"
              data-testid="parse-error"
              style={{
                background: "#fee2e2",
                color: "#7f1d1d",
                padding: "0.75rem",
                borderRadius: 6,
                marginBottom: "0.75rem",
              }}
            >
              {state.error}
            </div>
          )}
          {state.decision && (
            <div data-testid="decision-summary">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  data-testid="decision-outcome"
                  style={{
                    background: colorForOutcome(state.decision.outcome),
                    color: "#fff",
                    padding: "0.2rem 0.6rem",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {state.decision.outcome}
                </span>
                <span style={{ color: "#475569" }}>
                  State {state.decision.state} · Confidence{" "}
                  <strong>
                    {(state.decision.overallConfidence * 100).toFixed(0)}%
                  </strong>
                </span>
              </div>
              <ul data-testid="findings-list" style={{ paddingLeft: 18 }}>
                {state.decision.findings.length === 0 && (
                  <li style={{ color: "#16a34a" }}>No rule findings.</li>
                )}
                {state.decision.findings.map((finding, idx) => (
                  <li
                    key={idx}
                    style={{
                      color:
                        finding.severity === "blocker"
                          ? "#dc2626"
                          : finding.severity === "warning"
                            ? "#92400e"
                            : "#475569",
                    }}
                  >
                    <strong>{finding.severity}</strong> — {finding.message}{" "}
                    <span style={{ color: "#94a3b8" }}>({finding.ruleId})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 style={{ marginTop: "1.25rem" }}>Map</h2>
          <div
            data-testid="route-map"
            style={{
              position: "relative",
              height: 220,
              background: "linear-gradient(135deg, #e0f2fe, #ecfccb)",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              overflow: "hidden",
            }}
          >
            {state.decision?.legs.map((leg) => (
              <span
                key={leg.legIndex}
                data-testid={`leg-marker-${leg.legIndex}`}
                title={`Leg ${leg.legIndex}: ${(leg.confidence * 100).toFixed(0)}%`}
                style={{
                  position: "absolute",
                  left: `${4 + ((leg.legIndex * 7) % 90)}%`,
                  top: `${10 + ((leg.legIndex * 11) % 70)}%`,
                  width: 12,
                  height: 12,
                  borderRadius: 99,
                  background: colorForConfidence(leg.confidence),
                  border: "2px solid #fff",
                }}
              />
            ))}
            {overlayEnabled &&
              weighStations.map((station) => (
                <span
                  key={station.id}
                  data-testid={`weigh-station-${station.id}`}
                  title={station.name}
                  style={{
                    position: "absolute",
                    left: `${station.x * 100}%`,
                    top: `${station.y * 100}%`,
                    width: 14,
                    height: 14,
                    border: "2px solid #1d4ed8",
                    borderRadius: 4,
                    background: "#dbeafe",
                  }}
                />
              ))}
          </div>
        </div>
      </div>

      {state.decision && state.permit && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Route legs</h2>
          <table
            data-testid="legs-table"
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                <th style={{ padding: "0.4rem" }}>#</th>
                <th style={{ padding: "0.4rem" }}>Kind</th>
                <th style={{ padding: "0.4rem" }}>Text</th>
                <th style={{ padding: "0.4rem" }}>Confidence</th>
                <th style={{ padding: "0.4rem" }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {state.permit.legs.map((leg) => {
                const conf: LegConfidence | undefined = state.decision!.legs[leg.index];
                const confidence = conf?.confidence ?? 0;
                const color = colorForConfidence(confidence);
                const isRed = confidence === 0;
                return (
                  <tr
                    key={leg.index}
                    data-testid={`leg-row-${leg.index}`}
                    data-confidence={confidence}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: isRed ? "#fef2f2" : undefined,
                    }}
                  >
                    <td style={{ padding: "0.4rem" }}>{leg.index}</td>
                    <td style={{ padding: "0.4rem" }}>{leg.kind}</td>
                    <td style={{ padding: "0.4rem", fontFamily: "ui-monospace" }}>
                      {leg.text}
                    </td>
                    <td style={{ padding: "0.4rem", color }}>
                      {(confidence * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "0.4rem", color: "#475569" }}>
                      {conf?.note ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
