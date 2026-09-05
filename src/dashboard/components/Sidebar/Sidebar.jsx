import React from "react";
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
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { NavLink, useLocation } from "react-router-dom";
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
        label: "Manage Users",
        path: "/dashboard/users",
        icon: (
          <ManageAccountsOutlinedIcon sx={{ color: "#d4af37 !important" }} />
        ),
      },
      {
        label: "Logout",
        path: "/landing",
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

  const handleItemClick = () => {
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
        {navSections.map((section) => (
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
                const isActive = isItemActive(item);
                const buttonContent = (
                  <ListItemButton
                    key={item.label}
                    component={NavLink}
                    to={item.path}
                    end={item.end}
                    onClick={handleItemClick}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    sx={{
                      borderRadius: "10px !important",
                      margin: "2px 0",
                      "&:hover": {
                        backgroundColor: "rgb(32 28 16) !important",
                        borderRadius: "10px !important",
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
          <Tooltip title="Aparna (Super Admin)" placement="right" arrow>
            <Box className="avatar-wrapper-collapsed">
              <Avatar alt="Aparna" className="user-avatar-squircle">
                A
              </Avatar>
              <span className="online-dot" />
            </Box>
          </Tooltip>
        ) : (
          <>
            <Box className="profile-left">
              <Box className="avatar-wrapper">
                <Avatar alt="Aparna" className="user-avatar-squircle">
                  A
                </Avatar>
                <span className="online-dot" />
              </Box>
              <Box className="user-details">
                <Typography className="user-name">Aparna</Typography>
                <Box className="role-line">
                  <VerifiedUserOutlinedIcon
                    className="verified-icon"
                    sx={{ color: "#d4af37 !important" }}
                  />
                  <Typography className="role-title">Super Admin</Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
