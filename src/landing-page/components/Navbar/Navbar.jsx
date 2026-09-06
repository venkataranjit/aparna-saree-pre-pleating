import React from 'react';
import { Link } from 'react-router-dom';
import { AppButton } from '../../../components/common';
import logo from '../../../assets/logo.png';
import './Navbar.scss';

const Navbar = () => {
  return (
    <header className="landing-navbar">
      <div className="landing-navbar__container">
        <Link to="/" className="landing-navbar__brand">
          <img src={logo} alt="Aparna Saree Pre-Pleating" />
        </Link>
        <div className="landing-navbar__actions">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <AppButton variant="primary">
              Go to Dashboard
            </AppButton>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
