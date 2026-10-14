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
  SlidersHorizontal,
  ChevronDown,
  X,
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

const CHART_TYPES = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
  { value: "histogram", label: "Histogram" },
];

const AGGREGATIONS = [
  ["sum", "Sum"],
  ["mean", "Average"],
  ["count", "Count"],
  ["min", "Minimum"],
  ["max", "Maximum"],
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Visualizations and Statistics both need a generated analysis,
  // so create one automatically the first time they are opened.
  useEffect(() => {
    const needsAnalysis =
      activeTab === "visualizations" || activeTab === "statistics";

    if (needsAnalysis && !summary && !analyzing && columns.length > 0) {
      generateAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, summary, columns.length]);

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

  // Overview: how many columns of each type.
  const typeBreakdown = useMemo(() => {
    const counts = {};

    columns.forEach((column) => {
      const type = getColumnType(column);
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [columns]);

  // Overview: columns that contain missing values.
  const columnsWithMissing = useMemo(
    () =>
      columns
        .map((column) => ({
          name: getColumnName(column),
          missing:
            Number(
              getStatistic(column, [
                "missing_values",
                "missing",
                "null_count",
              ])
            ) || 0,
        }))
        .filter((item) => item.missing > 0)
        .sort((a, b) => b.missing - a.missing),
    [columns]
  );

  const totalCells = (Number(analysis?.rows) || 0) * columns.length;

  const totalMissing = columnsWithMissing.reduce(
    (sum, item) => sum + item.missing,
    0
  );

  const completeness = totalCells
    ? (1 - totalMissing / totalCells) * 100
    : null;

  const activeFilterCount =
    (filters.startDate || filters.endDate ? 1 : 0) +
    (filters.categoryValues.length > 0 ? 1 : 0);

  const aggregationLabel =
    AGGREGATIONS.find(([value]) => value === filters.aggregation)?.[1] ||
    "Sum";

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
                <p>
                  {analysis?.filename || "Current dataset"} · structure
                  and data quality at a glance.
                </p>
              </div>
              <Database size={22} color="#818cf8" />
            </div>

            <div className="overview-grid">
              {/* Column types */}
              <div className="overview-block">
                <h3>Column types</h3>

                {typeBreakdown.map(({ type, count }) => (
                  <div className="overview-bar-row" key={type}>
                    <span className="overview-bar-label">{type}</span>
                    <div className="overview-bar-track">
                      <div
                        className="overview-bar-fill"
                        style={{
                          width: `${(count / columns.length) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>

              {/* Data quality */}
              <div className="overview-block">
                <h3>Data quality</h3>

                <div className="quality-score">
                  <strong>
                    {completeness === null
                      ? "—"
                      : `${completeness.toFixed(1)}%`}
                  </strong>
                  <span>complete</span>
                </div>

                <div className="overview-bar-track">
                  <div
                    className={`overview-bar-fill ${
                      completeness !== null && completeness < 90
                        ? "warn"
                        : "good"
                    }`}
                    style={{ width: `${completeness ?? 0}%` }}
                  />
                </div>

                {columnsWithMissing.length === 0 ? (
                  <p className="overview-ok">
                    No missing values found.
                  </p>
                ) : (
                  <ul className="missing-list">
                    {columnsWithMissing.slice(0, 4).map((item) => (
                      <li key={item.name}>
                        <span>{item.name}</span>
                        <strong>
                          {formatNumber(item.missing)} missing
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                          <Detail label="Data type" value={type} />
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

                            setSummary(null);
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
        <div className="analysis-tab-page viz-page">
          {/* Control bar */}
          <section className="analysis-card viz-toolbar">
            <div className="viz-toolbar-top">
              <div
                className="viz-chart-types"
                role="group"
                aria-label="Chart type"
              >
                {CHART_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      filters.chartType === value
                        ? "viz-type active"
                        : "viz-type"
                    }
                    onClick={() => updateFilter("chartType", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="viz-toolbar-actions">
                <button
                  type="button"
                  className="analysis-button secondary"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="viz-badge">{activeFilterCount}</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={filtersOpen ? "viz-chevron open" : "viz-chevron"}
                  />
                </button>

                <button
                  type="button"
                  className="analysis-button secondary"
                  onClick={resetFilters}
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="analysis-button primary"
                  onClick={generateAnalysis}
                  disabled={analyzing}
                >
                  <BarChart3 size={15} />
                  {analyzing ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            <div className="viz-fields">
              <div className="viz-field">
                <label htmlFor="viz-x">X-axis</label>
                <select
                  id="viz-x"
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

              <div className="viz-field">
                <label htmlFor="viz-y">Y-axis</label>
                <select
                  id="viz-y"
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

              <div className="viz-field">
                <label htmlFor="viz-agg">Calculate</label>
                <select
                  id="viz-agg"
                  value={filters.aggregation}
                  onChange={(event) =>
                    updateFilter("aggregation", event.target.value)
                  }
                >
                  {AGGREGATIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="viz-field">
                <label htmlFor="viz-breakdown">Group by time</label>
                <select
                  id="viz-breakdown"
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
            </div>

            {/* Collapsible filters */}
            {filtersOpen && (
              <div className="viz-filters">
                <div className="viz-filter-group">
                  <h3>
                    <CalendarDays size={14} />
                    Date range
                  </h3>

                  <div className="viz-filter-row">
                    <div className="viz-field">
                      <label htmlFor="viz-date-col">Date column</label>
                      <select
                        id="viz-date-col"
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
                    </div>

                    <div className="viz-field">
                      <label htmlFor="viz-start">From</label>
                      <input
                        id="viz-start"
                        type="date"
                        value={filters.startDate}
                        disabled={!filters.dateColumn}
                        onChange={(event) =>
                          updateFilter("startDate", event.target.value)
                        }
                      />
                    </div>

                    <div className="viz-field">
                      <label htmlFor="viz-end">To</label>
                      <input
                        id="viz-end"
                        type="date"
                        value={filters.endDate}
                        disabled={!filters.dateColumn}
                        onChange={(event) =>
                          updateFilter("endDate", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="viz-filter-group">
                  <h3>
                    <Tag size={14} />
                    Category
                  </h3>

                  <div className="viz-filter-row">
                    <div className="viz-field">
                      <label htmlFor="viz-cat-col">Category column</label>
                      <select
                        id="viz-cat-col"
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
                    </div>

                    <p className="analysis-field-hint viz-hint">
                      Choosing which category values to keep needs the
                      backend to return the values for each column.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="viz-chips">
                {(filters.startDate || filters.endDate) && (
                  <span className="viz-chip">
                    {filters.dateColumn}: {filters.startDate || "start"} to{" "}
                    {filters.endDate || "end"}
                    <button
                      type="button"
                      aria-label="Clear date range"
                      onClick={() => {
                        updateFilter("startDate", "");
                        updateFilter("endDate", "");
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {filters.categoryValues.length > 0 && (
                  <span className="viz-chip">
                    {filters.categoryColumn}: {filters.categoryValues.length}{" "}
                    selected
                    <button
                      type="button"
                      aria-label="Clear category filter"
                      onClick={() => updateFilter("categoryValues", [])}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Result numbers */}
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

          {/* Main chart */}
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>
                  {aggregationLabel} of {filters.yColumn || "records"} by{" "}
                  {filters.xColumn || "selected column"}
                </h2>
                <p>
                  {analyzing
                    ? "Updating chart..."
                    : "Change the chart type above to switch views instantly."}
                </p>
              </div>
              <button
                type="button"
                className="analysis-button secondary"
                onClick={exportReport}
              >
                <Download size={14} />
                Export summary
              </button>
            </div>

            <div className="analysis-chart viz-main-chart">
              {trendData.length ? (
                <ChartRenderer
                  type={filters.chartType}
                  data={trendData}
                  xKey="label"
                  yKey="value"
                />
              ) : (
                <EmptyChart
                  message={
                    analyzing
                      ? "Generating your chart..."
                      : "Pick your columns, then select Generate."
                  }
                />
              )}
            </div>
          </section>

          {/* Breakdowns */}
          <div className="analysis-breakdown-grid">
            <section className="analysis-card">
              <h2 className="viz-card-title">By year</h2>
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
              <h2 className="viz-card-title">By category</h2>
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

          {/* Data preview */}
          <section className="analysis-card">
            <div className="analysis-card-heading">
              <div>
                <h2>Filtered data</h2>
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
                  Summary statistics for {filters.yColumn || "record count"}{" "}
                  using your current filters.
                </p>
              </div>
              <Activity size={22} color="#818cf8" />
            </div>

            {analyzing ? (
              <div className="analysis-message">
                <RefreshCw size={18} />
                Calculating statistics...
              </div>
            ) : (
              <div className="analysis-result-kpis">
                <ResultCard
                  label="Total"
                  value={formatNumber(summary?.total)}
                />
                <ResultCard
                  label="Average"
                  value={formatNumber(summary?.average)}
                />
                <ResultCard
                  label="Minimum"
                  value={formatNumber(summary?.minimum)}
                />
                <ResultCard
                  label="Maximum"
                  value={formatNumber(summary?.maximum)}
                />
              </div>
            )}

            <p className="analysis-note">
              Change the filters in Visualizations and select Generate
              Analysis to refresh these results.
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
