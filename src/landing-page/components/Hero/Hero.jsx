import React from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link } from 'react-router-dom';
import { AppButton } from '../../../components/common';
import './Hero.scss';

const Hero = () => {
  return (
    <section className="landing-hero">
      <div className="landing-hero__content">
        <span className="landing-hero__tagline">
          Luxury Pre-Pleating & Box Folding
        </span>
        <h1 className="landing-hero__title">
          Flawless Saree Draping, Every Single Time
        </h1>
        <p className="landing-hero__subtitle">
          Professional pleating, ironing, and box-folding crafted for brides, celebrations, and festive events.
        </p>
        <div className="landing-hero__actions">
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <AppButton
              variant="primary"
              size="lg"
              icon={<DashboardIcon />}
            >
              Launch Dashboard
            </AppButton>
          </Link>
          <AppButton
            variant="secondary"
            size="lg"
            icon={<AutoAwesomeIcon />}
          >
            Explore Services
          </AppButton>
        </div>
      </div>
    </section>
  );
};

export default Hero;
