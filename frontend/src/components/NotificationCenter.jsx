import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "analysthub-notifications";
const NOTIFICATION_SETTING_KEY =
  "analysthub-notifications-enabled";

// Load saved notifications
function loadNotifications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((notification) => ({
      ...notification,
      read: notification.read === true,
    }));
  } catch {
    return [];
  }
}

// Save notifications and notify other components
function persistNotifications(notifications) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );

    window.dispatchEvent(
      new Event("analysthub-notifications-updated")
    );

    return true;
  } catch (error) {
    console.error("Unable to save notifications:", error);
    return false;
  }
}

// Check whether notifications are enabled in Settings
function areNotificationsEnabled() {
  return (
    localStorage.getItem(NOTIFICATION_SETTING_KEY) !== "false"
  );
}

// Add a notification from anywhere in AnalystHub
export function addNotification({
  title,
  message,
  type = "info",
  path = "/",
}) {
  // Do not create new notifications when disabled
  if (!areNotificationsEnabled()) {
    return;
  }

  const notification = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title,
    message,
    type,
    path,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const updated = [
    notification,
    ...loadNotifications(),
  ].slice(0, 50);

  persistNotifications(updated);
}

function NotificationCenter() {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [notifications, setNotifications] =
    useState(loadNotifications);

  const [isOpen, setIsOpen] = useState(false);

  // Calculate unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Refresh notifications when they change
  useEffect(() => {
    function refreshNotifications() {
      setNotifications(loadNotifications());
    }

    window.addEventListener(
      "analysthub-notifications-updated",
      refreshNotifications
    );

    window.addEventListener("storage", refreshNotifications);

    return () => {
      window.removeEventListener(
        "analysthub-notifications-updated",
        refreshNotifications
      );

      window.removeEventListener(
        "storage",
        refreshNotifications
      );
    };
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
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

  // Save changes and refresh the interface
  function saveNotifications(updated) {
    if (persistNotifications(updated)) {
      setNotifications(updated);
    }
  }

  // Mark one notification as read
  function markAsRead(id) {
    const updated = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, read: true }
        : notification
    );

    saveNotifications(updated);
  }

  // Mark all notifications as read
  function markAllAsRead() {
    if (unreadCount === 0) return;

    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));

    saveNotifications(updated);
  }

  // Clear all notifications
  function clearAll() {
    saveNotifications([]);
  }

  // Open the related page
  function openNotification(notification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    setIsOpen(false);
    navigate(notification.path || "/");
  }

  // Display a readable time
  function formatTime(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const difference = Math.max(
      0,
      Date.now() - date.getTime()
    );

    if (difference < 60_000) return "Just now";

    if (difference < 3_600_000) {
      return `${Math.floor(difference / 60_000)} min ago`;
    }

    if (difference < 86_400_000) {
      return `${Math.floor(difference / 3_600_000)} hr ago`;
    }

    return date.toLocaleDateString();
  }

  return (
    <div className="notification-wrapper" ref={panelRef}>
      {/* Notification Bell */}
      <button
        type="button"
        className="icon-button notification-button"
        title="Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className="notification-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {/* Notification Actions */}
          {notifications.length > 0 && (
            <div className="notification-toolbar">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={
                  unreadCount === 0 ? "is-disabled" : ""
                }
              >
                Mark all as read
              </button>

              <button
                type="button"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">
                  🔔
                </span>

                <strong>No notifications yet</strong>

                <p>
                  Dataset uploads and cleaning activities will
                  appear here when those events occur.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item ${
                    notification.read
                      ? "is-read"
                      : "is-unread"
                  }`}
                  onClick={() =>
                    openNotification(notification)
                  }
                >
                  <span
                    className={`notification-type-icon ${
                      notification.type || "info"
                    }`}
                  >
                    {notification.type === "success"
                      ? "✓"
                      : notification.type === "warning"
                      ? "!"
                      : notification.type === "error"
                      ? "×"
                      : "i"}
                  </span>

                  <span className="notification-item-content">
                    <strong>{notification.title}</strong>

                    <span>{notification.message}</span>

                    <small>
                      {formatTime(notification.createdAt)}
                    </small>
                  </span>

                  {!notification.read && (
                    <span className="notification-unread-dot" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;