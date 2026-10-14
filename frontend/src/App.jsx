import { useState } from "react";
import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Overview from "./pages/Overview";
import Dashboards from "./pages/Dashboards";
import Dataset from "./pages/Dataset";
import Profile from "./pages/Profile";
import Cleaning from "./pages/Cleaning";
import Analysis from "./pages/Analysis";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  function toggleTheme() {
    const newMode = !darkMode;
    setDarkMode(newMode);

    localStorage.setItem(
      "theme",
      newMode ? "dark" : "light"
    );
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => !current);
  }

  return (
    <BrowserRouter>
      <div
        className={[
          "app",
          darkMode ? "dark-mode" : "",
          sidebarCollapsed ? "sidebar-collapsed" : "",
        ].join(" ")}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        <div
          className={
            sidebarCollapsed
              ? "main-area sidebar-collapsed"
              : "main-area"
          }
        >
          <Topbar
            darkMode={darkMode}
            toggleTheme={toggleTheme}
          />

          <main className="main-content">
            <Routes>
              <Route
                path="/"
                element={<Overview />}
              />

              <Route
                path="/dashboards"
                element={<Dashboards />}
              />

              <Route
                path="/dataset"
                element={<Dataset />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/cleaning"
                element={<Cleaning />}
              />

              <Route
                path="/analysis"
                element={<Analysis />}
              />

              <Route
                path="/my-profile"
                element={<MyProfile />}
              />

              <Route
                path="/settings"
                element={
                  <Settings
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;