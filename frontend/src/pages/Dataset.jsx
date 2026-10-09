import { useState } from "react";
import { addNotification } from "../components/NotificationCenter";

function Dataset() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Select file
  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError("");
    }
  }

  // Upload dataset
  async function handleUpload() {
    if (!selectedFile) {
      setError("Please choose a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      // Handle unsuccessful responses
      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Upload failed."
        );
      }

      // Display upload results
      setResult(data);

      // Create a success notification
      addNotification({
        title: "Dataset uploaded successfully",
        message: `${data.filename || selectedFile.name} is ready for analysis.`,
        type: "success",
        path: "/dataset",
      });
    } catch (error) {
      const errorMessage =
        error.message || "Unable to upload the dataset.";

      setError(errorMessage);

      // Create an error notification
      addNotification({
        title: "Dataset upload failed",
        message: errorMessage,
        type: "error",
        path: "/dataset",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="dataset-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dataset</h1>
          <p>Upload and manage your datasets.</p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="upload-area">
        <div className="upload-icon">📁</div>

        <h2>Upload your dataset</h2>

        <p>
          Upload a CSV or Excel file to start analyzing your data.
        </p>

        <input
          type="file"
          id="dataset-file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          hidden
        />

        <label
          htmlFor="dataset-file"
          className="upload-button"
        >
          Choose File
        </label>

        {/* Selected File */}
        {selectedFile && (
          <p className="selected-file">
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <button
            type="button"
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Dataset"}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {/* Upload Results */}
        {result && (
          <div className="upload-result">
            <h3>Dataset Uploaded Successfully</h3>

            <p>
              File: <strong>{result.filename}</strong>
            </p>

            <p>
              Rows: <strong>{result.rows}</strong>
            </p>

            <p>
              Columns: <strong>{result.columns}</strong>
            </p>

            <p>
              Missing Values:{" "}
              <strong>{result.missing_values}</strong>
            </p>

            <p>
              Duplicate Rows:{" "}
              <strong>{result.duplicate_rows}</strong>
            </p>
          </div>
        )}

        <small>Supported formats: CSV, XLSX</small>
      </div>
    </div>
  );
}

export default Dataset;