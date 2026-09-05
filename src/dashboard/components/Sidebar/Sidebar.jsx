import React, { useMemo } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import BookOnlineOutlinedIcon from "@mui/icons-material/BookOnlineOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
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
        icon: <GridViewOutlinedIcon sx={{ color: "#d4af37 !important" }} />,
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
        icon: <BookOnlineOutlinedIcon sx={{ color: "#d4af37 !important" }} />,
      },
      {
        label: "Services",
        path: "/dashboard/services",
        icon: <DryCleaningOutlinedIcon sx={{ color: "#d4af37 !important" }} />,
      },
      {
        label: "Customers",
        path: "/dashboard/customers",
        icon: <PeopleOutlineIcon sx={{ color: "#d4af37 !important" }} />,
      },
    ],
  },
  {
    title: "STOREFRONT",
    items: [
      {
        label: "Landing Page",
        path: "/landing",
        icon: <StorefrontOutlinedIcon sx={{ color: "#d4af37 !important" }} />,
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "My Profile",
        path: "/dashboard/profile",
        icon: <PersonOutlineIcon sx={{ color: "#d4af37 !important" }} />,
      },
      {
        label: "Manage Users",
        path: "/dashboard/users",
        icon: (
          <ManageAccountsOutlinedIcon sx={{ color: "#d4af37 !important" }} />
        ),
      },
      {
        label: "Logout",
        path: "/login",
        icon: <LogoutOutlinedIcon sx={{ color: "#d4af37 !important" }} />,
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
    (isSuperAdmin ? "Victory Ranjit" : (currentUser?.email ? currentUser.email.split("@")[0] : "Aparna"));

  const roleLabel =
    isSuperAdmin || role === "superadmin"
      ? "Super Admin"
      : role === "admin"
      ? "Admin"
      : role === "staff"
      ? "Staff"
      : "Customer";

  const avatarChar = (displayName.charAt(0) || "A").toUpperCase();

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
    const isCustomer = !isSuperAdmin && (userRole === "customer" || userRole === "");

    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (isCustomer && (item.path === "/dashboard/users" || item.path === "/dashboard/customers")) {
            return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [role, isSuperAdmin]);


  return (
    <Box
      component="aside"
      className={`dashboard-sidebar ${collapsed ? "collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* Top Header with Brand Logo & Toggle Buttons */}
      <Box className="dashboard-sidebar__top-bar">
        {!collapsed && (
          <Box className="sidebar-brand-wrap">
            <img
              src={textLogo}
              alt="Aparna Saree Pre-Pleating"
              className="sidebar-text-logo"
            />
          </Box>
        )}

        {/* Desktop Collapse Toggle Button */}
        <Tooltip
          title={collapsed ? "Expand Menu" : "Collapse Menu"}
          placement="right"
          arrow
        >
          <IconButton
            onClick={onToggleCollapse}
            className="collapse-toggle-btn desktop-only"
            size="small"
            aria-label="toggle collapse"
          >
            {collapsed ? (
              <MenuIcon sx={{ color: "#d4af37 !important", fontSize: 22 }} />
            ) : (
              <MenuOpenIcon
                sx={{ color: "#d4af37 !important", fontSize: 22 }}
              />
            )}
          </IconButton>
        </Tooltip>

        {/* Mobile Close Button (visible only when mobile drawer is open) */}
        <IconButton
          onClick={onCloseMobile}
          className="mobile-close-btn"
          size="small"
          aria-label="close menu"
        >
          <CloseIcon sx={{ color: "#d4af37 !important", fontSize: 22 }} />
        </IconButton>
      </Box>

      {/* Scrollable Navigation List with Section Dividers */}
      <Box className="dashboard-sidebar__scroll-area">
        {filteredNavSections.map((section) => (
          <Box key={section.title} className="nav-section-group">
            {/* Section Header with Horizontal Divider Line */}
            {!collapsed && (
              <Box className="nav-section-header">
                <Typography variant="caption" className="section-title">
                  {section.title}
                </Typography>
                <Box className="section-line" />
              </Box>
            )}

            {/* Section Items */}
            <List disablePadding className="section-list">
              {section.items.map((item) => {
                const isLogout = item.label === "Logout";
                const isActive = !isLogout && isItemActive(item);
                const buttonContent = (
                  <ListItemButton
                    key={item.label}
                    component={isLogout ? "div" : NavLink}
                    to={isLogout ? undefined : item.path}
                    end={isLogout ? undefined : item.end}
                    onClick={(e) => handleItemClick(item, e)}
                    className={`nav-item ${isActive ? "active" : ""} ${isLogout ? "nav-item--logout" : ""}`}
                    sx={{
                      borderRadius: "10px !important",
                      margin: "2px 0",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: isLogout ? "rgba(239, 68, 68, 0.15) !important" : "rgb(32 28 16) !important",
                        borderRadius: "10px !important",
                        "& .nav-icon svg, & .MuiTypography-root": {
                          color: isLogout ? "#ef4444 !important" : undefined,
                        },
                      },
                      "&.active, &.Mui-selected": {
                        backgroundColor: "rgb(32 28 16) !important",
                        borderRadius: "10px !important",
                      },
                    }}
                  >
                    <ListItemIcon className="nav-icon">
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText primary={item.label} className="nav-text" />
                    )}
                  </ListItemButton>
                );


                return collapsed ? (
                  <Tooltip
                    key={item.label}
                    title={item.label}
                    placement="right"
                    arrow
                  >
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom User Profile Section (Pinned to Bottom of Screen) */}
      <Box className="dashboard-sidebar__profile-bottom">
        {collapsed ? (
          <Tooltip title={`${displayName} (${roleLabel}) - My Profile`} placement="right" arrow>
            <Box
              className="avatar-wrapper-collapsed"
              onClick={() => {
                navigate("/dashboard/profile");
                if (onCloseMobile) onCloseMobile();
              }}
              sx={{ cursor: "pointer" }}
            >
              <Avatar alt={displayName} className="user-avatar-squircle">
                {avatarChar}
              </Avatar>
              <span className="online-dot" />
            </Box>
          </Tooltip>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <Box
              className="profile-left"
              onClick={() => {
                navigate("/dashboard/profile");
                if (onCloseMobile) onCloseMobile();
              }}
              sx={{ cursor: "pointer", flex: 1, minWidth: 0, mr: 1 }}
            >
              <Box className="avatar-wrapper">
                <Avatar alt={displayName} className="user-avatar-squircle">
                  {avatarChar}
                </Avatar>
                <span className="online-dot" />
              </Box>
              <Box className="user-details" sx={{ overflow: "hidden" }}>
                <Typography className="user-name" noWrap title={displayName}>
                  {displayName}
                </Typography>
                <Box className="role-line">
                  <VerifiedUserOutlinedIcon
                    className="verified-icon"
                    sx={{ color: "#d4af37 !important" }}
                  />
                  <Typography className="role-title">{roleLabel}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Direct My Profile Icon Button in Profile Card */}
            <Tooltip title="My Profile" arrow>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/dashboard/profile");
                  if (onCloseMobile) onCloseMobile();
                }}
                className="profile-quick-nav-btn"
                size="small"
                aria-label="my profile"
                sx={{
                  color: "rgba(212, 175, 55, 0.9) !important",
                  padding: "6px",
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  backgroundColor: "rgba(212, 175, 55, 0.06)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    color: "#0a0a0a !important",
                    backgroundColor: "#d4af37 !important",
                    borderColor: "#d4af37",
                    transform: "scale(1.05)",
                    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.35)",
                  },
                }}
              >
                <PersonOutlineIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>


    </Box>
  );
};

export default Sidebar;
