
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/profile";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString()
    : String(value);
};

const normaliseType = (type = "") =>
  String(type).toLowerCase();

const getColumnQuality = (column, rows) => {
  const missing = Number(column?.missing_values || 0);
  const total = Number(rows || 0);

  if (!total) {
    return {
      label: "Unknown",
      tone: "neutral",
      completeness: 0,
    };
  }

  const completeness = Math.max(
    0,
    Math.min(100, ((total - missing) / total) * 100)
  );

  if (missing === 0) {
    return { label: "Excellent", tone: "good", completeness };
  }

  if (completeness >= 95) {
    return { label: "Good", tone: "good", completeness };
  }

  if (completeness >= 80) {
    return { label: "Review", tone: "warning", completeness };
  }

  return { label: "Attention", tone: "danger", completeness };
};

const isNumericType = (type = "") => {
  const value = normaliseType(type);

  return (
    value.includes("numeric") ||
    value.includes("number") ||
    value.includes("int") ||
    value.includes("float") ||
    value.includes("double") ||
    value.includes("decimal")
  );
};

const isCategoricalType = (type = "") => {
  const value = normaliseType(type);

  return (
    value.includes("categorical") ||
    value.includes("object") ||
    value.includes("text") ||
    value.includes("string") ||
    value.includes("category") ||
    value.includes("bool")
  );
};

