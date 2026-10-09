import { useEffect, useState } from "react";

function Cleaning() {
  const [cleaningInfo, setCleaningInfo] = useState(null);
  const [error, setError] = useState("");

  const [selectedColumn, setSelectedColumn] = useState("");
  const [method, setMethod] = useState("");
  const [customValue, setCustomValue] = useState("");

  const [preview, setPreview] = useState(null);

  const [duplicates, setDuplicates] = useState(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const [loading, setLoading] = useState(false);


  // ==================================================
  // Load Cleaning Information
  // ==================================================

  function loadCleaningInfo() {
    fetch("http://127.0.0.1:8000/cleaning")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCleaningInfo(data);
          setError("");
        }
      })
      .catch(() => {
        setError(
          "Unable to connect to the AnalystHub API."
        );
      });
  }


  // Load when page opens
  useEffect(() => {
    loadCleaningInfo();
  }, []);


  // ==================================================
  // Selected Column Information
  // ==================================================

  const selectedColumnInfo =
    cleaningInfo?.missing_columns.find(
      (column) =>
        column.name === selectedColumn
    );


  // ==================================================
  // Select Column
  // ==================================================

  function handleColumnChange(event) {
    const columnName = event.target.value;

    setSelectedColumn(columnName);
    setPreview(null);
    setCustomValue("");

    const column =
      cleaningInfo?.missing_columns.find(
        (item) =>
          item.name === columnName
      );

    if (column?.data_type === "numeric") {
      setMethod("mean");
    } else {
      setMethod("mode");
    }
  }


  // ==================================================
  // Select Method
  // ==================================================

  function handleMethodChange(event) {
    setMethod(event.target.value);
    setPreview(null);
  }


  // ==================================================
  // Preview Cleaning
  // ==================================================

  async function previewCleaning() {
    if (!selectedColumn) {
      setError(
        "Please select a column first."
      );
      return;
    }

    if (!method) {
      setError(
        "Please select a cleaning method."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/cleaning/preview",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            column: selectedColumn,
            method: method,
            custom_value: customValue,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setPreview(data);
      }

    } catch {
      setError(
        "Unable to preview the cleaning action."
      );
    } finally {
      setLoading(false);
    }
  }


  // ==================================================
  // Apply Cleaning
  // ==================================================

  async function applyCleaning() {
    if (!preview) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/cleaning/apply",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            column: selectedColumn,
            method: method,
            custom_value: customValue,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setPreview(null);

        setSelectedColumn("");
        setMethod("");
        setCustomValue("");

        loadCleaningInfo();
      }

    } catch {
      setError(
        "Unable to apply the cleaning action."
      );
    } finally {
      setLoading(false);
    }
  }


  // ==================================================
  // View Duplicate Rows
  // ==================================================

  async function viewDuplicates() {
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/cleaning/duplicates"
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setDuplicates(data);
        setShowDuplicates(true);
      }

    } catch {
      setError(
        "Unable to load duplicate rows."
      );
    }
  }


  // ==================================================
  // Close Duplicate Review
  // ==================================================

  function closeDuplicateReview() {
    setShowDuplicates(false);
    setDuplicates(null);
  }


  // ==================================================
  // Remove Duplicates
  // ==================================================

  async function removeDuplicates() {
    const confirmed = window.confirm(
      "Are you sure you want to remove the duplicate rows?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/cleaning/duplicates/remove",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        closeDuplicateReview();
        loadCleaningInfo();
      }

    } catch {
      setError(
        "Unable to remove duplicate rows."
      );
    } finally {
      setLoading(false);
    }
  }


  // ==================================================
  // Error Screen
  // ==================================================

  if (error && !cleaningInfo) {
    return (
      <div className="cleaning-page">

        <div className="page-header">
          <h1>Data Cleaning</h1>

          <p>
            Review and clean your dataset
            before applying changes.
          </p>
        </div>

        <div className="profile-error">
          {error}
        </div>

      </div>
    );
  }


  // ==================================================
  // Loading Screen
  // ==================================================

  if (!cleaningInfo) {
    return (
      <div className="cleaning-page">

        <div className="page-header">
          <h1>Data Cleaning</h1>

          <p>
            Loading cleaning information...
          </p>
        </div>

      </div>
    );
  }


  // ==================================================
  // Main Page
  // ==================================================

  return (
    <div className="cleaning-page">


      {/* ==============================================
          PAGE HEADER
          ============================================== */}

      <div className="page-header">

        <h1>
          Data Cleaning
        </h1>

        <p>
          Review and clean your dataset
          before applying changes.
        </p>

      </div>


      {/* ==============================================
          ERROR MESSAGE
          ============================================== */}

      {error && (
        <div className="cleaning-error">
          {error}
        </div>
      )}


      {/* ==============================================
          SUMMARY CARDS
          ============================================== */}

      <div className="metrics">


        {/* Rows */}

        <div className="metric-card">

          <span className="metric-label">
            Rows
          </span>

          <strong>
            {cleaningInfo.rows}
          </strong>

          <small>
            Total records
          </small>

        </div>


        {/* Columns */}

        <div className="metric-card">

          <span className="metric-label">
            Columns
          </span>

          <strong>
            {cleaningInfo.columns}
          </strong>

          <small>
            Variables
          </small>

        </div>


        {/* Missing */}

        <div className="metric-card">

          <span className="metric-label">
            Missing Values
          </span>

          <strong>
            {cleaningInfo.missing_values}
          </strong>

          <small>
            Need attention
          </small>

        </div>


        {/* Duplicates */}

        <div className="metric-card">

          <span className="metric-label">
            Duplicates
          </span>

          <strong>
            {cleaningInfo.duplicate_rows}
          </strong>

          <small>
            Rows to remove
          </small>

        </div>

      </div>


      {/* =================================================
          MISSING VALUES
          ================================================= */}

      <div className="cleaning-card">


        {/* Section Header */}

        <div className="cleaning-section-header">

          <div>

            <h2>
              Missing Values
            </h2>

            <p>
              Review columns containing
              missing data.
            </p>

          </div>

        </div>


        {/* No Missing Values */}

        {cleaningInfo.missing_columns.length === 0 ? (

          <div className="cleaning-empty">

            No missing values were found
            in this dataset.

          </div>

        ) : (

          <>


            {/* ==========================================
                MISSING VALUE TABLE
                ========================================== */}

            <div className="cleaning-table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Column
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Missing
                    </th>

                    <th>
                      Missing %
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {cleaningInfo.missing_columns.map(
                    (column) => (

                      <tr
                        key={column.name}

                        onClick={() => {
                          setSelectedColumn(
                            column.name
                          );

                          setPreview(null);

                          if (
                            column.data_type ===
                            "numeric"
                          ) {
                            setMethod("mean");
                          } else {
                            setMethod("mode");
                          }
                        }}

                        className={
                          selectedColumn ===
                          column.name
                            ? "cleaning-selected-row"
                            : ""
                        }
                      >

                        <td>
                          {column.name}
                        </td>

                        <td>
                          {column.data_type}
                        </td>

                        <td>
                          {column.missing_count}
                        </td>

                        <td>
                          {column.missing_percentage}%
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* ==========================================
                CLEANING CONTROLS
                ========================================== */}

            <div className="cleaning-selection">


              {/* Selected Column */}

              <div className="cleaning-field">

                <label>
                  Selected Column
                </label>

                <select
                  value={selectedColumn}
                  onChange={handleColumnChange}
                >

                  <option value="">
                    Select a column
                  </option>

                  {cleaningInfo.missing_columns.map(
                    (column) => (

                      <option
                        key={column.name}
                        value={column.name}
                      >
                        {column.name}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* Cleaning Method */}

              <div className="cleaning-field">

                <label>
                  Cleaning Method
                </label>

                <select
                  value={method}
                  onChange={handleMethodChange}
                >

                  <option value="">
                    Select method
                  </option>


                  {/* Numeric methods */}

                  {selectedColumnInfo?.data_type ===
                    "numeric" && (
                    <>

                      <option value="mean">
                        Fill with Mean
                      </option>

                      <option value="median">
                        Fill with Median
                      </option>

                    </>
                  )}


                  {/* Available for all types */}

                  <option value="mode">
                    Fill with Mode
                  </option>

                  <option value="custom">
                    Fill with Custom Value
                  </option>

                  <option value="remove">
                    Remove Rows
                  </option>

                </select>

              </div>

            </div>


            {/* ==========================================
                CUSTOM VALUE
                ========================================== */}

            {method === "custom" && (

              <div className="cleaning-custom-field">

                <label>
                  Custom Value
                </label>

                <input
                  type="text"
                  value={customValue}
                  onChange={(event) =>
                    setCustomValue(
                      event.target.value
                    )
                  }
                  placeholder="Enter replacement value"
                />

              </div>

            )}


            {/* ==========================================
                PREVIEW BUTTON
                ========================================== */}

            <div className="cleaning-actions">

              <button
                className="cleaning-button"
                onClick={previewCleaning}
                disabled={loading}
              >

                {loading
                  ? "Preparing Preview..."
                  : "Preview Changes"}

              </button>

            </div>


            {/* ==========================================
                CLEANING PREVIEW
                ========================================== */}

            {preview && (

              <div className="cleaning-preview">


                {/* Preview Header */}

                <div className="preview-header">

                  <div>

                    <h3>
                      Preview Changes
                    </h3>

                    <p>
                      Review the changes
                      before applying them.
                    </p>

                  </div>

                </div>


                {/* Preview Summary */}

                <div className="preview-grid">


                  <div>

                    <span>
                      Column
                    </span>

                    <strong>
                      {preview.column}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Method
                    </span>

                    <strong>
                      {preview.method}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Missing Before
                    </span>

                    <strong>
                      {preview.missing_before}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Rows Affected
                    </span>

                    <strong>
                      {preview.rows_affected}
                    </strong>

                  </div>

                </div>


                {/* Replacement Value */}

                {preview.method !== "remove" && (

                  <div className="preview-value">

                    <span>
                      Replacement Value
                    </span>

                    <strong>
                      {preview.replacement_value}
                    </strong>

                  </div>

                )}


                {/* Remove Warning */}

                {preview.method === "remove" && (

                  <div className="preview-warning">

                    ⚠️{" "}
                    {preview.rows_affected}
                    {" "}rows will be removed.

                  </div>

                )}


                {/* Before / After */}

                <div className="before-after">

                  <h4>
                    Sample Changes
                  </h4>

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Before
                        </th>

                        <th>
                          After
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {preview.preview_rows.map(
                        (row, index) => (

                          <tr key={index}>

                            <td>
                              {row.before}
                            </td>

                            <td>
                              {row.after}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


                {/* Preview Actions */}

                <div className="preview-actions">

                  <button
                    className="cleaning-button secondary"
                    onClick={() =>
                      setPreview(null)
                    }
                  >
                    Close Preview
                  </button>


                  <button
                    className={
                      preview.method === "remove"
                        ? "cleaning-button danger"
                        : "cleaning-button"
                    }
                    onClick={applyCleaning}
                    disabled={loading}
                  >

                    {loading
                      ? "Applying..."
                      : "Apply Changes"}

                  </button>

                </div>

              </div>

            )}

          </>

        )}

      </div>


      {/* =================================================
          DUPLICATE ROWS
          ================================================= */}

      <div className="cleaning-card">


        {/* Duplicate Header */}

        <div className="cleaning-section-header">

          <div>

            <h2>
              Duplicate Rows
            </h2>

            <p>
              Review duplicate rows before
              removing them.
            </p>

          </div>

        </div>


        {/* Duplicate Count */}

        <div className="duplicate-summary">

          <strong>
            {cleaningInfo.duplicate_rows}
          </strong>

          <span>
            duplicate rows detected.
          </span>

        </div>


        {/* View Button */}

        {!showDuplicates && (

          <button
            className="cleaning-button secondary"
            onClick={viewDuplicates}
          >
            View Duplicate Rows
          </button>

        )}


        {/* ==============================================
            DUPLICATE REVIEW
            ============================================== */}

        {showDuplicates && duplicates && (

          <div className="duplicate-preview">


            {/* Review Header */}

            <div className="duplicate-review-header">

              <div>

                <h3>
                  Duplicate Records
                </h3>

                <p>
                  {duplicates.count}
                  {" "}duplicate rows will be
                  removed.
                </p>

              </div>


              {/* CLOSE */}

              <button
                className="cleaning-button secondary"
                onClick={closeDuplicateReview}
              >
                Close
              </button>

            </div>


            {/* No duplicates */}

            {duplicates.rows.length === 0 ? (

              <div className="cleaning-empty">

                No duplicate rows found.

              </div>

            ) : (

              <>


                {/* Duplicate Table */}

                <div className="cleaning-table-container">

                  <table>

                    <thead>

                      <tr>

                        {Object.keys(
                          duplicates.rows[0]
                        )
                          .filter(
                            (column) =>
                              column !==
                              "duplicate_count"
                          )
                          .map((column) => (

                            <th key={column}>
                              {column}
                            </th>

                          ))}


                        <th>
                          Duplicate Count
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {duplicates.rows.map(
                        (row, index) => (

                          <tr key={index}>

                            {Object.keys(row)
                              .filter(
                                (column) =>
                                  column !==
                                  "duplicate_count"
                              )
                              .map((column) => (

                                <td key={column}>
                                  {row[column]}
                                </td>

                              ))}


                            <td>

                              <strong className="duplicate-count">

                                {row.duplicate_count}

                              </strong>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>


                {/* Remove Button */}

                <button
                  className="cleaning-button danger"
                  onClick={removeDuplicates}
                  disabled={loading}
                >

                  {loading
                    ? "Removing..."
                    : `Remove ${duplicates.count} Duplicate Rows`}

                </button>

              </>

            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default Cleaning;