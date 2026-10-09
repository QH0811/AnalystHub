import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";

function Topbar({ darkMode, toggleTheme }) {
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Load saved profile information
  function readProfile() {
    try {
      const saved = localStorage.getItem("analysthub-profile");

      return saved
        ? JSON.parse(saved)
        : {
            fullName: "Qian Han",
            email: "",
            jobTitle: "Data Analyst",
          };
    } catch {
      return {
        fullName: "Qian Han",
        email: "",
        jobTitle: "Data Analyst",
      };
    }
  }

  const [userProfile, setUserProfile] = useState(readProfile);

  // Refresh the profile when it is updated
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

  // Close the profile menu when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // Available pages
  const searchItems = [
    {
      title: "Dashboard",
      description: "View your dataset overview",
      path: "/",
      keywords: "home overview summary",
      icon: "🏠",
    },
    {
      title: "Dataset",
      description: "Upload and preview datasets",
      path: "/dataset",
      keywords: "csv excel upload file data",
      icon: "📁",
    },
    {
      title: "Data Profile",
      description: "Explore columns and data quality",
      path: "/profile",
      keywords: "column missing values statistics",
      icon: "🔍",
    },
    {
      title: "Data Cleaning",
      description: "Review missing values and duplicates",
      path: "/cleaning",
      keywords: "clean remove duplicates null",
      icon: "🧹",
    },
    {
      title: "Analysis",
      description: "Explore charts and statistics",
      path: "/analysis",
      keywords: "chart graph bar histogram pie",
      icon: "📊",
    },
    {
      title: "My Profile",
      description: "Edit your personal information",
      path: "/my-profile",
      keywords: "account name email job title",
      icon: "👤",
    },
  ];

  // Filter search results
  const filteredItems = searchItems.filter((item) => {
    const searchText = searchTerm.toLowerCase().trim();

    if (!searchText) {
      return false;
    }

    return (
      item.title.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText) ||
      item.keywords.toLowerCase().includes(searchText)
    );
  });

  // Keyboard shortcuts
  useEffect(() => {
    function handleShortcut(event) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearchTerm("");
        setProfileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  // Navigate to a selected page
  function openPage(path) {
    navigate(path);
    setSearchTerm("");
    setSearchOpen(false);
    setProfileMenuOpen(false);
    searchRef.current?.blur();
  }

  // Navigate using the first search result when Enter is pressed
  function handleSearchKeyDown(event) {
    if (event.key === "Enter" && filteredItems.length > 0) {
      openPage(filteredItems[0].path);
    }
  }

  // Generate initials from the saved name
  const userInitials = (userProfile.fullName || "Qian Han")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <header className="topbar">
      {/* Global Search */}
      <div className="global-search">
        <div className="search-box">
          <span className="search-icon">🔍</span>

          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            placeholder="Search pages..."
            aria-label="Search AnalystHub pages"
            aria-expanded={
              searchOpen && searchTerm.trim().length > 0
            }
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          <button
            type="button"
            className="search-shortcut"
            onClick={() => {
              searchRef.current?.focus();
              setSearchOpen(true);
            }}
            title="Focus search"
          >
            Ctrl K
          </button>
        </div>

        {/* Search Results */}
        {searchOpen && searchTerm.trim() && (
          <div className="search-results">
            {filteredItems.length > 0 ? (
              <>
                <div className="search-results-heading">
                  PAGES
                </div>

                {filteredItems.map((item) => (
                  <button
                    type="button"
                    className="search-result-item"
                    key={item.path}
                    onClick={() => openPage(item.path)}
                  >
                    <span className="search-result-icon">
                      {item.icon}
                    </span>

                    <span className="search-result-text">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>

                    <span className="search-result-arrow">
                      ↗
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <div className="search-no-results">
                <span>🔎</span>
                <strong>No matching pages</strong>
                <small>
                  Try Dashboard, Dataset, Profile, Cleaning or Analysis.
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right-side actions */}
      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button
          type="button"
          className={`theme-toggle ${darkMode ? "dark" : ""}`}
          onClick={toggleTheme}
          title={
            darkMode
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
          aria-label={
            darkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          <span className="toggle-icon">
            {darkMode ? "🌙" : "☀️"}
          </span>

          <span className="toggle-circle" />
        </button>

        {/* Notification Center: one bell only */}
        <NotificationCenter />

        {/* Profile Dropdown */}
        <div
          className="profile-menu-wrapper"
          ref={profileMenuRef}
        >
          <button
            type="button"
            className="topbar-profile"
            title="My Profile"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() =>
              setProfileMenuOpen((open) => !open)
            }
          >
            <div className="topbar-avatar">
              {userInitials || "QH"}
            </div>

            <div className="topbar-profile-info">
              <strong>
                {userProfile.fullName || "Qian Han"}
              </strong>

              <small>
                {userProfile.jobTitle || "Data Analyst"}
              </small>
            </div>

            <span className="profile-arrow">▼</span>
          </button>

          {/* Dropdown Menu */}
          {profileMenuOpen && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-dropdown-heading">
                <strong>
                  {userProfile.fullName || "Qian Han"}
                </strong>

                <small>Manage your account</small>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => openPage("/my-profile")}
              >
                <span>👤</span>
                My Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;