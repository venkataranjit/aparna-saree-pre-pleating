import React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import './Header.scss';

const Header = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    navigate('/login', { replace: true });
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__toolbar">
        {/* Mobile menu hamburger toggle - visible only on mobile/tablet */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="mobile-menu-trigger"
          aria-label="open navigation menu"
        >
          <MenuIcon />
        </button>

        {/* Mobile Navigation Title */}
        <div className="dashboard-header__title-container">
          <h2 className="dashboard-header__title">
            Dashboard
          </h2>
        </div>

        {/* Mobile Logout Action */}
        <button
          type="button"
          onClick={handleLogout}
          className="mobile-logout-btn"
          aria-label="logout"
          title="Log Out"
        >
          <LogoutOutlinedIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;
