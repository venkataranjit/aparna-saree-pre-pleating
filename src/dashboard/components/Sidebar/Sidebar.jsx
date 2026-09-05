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
    (isSuperAdmin ? "Victory Ranjit" : (currentUser?.email ? currentUser.email.split("@")[0] : (currentUser ? "Customer" : "")));

  const roleLabel =
    isSuperAdmin || role === "superadmin"
      ? "Super Admin"
      : role === "admin"
      ? "Admin"
      : role === "staff"
      ? "Staff"
      : (currentUser || userProfile ? "Customer" : "");

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
        <Box className="sidebar-brand-wrap">
          <img
            src={textLogo}
            alt="Aparna Saree Pre-Pleating"
            className="sidebar-text-logo"
          />
        </Box>

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
            <MenuOpenIcon
              className={`collapse-icon ${collapsed ? "rotated" : ""}`}
              sx={{ color: "#d4af37 !important", fontSize: 22 }}
            />
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
            <Box className="nav-section-header">
              <Typography variant="caption" className="section-title">
                {section.title}
              </Typography>
              <Box className="section-line" />
            </Box>

            {/* Section Items */}
            <List disablePadding className="section-list">
              {section.items.map((item) => {
                const isLogout = item.label === "Logout";
                const isActive = !isLogout && isItemActive(item);

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
                    <ListItemButton
                      component={isLogout ? "div" : NavLink}
                      to={isLogout ? undefined : item.path}
                      end={isLogout ? undefined : item.end}
                      onClick={(e) => handleItemClick(item, e)}
                      className={`nav-item ${isActive ? "active" : ""} ${isLogout ? "nav-item--logout" : ""}`}
                    >
                      <ListItemIcon className="nav-icon">
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} className="nav-text" />
                    </ListItemButton>
                  </Tooltip>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom User Profile Section (Pinned to Bottom of Screen) */}
      <Tooltip
        title={collapsed ? `${displayName} (${roleLabel}) - My Profile` : ""}
        placement="right"
        arrow
        disableHoverListener={!collapsed}
        disableFocusListener={!collapsed}
        disableTouchListener={!collapsed}
      >
        <Box
          className="dashboard-sidebar__profile-bottom"
          onClick={() => {
            navigate("/dashboard/profile");
            if (onCloseMobile) onCloseMobile();
          }}
        >
          <Box className="profile-inner-row">
            <Box className="avatar-wrapper">
              <Avatar alt={displayName} className="user-avatar-squircle">
                {avatarChar || <PersonOutlineIcon sx={{ fontSize: 20, color: '#000000 !important' }} />}
              </Avatar>
              <span className="online-dot" />
            </Box>

            <Box className="user-details">
              <Typography className="user-name" noWrap title={displayName || 'Account'}>
                {displayName || 'Loading...'}
              </Typography>
              <Box className="role-line">
                <VerifiedUserOutlinedIcon
                  className="verified-icon"
                  sx={{ color: "#d4af37 !important" }}
                />
                <Typography className="role-title">{roleLabel}</Typography>
              </Box>
            </Box>

            <Box className="profile-action-btn-wrap">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/dashboard/profile");
                  if (onCloseMobile) onCloseMobile();
                }}
                className="profile-quick-nav-btn"
                size="small"
                aria-label="my profile"
              >
                <PersonOutlineIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Tooltip>


    </Box>
  );
};

export default Sidebar;
