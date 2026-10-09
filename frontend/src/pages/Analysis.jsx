import { useEffect, useMemo, useState } from "react";
import {
  Database,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  CalendarDays,
  Table2,
  TrendingUp,
  Tag,
  Hash,
  Layers3,
  FileText,
  Activity,
  Search,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
} from "recharts";

import "../App.css";

const API_URL = "http://127.0.0.1:8000";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "visualizations", label: "Visualizations" },
  { id: "statistics", label: "Statistics" },
  { id: "relationships", label: "Relationships" },
  { id: "reports", label: "Reports" },
];

const DEFAULT_FILTERS = {
  dateColumn: "",
  startDate: "",
  endDate: "",
  categoryColumn: "",
  categoryValues: [],
  chartType: "bar",
  xColumn: "",
  yColumn: "",
  aggregation: "sum",
  breakdown: "month",
};

function getColumnName(column) {
  return typeof column === "string" ? column : column?.name || "";
}

function getColumnType(column) {
  const rawType = String(
    column?.type || column?.data_type || column?.dtype || ""
  ).toLowerCase();

  if (/datetime|timestamp|date|time/.test(rawType)) {
    return "date";
  }

  if (/bool/.test(rawType)) {
    return "boolean";
  }

  if (/int|float|double|decimal|numeric/.test(rawType)) {
    return "numeric";
  }

  if (/object|string|category|categorical/.test(rawType)) {
    return "categorical";
  }

  if (
    /(^|[_\s])(date|datetime|timestamp)([_\s]|$)/i.test(
      getColumnName(column)
    )
  ) {
    return "date";
  }

  return "other";
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(value);
}

function getErrorMessage(data, fallback) {
  return data?.detail || data?.error || fallback;
}

function getStatistic(column, keys) {
  for (const key of keys) {
    if (column?.[key] !== undefined && column?.[key] !== null) {
      return column[key];
    }
  }

  return null;
}

