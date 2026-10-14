
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Database,
  Rows3,
  Columns3,
  Upload,
  ChartNoAxesCombined,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CircleAlert,
} from "lucide-react";

import "../App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const DEFAULT_PROFILE = {
  fullName: "Qian Han",
  jobTitle: "Data Analyst",
};

function readProfile() {
  try {
    const saved = localStorage.getItem("analysthub-profile");

    return saved
      ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) }
      : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function Overview() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(readProfile);

  // Refresh the welcome name when My Profile is updated.
  useEffect(() => {
    function updateProfile() {
      setProfile(readProfile());
    }

    window.addEventListener(
      "analysthub-profile-updated",
      updateProfile
    );

    window.addEventListener("storage", updateProfile);

    return () => {
      window.removeEventListener(
        "analysthub-profile-updated",
        updateProfile
      );

      window.removeEventListener("storage", updateProfile);
    };
  }, []);

  const firstName =
    profile.fullName?.trim().split(/\s+/)[0] || "there";

  // Load dataset information from the FastAPI backend.
  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/analysis`);

      if (!response.ok) {
        throw new Error("Unable to load dataset information.");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the AnalystHub API."
      );

      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Safely handle dataset column information.
  const columns = Array.isArray(data?.column_info)
    ? data.column_info
    : [];

  const getColumnType = (column) =>
    String(
      column.type || column.data_type || column.dtype || ""
    ).toLowerCase();

  const numericColumns = columns.filter((column) =>
    /int|float|double|numeric|decimal/.test(
      getColumnType(column)
    )
  );

  const categoricalColumns = columns.filter((column) => {
    const type = getColumnType(column);

    return (
      type === "object" ||
      type === "category" ||
      type === "categorical" ||
      type.includes("string")
    );
  });

  const otherColumns = Math.max(
    0,
    columns.length -
      numericColumns.length -
      categoricalColumns.length
  );

  // Overview KPI cards.
  const stats = [
    {
      label: "Total Rows",
      value: data?.rows,
      icon: Rows3,
      color: "blue",
      description: "Records in current dataset",
    },
    {
      label: "Total Columns",
      value: data?.columns,
      icon: Columns3,
      color: "purple",
      description: "Available data fields",
    },
    {
      label: "Numeric Fields",
      value: numericColumns.length,
      icon: ChartNoAxesCombined,
      color: "green",
      description: "Fields for calculations",
    },
    {
      label: "Categorical Fields",
      value: categoricalColumns.length,
      icon: Database,
      color: "orange",
      description: "Fields for grouping",
    },
  ];

  // Quick-access workspace tools.
  const tools = [
    {
      title: "Explore Dataset",
      description:
        "Inspect columns, data types and missing values.",
      icon: Database,
      color: "blue",
      path: "/profile",
    },
    {
      title: "Clean Data",
      description:
        "Prepare data for more reliable analysis.",
      icon: Sparkles,
      color: "green",
      path: "/cleaning",
    },
    {
      title: "View Dashboards",
      description:
        "Explore KPI cards and interactive charts.",
      icon: ChartNoAxesCombined,
      color: "purple",
      path: "/dashboards",
    },
    {
      title: "Create Visualizations",
      description:
        "Select columns and build your own charts.",
      icon: ChartNoAxesCombined,
      color: "blue",
      path: "/analysis",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* PAGE HEADING */}
      <header className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            YOUR WORKSPACE
          </span>

          <h1>Welcome, {firstName}!</h1>

          <p>
            Your overview of datasets, data quality and analytical
            activities.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </header>

      {/* HERO BANNER */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="hero-label">
            <Sparkles size={14} />
            YOUR DATA WORKSPACE
          </span>

          <h2>
            Turn your data
            <br />
            into{" "}
            <span className="hero-highlight">
              actionable insights.
            </span>
          </h2>

          <p>
            Upload a dataset, understand its structure, clean your
            data and discover useful patterns — all in one workspace.
          </p>

          <div className="hero-actions">
            <button
              className="hero-primary"
              onClick={() => navigate("/dataset")}
            >
              <Upload size={16} />
              Upload Dataset
            </button>

            <button
              className="hero-secondary"
              onClick={() => navigate("/analysis")}
            >
              Start Analysis
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Decorative analytics illustration */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-glow" />

          <div className="hero-chart-window">
            <div className="hero-window-top">
              <div className="hero-window-dots">
                <span />
                <span />
                <span />
              </div>

              <span className="hero-window-title">
                ANALYTICS OVERVIEW
              </span>
            </div>

            <div className="hero-chart-content">
              <div className="hero-chart-heading">
                <div>
                  <span className="hero-chart-caption">
                    Performance
                  </span>

                  <strong>Data Insights</strong>
                </div>

                <span className="hero-chart-badge">
                  <ChartNoAxesCombined size={14} />
                </span>
              </div>

              <div className="hero-chart-area">
                <div className="hero-chart-y-axis">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                </div>

                <div className="hero-chart-bars">
                  {[36, 52, 43, 72, 59, 86, 68, 96].map(
                    (height, index) => (
                      <span
                        key={index}
                        className={
                          index === 5
                            ? "hero-bar hero-bar-highlight"
                            : "hero-bar"
                        }
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="hero-chart-footer">
                <span>
                  <i className="hero-legend-dot" />
                  Dataset performance
                </span>

                <strong>+ Insights</strong>
              </div>
            </div>
          </div>

          <div className="hero-floating-card hero-floating-top">
            <span className="hero-floating-icon">
              <Database size={17} />
            </span>

            <div>
              <small>DATASET</small>
              <strong>Ready to explore</strong>
            </div>

            <span className="hero-status-dot" />
          </div>

          <div className="hero-floating-card hero-floating-bottom">
            <span className="hero-pie-icon">
              <ChartNoAxesCombined size={19} />
            </span>

            <div>
              <small>YOUR WORKSPACE</small>
              <strong>Insights made simple</strong>
            </div>
          </div>
        </div>
      </section>

      {/* DATASET OVERVIEW */}
      <div className="section-heading">
        <div>
          <h2>Dataset Overview</h2>
          <p>Statistics from your current dataset</p>
        </div>

        <button
          className="text-action"
          onClick={() => navigate("/dataset")}
        >
          Manage Dataset
          <ArrowRight size={15} />
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="dashboard-message">
          <CircleAlert size={19} />

          <div>
            <strong>Dataset information unavailable</strong>
            <p>{error}</p>

            <button onClick={loadDashboard}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* KPI STATISTICS */}
      <div className="dashboard-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="dashboard-stat-card"
              key={stat.label}
            >
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={21} />
              </div>

              <div className="stat-content">
                <span>{stat.label}</span>

                <strong>
                  {loading
                    ? "..."
                    : stat.value == null
                    ? "—"
                    : Number(stat.value).toLocaleString()}
                </strong>

                <p>{stat.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* LOWER OVERVIEW PANELS */}
      <div className="dashboard-lower-grid">
        {/* CURRENT DATASET PANEL */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Current Dataset</h2>
              <p>Your active data workspace</p>
            </div>

            <span className="panel-icon">
              <Database size={19} />
            </span>
          </div>

          {loading ? (
            <div className="dataset-empty">
              Loading dataset information...
            </div>
          ) : data && !error ? (
            <>
              <div className="dataset-summary">
                <div>
                  <span>Total Rows</span>
                  <strong>
                    {Number(data.rows ?? 0).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Total Columns</span>
                  <strong>
                    {Number(data.columns ?? 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="column-section">
                <h3>Column Types</h3>

                <div className="column-type-row">
                  <span>
                    <i className="type-dot numeric-dot" />
                    Numeric
                  </span>
                  <strong>{numericColumns.length}</strong>
                </div>

                <div className="column-type-row">
                  <span>
                    <i className="type-dot categorical-dot" />
                    Categorical
                  </span>
                  <strong>{categoricalColumns.length}</strong>
                </div>

                <div className="column-type-row">
                  <span>
                    <i className="type-dot other-dot" />
                    Other types
                  </span>
                  <strong>{otherColumns}</strong>
                </div>
              </div>

              <button
                className="panel-footer-action"
                onClick={() => navigate("/profile")}
              >
                View Full Data Profile
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <div className="dataset-empty">
              <div className="empty-icon">
                <Upload size={24} />
              </div>

              <h3>No Dataset Available</h3>

              <p>
                Upload a CSV or Excel file to start exploring your data.
              </p>

              <button
                className="hero-primary"
                onClick={() => navigate("/dataset")}
              >
                Upload Dataset
              </button>
            </div>
          )}
        </section>

        {/* WORKSPACE TOOLS PANEL */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Workspace Tools</h2>
              <p>Choose your next step</p>
            </div>
          </div>

          <div className="workspace-tools">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <button
                  className="workspace-tool"
                  key={tool.title}
                  onClick={() => navigate(tool.path)}
                >
                  <span className={`tool-icon ${tool.color}`}>
                    <Icon size={20} />
                  </span>

                  <span className="tool-copy">
                    <strong>{tool.title}</strong>
                    <small>{tool.description}</small>
                  </span>

                  <ArrowRight
                    className="tool-arrow"
                    size={17}
                  />
                </button>
              );
            })}
          </div>

          <div className="workspace-tip">
            <Sparkles size={18} />

            <div>
              <strong>Suggested Workflow</strong>
              <p>
                Explore your data first, clean it, then analyse it
                using charts and dashboards.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Overview;
