import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LoginIcon from "@mui/icons-material/Login";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import IronOutlinedIcon from "@mui/icons-material/IronOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import ChildCareOutlinedIcon from "@mui/icons-material/ChildCareOutlined";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import WomanOutlinedIcon from "@mui/icons-material/WomanOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import FlareOutlinedIcon from "@mui/icons-material/FlareOutlined";
import { useAuth } from "../../auth/context/AuthContext";
import Footer from "../components/Footer/Footer";
import brandLogo from "../../assets/logo.png";
import "./LandingPage.scss";

// Exclusive Saree Pre-Pleating & Styling Services (With icons, without pricing or numbers)
const OFFERINGS = [
  {
    title: "Flat Pleats",
    desc: "Crisp, razor-straight pleats pressed seamlessly for a modern, tailored silhouette.",
    badge: "Popular",
    icon: <IronOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Semi-Fluffy Pleats",
    desc: "Balanced volume providing natural bounce and effortless poise throughout your day.",
    badge: "Signature",
    icon: <FlareOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Fluffy Pleats",
    desc: "Voluminous, dramatic pleats ideal for grand wedding entries and royal flair.",
    badge: "Royal",
    icon: <AutoAwesomeIcon className="service-card-icon" />,
  },
  {
    title: "Box Folding",
    desc: "Archival dust-free box folding engineered for bridal trousseau, gifting, and travel.",
    badge: "Essential",
    icon: <Inventory2OutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Hanger Folding",
    desc: "Ready-to-hang storage preserving pleat lines without creating fold creases.",
    badge: "Couture",
    icon: <CheckroomOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Single Pallu Pleating",
    desc: "Bespoke shoulder pallu cascading pleats crafted for statement border silks.",
    badge: "On Request",
    icon: <StyleOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Half Saree Pleating",
    desc: "Traditional dhavani / langa voni draping styled with youthful grace.",
    badge: "On Request",
    icon: <StraightenOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Maharani Style Dupatta",
    desc: "Opulent double-drape pleats and regal chest pleating fit for royal occasions.",
    badge: "Specialty",
    icon: <DiamondOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Lehenga Pleating",
    desc: "Custom waistband and flare pleating ensuring flawless twirl and comfort.",
    badge: "On Request",
    icon: <AutoFixHighOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Kids Saree Pre-Pleating",
    desc: "Comfort-first lightweight pre-stitched pleating tailored for little ones.",
    badge: "Customized",
    icon: <ChildCareOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Saree Draping",
    desc: "Professional on-site / studio draping service by our master stylists.",
    badge: "Bespoke",
    icon: <WomanOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Hair Styling",
    desc: "Artisanal traditional flowers, modern buns, and bridal crown hair artistry.",
    badge: "Artistry",
    icon: <FaceRetouchingNaturalOutlinedIcon className="service-card-icon" />,
  },
];

