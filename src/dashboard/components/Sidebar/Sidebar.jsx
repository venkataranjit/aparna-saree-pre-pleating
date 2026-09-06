import React, { useMemo } from "react";
import { Tooltip } from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import BookOnlineOutlinedIcon from "@mui/icons-material/BookOnlineOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import textLogo from "../../../assets/text-logo.png";
import "./Sidebar.scss";

const navSections = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Overview",
        path: "/dashboard",
        icon: <GridViewOutlinedIcon />,
        end: true,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Orders",
        path: "/dashboard/bookings",
        icon: <BookOnlineOutlinedIcon />,
      },
      {
        label: "Services",
        path: "/dashboard/services",
        icon: <DryCleaningOutlinedIcon />,
      },
      {
        label: "Customers",
        path: "/dashboard/customers",
        icon: <PeopleOutlineIcon />,
      },
    ],
  },
  {
    title: "STOREFRONT",
    items: [
      {
        label: "Landing Page",
        path: "/landing",
        icon: <StorefrontOutlinedIcon />,
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "My Profile",
        path: "/dashboard/profile",
        icon: <PersonOutlineIcon />,
      },
      {
        label: "Manage Users",
        path: "/dashboard/users",
        icon: <ManageAccountsOutlinedIcon />,
      },
      {
        label: "Logout",
        path: "/login",
        icon: <LogoutOutlinedIcon />,
      },
    ],
  },
];

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, isSuperAdmin, role, logout } = useAuth();

  const displayName =
    userProfile?.username ||
    currentUser?.displayName ||
    (isSuperAdmin
      ? "Victory Ranjit"
      : currentUser?.email
      ? currentUser.email.split("@")[0]
      : currentUser
      ? "Customer"
      : "");

  const roleLabel =
    isSuperAdmin || role === "superadmin"
      ? "Super Admin"
      : role === "admin"
      ? "Admin"
      : role === "staff"
      ? "Staff"
      : currentUser || userProfile
      ? "Customer"
      : "";

  const avatarChar = displayName ? displayName.charAt(0).toUpperCase() : "";

  const handleItemClick = async (item, e) => {
    if (item.label === "Logout") {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      try {
        await logout();
      } catch (err) {
        console.warn("Logout error:", err);
      }
      if (onCloseMobile) onCloseMobile();
      navigate("/login", { replace: true });
      return;
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (item) => {
    if (item.end) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  // Filter navigation items based on role (hide Manage Users and Customers for customers)
  const filteredNavSections = useMemo(() => {
    const userRole = (role || "").toLowerCase();
    const isCustomer =
      !isSuperAdmin && (userRole === "customer" || userRole === "");

    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (
            isCustomer &&
            (item.path === "/dashboard/users" ||
              item.path === "/dashboard/customers")
          ) {
            return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [role, isSuperAdmin]);

  return (
    <aside
      className={`dashboard-sidebar ${collapsed ? "collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Top Header with Brand Logo & Toggle Buttons */}
      <div className="dashboard-sidebar__top-bar">
        <div className="sidebar-brand-wrap">
          <img
            src={textLogo}
            alt="Aparna Saree Pre-Pleating"
            className="sidebar-text-logo"
          />
        </div>

        {/* Desktop Collapse Toggle Button */}
        <Tooltip
          title={collapsed ? "Expand Menu" : "Collapse Menu"}
          placement="right"
          arrow
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="collapse-toggle-btn desktop-only"
            aria-label="toggle collapse"
          >
            <MenuOpenIcon
              className={`collapse-icon ${collapsed ? "rotated" : ""}`}
            />
          </button>
        </Tooltip>

        {/* Mobile Close Button (visible only when mobile drawer is open) */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="mobile-close-btn"
          aria-label="close menu"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable Navigation List with Section Dividers */}
      <div className="dashboard-sidebar__scroll-area">
        {filteredNavSections.map((section) => (
          <div key={section.title} className="nav-section-group">
            {/* Section Header with Horizontal Divider Line */}
            <div className="nav-section-header">
              <span className="section-title">{section.title}</span>
              <div className="section-line" />
            </div>

            {/* Section Items */}
            <nav className="section-list">
              {section.items.map((item) => {
                const isLogout = item.label === "Logout";
                const isActive = !isLogout && isItemActive(item);

                const itemContent = (
                  <>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">
                      <span className="nav-text-label">{item.label}</span>
                    </span>
                  </>
                );

                return (
                  <Tooltip
                    key={item.label}
                    title={collapsed ? item.label : ""}
                    placement="right"
                    arrow
                    disableHoverListener={!collapsed}
                    disableFocusListener={!collapsed}
                    disableTouchListener={!collapsed}
                  >
                    {isLogout ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleItemClick(item, e)}
                        className={`nav-item nav-item--logout`}
                      >
                        {itemContent}
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        end={item.end}
                        onClick={(e) => handleItemClick(item, e)}
                        className={`nav-item ${isActive ? "active" : ""}`}
                      >
                        {itemContent}
                      </NavLink>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom User Profile Section (Pinned to Bottom of Screen) */}
      <Tooltip
        title={collapsed ? `${displayName} (${roleLabel}) - My Profile` : ""}
        placement="right"
        arrow
        disableHoverListener={!collapsed}
        disableFocusListener={!collapsed}
        disableTouchListener={!collapsed}
      >
        <div
          className="dashboard-sidebar__profile-bottom"
          onClick={() => {
            navigate("/dashboard/profile");
            if (onCloseMobile) onCloseMobile();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="profile-inner-row">
            <div className="avatar-wrapper">
              <div className="user-avatar-squircle">
                {avatarChar ? (
                  <span className="avatar-char">{avatarChar}</span>
                ) : (
                  <PersonOutlineIcon />
                )}
              </div>
              <span className="online-dot" />
            </div>

            <div className="user-details">
              <span className="user-name" title={displayName || "Account"}>
                {displayName || "Loading..."}
              </span>
              <div className="role-line">
                <VerifiedUserOutlinedIcon className="verified-icon" />
                <span className="role-title">{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </Tooltip>
    </aside>
  );
};

export default Sidebar;
