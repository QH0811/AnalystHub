import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SETTINGS_KEY = "analysthub-settings";
const NOTIFICATIONS_KEY = "analysthub-notifications";

const DEFAULT_SETTINGS = {
  theme: "light",
  notificationsEnabled: true,
  defaultChartType: "bar",
  previewRows: 10,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Settings({ darkMode, toggleTheme }) {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(loadSettings);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Update one setting
  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaveMessage("");
    setErrorMessage("");
  }

  // Save settings
  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      // Synchronize notification preference
      localStorage.setItem(
        "analysthub-notifications-enabled",
        String(settings.notificationsEnabled)
      );

      setSaveMessage("Your settings have been saved.");
      setErrorMessage("");
    } catch {
      setSaveMessage("");
      setErrorMessage(
        "Unable to save settings. Please check your browser storage."
      );
    }
  }

  // Reset settings to defaults
  function resetSettings() {
    const defaults = { ...DEFAULT_SETTINGS };

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(defaults)
      );

      localStorage.setItem(
        "analysthub-notifications-enabled",
        "true"
      );

      setSettings(defaults);

      // Apply the default light theme if necessary
      if (darkMode) {
        toggleTheme();
      }

      setSaveMessage("Settings have been reset to defaults.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Unable to reset settings.");
    }
  }

  // Clear saved notifications
  function clearNotifications() {
    try {
      localStorage.removeItem(NOTIFICATIONS_KEY);

      window.dispatchEvent(
        new Event("analysthub-notifications-updated")
      );

      setSaveMessage("All notifications have been cleared.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Unable to clear notifications.");
    }
  }

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header settings-page-header">
        <div>
          <h1>Settings</h1>
          <p>
            Customize your AnalystHub workspace and preferences.
          </p>
        </div>
      </div>

      {/* Appearance */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">🎨</div>

          <div>
            <h2>Appearance</h2>
            <p>Personalize how AnalystHub looks.</p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Theme</strong>
            <small>
              Choose between light and dark appearance.
            </small>
          </div>

          <select
            className="settings-select"
            value={darkMode ? "dark" : "light"}
            onChange={(event) => {
              const selectedTheme = event.target.value;

              if (
                (selectedTheme === "dark") !== darkMode
              ) {
                toggleTheme();
              }

              updateSetting("theme", selectedTheme);
            }}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">🔔</div>

          <div>
            <h2>Notifications</h2>
            <p>Control notifications from your workspace.</p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Enable notifications</strong>
            <small>
              Receive alerts about uploads and data activities.
            </small>
          </div>

          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(event) =>
                updateSetting(
                  "notificationsEnabled",
                  event.target.checked
                )
              }
            />

            <span className="settings-switch-slider" />
          </label>
        </div>
      </section>

      {/* Data Preferences */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">📊</div>

          <div>
            <h2>Data Preferences</h2>
            <p>Set your default data visualization preferences.</p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Default chart type</strong>
            <small>
              Your preferred chart when opening the Analysis page.
            </small>
          </div>

          <select
            className="settings-select"
            value={settings.defaultChartType}
            onChange={(event) =>
              updateSetting(
                "defaultChartType",
                event.target.value
              )
            }
          >
            <option value="bar">Bar Chart</option>
            <option value="histogram">Histogram</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="line">Line Chart</option>
          </select>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Dataset preview rows</strong>
            <small>
              Number of rows to show in a dataset preview.
            </small>
          </div>

          <select
            className="settings-select"
            value={settings.previewRows}
            onChange={(event) =>
              updateSetting(
                "previewRows",
                Number(event.target.value)
              )
            }
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </section>

      {/* Storage & Privacy */}
      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-heading-icon">🔒</div>

          <div>
            <h2>Storage & Privacy</h2>
            <p>
              Manage preferences and locally saved notifications.
            </p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Notification storage</strong>
            <small>
              Notifications are stored in this browser.
            </small>
          </div>

          <button
            type="button"
            className="settings-secondary-button"
            onClick={clearNotifications}
          >
            Clear Notifications
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Profile information</strong>
            <small>
              Manage your saved name, email and job title.
            </small>
          </div>

          <button
            type="button"
            className="settings-secondary-button"
            onClick={() => navigate("/my-profile")}
          >
            Open My Profile
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <strong>Reset preferences</strong>
            <small>
              Restore the default settings for AnalystHub.
            </small>
          </div>

          <button
            type="button"
            className="settings-danger-button"
            onClick={resetSettings}
          >
            Reset Settings
          </button>
        </div>
      </section>

      {/* Save Actions */}
      <div className="settings-footer">
        <div>
          {saveMessage && (
            <p className="settings-success-message" role="status">
              {saveMessage}
            </p>
          )}

          {errorMessage && (
            <p className="settings-error-message" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          className="settings-save-button"
          onClick={saveSettings}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default Settings;