const getDistributionValues = (column) => {
  const stats = column?.statistics || {};

  const candidates = [
    stats.histogram,
    stats.histogram_bins,
    stats.distribution,
    stats.bins,
    stats.value_counts,
    column?.histogram,
    column?.distribution,
    column?.value_counts,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || candidate.length === 0) {
      continue;
    }

    const values = candidate
      .map((item, index) => {
        if (typeof item === "number") {
          return {
            label: String(index + 1),
            value: item,
          };
        }

        if (Array.isArray(item)) {
          return {
            label: String(item[0] ?? index + 1),
            value: Number(item[1] ?? 0),
          };
        }

        return {
          label: String(
            item?.label ??
            item?.bin ??
            item?.name ??
            index + 1
          ),
          value: Number(
            item?.count ??
            item?.frequency ??
            item?.y ??
            item?.value_count ??
            0
          ),
        };
      })
      .filter(
        (item) =>
          Number.isFinite(item.value) && item.value >= 0
      );

    if (values.length > 0) {
      return values.slice(0, 24);
    }
  }

  return [];
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedColumn, setSelectedColumn] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setProfile(data);

      const newColumns = data.column_info || [];

      setSelectedColumn((current) =>
        newColumns.find(
          (column) => column.name === current?.name
        ) ||
        newColumns[0] ||
        null
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the AnalystHub API."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const columns = profile?.column_info || [];

  const rowTotal = Number(profile?.rows || 0);
  const columnTotal = Number(
    profile?.columns || columns.length
  );
  const missingTotal = Number(
    profile?.missing_values || 0
  );
  const duplicateTotal = Number(
    profile?.duplicate_rows || 0
  );

  // Search, filtering and sorting
  const filteredColumns = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = columns.filter((column) => {
      const type = normaliseType(column.data_type);
      const missing = Number(column.missing_values || 0);

      const matchesSearch =
        !query ||
        String(column.name).toLowerCase().includes(query) ||
        type.includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "missing" && missing > 0) ||
        (filter === "numeric" && isNumericType(type)) ||
        (filter === "categorical" && isCategoricalType(type));

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let result = 0;

      if (sortBy === "missing") {
        result =
          Number(a.missing_values || 0) -
          Number(b.missing_values || 0);
      } else if (sortBy === "unique") {
        result =
          Number(a.unique_values || 0) -
          Number(b.unique_values || 0);
      } else if (sortBy === "type") {
        result = String(a.data_type || "").localeCompare(
          String(b.data_type || "")
        );
      } else {
        result = String(a.name || "").localeCompare(
          String(b.name || "")
        );
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [
    columns,
    search,
    filter,
    sortBy,
    sortDirection,
  ]);

  // Selected column information
  const selectedQuality = selectedColumn
    ? getColumnQuality(selectedColumn, rowTotal)
    : null;

  const selectedStats = selectedColumn?.statistics || {};
  const selectedType = normaliseType(
    selectedColumn?.data_type
  );

  const isNumeric =
    selectedStats.type === "numeric" ||
    isNumericType(selectedType);

  const distribution = useMemo(
    () => getDistributionValues(selectedColumn),
    [selectedColumn]
  );

  const maxDistribution = Math.max(
    1,
    ...distribution.map((item) => item.value)
  );

  // Dataset-wide quality insights
  const columnsWithMissing = useMemo(
    () =>
      columns
        .filter(
          (column) =>
            Number(column.missing_values || 0) > 0
        )
        .sort(
          (a, b) =>
            Number(b.missing_values || 0) -
            Number(a.missing_values || 0)
        ),
    [columns]
  );

  const cleanColumns = columns.filter(
    (column) => Number(column.missing_values || 0) === 0
  );

  const numericColumnCount = columns.filter(
    (column) => isNumericType(column.data_type)
  ).length;

  const categoricalColumnCount = columns.filter(
    (column) => isCategoricalType(column.data_type)
  ).length;

  const totalCells = rowTotal * columnTotal;

  const overallCompleteness =
    totalCells > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((totalCells - missingTotal) / totalCells) * 100
          )
        )
      : 0;

  const maxMissing = Math.max(
    1,
    ...columnsWithMissing.map((column) =>
      Number(column.missing_values || 0)
    )
  );

  const changeSort = (key) => {
    if (sortBy === key) {
      setSortDirection((direction) =>
        direction === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  const inspectColumn = (column) => {
    setSelectedColumn(column);
    setFilter("all");
    setSearch("");
  };

  if (loading) {
    return (
      <main className="profile-v2">
        <div className="profile-v2-heading">
          <div>
            <span className="profile-eyebrow">
              WORKSPACE / DATA QUALITY
            </span>
            <h1>Data Profile</h1>
            <p>
              Understand the structure and quality of your dataset.
            </p>
          </div>
        </div>

        <div className="profile-loading">
          <span className="profile-spinner" />
          Loading your dataset profile...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-v2">
        <div className="profile-v2-heading">
          <div>
            <span className="profile-eyebrow">
              WORKSPACE / DATA QUALITY
            </span>
            <h1>Data Profile</h1>
            <p>
              Understand the structure and quality of your dataset.
            </p>
          </div>
        </div>

        <div className="profile-error-panel">
          <div className="profile-error-icon">!</div>

          <div>
            <h2>Could not load data profile</h2>
            <p>{error}</p>

            <button
              className="profile-primary-button"
              onClick={() => loadProfile()}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-v2">
      {/* PAGE HEADER */}
      <header className="profile-v2-heading">
        <div>
          <span className="profile-eyebrow">
            WORKSPACE / DATA QUALITY
          </span>

          <h1>Data Profile</h1>

          <p>
            Understand the structure and quality of your dataset.
          </p>
        </div>

        <div className="profile-dataset-pill">
          <span className="profile-file-icon">▤</span>

          <span className="profile-dataset-meta">
            <strong>
              {profile?.dataset_name ||
                profile?.filename ||
                "Current dataset"}
            </strong>

            <small>
              <i />
              Profile loaded successfully
            </small>
          </span>

          <button
            className="profile-refresh-button"
            onClick={() => loadProfile(true)}
            disabled={refreshing}
            title="Refresh profile"
          >
            {refreshing ? "..." : "↻"}
          </button>
        </div>
      </header>

      {/* SUMMARY CARDS */}
      <section className="profile-metrics">
        <article className="profile-metric-card">
          <div className="profile-metric-icon purple">▤</div>
          <div className="profile-metric-content">
            <span>ROWS</span>
            <strong>{formatNumber(rowTotal)}</strong>
            <small>Total records</small>
          </div>
        </article>

        <article className="profile-metric-card">
          <div className="profile-metric-icon blue">▦</div>
          <div className="profile-metric-content">
            <span>COLUMNS</span>
            <strong>{formatNumber(columnTotal)}</strong>
            <small>Variables</small>
          </div>
        </article>

        <article className="profile-metric-card">
          <div className="profile-metric-icon amber">⚠</div>
          <div className="profile-metric-content">
            <span>MISSING VALUES</span>
            <strong>{formatNumber(missingTotal)}</strong>
            <small>
              {missingTotal
                ? "Needs attention"
                : "No missing values"}
            </small>
          </div>
        </article>

        <article className="profile-metric-card">
          <div className="profile-metric-icon violet">⧉</div>
          <div className="profile-metric-content">
            <span>DUPLICATE ROWS</span>
            <strong>{formatNumber(duplicateTotal)}</strong>
            <small>
              {duplicateTotal
                ? "Duplicate records found"
                : "No duplicates found"}
            </small>
          </div>
        </article>
      </section>

      {/* MAIN CONTENT */}
      <section className="profile-workspace-grid">
        {/* COLUMN TABLE */}
        <div className="profile-panel profile-column-panel">
          <div className="profile-panel-heading">
            <div>
              <h2>
                Column Overview{" "}
                <span
                  className="profile-info-dot"
                  title="Select a column to inspect its statistics"
                >
                  i
                </span>
              </h2>

              <p>Select a column to view its statistics.</p>
            </div>

            <label className="profile-search">
              <span>⌕</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search columns..."
                aria-label="Search columns"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
          </div>

          {/* FILTERS */}
          <div className="profile-filter-row">
            {[
              ["all", "All columns"],
              ["missing", "Missing values"],
              ["numeric", "Numeric"],
              ["categorical", "Categorical"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`profile-filter-chip ${
                  filter === value ? "active" : ""
                }`}
                onClick={() => setFilter(value)}
              >
                {label}

                {value === "missing" && (
                  <span>{columnsWithMissing.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="profile-table-wrap">
            <table className="profile-column-table">
              <thead>
                <tr>
                  <th>
                    <button onClick={() => changeSort("name")}>
                      COLUMN ↕
                    </button>
                  </th>

                  <th>
                    <button onClick={() => changeSort("type")}>
                      TYPE ↕
                    </button>
                  </th>

                  <th>
                    <button onClick={() => changeSort("missing")}>
                      MISSING ↕
                    </button>
                  </th>

                  <th>
                    <button onClick={() => changeSort("unique")}>
                      UNIQUE ↕
                    </button>
                  </th>

                  <th>QUALITY</th>
                </tr>
              </thead>

              <tbody>
                {filteredColumns.map((column) => {
                  const quality = getColumnQuality(
                    column,
                    rowTotal
                  );

                  const selected =
                    selectedColumn?.name === column.name;

                  return (
                    <tr
                      key={column.name}
                      className={selected ? "selected" : ""}
                      onClick={() => inspectColumn(column)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          inspectColumn(column);
                        }
                      }}
                    >
                      <td>
                        <span className="profile-column-name">
                          {column.name}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`profile-type-badge ${quality.tone}`}
                        >
                          {column.data_type || "unknown"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            Number(column.missing_values || 0) > 0
                              ? "profile-missing-value"
                              : ""
                          }
                        >
                          {formatNumber(
                            column.missing_values || 0
                          )}
                        </span>
                      </td>

                      <td>
                        {formatNumber(column.unique_values)}
                      </td>

                      <td>
                        <span
                          className={`profile-quality ${quality.tone}`}
                        >
                          <i />
                          {quality.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredColumns.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="profile-empty-cell"
                    >
                      No columns match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="profile-table-footer">
            <span>
              Showing <strong>{filteredColumns.length}</strong> of{" "}
              <strong>{columns.length}</strong> columns
            </span>

            <span>Click a row to inspect →</span>
          </div>
        </div>

        {/* RIGHT-HAND PANEL */}
        <aside className="profile-panel profile-selected-panel">
          {!selectedColumn ? (
            <div className="profile-no-selection">
              <div>▦</div>
              <h2>Select a column</h2>
              <p>
                Choose a column from the table to see its profile.
              </p>
            </div>
          ) : (
            <>
              {/* SELECTED COLUMN HEADER */}
              <div className="profile-selected-heading">
                <div>
                  <span className="profile-eyebrow">
                    COLUMN DETAILS
                  </span>

                  <h2>{selectedColumn.name}</h2>
                </div>

                <span className="profile-type-badge selected-type">
                  {selectedColumn.data_type || "unknown"}
                </span>
              </div>

              {/* DISTRIBUTION */}
              <div className="profile-distribution-card">
                <div className="profile-chart-heading">
                  <h3>
                    {isNumeric
                      ? "Distribution"
                      : "Column Overview"}
                  </h3>

                  <span>
                    {distribution.length
                      ? `${distribution.length} bins`
                      : "Statistics"}
                  </span>
                </div>

                {distribution.length > 0 ? (
                  <>
                    <div
                      className="profile-chart"
                      role="img"
                      aria-label={`Distribution for ${selectedColumn.name}`}
                    >
                      {distribution.map((item, index) => (
                        <div
                          className="profile-chart-column"
                          key={`${item.label}-${index}`}
                          title={`${item.label}: ${formatNumber(
                            item.value
                          )}`}
                        >
                          <div
                            className="profile-chart-bar"
                            style={{
                              height: `${Math.max(
                                3,
                                (item.value / maxDistribution) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="profile-chart-axis">
                      <span>{distribution[0]?.label}</span>
                      <span>
                        {
                          distribution[
                            Math.floor(distribution.length / 2)
                          ]?.label
                        }
                      </span>
                      <span>
                        {distribution[distribution.length - 1]?.label}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="profile-chart-empty">
                    <div className="profile-chart-empty-icon">
                      {isNumeric ? "⌁" : "▤"}
                    </div>

                    <strong>
                      {isNumeric
                        ? "Distribution data unavailable"
                        : "Detailed value distribution unavailable"}
                    </strong>

                    <p>
                      Your API has not returned distribution bins
                      for this column. The quality statistics below
                      are based on the available profile data.
                    </p>
                  </div>
                )}
              </div>

              {/* COLUMN STATISTICS */}
              <div
                className={`profile-stat-grid ${
                  isNumeric ? "" : "categorical"
                }`}
              >
                {isNumeric ? (
                  [
                    ["Mean", selectedStats.mean],
                    ["Median", selectedStats.median],
                    ["Minimum", selectedStats.minimum],
                    ["Maximum", selectedStats.maximum],
                    [
                      "Std. deviation",
                      selectedStats.standard_deviation,
                    ],
                  ].map(([label, value]) => (
                    <div
                      className="profile-stat-tile"
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>{formatNumber(value)}</strong>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="profile-stat-tile profile-stat-wide">
                      <span>Most common value</span>
                      <strong
                        title={String(
                          selectedStats.most_common ?? "N/A"
                        )}
                      >
                        {selectedStats.most_common ?? "N/A"}
                      </strong>
                    </div>

                    <div className="profile-stat-tile">
                      <span>Unique values</span>
                      <strong>
                        {formatNumber(selectedColumn.unique_values)}
                      </strong>
                    </div>
                  </>
                )}
              </div>

              {/* COLUMN COMPLETENESS */}
              <div className="profile-completeness">
                <div className="profile-completeness-heading">
                  <span>Column completeness</span>

                  <strong>
                    {selectedQuality.completeness.toFixed(1)}%
                  </strong>
                </div>

                <div className="profile-progress-track">
                  <div
                    className="profile-progress-fill"
                    style={{
                      width: `${selectedQuality.completeness}%`,
                    }}
                  />
                </div>

                <div className="profile-completeness-foot">
                  <span>
                    {formatNumber(
                      selectedColumn.missing_values || 0
                    )}{" "}
                    missing values
                  </span>

                  <span>
                    {formatNumber(
                      Math.max(
                        0,
                        rowTotal -
                          Number(selectedColumn.missing_values || 0)
                      )
                    )}{" "}
                    present
                  </span>
                </div>
              </div>

              {/* COLUMN QUALITY */}
              <div
                className={`profile-insight ${selectedQuality.tone}`}
              >
                <span className="profile-insight-icon">
                  {selectedQuality.tone === "good" ? "✓" : "!"}
                </span>

                <div>
                  <strong>
                    {selectedQuality.tone === "good"
                      ? "Column looks healthy"
                      : "Review this column"}
                  </strong>

                  <p>
                    {Number(
                      selectedColumn.missing_values || 0
                    ) === 0
                      ? "No missing values were reported for this column."
                      : `${formatNumber(
                          selectedColumn.missing_values
                        )} missing value(s) detected. Review this field in Data Cleaning.`}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* DATASET-WIDE QUALITY INSIGHTS */}
          <section className="profile-dataset-insights">
            <div className="profile-insights-heading">
              <div>
                <span className="profile-eyebrow">
                  DATASET OVERVIEW
                </span>

                <h3>Quality Insights</h3>

                <p>
                  Quality checks across all columns.
                </p>
              </div>

              <span className="profile-insights-icon">✦</span>
            </div>

            {/* OVERALL COMPLETENESS */}
            <div className="profile-overall-quality">
              <div className="profile-overall-heading">
                <span>Overall completeness</span>

                <strong>
                  {overallCompleteness.toFixed(1)}%
                </strong>
              </div>

              <div className="profile-progress-track">
                <div
                  className="profile-progress-fill"
                  style={{
                    width: `${overallCompleteness}%`,
                  }}
                />
              </div>

              <p>
                {formatNumber(missingTotal)} missing cells out of{" "}
                {formatNumber(totalCells)} total cells.
              </p>
            </div>

            {/* QUALITY SUMMARY */}
            <div className="profile-insights-grid">
              <div className="profile-insight-stat">
                <span className="profile-insight-stat-icon green">
                  ✓
                </span>

                <div>
                  <strong>{formatNumber(cleanColumns.length)}</strong>
                  <span>Complete columns</span>
                </div>
              </div>

              <div className="profile-insight-stat">
                <span className="profile-insight-stat-icon amber">
                  !
                </span>

                <div>
                  <strong>
                    {formatNumber(columnsWithMissing.length)}
                  </strong>
                  <span>Columns with missing data</span>
                </div>
              </div>

              <div className="profile-insight-stat">
                <span className="profile-insight-stat-icon blue">
                  #
                </span>

                <div>
                  <strong>
                    {formatNumber(numericColumnCount)}
                  </strong>
                  <span>Numeric columns</span>
                </div>
              </div>

              <div className="profile-insight-stat">
                <span className="profile-insight-stat-icon purple">
                  ◈
                </span>

                <div>
                  <strong>
                    {formatNumber(categoricalColumnCount)}
                  </strong>
                  <span>Categorical / text columns</span>
                </div>
              </div>
            </div>

            {/* COLUMNS NEEDING ATTENTION */}
            <div className="profile-attention-section">
              <div className="profile-attention-heading">
                <h4>Columns needing attention</h4>
                <span>{columnsWithMissing.length}</span>
              </div>

              {columnsWithMissing.length > 0 ? (
                <div className="profile-attention-list">
                  {columnsWithMissing
                    .slice(0, 5)
                    .map((column) => {
                      const missing = Number(
                        column.missing_values || 0
                      );

                      const percentage =
                        rowTotal > 0
                          ? (missing / rowTotal) * 100
                          : 0;

                      return (
                        <button
                          type="button"
                          className="profile-attention-item"
                          key={column.name}
                          onClick={() => inspectColumn(column)}
                          title={`Inspect ${column.name}`}
                        >
                          <div className="profile-attention-top">
                            <span>{column.name}</span>
                            <strong>
                              {formatNumber(missing)}
                            </strong>
                          </div>

                          <div className="profile-attention-track">
                            <div
                              className="profile-attention-fill"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    (missing / maxMissing) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="profile-attention-bottom">
                            <span>
                              {percentage.toFixed(1)}% missing
                            </span>

                            <span>Inspect column →</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="profile-all-clean">
                  <span>✓</span>

                  <div>
                    <strong>All columns are complete</strong>
                    <p>
                      No missing values were reported for any column.
                    </p>
                  </div>
                </div>
              )}

              {columnsWithMissing.length > 5 && (
                <button
                  type="button"
                  className="profile-view-all"
                  onClick={() => {
                    setFilter("missing");
                    setSearch("");
                  }}
                >
                  View all {columnsWithMissing.length} columns
                  <span>→</span>
                </button>
              )}
            </div>

            {/* RECOMMENDATION */}
            <div className="profile-next-action">
              <span className="profile-next-action-icon">
                ✦
              </span>

              <div>
                <strong>Recommended next step</strong>

                <p>
                  {missingTotal > 0
                    ? "Review columns with missing values in Data Cleaning before proceeding to analysis."
                    : duplicateTotal > 0
                    ? "Review duplicate rows to determine whether any records should be removed."
                    : "No missing values were reported. Continue with data cleaning checks and analysis."}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      {/* FOOTER */}
      <footer className="profile-v2-footer">
        <span>
          <i />
          Profile information is based on the currently loaded dataset.
        </span>

        <button
          onClick={() => loadProfile(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh profile"}
        </button>
      </footer>
    </main>
  );
}

export default Profile;
