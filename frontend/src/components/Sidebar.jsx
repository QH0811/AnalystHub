import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Sidebar({ collapsed, toggleSidebar }) {
  // Load saved profile
  function readProfile() {
    try {
      const saved = localStorage.getItem("analysthub-profile");

      return saved
        ? JSON.parse(saved)
        : {
            fullName: "Qian Han",
            jobTitle: "Data Analyst",
          };
    } catch {
      return {
        fullName: "Qian Han",
        jobTitle: "Data Analyst",
      };
    }
  }

  const [userProfile, setUserProfile] = useState(readProfile);

  // Refresh profile when it changes
  useEffect(() => {
    function refreshProfile() {
      setUserProfile(readProfile());
    }

    window.addEventListener(
      "analysthub-profile-updated",
      refreshProfile
    );

    return () => {
      window.removeEventListener(
        "analysthub-profile-updated",
        refreshProfile
      );
    };
  }, []);

  // Generate user initials
  const userInitials = (userProfile.fullName || "Qian Han")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      {/* Logo and toggle */}
      <div className="sidebar-header">
        <div className="logo">
          <img
            src="/analysthub-logo.png"
            alt="AnalystHub Logo"
            className="logo-image"
          />

          <span className="logo-text">AnalystHub</span>
        </div>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="toggle-line" />
          <span className="toggle-line" />
          <span className="toggle-line" />
        </button>
      </div>

      {/* Main navigation */}
      <nav className="navigation">
        <p className="nav-title">WORKSPACE</p>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Dashboard"
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink
          to="/dataset"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Dataset"
        >
          <span className="nav-icon">📁</span>
          <span className="nav-text">Dataset</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Data Profile"
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Data Profile</span>
        </NavLink>

        <NavLink
          to="/cleaning"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Data Cleaning"
        >
          <span className="nav-icon">🧹</span>
          <span className="nav-text">Data Cleaning</span>
        </NavLink>

        <NavLink
          to="/analysis"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Analysis"
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Analysis</span>
        </NavLink>
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          title="Settings"
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </NavLink>

        {/* Dynamic user information */}
        <div className="user-card">
          <div className="avatar">{userInitials || "QH"}</div>

          <div className="user-info">
            <strong>{userProfile.fullName || "Qian Han"}</strong>
            <small>{userProfile.jobTitle || "Data Analyst"}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;