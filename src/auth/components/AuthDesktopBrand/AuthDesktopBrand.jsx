import React from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../../../assets/logo.png';
import logoDark from '../../../assets/logo-dark.png';
import logoLight from '../../../assets/logo-light.png';
import './AuthDesktopBrand.scss';

const AuthDesktopBrand = () => {
  return (
    <div className="auth-desktop-brand">
      <div className="auth-desktop-brand__glow" />
      <Link to="/landing" className="auth-desktop-brand__link" title="Aparna Saree Pre-Pleating - Return to Storefront">
        {/* Default Royal Gold Logo */}
        <div className="brand-theme-wrap brand-theme-wrap--default">
          <img
            src={brandLogo}
            alt="Aparna Saree Pre-Pleating"
            className="auth-desktop-brand__logo"
          />
        </div>

        {/* Dark Mode Slate / White Logo */}
        <div className="brand-theme-wrap brand-theme-wrap--dark">
          <img
            src={logoDark}
            alt="Aparna Saree Pre-Pleating"
            className="auth-desktop-brand__logo"
          />
        </div>

        {/* Light Mode Charcoal / Slate Logo */}
        <div className="brand-theme-wrap brand-theme-wrap--light">
          <img
            src={logoLight}
            alt="Aparna Saree Pre-Pleating"
            className="auth-desktop-brand__logo"
          />
        </div>
      </Link>
    </div>
  );
};

export default AuthDesktopBrand;
