import { useEffect, useState } from "react";

const DEFAULT_PROFILE = {
  fullName: "Qian Han",
  email: "",
  jobTitle: "Data Analyst",
  timeZone: "Asia/Kuala_Lumpur",
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

function MyProfile() {
  const [profile, setProfile] = useState(readProfile);
  const [savedProfile, setSavedProfile] = useState(readProfile);
  const [message, setMessage] = useState("");

  // Update a field
  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  }

  // Save profile information
  function handleSave(event) {
    event.preventDefault();

    const cleanedProfile = {
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      jobTitle: profile.jobTitle.trim(),
      timeZone: profile.timeZone,
    };

    if (!cleanedProfile.fullName) {
      setMessage("Please enter your full name.");
      return;
    }

    try {
      localStorage.setItem(
        "analysthub-profile",
        JSON.stringify(cleanedProfile)
      );

      setProfile(cleanedProfile);
      setSavedProfile(cleanedProfile);
      setMessage("Your profile has been saved.");

      // Notify Topbar to refresh the displayed name
      window.dispatchEvent(
        new Event("analysthub-profile-updated")
      );
    } catch {
      setMessage("Unable to save your profile in this browser.");
    }
  }

  // Restore the last saved information
  function handleCancel() {
    setProfile({ ...savedProfile });
    setMessage("");
  }

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "QH";

  return (
    <div className="my-profile-page">
      <div className="my-profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Profile information */}
        <section className="profile-panel">
          <h2>Profile Information</h2>
          <p className="profile-panel-description">
            Keep your personal details up to date.
          </p>

          <div className="profile-identity">
            <div className="profile-large-avatar">{initials}</div>

            <div className="profile-identity-details">
              <h3>{profile.fullName || "Your Name"}</h3>
              <p>{profile.jobTitle || "Your Job Title"}</p>
              <small>{profile.email || "Add your email address"}</small>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-form-field">
              <label htmlFor="profile-full-name">Full Name</label>
              <input
                id="profile-full-name"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="profile-form-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="profile-form-field">
              <label htmlFor="profile-job-title">Job Title</label>
              <input
                id="profile-job-title"
                name="jobTitle"
                value={profile.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Data Analyst"
              />
            </div>

            <div className="profile-form-field">
              <label htmlFor="profile-time-zone">Time Zone</label>
              <select
                id="profile-time-zone"
                name="timeZone"
                value={profile.timeZone}
                onChange={handleChange}
              >
                <option value="Asia/Kuala_Lumpur">
                  Kuala Lumpur (GMT+8)
                </option>
                <option value="Asia/Singapore">
                  Singapore (GMT+8)
                </option>
                <option value="Asia/Tokyo">
                  Tokyo (GMT+9)
                </option>
                <option value="Europe/London">
                  London
                </option>
                <option value="America/New_York">
                  New York
                </option>
                <option value="UTC">
                  UTC
                </option>
              </select>
            </div>
          </div>

          {message && (
            <p
              className={`profile-save-message ${
                message.includes("saved") ? "success" : "error"
              }`}
              role="status"
            >
              {message}
            </p>
          )}

          <div className="profile-form-actions">
            <button type="submit" className="profile-save-button">
              Save Changes
            </button>

            <button
              type="button"
              className="profile-cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </section>

        {/* Account overview */}
        <section className="profile-panel account-overview">
          <h2>Account Overview</h2>

          <div className="account-overview-row">
            <span>Account Type</span>
            <strong>Personal</strong>
          </div>

          <div className="account-overview-row">
            <span>Workspace</span>
            <strong>AnalystHub</strong>
          </div>

          <div className="account-overview-row">
            <span>Profile Storage</span>
            <strong>Local Browser</strong>
          </div>
        </section>
      </form>
    </div>
  );
}

export default MyProfile;