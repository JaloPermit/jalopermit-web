import { RouteVerificationPanel } from "@/components/RouteVerificationPanel";

export const dynamic = "force-dynamic";

const SAMPLE_TEXT = [
  "K-TRIPS Oversize/Overweight Permit",
  "Kansas Department of Transportation",
  "",
  "Permit #: 26035914",
  "Origin: Topeka, KS",
  "Destination: Salina, KS",
  "Route:",
  "  I-70 westbound from Topeka",
  "  Exit 244 onto US-77 northbound",
  "  Merge ramp onto K-18",
  "  Continue to MP 12 outside Salina",
  "",
  "Issued: 2026-04-12",
].join("\n");

export default function VerifyPage() {
  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#0f172a",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ margin: 0 }}>Route Verification Panel</h1>
      <p style={{ color: "#475569" }}>
        Paste permit text, run verification, and confirm every leg against
        Google Maps. Legs the router cannot resolve are flagged in red for
        explicit trucker verification.
      </p>
      <RouteVerificationPanel defaultText={SAMPLE_TEXT} />
    </main>
  );
}
