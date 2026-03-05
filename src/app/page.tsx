"use client";

import { useEffect, useState } from "react";

type ClassificationResult = {
  itemName: string;
  normalizedName: string;
  category: string;
  instructions: string;
};

type WeeklyReport = {
  generatedAt: string;
  totalClassifications: number;
  perCategory: Record<string, number>;
  mostCommonItem?: {
    itemName: string;
    count: number;
    category: string;
  };
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  async function classify() {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please type the name or type of a waste item.");
      setResult(null);
      return;
    }

    setIsClassifying(true);
    setError(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.message ??
          "We couldn’t classify that item. Please check the spelling or try a similar name.";
        setError(message);
        setResult(null);
      } else {
        const data = (await response.json()) as { result: ClassificationResult };
        setResult(data.result);
        setError(null);
        void loadWeeklyReport();
      }
    } catch {
      setError(
        "Something went wrong while processing your request. Please try again."
      );
      setResult(null);
    } finally {
      setIsClassifying(false);
    }
  }

  async function loadWeeklyReport() {
    try {
      setIsLoadingReport(true);
      const response = await fetch("/api/reports/weekly");
      if (!response.ok) return;
      const data = (await response.json()) as { report: WeeklyReport };
      setReport(data.report);
    } catch {
      // Report is optional for the user interface; ignore errors here.
    } finally {
      setIsLoadingReport(false);
    }
  }

  useEffect(() => {
    void loadWeeklyReport();
  }, []);

  const categoryBadges = [
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Organic",
    "Electronic",
  ];

  return (
    <>
      <section className="card">
        <div className="section-title-row">
          <div>
            <h2>Classify a waste item</h2>
            <p>
              Type what you are throwing away (for example:{" "}
              <strong>plastic bottle</strong>, <strong>battery</strong>,{" "}
              <strong>banana peel</strong>). You will immediately see the
              category and how to dispose of it correctly.
            </p>
          </div>
        </div>

        <label className="field-label" htmlFor="waste-input">
          Waste item name or type
        </label>
        <input
          id="waste-input"
          className="text-input"
          placeholder="e.g. plastic bottle, cardboard box, phone charger…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void classify();
            }
          }}
        />
        <button
          type="button"
          className="primary-button"
          onClick={() => classify()}
          disabled={isClassifying}
        >
          {isClassifying ? "Classifying…" : "Classify waste"}
        </button>

        {result && (
          <div className="inline-message inline-success">
            <div className="pill" style={{ marginBottom: "0.35rem" }}>
              <span className="pill-dot" />
              Classified successfully
            </div>
            <div style={{ fontWeight: 600 }}>{result.itemName}</div>
            <div style={{ marginTop: "0.25rem" }}>
              Category:{" "}
              <span style={{ fontWeight: 600 }}>{result.category}</span>
            </div>
            <div style={{ marginTop: "0.25rem" }}>{result.instructions}</div>
          </div>
        )}

        {error && (
          <div className="inline-message inline-error">
            <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
              We could not find that item.
            </div>
            <div>{error}</div>
            <div style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}>
              Try:
              <ul style={{ marginTop: "0.2rem", paddingLeft: "1.1rem" }}>
                <li>Checking the spelling of the item name.</li>
                <li>
                  Using a more general description like “glass jar” or “metal
                  can”.
                </li>
                <li>
                  Asking an administrator to add this item to the database for
                  future users.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="badge-row">
          {categoryBadges.map((cat) => (
            <span
              key={cat}
              className={`badge ${
                result?.category === cat ? "badge-strong" : ""
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      <aside className="card">
        <div className="section-title-row">
          <div>
            <h2>Weekly sorting summary</h2>
            <p>
              Every successful classification is recorded locally. This panel
              shows how many items were sorted in the last 7 days.
            </p>
          </div>
          <small>
            {isLoadingReport
              ? "Loading…"
              : report?.generatedAt
              ? "Updated just now"
              : "No data yet"}
          </small>
        </div>

        {report && report.totalClassifications > 0 ? (
          <>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Items classified</div>
                <div className="metric-value">
                  {report.totalClassifications}
                </div>
                <div className="metric-sub">Last 7 days</div>
              </div>
              {report.mostCommonItem && (
                <div className="metric-card">
                  <div className="metric-label">Most common item</div>
                  <div className="metric-value">
                    {report.mostCommonItem.itemName}
                  </div>
                  <div className="metric-sub">
                    {report.mostCommonItem.count}× •{" "}
                    {report.mostCommonItem.category}
                  </div>
                </div>
              )}
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.perCategory).map(
                  ([category, count]) => (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{count}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </>
        ) : (
          <div className="inline-message inline-success">
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              Ready when you are.
            </div>
            <div>
              As soon as you classify your first item, a weekly report will
              appear here, highlighting how you sort waste by category.
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

