import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BookOnlineOutlinedIcon from '@mui/icons-material/BookOnlineOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { useAuth } from '../../../auth/context/AuthContext';
import './CurvedBottomBar.scss';

/**
 * CurvedBottomBar
 * Fixed 100% width bottom navigation bar with luxury obsidian & gold styling.
 * Smoothly scales up icon size on hover with spring animation.
 * Features Home, Orders, Services, Clients/Store, and Menu (opens sidebar).
 */
export const CurvedBottomBar = ({
  collapsed = false,
  mobileOpen = false,
  onOpenSidebar,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, role } = useAuth();
  const [ripplingId, setRipplingId] = useState(null);

  const userRole = (role || '').toLowerCase();
  const isClient = !isSuperAdmin && (userRole === 'client' || userRole === '');

  // Configure navigation items matching the luxury dashboard layout
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/dashboard',
      exact: true,
      icon: <HomeOutlinedIcon className="nav-bar-icon" />,
    },
    {
      id: 'bookings',
      label: 'Orders',
      path: '/dashboard/bookings',
      icon: <BookOnlineOutlinedIcon className="nav-bar-icon" />,
    },
    {
      id: 'services',
      label: 'Services',
      path: '/dashboard/services',
      icon: <DryCleaningOutlinedIcon className="nav-bar-icon" />,
    },
    {
      id: isClient ? 'storefront' : 'clients',
      label: isClient ? 'Store' : 'Clients',
      path: isClient ? '/landing' : '/dashboard/clients',
      icon: isClient ? (
        <StorefrontOutlinedIcon className="nav-bar-icon" />
      ) : (
        <PeopleOutlineIcon className="nav-bar-icon" />
      ),
    },
    {
      id: 'more',
      label: 'Menu',
      icon: <MenuOutlinedIcon className="nav-bar-icon" />,
    },
  ];

  const isItemActive = (item) => {
    if (item.id === 'more') {
      return false;
    }
    if (item.id === 'clients') {
      return location.pathname.startsWith('/dashboard/clients');
    }
    if (item.exact) {
      return location.pathname === item.path;
    }
    return Boolean(item.path && location.pathname.startsWith(item.path));
  };

  const handleNav = (item) => {
    setRipplingId(item.id);
    setTimeout(() => setRipplingId(null), 350);
    if (item.id === 'more') {
      if (onOpenSidebar) {
        onOpenSidebar();
      }
      return;
    }
    navigate(item.path);
  };

  return (
    <nav
      className={`fixed-bottom-bar-wrapper ${collapsed ? 'is-collapsed-sidebar' : ''} ${
        mobileOpen ? 'is-mobile-drawer-open' : ''
      }`}
      aria-label="Bottom Navigation Menu"
    >
      <div className="fixed-bottom-bar-content">
        {navItems.map((item) => {
          const active = isItemActive(item);
          const rippling = ripplingId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${active ? 'is-active' : ''} ${rippling ? 'is-rippling' : ''}`}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              title={item.label}
            >
              {active && <span className="active-top-pill" />}
              <div className="bottom-nav-item__inner">
                <div className="icon-container">
                  {active && <span className="active-spotlight" />}
                  <span className="icon-wrapper">{item.icon}</span>
                </div>
                <span className="nav-label">{item.label}</span>
              </div>
              <span className="android-ripple" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CurvedBottomBar;