const LandingPage = () => {
  const { currentUser } = useAuth();
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Target Launch Date countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 24,
    hours: 18,
    minutes: 42,
    seconds: 30,
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 24);
    targetDate.setHours(targetDate.getHours() + 18);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setNotified(true);
  };

  return (
    <Box className="coming-soon-landing">
      {/* Ambient background glows */}
      <div className="coming-soon-landing__glow coming-soon-landing__glow--center" />
      <div className="coming-soon-landing__glow coming-soon-landing__glow--top" />
      <div className="coming-soon-landing__glow coming-soon-landing__glow--bottom" />

      {/* Top Navigation Bar */}
      <header className="coming-soon-header">
        <div className="coming-soon-header__inner">
          <div className="coming-soon-header__brand">
            <span className="brand-dot" />
            <span className="brand-badge">Official Storefront Preview</span>
          </div>

          <div className="coming-soon-header__actions">
            {currentUser ? (
              <Link to="/dashboard" className="portal-pill-btn">
                <DashboardIcon className="btn-icon" />
                <span>Open Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" className="portal-pill-btn">
                <LoginIcon className="btn-icon" />
                <span>Staff &amp; Client Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Showcase Section */}
      <main className="coming-soon-main">
        <div className="coming-soon-container">
          {/* Highlighted Hero Brand Logo Presentation */}
          <div className="hero-brand-presentation">
            <div className="brand-ambient-glow" />
            <img
              src={brandLogo}
              alt="Aparna Saree Pre-Pleating & Box Folding"
              className="brand-hero-logo"
            />
          </div>

          {/* Coming Soon Announcement Pill */}
          <div className="announcement-badge">
            <AutoAwesomeIcon className="sparkle-icon" />
            <span>Digital Storefront Experience &bull; Coming Soon</span>
          </div>

          {/* Headline & Narrative */}
          <h1 className="hero-title">
            <span className="gold-shimmer-text">
              Perfect Pleats for your Perfect Look.
            </span>
          </h1>

          {/* Live Countdown Clock */}
          <div className="countdown-card">
            <div className="countdown-card__header">
              <span className="live-pulse" />
              <span>GRAND REVEAL COUNTDOWN</span>
            </div>
            <div className="countdown-grid">
              <div className="countdown-unit">
                <span className="countdown-val">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">DAYS</span>
              </div>
              <span className="countdown-separator">:</span>
              <div className="countdown-unit">
                <span className="countdown-val">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">HOURS</span>
              </div>
              <span className="countdown-separator">:</span>
              <div className="countdown-unit">
                <span className="countdown-val">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">MINS</span>
              </div>
              <span className="countdown-separator">:</span>
              <div className="countdown-unit">
                <span className="countdown-val countdown-val--accent">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">SECS</span>
              </div>
            </div>
          </div>

          {/* Notify Me / VIP Access Card */}
          <div className="notify-section">
            {!notified ? (
              <form onSubmit={handleNotifySubmit} className="notify-form">
                <div className="notify-input-group">
                  <input
                    type="email"
                    placeholder="Enter your email for early VIP access &amp; offers..."
                    value={notifyEmail}
                    onChange={(e) => {
                      setNotifyEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className={`notify-input ${emailError ? "has-error" : ""}`}
                  />
                  <button type="submit" className="notify-btn">
                    <NotificationsActiveOutlinedIcon className="btn-icon" />
                    <span>Get Notified</span>
                  </button>
                </div>
                {emailError && (
                  <span className="notify-error-msg">{emailError}</span>
                )}
              </form>
            ) : (
              <div className="notify-success-badge">
                <CheckCircleOutlinedIcon className="success-icon" />
                <span>
                  You're on our VIP guest list! We will notify you when we go
                  live.
                </span>
              </div>
            )}
          </div>

          {/* Saree Care & Artistry Services Section */}
          <section className="services-section">
            <div className="services-section__header">
              <span className="section-eyebrow">Our Services</span>
              <h2 className="section-heading">
                Mastercraft Pre-Pleating &amp; Styling
              </h2>
              <p className="section-subtext">
                Every saree is meticulously hand-pleated, steam-pressed with
                temperature-controlled precision, and contoured to your exact
                body measurements.
              </p>
            </div>

            <div className="services-grid">
              {OFFERINGS.map((item, index) => (
                <div key={index} className="service-card">
                  <div className="service-card__top">
                    <div className="service-icon-box">
                      {item.icon}
                    </div>
                    <span className="service-badge">{item.badge}</span>
                  </div>
                  <h3 className="service-card__title">{item.title}</h3>
                  <p className="service-card__desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Navigation */}
          <div className="portal-actions-card">
            <Typography variant="body2" className="portal-prompt">
              Are you an authorized boutique staff member or registered client?
            </Typography>
            <div className="portal-buttons-wrap">
              <Link
                to="/dashboard"
                className="action-button action-button--secondary"
              >
                <DashboardIcon />
                <span>Direct Dashboard Access</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Luxury Footer with Developer Credit */}
      <Footer />
    </Box>
  );
};

export default LandingPage;
