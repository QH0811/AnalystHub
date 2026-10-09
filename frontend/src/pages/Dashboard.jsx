import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Table2,
  BarChart3,
  CalendarDays,
  ArrowRight,
  Upload,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/analysis`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.detail || data.error || "Unable to load dataset."
        );
      }

      setDataset(data);
    } catch (err) {
      setDataset(null);
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const columns = Array.isArray(dataset?.column_info)
    ? dataset.column_info
    : [];

  function getType(column) {
    const type = String(
      column.type || column.data_type || column.dtype || ""
    ).toLowerCase();

    if (/date|time|timestamp/.test(type)) return "date";
    if (/bool/.test(type)) return "boolean";
    if (/int|float|double|decimal|numeric/.test(type)) {
      return "numeric";
    }
    if (/object|string|category/.test(type)) {
      return "categorical";
    }

    return "other";
  }

  const numericCount = columns.filter(
    (column) => getType(column) === "numeric"
  ).length;

  const dateCount = columns.filter(
    (column) => getType(column) === "date"
  ).length;

  const categoryCount = columns.filter(
    (column) => getType(column) === "categorical"
  ).length;

  const number = (value) =>
    value == null ? "—" : Number(value).toLocaleString();

  return (
    <div className="home-dashboard">
      <header className="home-dashboard-header">
        <div>
          <span className="home-eyebrow">WORKSPACE</span>
          <h1>Dashboard</h1>
          <p>
            Welcome to AnalystHub. Your data workspace at a glance.
          </p>
        </div>

        <button
          className="home-button secondary"
          onClick={loadDashboard}
          disabled={loading}
          type="button"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {/* Welcome panel */}
      <section className="home-welcome">
        <div>
          <span className="home-welcome-label">
            YOUR DATA WORKSPACE
          </span>
          <h2>Turn your data into useful insights.</h2>
          <p>
            Upload a dataset, understand its quality, and explore
            patterns through interactive analysis.
          </p>

          <div className="home-welcome-actions">
            <button
              className="home-button primary"
              onClick={() => navigate("/dataset")}
              type="button"
            >
              <Upload size={16} />
              Manage Dataset
            </button>

            <button
              className="home-button welcome-secondary"
              onClick={() => navigate("/analysis")}
              type="button"
            >
              Explore Analysis
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className="home-welcome-icon">
          <BarChart3 size={60} />
        </div>
      </section>

      {loading && (
        <div className="home-state">
          <RefreshCw size={18} />
          Loading workspace information...
        </div>
      )}

      {!loading && error && (
        <section className="home-error">
          <strong>Unable to load dataset information</strong>
          <p>{error}</p>
          <p>
            Upload a dataset or check that your FastAPI backend is running.
          </p>
          <button
            className="home-button primary"
            onClick={() => navigate("/dataset")}
            type="button"
          >
            Open Dataset
          </button>
        </section>
      )}

      {!loading && dataset && (
        <>
          {/* Live dataset metrics */}
          <section className="home-section">
            <div className="home-section-heading">
              <div>
                <h2>Dataset Summary</h2>
                <p>Information from your current dataset.</p>
              </div>
              <Database size={21} />
            </div>

            <div className="home-metric-grid">
              <MetricCard
                icon={<Database size={20} />}
                label="Total Records"
                value={number(dataset.rows)}
                description="Rows in the dataset"
              />

              <MetricCard
                icon={<Table2 size={20} />}
                label="Total Columns"
                value={number(dataset.columns ?? columns.length)}
                description="Available variables"
              />

              <MetricCard
                icon={<Activity size={20} />}
                label="Numeric Columns"
                value={number(numericCount)}
                description="Suitable for calculations"
              />

              <MetricCard
                icon={<CalendarDays size={20} />}
                label="Date Columns"
                value={number(dateCount)}
                description="Suitable for time analysis"
              />
            </div>
          </section>

          {/* Dataset information */}
          <section className="home-section home-dataset-panel">
            <div className="home-section-heading">
              <div className="home-heading-icon">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2>Current Dataset</h2>
                <p>Review your dataset before analysing it.</p>
              </div>
              <span className="home-status">
                <CheckCircle2 size={13} />
                Loaded
              </span>
            </div>

            <div className="home-dataset-information">
              <div>
                <span>Dataset name</span>
                <strong>
                  {dataset.filename || "Current Dataset"}
                </strong>
              </div>

              <div>
                <span>Records</span>
                <strong>{number(dataset.rows)}</strong>
              </div>

              <div>
                <span>Variables</span>
                <strong>{number(dataset.columns ?? columns.length)}</strong>
              </div>

              <div>
                <span>Categorical columns</span>
                <strong>{number(categoryCount)}</strong>
              </div>
            </div>

            <div className="home-dataset-actions">
              <button
                className="home-button secondary"
                onClick={() => navigate("/profile")}
                type="button"
              >
                View Data Profile
                <ArrowRight size={14} />
              </button>

              <button
                className="home-button primary"
                onClick={() => navigate("/analysis")}
                type="button"
              >
                Start Analysis
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </>
      )}

      {/* Navigation shortcuts */}
      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <h2>Quick Access</h2>
            <p>Go directly to the tools you need.</p>
          </div>
        </div>

        <div className="home-quick-grid">
          <QuickCard
            icon={<Upload size={21} />}
            title="Dataset"
            description="Upload and preview CSV or Excel data."
            onClick={() => navigate("/dataset")}
          />

          <QuickCard
            icon={<Activity size={21} />}
            title="Data Profile"
            description="Inspect column types and data quality."
            onClick={() => navigate("/profile")}
          />

          <QuickCard
            icon={<CheckCircle2 size={21} />}
            title="Data Cleaning"
            description="Review and clean your dataset."
            onClick={() => navigate("/cleaning")}
          />

          <QuickCard
            icon={<BarChart3 size={21} />}
            title="Analysis"
            description="Build charts and compare variables."
            onClick={() => navigate("/analysis")}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, description }) {
  return (
    <article className="home-metric-card">
      <div className="home-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

function QuickCard({ icon, title, description, onClick }) {
  return (
    <button
      className="home-quick-card"
      onClick={onClick}
      type="button"
    >
      <div className="home-quick-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
      <span>
        Open tool <ArrowRight size={14} />
      </span>
    </button>
  );
}

export default Dashboard;