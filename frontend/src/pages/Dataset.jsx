
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  FileCheck,
  FileWarning,
  X,
  Database,
  Rows3,
  Columns3,
  ArrowRight,
  Sparkles,
  Clock3,
  CheckCircle2,
  LoaderCircle,
  FolderOpen,
} from "lucide-react";

import { addNotification } from "../components/NotificationCenter";
import "../App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const HISTORY_KEY = "analysthub-recent-uploads";
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

/* =========================================
   HELPER FUNCTIONS
========================================= */

function getSavedHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* =========================================
   DATASET COMPONENT
========================================= */

function Dataset() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(getSavedHistory);

  /* Refresh history when changed in another browser tab */
  useEffect(() => {
    function refreshHistory() {
      setHistory(getSavedHistory());
    }

    window.addEventListener("storage", refreshHistory);

    return () => {
      window.removeEventListener("storage", refreshHistory);
    };
  }, []);

  /* =========================================
     OPEN FILE PICKER
  ========================================= */

  function openFilePicker() {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }

  /* =========================================
     FILE VALIDATION
  ========================================= */

  function validateFile(file) {
    if (!file) {
      return "Please select a file before uploading.";
    }

    const filename = file.name.toLowerCase();

    const validExtension = ACCEPTED_EXTENSIONS.some((extension) =>
      filename.endsWith(extension)
    );

    if (!validExtension) {
      return "Unsupported file type. Please select a CSV or Excel file.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds the 50 MB limit.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    return "";
  }

  /* =========================================
     SELECT FILE
  ========================================= */

  function selectFile(file) {
    setError("");
    setResult(null);

    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  }

  function handleFileChange(event) {
    selectFile(event.target.files?.[0]);

    // Allows selecting the same file again.
    event.target.value = "";
  }

  /* =========================================
     DRAG AND DROP
  ========================================= */

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    if (uploading) return;

    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  }

  /* =========================================
     REMOVE SELECTED FILE
  ========================================= */

  function clearSelectedFile() {
    setSelectedFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /* =========================================
     UPLOAD DATASET
  ========================================= */

  async function handleUpload() {
    if (uploading) return;

    if (!selectedFile) {
      setError("Please choose a dataset file first.");
      return;
    }

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error || data.detail) {
        const message =
          data.error ||
          data.detail ||
          `Upload failed with HTTP ${response.status}.`;

        throw new Error(
          typeof message === "string"
            ? message
            : JSON.stringify(message)
        );
      }

      const uploadedDataset = {
        filename: data.filename || selectedFile.name,
        rows: data.rows ?? 0,
        columns: data.columns ?? 0,
        missing_values: data.missing_values ?? 0,
        duplicate_rows: data.duplicate_rows ?? 0,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      };

      setResult(uploadedDataset);

      /* Save the five latest successful uploads */
      const updatedHistory = [
        uploadedDataset,
        ...getSavedHistory().filter(
          (item) => item.filename !== uploadedDataset.filename
        ),
      ].slice(0, 5);

      try {
        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(updatedHistory)
        );
      } catch (storageError) {
        console.warn("Unable to save upload history:", storageError);
      }

      setHistory(updatedHistory);

      /* Notify other AnalystHub components */
      window.dispatchEvent(
        new Event("analysthub-dataset-updated")
      );

      addNotification({
        title: "Dataset uploaded successfully",
        message: `${uploadedDataset.filename} is ready for analysis.`,
        type: "success",
        path: "/dataset",
      });
    } catch (err) {
      let message =
        err.message || "Unable to upload the dataset.";

      if (
        err instanceof TypeError ||
        message.toLowerCase().includes("failed to fetch")
      ) {
        message =
          `Cannot connect to the backend at ${API_BASE}. ` +
          "Check that FastAPI is running and CORS is configured.";
      }

      setError(message);

      addNotification({
        title: "Dataset upload failed",
        message,
        type: "error",
        path: "/dataset",
      });
    } finally {
      setUploading(false);
    }
  }

  /* =========================================
     PAGE UI
  ========================================= */

  return (
    <div className="dataset-page dataset-modern">

      {/* PAGE HEADING */}

      <header className="dataset-heading">
        <div>
          <span className="dataset-eyebrow">
            <span className="dataset-eyebrow-dot" />
            DATA WORKSPACE
          </span>

          <h1>Datasets</h1>

          <p>
            Upload your data, review its basic information, and prepare
            it for your analysis workflow.
          </p>
        </div>

        <div className="dataset-management-badge">
          <span className="dataset-management-icon">
            <Database size={21} />
          </span>

          <span>
            <strong>Data management</strong>
            <small>CSV and Excel files</small>
          </span>
        </div>
      </header>

      {/* UPLOAD AND QUICK GUIDE */}

      <div className="dataset-main-grid">

        {/* UPLOAD PANEL */}

        <section className="dataset-panel dataset-upload-panel">

          <div className="dataset-panel-heading">
            <span className="dataset-section-icon">
              <Upload size={22} />
            </span>

            <div>
              <h2>Upload a dataset</h2>
              <p>Choose a file from your computer to get started.</p>
            </div>
          </div>

          {/* Hidden file input: file type is detected automatically */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="dataset-hidden-input"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {/* DROPZONE */}

          <div
            className={`dataset-dropzone ${
              dragging ? "is-dragging" : ""
            } ${selectedFile ? "has-file" : ""}`}
            onClick={(event) => {
              if (
                !uploading &&
                !event.target.closest("button")
              ) {
                openFilePicker();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();

              if (!uploading) {
                setDragging(true);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();

              if (!uploading) {
                setDragging(true);
              }
            }}
            onDragLeave={(event) => {
              event.preventDefault();

              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDragging(false);
              }
            }}
            onDrop={handleDrop}
          >

            {selectedFile ? (
              <>
                <span className="dataset-file-icon">
                  <FileSpreadsheet size={34} />
                  <CheckCircle2 size={19} />
                </span>

                <h3>File ready to upload</h3>
                <p>Your dataset has been selected.</p>

                <div className="dataset-selected-file">
                  <FileSpreadsheet size={23} />

                  <div className="dataset-selected-file-info">
                    <strong>{selectedFile.name}</strong>
                    <span>{formatBytes(selectedFile.size)}</span>
                  </div>

                  <button
                    type="button"
                    className="dataset-remove-file"
                    onClick={clearSelectedFile}
                    disabled={uploading}
                    aria-label="Remove selected file"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  className="dataset-browse-link"
                  onClick={openFilePicker}
                  disabled={uploading}
                >
                  Choose a different file
                </button>
              </>
            ) : (
              <>
                <span className="dataset-file-icon">
                  <FileSpreadsheet size={34} />

                  <span className="dataset-upload-arrow">
                    <Upload size={12} />
                  </span>
                </span>

                <h3>Drag and drop your dataset</h3>

                <p>
                  Drop your file here or{" "}
                  <button
                    type="button"
                    className="dataset-browse-link"
                    onClick={openFilePicker}
                    disabled={uploading}
                  >
                    browse files
                  </button>
                </p>

                <small>
                  CSV and Excel files supported · Maximum 50 MB
                </small>
              </>
            )}

          </div>

          {/* ERROR MESSAGE */}

          {error && (
            <div
              className="dataset-feedback dataset-feedback-error"
              role="alert"
            >
              <FileWarning size={19} />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {result && (
            <div
              className="dataset-feedback dataset-feedback-success"
              role="status"
            >
              <CheckCircle2 size={19} />
              <span>
                <strong>Upload successful!</strong> Your dataset is ready.
              </span>
            </div>
          )}

          {/* UPLOAD BUTTON */}

          <div className="dataset-upload-actions">
            <button
              type="button"
              className="dataset-primary-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <LoaderCircle
                    className="dataset-spin"
                    size={17}
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={17} />
                  Upload dataset
                </>
              )}
            </button>

            <span className="dataset-backend-note">
              <span className="dataset-status-dot" />
              Processed by your backend
            </span>
          </div>

          {/* UPLOAD RESULTS */}

          {result && (
            <div className="dataset-result">

              <div className="dataset-result-heading">
                <div>
                  <span className="dataset-eyebrow">
                    UPLOAD COMPLETE
                  </span>

                  <h3>{result.filename}</h3>
                </div>

                <FileCheck size={25} />
              </div>

              <div className="dataset-stats-grid">

                <div className="dataset-stat">
                  <Rows3 size={18} />
                  <span>Rows</span>
                  <strong>
                    {Number(result.rows).toLocaleString()}
                  </strong>
                </div>

                <div className="dataset-stat">
                  <Columns3 size={18} />
                  <span>Columns</span>
                  <strong>
                    {Number(result.columns).toLocaleString()}
                  </strong>
                </div>

                <div className="dataset-stat">
                  <Sparkles size={18} />
                  <span>Missing values</span>
                  <strong>
                    {Number(result.missing_values).toLocaleString()}
                  </strong>
                </div>

                <div className="dataset-stat">
                  <Database size={18} />
                  <span>Duplicate rows</span>
                  <strong>
                    {Number(result.duplicate_rows).toLocaleString()}
                  </strong>
                </div>

              </div>

              <div className="dataset-next-actions">
                <button
                  type="button"
                  className="dataset-secondary-button"
                  onClick={() => navigate("/profile")}
                >
                  Explore data profile
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  className="dataset-secondary-button"
                  onClick={() => navigate("/analysis")}
                >
                  Start analysis
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>
          )}

        </section>

        {/* QUICK GUIDE */}

        <aside className="dataset-panel dataset-guide-panel">

          <div className="dataset-panel-heading">
            <span className="dataset-section-icon">
              <Sparkles size={22} />
            </span>

            <div>
              <h2>Quick guide</h2>
              <p>Three simple steps to get started.</p>
            </div>
          </div>

          <div className="dataset-guide-steps">

            <div className="dataset-guide-step">
              <span className="dataset-step-number">01</span>

              <div>
                <h3>Select your file</h3>
                <p>
                  Choose a CSV or Excel file containing your dataset.
                </p>
              </div>
            </div>

            <div className="dataset-guide-step">
              <span className="dataset-step-number">02</span>

              <div>
                <h3>Upload and validate</h3>
                <p>
                  The backend processes your file and returns basic data
                  quality statistics.
                </p>
              </div>
            </div>

            <div className="dataset-guide-step">
              <span className="dataset-step-number">03</span>

              <div>
                <h3>Continue your workflow</h3>
                <p>
                  Use Data Profile, Data Cleaning, and Analysis to
                  explore your data.
                </p>
              </div>
            </div>

          </div>

          <div className="dataset-tip">
            <span>i</span>
            <p>
              Tip: Check your column names and data types before starting
              detailed analysis.
            </p>
          </div>

        </aside>
      </div>

      {/* RECENT UPLOADS */}

      <section className="dataset-panel dataset-history-panel">

        <div className="dataset-history-heading">
          <div>
            <h2>Recent uploads</h2>
            <p>
              Your five most recent successful uploads on this browser.
            </p>
          </div>

          <span className="dataset-history-count">
            {history.length} / 5
          </span>
        </div>

        {history.length === 0 ? (
          <div className="dataset-empty-history">
            <span>
              <FolderOpen size={25} />
            </span>

            <h3>No uploads yet</h3>
            <p>Your successful uploads will appear here.</p>
          </div>
        ) : (
          <div className="dataset-history-list">

            {history.map((item, index) => (
              <div
                className="dataset-history-item"
                key={`${item.filename}-${item.uploadedAt || index}`}
              >
                <span className="dataset-history-file-icon">
                  <FileSpreadsheet size={22} />
                </span>

                <div className="dataset-history-file">
                  <strong>{item.filename}</strong>

                  <span>
                    <Clock3 size={13} />

                    {item.uploadedAt
                      ? formatDate(item.uploadedAt)
                      : "Previously uploaded"}
                  </span>
                </div>

                <div className="dataset-history-metadata">
                  <span>
                    {Number(item.rows || 0).toLocaleString()} rows
                  </span>

                  <span>
                    {Number(item.columns || 0).toLocaleString()} columns
                  </span>
                </div>

                <span className="dataset-history-success">
                  <CheckCircle2 size={15} />
                  Success
                </span>
              </div>
            ))}

          </div>
        )}

      </section>
    </div>
  );
}

export default Dataset;
