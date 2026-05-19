import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";

import { RouteVerificationPanel } from "@/components/RouteVerificationPanel";
import type { ParsedPermit, RouterDecision, VerifyResponse } from "@/lib/permits";

const PERMIT: ParsedPermit = {
  state: "KS",
  permitNumber: "26035914",
  origin: "Topeka, KS",
  destination: "Salina, KS",
  legs: [
    { index: 0, kind: "origin", text: "Topeka, KS" },
    { index: 1, kind: "highway", text: "I-70 westbound from Topeka" },
    { index: 2, kind: "exit", text: "Exit 244 onto US-77 northbound" },
    { index: 3, kind: "destination", text: "Salina, KS" },
  ],
};

function buildDecision(overrides: Partial<RouterDecision> = {}): RouterDecision {
  return {
    state: "KS",
    outcome: "approve",
    findings: [],
    legs: PERMIT.legs.map((leg) => ({ legIndex: leg.index, confidence: 1 })),
    overallConfidence: 1,
    permitNumber: "26035914",
    ...overrides,
  };
}

function buildResponse(decision?: RouterDecision): VerifyResponse {
  return { state: "KS", permit: PERMIT, decision: decision ?? buildDecision() };
}

describe("RouteVerificationPanel", () => {
  it("renders panel container with the seeded permit text", () => {
    render(<RouteVerificationPanel defaultText="initial-permit" />);
    expect(screen.getByTestId("route-verification-panel")).toBeDefined();
    const textarea = screen.getByTestId("permit-text-input") as HTMLTextAreaElement;
    expect(textarea.value).toBe("initial-permit");
  });

  it("invokes the injected verifier on click and renders the approve outcome", async () => {
    const verifier = vi.fn(() => Promise.resolve(buildResponse()));
    render(<RouteVerificationPanel defaultText="text" verifier={verifier} />);
    fireEvent.click(screen.getByTestId("run-verification"));
    await waitFor(() =>
      expect(screen.getByTestId("decision-summary")).toBeDefined(),
    );
    const outcome = screen.getByTestId("decision-outcome");
    expect(outcome.textContent?.toLowerCase()).toBe("approve");
    expect(verifier).toHaveBeenCalledOnce();
    expect(verifier).toHaveBeenCalledWith("text");
  });

  it("renders all legs red when confidence is 0", async () => {
    const verifier = vi.fn(() =>
      Promise.resolve(
        buildResponse(
          buildDecision({
            outcome: "verify",
            overallConfidence: 0,
            legs: PERMIT.legs.map((leg) => ({
              legIndex: leg.index,
              confidence: 0,
              note: "Maps unavailable.",
            })),
          }),
        ),
      ),
    );
    render(<RouteVerificationPanel defaultText="text" verifier={verifier} />);
    fireEvent.click(screen.getByTestId("run-verification"));
    await waitFor(() => expect(screen.getByTestId("legs-table")).toBeDefined());
    const table = screen.getByTestId("legs-table");
    const rows = within(table).getAllByTestId(/leg-row-/);
    expect(rows.length).toBe(PERMIT.legs.length);
    for (const row of rows) {
      expect(row.getAttribute("data-confidence")).toBe("0");
    }
    expect(screen.getByTestId("decision-outcome").textContent?.toLowerCase()).toBe("verify");
  });

  it("shows the error banner when the verifier rejects", async () => {
    const verifier = vi.fn(() => Promise.reject(new Error("api unavailable")));
    render(<RouteVerificationPanel defaultText="text" verifier={verifier} />);
    fireEvent.click(screen.getByTestId("run-verification"));
    await waitFor(() => expect(screen.getByTestId("parse-error")).toBeDefined());
    expect(screen.getByTestId("parse-error").textContent).toContain("api unavailable");
  });

  it("toggling overlay removes weigh-station markers from the map", async () => {
    const verifier = vi.fn(() => Promise.resolve(buildResponse()));
    const { container } = render(
      <RouteVerificationPanel defaultText="text" verifier={verifier} />,
    );
    fireEvent.click(screen.getByTestId("run-verification"));
    await waitFor(() => expect(screen.getByTestId("legs-table")).toBeDefined());
    const stationsBefore = container.querySelectorAll(
      "[data-testid^='weigh-station-']",
    );
    expect(stationsBefore.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId("overlay-toggle"));
    const stationsAfter = container.querySelectorAll(
      "[data-testid^='weigh-station-']",
    );
    expect(stationsAfter.length).toBe(0);
  });

  it("disables Verify button when the textarea is empty", () => {
    render(<RouteVerificationPanel defaultText="" />);
    const btn = screen.getByTestId("run-verification") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
