import { useNavigate } from "react-router-dom";
import {
  ChartNoAxesCombined,
  ArrowRight,
  Database,
  BarChart3,
} from "lucide-react";

function Dashboards() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ marginBottom: "28px" }}>
        <span
          style={{
            color: "#64748b",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1.5px",
          }}
        >
          ANALYTICS WORKSPACE
        </span>

        <h1 style={{ margin: "10px 0", fontSize: "30px" }}>
          Dashboards
        </h1>

        <p style={{ color: "var(--text-secondary, #64748b)" }}>
          Explore your data through visual summaries and charts.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        <section
          style={{
            padding: "24px",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "16px",
            background: "var(--card-bg, #ffffff)",
          }}
        >
          <Database size={26} color="#6366f1" />

          <h3>Dataset Overview</h3>

          <p>
            Review the structure and statistics of your current dataset.
          </p>

          <button onClick={() => navigate("/profile")}>
            Explore dataset <ArrowRight size={15} />
          </button>
        </section>

        <section
          style={{
            padding: "24px",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "16px",
            background: "var(--card-bg, #ffffff)",
          }}
        >
          <BarChart3 size={26} color="#10b981" />

          <h3>Data Analysis</h3>

          <p>
            Choose columns and create visualizations from your data.
          </p>

          <button onClick={() => navigate("/analysis")}>
            Start analysis <ArrowRight size={15} />
          </button>
        </section>

        <section
          style={{
            padding: "24px",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "16px",
            background: "var(--card-bg, #ffffff)",
          }}
        >
          <ChartNoAxesCombined size={26} color="#a855f7" />

          <h3>Coming Next</h3>

          <p>
            Build interactive KPI cards and charts using your selected dataset.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Dashboards;