import React from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../../../assets/logo.png';
import './AuthDesktopBrand.scss';

const AuthDesktopBrand = () => {
  return (
    <div className="auth-desktop-brand">
      <div className="auth-desktop-brand__glow" />
      <Link to="/landing" className="auth-desktop-brand__link" title="Aparna Saree Pre-Pleating - Return to Storefront">
        <img
          src={brandLogo}
          alt="Aparna Saree Pre-Pleating"
          className="auth-desktop-brand__logo"
        />
      </Link>
    </div>
  );
};

export default AuthDesktopBrand;
