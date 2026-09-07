import React from "react";
import "./AuthBackground.scss";

/**
 * AuthBackground
 * Minimalist luxury pure black background with glowing / growing golden dots.
 */
const AuthBackground = () => {
  return (
    <div className="auth-black-backdrop" aria-hidden="true">
      {/* 1. Pure Solid Pitch Black Base */}
      <div className="auth-black-backdrop__base" />

      {/* 2. Micro-Dot Matrix Weave Overlay */}
      <div className="auth-black-backdrop__dots-grid" />

      {/* 3. Glowing & Growing Golden Star Particles */}
      <div className="auth-black-backdrop__glowing-dots">
        <span className="dot dot--1" />
        <span className="dot dot--2" />
        <span className="dot dot--3" />
        <span className="dot dot--4" />
        <span className="dot dot--5" />
        <span className="dot dot--6" />
        <span className="dot dot--7" />
        <span className="dot dot--8" />
      </div>
    </div>
  );
};

export default AuthBackground;
