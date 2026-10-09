import { useState } from "react";
import "./App.css";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Dataset from "./pages/Dataset";
import Profile from "./pages/Profile";
import Cleaning from "./pages/Cleaning";
import Analysis from "./pages/Analysis";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";


function App() {

  // Theme state
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);


  // Toggle theme
  function toggleTheme() {

    const newMode = !darkMode;

    setDarkMode(newMode);

    localStorage.setItem(
      "theme",
      newMode ? "dark" : "light"
    );
  }


  // Toggle sidebar
  function toggleSidebar() {

    setSidebarCollapsed(
      (current) => !current
    );

  }


  return (
    <BrowserRouter>

      <div
        className={[
          "app",
          darkMode ? "dark-mode" : "",
          sidebarCollapsed
            ? "sidebar-collapsed"
            : "",
        ].join(" ")}
      >

        {/* Sidebar */}

        <Sidebar
          collapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />


        {/* Main area */}

        <div
          className={
            sidebarCollapsed
              ? "main-area sidebar-collapsed"
              : "main-area"
          }
        >

          {/* Topbar */}

          <Topbar
            darkMode={darkMode}
            toggleTheme={toggleTheme}
          />


          {/* Page content */}

          <main className="main-content">

            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
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