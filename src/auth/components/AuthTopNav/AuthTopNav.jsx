import React from 'react';
import { Link } from 'react-router-dom';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { ThemeToggle } from '../../../components/common/ThemeToggle/ThemeToggle';
import './AuthTopNav.scss';

const AuthTopNav = () => {
  return (
    <header className="auth-top-nav">
      <Link to="/landing" className="auth-top-nav__storefront" title="Return to Storefront">
        <StorefrontOutlinedIcon className="storefront-icon" />
        <span className="storefront-text">Storefront</span>
      </Link>
      <div className="auth-top-nav__actions">
        <ThemeToggle variant="segmented" size="sm" showLabels={true} />
      </div>
    </header>
  );
};

export default AuthTopNav;