function Analysis() {
  const [analysis, setAnalysis] = useState(null);
  const [columns, setColumns] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [yearData, setYearData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const [columnSearch, setColumnSearch] = useState("");
  const [columnTypeFilter, setColumnTypeFilter] = useState("all");
  const [selectedColumn, setSelectedColumn] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Load dataset metadata from FastAPI.
  async function loadDataset() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/analysis`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          getErrorMessage(data, "Unable to load dataset.")
        );
      }

      const availableColumns = Array.isArray(data.column_info)
        ? data.column_info
        : [];

      setAnalysis(data);
      setColumns(availableColumns);

      const dates = availableColumns.filter(
        (column) => getColumnType(column) === "date"
      );

      const numeric = availableColumns.filter(
        (column) => getColumnType(column) === "numeric"
      );

      const categorical = availableColumns.filter(
        (column) => getColumnType(column) === "categorical"
      );

      setFilters((previous) => ({
        ...previous,
        dateColumn:
          previous.dateColumn || getColumnName(dates[0]),
        categoryColumn:
          previous.categoryColumn || getColumnName(categorical[0]),
        xColumn:
          previous.xColumn ||
          getColumnName(dates[0]) ||
          getColumnName(categorical[0]) ||
          getColumnName(availableColumns[0]),
        yColumn:
          previous.yColumn || getColumnName(numeric[0]),
      }));
    } catch (err) {
      setError(err.message || "Unable to load dataset.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDataset();
  }, []);

  const numericColumns = useMemo(
    () =>
      columns.filter(
        (column) => getColumnType(column) === "numeric"
      ),
    [columns]
  );

  const dateColumns = useMemo(
    () =>
      columns.filter(
        (column) => getColumnType(column) === "date"
      ),
    [columns]
  );

  const categoricalColumns = useMemo(
    () =>
      columns.filter(
        (column) => getColumnType(column) === "categorical"
      ),
    [columns]
  );

  const filteredColumns = useMemo(() => {
    const search = columnSearch.trim().toLowerCase();

    return columns.filter((column) => {
      const name = getColumnName(column);
      const type = getColumnType(column);

      return (
        name.toLowerCase().includes(search) &&
        (columnTypeFilter === "all" || type === columnTypeFilter)
      );
    });
  }, [columns, columnSearch, columnTypeFilter]);

  function updateFilter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
      dateColumn: getColumnName(dateColumns[0]),
      categoryColumn: getColumnName(categoricalColumns[0]),
      xColumn:
        getColumnName(dateColumns[0]) ||
        getColumnName(categoricalColumns[0]) ||
        getColumnName(columns[0]),
      yColumn: getColumnName(numericColumns[0]),
    });
  }

  async function generateAnalysis() {
    setAnalyzing(true);
    setError("");

    try {
      const payload = {
        date_column: filters.dateColumn || null,
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        category_column: filters.categoryColumn || null,
        category_values: filters.categoryValues,
        chart_type: filters.chartType,
        x_column: filters.xColumn || null,
        y_column: filters.yColumn || null,
        aggregation: filters.aggregation,
        breakdown: filters.breakdown,
      };

      const response = await fetch(`${API_URL}/analysis/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(
          getErrorMessage(result, "Unable to generate analysis.")
        );
      }

      setSummary(result.summary || {});
      setTrendData(result.trend || []);
      setYearData(result.year_breakdown || []);
      setCategoryData(result.category_breakdown || []);
      setPreviewRows(result.preview || []);
    } catch (err) {
      setError(err.message || "Unable to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  function exportCSV() {
    if (!previewRows.length) {
      setError("No filtered records available to export.");
      return;
    }

    const headers = Object.keys(previewRows[0]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...previewRows.map((row) =>
        headers.map((header) => escapeCSV(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "analysthub-filtered-data.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function exportReport() {
    const report = {
      dataset: analysis?.filename || "Current Dataset",
      filters,
      summary,
      trend: trendData,
      yearlyBreakdown: yearData,
      categoryBreakdown: categoryData,
      previewRecordCount: previewRows.length,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "analysthub-analysis-report.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="analysis-message">
          <RefreshCw size={20} />
          Loading dataset...
        </div>
      </div>
    );
  }

  if (!analysis && error) {
    return (
      <div className="analysis-page">
        <div className="analysis-error">
          <p>{error}</p>
          <button
            type="button"
            className="analysis-button primary"
            onClick={loadDataset}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <div>
          <h1>Analysis</h1>
          <p>
            Explore, visualize and understand your data with
            interactive charts and statistics.
          </p>
        </div>

        <button
          type="button"
          className="analysis-button secondary"
          onClick={loadDataset}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="analysis-top-metrics">
        <Metric
          icon={<Database size={17} />}
          label="Rows"
          value={formatNumber(analysis?.rows)}
        />
        <Metric
          icon={<Layers3 size={17} />}
          label="Columns"
          value={formatNumber(analysis?.columns ?? columns.length)}
        />
        <Metric
          icon={<Hash size={17} />}
          label="Numeric"
          value={numericColumns.length}
        />
        <Metric
          icon={<Tag size={17} />}
          label="Categorical"
          value={categoricalColumns.length}
        />
        <Metric
          icon={<CalendarDays size={17} />}
          label="Date/Time"
          value={dateColumns.length}
        />
      </div>

      <div className="analysis-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "analysis-tab active"
                : "analysis-tab"
            }
            onClick={() => {
              setActiveTab(tab.id);
              setError("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="analysis-inline-error">{error}</div>}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="analysis-tab-page">
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Dataset Overview</h2>
                <p>A summary of your uploaded dataset.</p>
              </div>
              <Database size={22} color="#818cf8" />
            </div>

            <div className="analysis-result-kpis">
              <ResultCard
                icon={<Database size={18} />}
                label="Total Records"
                value={formatNumber(analysis?.rows)}
              />
              <ResultCard
                icon={<Layers3 size={18} />}
                label="Total Columns"
                value={formatNumber(analysis?.columns ?? columns.length)}
              />
              <ResultCard
                icon={<Hash size={18} />}
                label="Numeric Columns"
                value={numericColumns.length}
              />
              <ResultCard
                icon={<CalendarDays size={18} />}
                label="Date Columns"
                value={dateColumns.length}
              />
            </div>
          </section>

          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Available Columns</h2>
                <p>
                  Search, filter and select a column to inspect its details.
                </p>
              </div>
              <Layers3 size={22} color="#818cf8" />
            </div>

            <div className="column-toolbar">
              <div className="column-search-wrap">
                <Search size={16} />
                <input
                  type="search"
                  className="column-search"
                  placeholder="Search columns..."
                  value={columnSearch}
                  onChange={(event) =>
                    setColumnSearch(event.target.value)
                  }
                />
              </div>

              <select
                className="column-type-filter"
                value={columnTypeFilter}
                onChange={(event) =>
                  setColumnTypeFilter(event.target.value)
                }
              >
                <option value="all">All types</option>
                <option value="numeric">Numeric</option>
                <option value="categorical">Categorical</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="other">Other</option>
              </select>
            </div>

            <p className="column-count">
              Showing {filteredColumns.length} of {columns.length} columns
            </p>

            <div className="analysis-column-grid">
              {filteredColumns.map((column) => {
                const name = getColumnName(column);
                const type = getColumnType(column);
                const selected =
                  getColumnName(selectedColumn) === name;

                return (
                  <div
                    key={name}
                    className={`column-card-wrapper ${
                      selected ? "expanded" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={
                        selected
                          ? "analysis-column-item selected"
                          : "analysis-column-item"
                      }
                      onClick={() =>
                        setSelectedColumn(selected ? null : column)
                      }
                      aria-expanded={selected}
                    >
                      <span>{name}</span>
                      <div className="column-card-right">
                        <small>{type}</small>
                        <span className="column-chevron">
                          {selected ? "⌃" : "⌄"}
                        </span>
                      </div>
                    </button>

                    {selected && (
                      <div className="column-dropdown">
                        <div className="column-dropdown-grid">
                          <Detail
                            label="Data type"
                            value={type}
                          />
                          <Detail
                            label="Missing values"
                            value={formatNumber(
                              getStatistic(column, [
                                "missing_values",
                                "missing",
                                "null_count",
                              ])
                            )}
                          />
                          <Detail
                            label="Unique values"
                            value={formatNumber(
                              getStatistic(column, [
                                "unique_values",
                                "unique",
                                "nunique",
                              ])
                            )}
                          />
                          <Detail
                            label="Minimum"
                            value={formatNumber(
                              getStatistic(column, ["min", "minimum"])
                            )}
                          />
                          <Detail
                            label="Maximum"
                            value={formatNumber(
                              getStatistic(column, ["max", "maximum"])
                            )}
                          />
                          <Detail
                            label="Average"
                            value={formatNumber(
                              getStatistic(column, ["mean", "average"])
                            )}
                          />
                        </div>

                        <button
                          type="button"
                          className="analysis-button primary"
                          onClick={() => {
                            setFilters((previous) => ({
                              ...previous,
                              xColumn: name,
                              yColumn:
                                type === "numeric"
                                  ? name
                                  : previous.yColumn,
                            }));

                            setActiveTab("visualizations");
                            setSelectedColumn(null);
                          }}
                        >
                          <BarChart3 size={15} />
                          Use in Analysis
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredColumns.length === 0 && (
              <div className="analysis-empty-table">
                No columns match your search.
              </div>
            )}
          </section>
        </div>
      )}

      {/* VISUALIZATIONS */}
      {activeTab === "visualizations" && (
        <div className="analysis-workspace">
          <aside className="analysis-filter-panel">
            <div className="analysis-panel-title">
              <div className="analysis-title-icon">
                <Filter size={18} />
              </div>
              <div>
                <h2>Analysis Filters</h2>
                <p>Filter and configure your analysis.</p>
              </div>
              <button
                type="button"
                className="analysis-reset"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

            <div className="analysis-filter-section">
              <h3>
                <CalendarDays size={14} />
                Date range <span>(optional)</span>
              </h3>

              <label>Date column</label>
              <select
                value={filters.dateColumn}
                onChange={(event) =>
                  updateFilter("dateColumn", event.target.value)
                }
              >
                <option value="">No date filter</option>
                {dateColumns.map((column) => (
                  <option
                    key={getColumnName(column)}
                    value={getColumnName(column)}
                  >
                    {getColumnName(column)}
                  </option>
                ))}
              </select>

              <div className="analysis-date-grid">
                <div>
                  <label>Start date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) =>
                      updateFilter("startDate", event.target.value)
                    }
                    disabled={!filters.dateColumn}
                  />
                </div>
                <div>
                  <label>End date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) =>
                      updateFilter("endDate", event.target.value)
                    }
                    disabled={!filters.dateColumn}
                  />
                </div>
              </div>
            </div>

            <div className="analysis-filter-section">
              <h3>
                <Tag size={14} />
                Filter by category <span>(optional)</span>
              </h3>

              <label>Category column</label>
              <select
                value={filters.categoryColumn}
                onChange={(event) => {
                  updateFilter("categoryColumn", event.target.value);
                  updateFilter("categoryValues", []);
                }}
              >
                <option value="">No category filter</option>
                {categoricalColumns.map((column) => (
                  <option
                    key={getColumnName(column)}
                    value={getColumnName(column)}
                  >
                    {getColumnName(column)}
                  </option>
                ))}
              </select>

              <p className="analysis-field-hint">
                Category-value selection can be added when the backend
                exposes the available values for each column.
              </p>
            </div>

            <div className="analysis-filter-section">
              <h3>
                <BarChart3 size={14} />
                Chart configuration
              </h3>

              <label>Chart type</label>
              <select
                value={filters.chartType}
                onChange={(event) =>
                  updateFilter("chartType", event.target.value)
                }
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie / Donut Chart</option>
                <option value="histogram">Histogram</option>
                <option value="scatter">Scatter Plot</option>
              </select>

              <div className="analysis-field-grid">
                <div>
                  <label>X-axis column</label>
                  <select
                    value={filters.xColumn}
                    onChange={(event) =>
                      updateFilter("xColumn", event.target.value)
                    }
                  >
                    {columns.map((column) => (
                      <option
                        key={getColumnName(column)}
                        value={getColumnName(column)}
                      >
                        {getColumnName(column)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Y-axis column</label>
                  <select
                    value={filters.yColumn}
                    onChange={(event) =>
                      updateFilter("yColumn", event.target.value)
                    }
                  >
                    <option value="">Count records</option>
                    {numericColumns.map((column) => (
                      <option
                        key={getColumnName(column)}
                        value={getColumnName(column)}
                      >
                        {getColumnName(column)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label>Aggregation method</label>
              <div className="analysis-aggregation-grid">
                {[
                  ["sum", "Sum"],
                  ["mean", "Average"],
                  ["count", "Count"],
                  ["min", "Minimum"],
                  ["max", "Maximum"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      filters.aggregation === value
                        ? "analysis-aggregation active"
                        : "analysis-aggregation"
                    }
                    onClick={() => updateFilter("aggregation", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label>Trend breakdown</label>
              <select
                value={filters.breakdown}
                onChange={(event) =>
                  updateFilter("breakdown", event.target.value)
                }
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            <button
              type="button"
              className="analysis-button primary generate-button"
              onClick={generateAnalysis}
              disabled={analyzing}
            >
              <BarChart3 size={16} />
              {analyzing ? "Generating..." : "Generate Analysis"}
            </button>
          </aside>

          <main className="analysis-results">
            <div className="analysis-result-kpis">
              <ResultCard
                icon={<Database size={18} />}
                label="Total"
                value={formatNumber(summary?.total)}
              />
              <ResultCard
                icon={<Table2 size={18} />}
                label="Records"
                value={formatNumber(summary?.record_count)}
              />
              <ResultCard
                icon={<TrendingUp size={18} />}
                label="Average"
                value={formatNumber(summary?.average)}
              />
              <ResultCard
                icon={<Tag size={18} />}
                label="Unique values"
                value={formatNumber(summary?.unique_categories)}
              />
            </div>

            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <h2>{filters.yColumn || "Record Count"} Trend</h2>
                  <p>
                    {filters.aggregation} by{" "}
                    {filters.xColumn || "selected column"}
                  </p>
                </div>
                <button
                  type="button"
                  className="analysis-button secondary"
                  onClick={exportReport}
                >
                  <Download size={14} />
                  Export Summary
                </button>
              </div>

              <div className="analysis-chart large">
                {trendData.length ? (
                  <ChartRenderer
                    type={filters.chartType}
                    data={trendData}
                    xKey="label"
                    yKey="value"
                  />
                ) : (
                  <EmptyChart message="Choose your filters and generate an analysis." />
                )}
              </div>
            </section>

            <div className="analysis-breakdown-grid">
              <section className="analysis-card">
                <h2>Breakdown by Year</h2>
                <div className="analysis-chart medium">
                  {yearData.length ? (
                    <ChartRenderer
                      type="bar"
                      data={yearData}
                      xKey="label"
                      yKey="value"
                    />
                  ) : (
                    <EmptyChart message="No yearly breakdown available." />
                  )}
                </div>
              </section>

              <section className="analysis-card">
                <h2>Category Breakdown</h2>
                <div className="analysis-chart medium">
                  {categoryData.length ? (
                    <ChartRenderer
                      type="bar"
                      data={categoryData}
                      xKey="label"
                      yKey="value"
                      horizontal
                    />
                  ) : (
                    <EmptyChart message="No category breakdown available." />
                  )}
                </div>
              </section>
            </div>

            <section className="analysis-card">
              <div className="analysis-card-heading">
                <div>
                  <h2>Filtered Data Preview</h2>
                  <p>Showing up to 100 records.</p>
                </div>
                <button
                  type="button"
                  className="analysis-button secondary"
                  onClick={exportCSV}
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
              <DataPreview rows={previewRows} />
            </section>
          </main>
        </div>
      )}

      {/* STATISTICS */}
      {activeTab === "statistics" && (
        <div className="analysis-tab-page">
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Statistical Summary</h2>
                <p>
                  Summary statistics from your generated analysis.
                </p>
              </div>
              <Activity size={22} color="#818cf8" />
            </div>

            <div className="analysis-result-kpis">
              <ResultCard label="Total" value={formatNumber(summary?.total)} />
              <ResultCard label="Average" value={formatNumber(summary?.average)} />
              <ResultCard label="Minimum" value={formatNumber(summary?.minimum)} />
              <ResultCard label="Maximum" value={formatNumber(summary?.maximum)} />
            </div>

            <p className="analysis-note">
              Generate an analysis in Visualizations to refresh these
              results. Statistical values depend on backend support.
            </p>
          </section>
        </div>
      )}

      {/* RELATIONSHIPS */}
      {activeTab === "relationships" && (
        <div className="analysis-tab-page">
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Variable Relationships</h2>
                <p>
                  Explore the numeric columns available for relationship analysis.
                </p>
              </div>
              <TrendingUp size={22} color="#818cf8" />
            </div>

            <div className="analysis-column-grid">
              {numericColumns.map((column) => (
                <div
                  className="analysis-column-item"
                  key={getColumnName(column)}
                >
                  <span>{getColumnName(column)}</span>
                  <small>Numeric</small>
                </div>
              ))}
            </div>

            {numericColumns.length < 2 && (
              <p className="analysis-note">
                At least two numeric columns are required to calculate correlations.
              </p>
            )}

            <p className="analysis-note">
              Correlation coefficients and heatmaps need a backend calculation
              before they can be displayed.
            </p>
          </section>
        </div>
      )}

      {/* REPORTS */}
      {activeTab === "reports" && (
        <div className="analysis-tab-page">
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Analysis Reports</h2>
                <p>
                  Export your current analysis summary or filtered data.
                </p>
              </div>
              <FileText size={22} color="#818cf8" />
            </div>

            <div className="analysis-report-summary">
              <div>
                <span>Dataset</span>
                <strong>{analysis?.filename || "Current Dataset"}</strong>
              </div>
              <div>
                <span>Rows</span>
                <strong>{formatNumber(analysis?.rows)}</strong>
              </div>
              <div>
                <span>Columns</span>
                <strong>
                  {formatNumber(analysis?.columns ?? columns.length)}
                </strong>
              </div>
              <div>
                <span>Filtered records</span>
                <strong>{formatNumber(previewRows.length)}</strong>
              </div>
            </div>

            <div className="analysis-report-actions">
              <button
                type="button"
                className="analysis-button primary"
                onClick={exportReport}
              >
                <Download size={15} />
                Export Summary JSON
              </button>
              <button
                type="button"
                className="analysis-button secondary"
                onClick={exportCSV}
              >
                <Table2 size={15} />
                Export Filtered Data
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Reusable components

function Metric({ icon, label, value }) {
  return (
    <div className="analysis-top-metric">
      <div className="analysis-metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ResultCard({ icon, label, value, subtitle }) {
  return (
    <div className="analysis-result-card">
      <div className="analysis-result-icon">
        {icon || <BarChart3 size={18} />}
      </div>
      <div className="analysis-result-text">
        <span>{label}</span>
        <strong>{value ?? "—"}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="analysis-empty-chart">
      <BarChart3 size={24} />
      <p>{message}</p>
    </div>
  );
}

function ChartRenderer({
  type,
  data,
  xKey,
  yKey,
  horizontal = false,
}) {
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey}
            nameKey={xKey}
            outerRadius={100}
            label
          >
            {data.map((item, index) => (
              <Cell
                key={`${item[xKey]}-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    const numericData = data
      .map((item) => ({
        x: Number(item.x ?? item[xKey]),
        y: Number(item.y ?? item[yKey]),
      }))
      .filter(
        (item) => Number.isFinite(item.x) && Number.isFinite(item.y)
      );

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
          />
          <Tooltip />
          <Scatter data={numericData} fill="#818cf8" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
          />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 12, bottom: 5, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              width={90}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
            />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
          </>
        )}

        <Tooltip />
        <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DataPreview({ rows }) {
  if (!rows?.length) {
    return (
      <div className="analysis-empty-table">
        No filtered records to display. Generate an analysis first.
      </div>
    );
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="analysis-table-wrapper">
      <table className="analysis-data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((row, index) => (
            <tr key={index}>
              {headers.map((header) => (
                <td key={header}>
                  {row[header] === null || row[header] === undefined
                    ? "—"
                    : String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Analysis;