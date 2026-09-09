import React, { useState, useEffect, useRef } from 'react';
import brandLogo from '../../../assets/logo.png';
import logoDark from '../../../assets/logo-dark.png';
import logoLight from '../../../assets/logo-light.png';
import { useTheme } from '../../../context/ThemeContext';
import './PageLoader.scss';

const PageLoader = ({
  progress,
  auto = true,
  duration = 950,
  message = '',
  onComplete,
  fullscreen = true,
  className = '',
}) => {
  const [internalProgress, setInternalProgress] = useState(progress !== undefined ? progress : 0);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);

  let themeContext = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    themeContext = useTheme();
  } catch {
    // Gracefully handle if mounted outside ThemeProvider
  }
  const currentTheme =
    themeContext?.theme ||
    (typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'default'
      : 'default');

  useEffect(() => {
    if (progress !== undefined) {
      setInternalProgress(progress);
      return;
    }

    if (!auto) return;

    let start = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Smooth cubic-out easing curve (starts quickly and lands gently at 100)
      const eased = 1 - Math.pow(1 - rawProgress, 2.6);
      const nextVal = Math.min(100, Math.round(eased * 100));

      setInternalProgress(nextVal);

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else if (!completedRef.current) {
        completedRef.current = true;
        setInternalProgress(100);
        setIsExiting(true);
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 120);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [auto, duration, onComplete, progress]);

  const displayProgress = progress !== undefined ? Math.min(100, Math.max(0, progress)) : internalProgress;

  return (
    <div
      className={`page-loader ${fullscreen ? 'page-loader--fullscreen' : ''} ${isExiting ? 'page-loader--exiting' : ''} ${className}`}
      data-theme={currentTheme}
      role="status"
      aria-label="Loading page"
    >
      <div className="page-loader__backdrop-glow" />

      <div className="page-loader__content">
        {/* Brand Logos: Default (Gold), Dark (Slate), Light (Charcoal) */}
        <div className="page-loader__brand">
          <img
            src={brandLogo}
            alt="Aparna Saree Pre-Pleating"
            className="page-loader__logo page-loader__logo--default"
          />
          <img
            src={logoDark}
            alt="Aparna Saree Pre-Pleating"
            className="page-loader__logo page-loader__logo--dark"
          />
          <img
            src={logoLight}
            alt="Aparna Saree Pre-Pleating"
            className="page-loader__logo page-loader__logo--light"
          />
        </div>

        {/* Progress Bar with 0 to 100 Counter */}
        <div className="page-loader__progress-wrap">
          <div className="page-loader__progress-bar">
            <div
              className="page-loader__progress-fill"
              style={{ width: `${displayProgress}%` }}
            >
              <div className="page-loader__progress-shimmer" />
            </div>
          </div>

          <div className="page-loader__progress-meta">
            <span className="page-loader__percent">{displayProgress}%</span>
            {message && <span className="page-loader__message">{message}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
