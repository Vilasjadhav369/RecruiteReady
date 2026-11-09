import Logo from "../common/Logo.jsx";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed.js";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount.js";
import { calculateProfileCompletion } from "../../utils/profileCompletion.js";
import {
  DashboardIcon,
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ResourcesIcon,
  ProgressIcon,
  ProfileIcon,
  LogoutIcon,
  CloseIcon,
  StarIcon,
  TrophyIcon,
  BellIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
} from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import { Tooltip } from "../ui/Tooltip.jsx";

const NAV_GROUPS = [
  {
    items: [
      { label: "Dashboard", to: "/dashboard", icon: DashboardIcon },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { label: "Aptitude", to: "/aptitude", icon: AptitudeIcon },
      { label: "Coding", to: "/coding", icon: CodingIcon },
      { label: "Mock Tests", to: "/mock-tests", icon: MockTestIcon },
      { label: "Companies", to: "/companies", icon: CompanyIcon },
    ],
  },
  {
    title: "LIBRARY",
    items: [
      { label: "Study Materials", to: "/resources", icon: ResourcesIcon },
      { label: "Saved Items", to: "/saved", icon: BookmarkIcon },
    ],
  },
  {
    title: "PERFORMANCE",
    items: [
      { label: "Progress", to: "/progress", icon: ProgressIcon },
      { label: "Leaderboard", to: "/leaderboard", icon: TrophyIcon },
      { label: "Reviews", to: "/reviews", icon: StarIcon },
    ],
  },
];

/**
 * Capitalize display name safely in the view only without mutating the stored user.
 */
function formatDisplayName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Check whether a navigation route is active, including sub-paths.
 */
function isNavActive(pathname, itemPath) {
  if (itemPath === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * StudentSidebar — Swiss Monochrome desktop sidebar & accessible mobile drawer.
 */
function StudentSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { preference, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed("student");
  const prefersReduced = useReducedMotion();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const menuItemsRef = useRef([]);
  const prevPathRef = useRef(location.pathname);

  // Shared TanStack Query for unread count (consolidated via useUnreadNotificationCount)
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Calculate profile completion
  const profileCompletion = user ? calculateProfileCompletion(user) : null;
  const isProfileComplete = profileCompletion?.isComplete ?? true;
  const profilePercentage = profileCompletion?.percentage ?? 100;

  // Safe capitalized user names
  const rawFullName = user?.firstName
    ? `${user.firstName} ${user?.lastName || ""}`.trim()
    : "Student User";
  const formattedDisplayName = formatDisplayName(rawFullName) || "Student";
  const userEmail = user?.email || "student@recruitready.edu";

  // Close menus & drawers on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (setMobileOpen) setMobileOpen(false);
      setUserMenuOpen(false);
    }
  }, [location.pathname, setMobileOpen]);

  // Keyboard shortcut '[' to toggle sidebar collapse when not typing
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable);

      if (!isTyping && e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  // Close user menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleMenuKeyDown = (e) => {
      if (!userMenuOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setUserMenuOpen(false);
        userButtonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const items = menuItemsRef.current.filter(Boolean);
        const currentIndex = items.indexOf(document.activeElement);
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const items = menuItemsRef.current.filter(Boolean);
        const currentIndex = items.indexOf(document.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleMenuKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleMenuKeyDown);
    };
  }, [userMenuOpen]);

  // Mobile drawer: body scroll lock, Escape key, and focus trap
  useEffect(() => {
    if (mobileOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = "hidden";

      const handleDrawerKeyDown = (e) => {
        if (e.key === "Escape" && setMobileOpen) {
          e.preventDefault();
          setMobileOpen(false);
        }

        // Focus trap
        if (e.key === "Tab" && drawerRef.current) {
          const focusableEls = drawerRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableEls.length === 0) return;
          const firstEl = focusableEls[0];
          const lastEl = focusableEls[focusableEls.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleDrawerKeyDown);

      // Focus first element in drawer
      requestAnimationFrame(() => {
        const firstFocusable = drawerRef.current?.querySelector("button, a");
        firstFocusable?.focus();
      });

      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleDrawerKeyDown);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [mobileOpen, setMobileOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    if (setMobileOpen) setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const handleOpenShortcuts = () => {
    setUserMenuOpen(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
  };

  // Nav Item renderer
  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isNavActive(location.pathname, item.to);

    const linkEl = (
      <Link
        to={item.to}
        onClick={() => setMobileOpen && setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={`relative min-h-9 flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:min-h-11 ${
          active
            ? "bg-primary-tint text-ink font-semibold before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary before:rounded-r"
            : "text-ink-2 hover:bg-primary-tint/60 hover:text-ink"
        }`}
        aria-current={active ? "page" : undefined}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            active ? "text-ink" : "text-ink-2"
          }`}
        />
        <span className="rr-nav-label truncate">{item.label}</span>
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.to} content={item.label} position="right" delay={300} className="w-full">
          {linkEl}
        </Tooltip>
      );
    }

    return <React.Fragment key={item.to}>{linkEl}</React.Fragment>;
  };

  // Navigation Body Content
  const navContent = (
    <div className="flex flex-col h-full bg-card">
      {/* ── Brand & Header Row (h-14) ───────────────────────── */}
      <div className="h-14 px-3 border-b border-border flex items-center justify-between shrink-0">
        {collapsed ? (
          <div className="w-full flex items-center justify-center">
            <Tooltip content="Expand sidebar ([)" position="right" delay={300}>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                aria-expanded={false}
                className="w-8 h-8 rounded-md flex items-center justify-center text-ink-2 hover:text-ink hover:bg-primary-tint/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Logo variant="symbol" size={26} asLink={false} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <>
            <Logo variant="compact" size="sm" to="/dashboard" />

            {/* Desktop collapse button */}
            <div className="hidden md:block">
              <Tooltip content="Collapse sidebar ([)" position="bottom" delay={300}>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  className="w-7 h-7 rounded flex items-center justify-center text-ink-2 hover:text-ink hover:bg-primary-tint/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Mobile close button */}
            {setMobileOpen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-primary-tint/60 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close navigation drawer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation Links (space-y-3) ────────────── */}
      <nav
        className="flex-1 px-2.5 py-3 space-y-3 overflow-y-auto"
        aria-label="Student portal navigation"
      >
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.title || `group-${groupIdx}`} className="space-y-1">
            {group.title ? (
              <>
                <span className="rr-nav-group px-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-2 block mb-1">
                  {group.title}
                </span>
                <div className="rr-nav-divider" aria-hidden="true" />
              </>
            ) : null}

            {group.items.map((item) => renderNavItem(item))}
          </div>
        ))}
      </nav>

      {/* ── Optional Profile Progress Line ──────────── */}
      {!isProfileComplete && (
        <div className="px-3 py-2 border-t border-border rr-nav-hide shrink-0">
          <Link
            to="/profile"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="block group no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
            aria-label={`Profile ${profilePercentage}% complete. Click to finish profile.`}
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-ink-2 group-hover:text-ink font-medium transition-colors">
                Profile completion
              </span>
              <span className="text-ink font-semibold">{profilePercentage}%</span>
            </div>
            <div className="h-1 w-full bg-primary-soft rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${profilePercentage}%` }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* ── User Footer & Upward Popover Menu (~56px) ─────────────── */}
      <div className="p-2 border-t border-border bg-card relative shrink-0">
        {/* User Card Trigger Button */}
        <button
          ref={userButtonRef}
          type="button"
          id="user-menu-button"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          aria-label={
            unreadCount > 0
              ? `User menu for ${formattedDisplayName}. Notifications: ${unreadCount} unread.`
              : `User menu for ${formattedDisplayName}`
          }
          className={`w-full min-h-[44px] flex items-center rounded-lg p-1.5 transition-colors cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            userMenuOpen ? "bg-primary-tint" : "hover:bg-primary-tint/60"
          } ${collapsed ? "justify-center" : "gap-2.5 justify-between"}`}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <Avatar name={formattedDisplayName} src={user?.profilePhoto} size="sm" />
            {collapsed && unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card"
                aria-label={`Notifications, ${unreadCount} unread`}
              />
            )}
          </div>

          <div className="rr-nav-hide min-w-0 flex-1">
            <span className="text-[13px] font-medium text-ink truncate block">
              {formattedDisplayName}
            </span>
            <span
              className="text-[11px] text-ink-2 truncate block font-sans"
              title={userEmail}
            >
              {userEmail}
            </span>
          </div>

          <div className="rr-nav-hide text-ink-2 shrink-0">
            {userMenuOpen ? (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {/* Upward Floating Popover Menu */}
        {userMenuOpen && (
          <div
            ref={userMenuRef}
            role="menu"
            aria-labelledby="user-menu-button"
            className={`absolute bottom-full mb-2 bg-card border border-border rounded-lg shadow-lg z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 ${
              collapsed
                ? "left-2 w-60"
                : "left-2 right-2 max-w-[calc(100%-1rem)]"
            }`}
          >
            {/* User Details Header */}
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <span className="font-semibold text-ink block truncate text-[13px]">
                {formattedDisplayName}
              </span>
              <span className="text-[11px] text-ink-2 block truncate font-sans" title={userEmail}>
                {userEmail}
              </span>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
              <Link
                ref={(el) => (menuItemsRef.current[0] = el)}
                to="/profile"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink-2 hover:text-ink hover:bg-primary-tint/60 rounded-md transition-colors no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <ProfileIcon className="w-4 h-4 text-ink-2" />
                <span>My Profile</span>
              </Link>

              <Link
                ref={(el) => (menuItemsRef.current[1] = el)}
                to="/notifications"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-ink-2 hover:text-ink hover:bg-primary-tint/60 rounded-md transition-colors no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-center gap-2">
                  <BellIcon className="w-4 h-4 text-ink-2" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span
                    className="px-1.5 py-0.2 min-w-4 text-[10px] font-bold rounded-full bg-primary text-surface inline-flex items-center justify-center leading-none"
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Appearance Mode Segment */}
              <div className="px-2.5 py-1.5 border-t border-border mt-1">
                <span className="text-[11px] font-medium text-ink-2 block mb-1.5">
                  Appearance
                </span>
                <div
                  className="grid grid-cols-3 gap-1 p-0.5 bg-primary-soft rounded-md border border-border"
                  role="group"
                  aria-label="Appearance theme preference"
                >
                  {["light", "dark", "system"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="menuitem"
                      onClick={() => setTheme(mode)}
                      className={`px-1.5 py-1 text-[11px] capitalize rounded transition-colors cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        preference === mode
                          ? "bg-card text-ink font-semibold border border-border/80"
                          : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts Trigger */}
              <button
                ref={(el) => (menuItemsRef.current[2] = el)}
                type="button"
                role="menuitem"
                onClick={handleOpenShortcuts}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-ink-2 hover:text-ink hover:bg-primary-tint/60 rounded-md transition-colors cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>Keyboard shortcuts</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-border bg-primary-soft rounded text-ink-2">
                  ?
                </kbd>
              </button>

              <div className="my-1 border-t border-border" role="separator" />

              {/* Sign Out Button */}
              <button
                ref={(el) => (menuItemsRef.current[3] = el)}
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 rounded-md transition-colors cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <LogoutIcon className="w-4 h-4 text-danger" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        data-collapsed={collapsed}
        className="rr-sidebar hidden md:block w-64 h-dvh sticky top-0 bg-card border-r border-border shrink-0 z-30"
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 bottom-0 left-0 w-64 max-w-[85vw] bg-card z-50 md:hidden border-r border-border shadow-2xl ${
          prefersReduced
            ? ""
            : "transform transition-transform duration-200 ease-in-out"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        inert={!mobileOpen ? "" : undefined}
        aria-label="Student navigation menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default StudentSidebar;
