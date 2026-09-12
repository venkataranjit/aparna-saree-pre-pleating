import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AndroidIcon from "@mui/icons-material/Android";
import LoginIcon from "@mui/icons-material/Login";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import IronOutlinedIcon from "@mui/icons-material/IronOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import ChildCareOutlinedIcon from "@mui/icons-material/ChildCareOutlined";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import WomanOutlinedIcon from "@mui/icons-material/WomanOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import FlareOutlinedIcon from "@mui/icons-material/FlareOutlined";
import CallIcon from "@mui/icons-material/Call";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useAuth } from "../../auth/context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Footer from "../components/Footer/Footer";
import brandLogo from "../../assets/logo.png";
import logoLight from "../../assets/logo-light.png";
import logoDark from "../../assets/logo-dark.png";
import heroBg from "../../assets/hero1.png";
import ladyLogo from "../../assets/lady-logo.png";
import "./LandingPageNew.scss";

const SERVICES_LIST = [
  {
    title: "Flat Pleats",
    desc: "Neat, razor-straight pleats pressed flat for a slim, clean, and elegant look.",
    badge: "Popular",
    icon: <IronOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Semi-Fluffy Pleats",
    desc: "Soft and natural pleats with a gentle puff — comfortable and easy to wear all day.",
    badge: "Signature",
    icon: <FlareOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Fluffy Pleats",
    desc: "Grand, puffy pleats with extra volume for a rich and royal bridal look.",
    badge: "Royal",
    icon: <AutoAwesomeIcon className="service-card-icon" />,
  },
  {
    title: "Box Folding",
    desc: "Neatly packed in a dust-proof box so you can travel easily without pleats getting crushed.",
    badge: "Essential",
    icon: <Inventory2OutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Hanger Folding",
    desc: "Ready to hang in your wardrobe with zero fold marks or creases.",
    badge: "Couture",
    icon: <CheckroomOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Single Pallu Pleating",
    desc: "Shoulder pleats set neatly in single-pallu style to highlight your saree's heavy border.",
    badge: "On Request",
    icon: <StyleOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Half Saree Pleating",
    desc: "Crisp and graceful pleats tailored for traditional half sarees (Langa Voni).",
    badge: "On Request",
    icon: <StraightenOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Maharani Style Dupatta",
    desc: "Grand double-dupatta pleating and chest draping for brides and wedding events.",
    badge: "Specialty",
    icon: <DiamondOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Lehenga Pleating",
    desc: "Custom waistband and flare pleating for comfortable walking and great twirls.",
    badge: "On Request",
    icon: <AutoFixHighOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Kids Saree Pre-Pleating",
    desc: "Easy-to-wear, lightweight pre-stitched pleating made super comfortable for little ones.",
    badge: "Customized",
    icon: <ChildCareOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Saree Draping",
    desc: "Complete professional saree draping by experts at our studio or your venue.",
    badge: "Bespoke",
    icon: <WomanOutlinedIcon className="service-card-icon" />,
  },
  {
    title: "Hair Styling",
    desc: "Artisanal flower hair settings, traditional braids, modern buns, and bridal hairdos.",
    badge: "Artistry",
    icon: <FaceRetouchingNaturalOutlinedIcon className="service-card-icon" />,
  },
];

const LandingPageNew = () => {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const containerRef = useRef(null);

  useEffect(() => {
    document.title =
      "Aparna Saree Pre-Pleating & Draping Studio Hyderabad | 2-Min Ready to Wear Sarees";
    // Trigger dynamic moving entrance animations on page load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos =
        window.scrollY ||
        (containerRef.current ? containerRef.current.scrollTop : 0);
      setIsScrolled(scrollPos > 40);

      // Track active section for nav highlight
      if (scrollPos < 350) {
        setActiveSection("home");
      } else {
        const servicesEl = document.getElementById("services");
        const aboutEl = document.getElementById("about");
        const contactEl = document.getElementById("contact");

        if (contactEl && contactEl.getBoundingClientRect().top < 300) {
          setActiveSection("contact");
        } else if (aboutEl && aboutEl.getBoundingClientRect().top < 300) {
          setActiveSection("about");
        } else if (servicesEl && servicesEl.getBoundingClientRect().top < 300) {
          setActiveSection("services");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const getLogo = () => {
    if (currentTheme === "light") return logoLight || brandLogo;
    if (currentTheme === "dark") return logoDark || brandLogo;
    return brandLogo;
  };

  const WHATSAPP_NUMBER = "919553900003";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Aparna ji, I would like to book a saree pre-pleating and draping service with you.",
  )}`;
  const instagramUrl = "https://www.instagram.com/aparna_saree_prepleating/";

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else if (containerRef.current) {
      const target = containerRef.current.querySelector(`#${id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const scrollToTop = () => {
    setActiveSection("home");
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className={`aparna-luxury-landing ${isLoaded ? "page-is-loaded" : ""} ${isScrolled ? "is-scrolled" : ""}`}
    >
      {/* =========================================================================
          HERO SECTION: Background + Centered Hero Brand Logo + Editorial Copy
          ========================================================================= */}
      <section className="luxury-hero-section">
        {/* Background Canvas with Horizontally Flipped hero1.png (Model on Left) */}
        <div className="luxury-hero-backdrop">
          <div
            className="luxury-hero-bg-flipped"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Soft right-aligned vignette gradient to protect text legibility on the right */}
          <div className="luxury-hero-overlay" />

          {/* Animated Floating Gold Particles */}
          <div className="ambient-sparkle ambient-sparkle--1" />
          <div className="ambient-sparkle ambient-sparkle--2" />
          <div className="ambient-sparkle ambient-sparkle--3" />
          <div className="ambient-sparkle ambient-sparkle--4" />
        </div>

        {/* HERO LOGO: Center-aligned across the complete page with heavily increased width */}
        <div className="hero-page-top-bar anim-hero-logo">
          <div className="hero-brand-top-wrap">
            <img
              src={getLogo()}
              alt="Aparna Saree Pre-Pleating"
              className="hero-prominent-logo"
            />
          </div>
        </div>

        {/* Main Hero Content */}
        <main className="luxury-hero-content">
          <div className="luxury-hero-container">
            <div className="editorial-hero-panel">
              {/* Luxury Ambient Glow Behind Title Panel */}
              <div className="hero-editorial-aura" />

              {/* Main Heading in Caveat Calligraphy Font */}
              <h1 className="editorial-title anim-hero-title">
                <span className="caveat-line-1">Drape Today.</span>
                <span className="caveat-line-2">Memories Forever.</span>
              </h1>

              {/* Description */}
              <p className="editorial-tagline anim-hero-subtitle">
                Perfectly pre-pleated sarees, crafted to make every special
                occasion effortless, elegant, and unforgettable.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="editorial-cta-group anim-hero-cta">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="luxury-cta-gold"
                >
                  <span className="cta-shimmer-shine" />
                  <WhatsAppIcon className="cta-icon-wa" />
                  <span className="cta-label">Book Your Saree</span>
                  <ArrowForwardIcon className="cta-arrow" />
                </a>

                <button
                  type="button"
                  onClick={() => scrollToSection("services")}
                  className="luxury-cta-glass"
                >
                  <span>Explore Services</span>
                </button>
              </div>

              {/* Trust / Highlight Points */}
              <div className="trust-highlights-strip anim-hero-trust">
                <div className="trust-item">
                  <span className="trust-symbol">✦</span>
                  <span className="trust-text">Perfect Pleats</span>
                </div>
                <div className="trust-item">
                  <span className="trust-symbol">✦</span>
                  <span className="trust-text">Ready to Drape</span>
                </div>
                <div className="trust-item">
                  <span className="trust-symbol">✦</span>
                  <span className="trust-text">Saves Your Time</span>
                </div>
                <div className="trust-item">
                  <span className="trust-symbol">✦</span>
                  <span className="trust-text">Made for Every Occasion</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Small Bottom Indicator: Scroll to discover */}
        <div
          className="luxury-scroll-indicator anim-hero-scroll"
          onClick={() => scrollToSection("about")}
        >
          <span className="scroll-label">Scroll to discover</span>
          <KeyboardArrowDownIcon className="scroll-arrow-icon" />
        </div>
      </section>

      {/* =========================================================================
          ABOUT US & ATELIER STORY SECTION (Follows Home)
          ========================================================================= */}
      <section id="about" className="luxury-about-section">
        <div className="section-container">
          {/* Section Header */}
          <div className="about-section-header">
            <span className="section-eyebrow">About Us</span>
            <h2 className="section-heading">
              Where Heritage Weaves Meet Flawless Precision
            </h2>
            <p className="section-subtext">
              Dedicated to elevating South India's timeless saree traditions
              with effortless, modern draping artistry.
            </p>
          </div>

          {/* Stats & Trust Metrics Strip */}
          <div className="about-stats-strip">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Sarees Pre-Pleated</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Silk &amp; Zari Safe</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">2 Mins</div>
              <div className="stat-label">Ready-to-Wear Ease</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5.0 ★</div>
              <div className="stat-label">Hyderabad Client Rating</div>
            </div>
          </div>

          {/* Main Content Grid: Story & Pillars (Left) + Founder Showcase (Right) */}
          <div className="about-main-grid">
            <div className="about-story-col">
              <div className="story-card">
                <h3 className="story-heading">
                  The Story Behind the Perfection
                </h3>
                <p className="about-narrative">
                  At <strong>Aparna Saree Pre-Pleating</strong>, we understand
                  that a saree is never just fabric — it is an emotion, a family
                  legacy, and a statement of timeless grace. Our journey began
                  with a mission to banish the stress of uneven pleats, shifting
                  pallus, and frantic safety pins on your most cherished
                  occasions.
                </p>
                <p className="about-narrative">
                  Whether it is a regal Kanchipuram bridal pattu, an intricate
                  Banarasi, or a lightweight modern organza, our master
                  craftsmen calibrate every fold to your unique body contour —
                  guaranteeing razor-sharp symmetry and effortless movement
                  throughout your celebrations.
                </p>

                {/* 4 Core Pillars Grid */}
                <div className="about-pillars-grid">
                  <div className="pillar-item">
                    <div className="pillar-icon-box">
                      <ShieldOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Zero Zari Damage</h4>
                      <p>
                        Temperature-controlled steam shaping to preserve pure
                        gold and silver threads.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-item">
                    <div className="pillar-icon-box">
                      <TimerOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>2-Minute Wear</h4>
                      <p>
                        Pre-measured pleats and pinned pallu let you slip into
                        your saree in under 120 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-item">
                    <div className="pillar-icon-box">
                      <WorkspacePremiumOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Bespoke Contouring</h4>
                      <p>
                        Custom waist curvature and pallu drops personalized to
                        your exact height.
                      </p>
                    </div>
                  </div>

                  <div className="pillar-item">
                    <div className="pillar-icon-box">
                      <Inventory2OutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Archival Box Packaging</h4>
                      <p>
                        Crease-free and dust-proof luxury packaging engineered
                        for travel &amp; weddings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Showcase & Studio Atelier Card */}
            <div className="about-founder-col">
              <div className="founder-card">
                <div className="founder-card__glow" />
                <div className="founder-card__emblem-wrap">
                  <img
                    src={ladyLogo}
                    alt="Aparna Atelier Emblem"
                    className="founder-emblem"
                  />
                </div>

                <div className="founder-quote-box">
                  <span className="quote-mark">“</span>
                  <p className="quote-text">
                    A beautifully draped saree shouldn't take an hour of
                    struggle. When every pleat falls into place with ease, you
                    can truly immerse yourself in the celebration.
                  </p>
                </div>

                <div className="founder-info-wrap">
                  <div className="founder-info">
                    <h4 className="founder-name">Aparna</h4>
                    <span className="founder-title">
                      Master Drapist &amp; Founder
                    </span>
                    <span className="founder-location">Hyderabad Atelier</span>
                  </div>
                </div>

                <div className="founder-card-actions">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="luxury-cta-gold"
                  >
                    <WhatsAppIcon className="cta-icon-wa" />
                    <span>Chat with Aparna ji</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SERVICES SECTION: Mastercraft Pre-Pleating Styles (Follows About Us)
          ========================================================================= */}
      <section id="services" className="services-section">
        <div className="services-section__header">
          <span className="section-eyebrow">Our Services</span>
          <h2 className="section-heading">
            Mastercraft Pre-Pleating &amp; Styling
          </h2>
          <p className="section-subtext">
            Every saree is carefully hand-pleated, steam-pressed safely, and
            tailored to your exact height and fit.
          </p>
        </div>

        <div className="services-grid">
          {SERVICES_LIST.map((item, index) => (
            <div key={index} className="service-card">
              <div className="service-card__top">
                <div className="service-icon-box">{item.icon}</div>
                <span className="service-badge">{item.badge}</span>
              </div>
              <h3 className="service-card__title">{item.title}</h3>
              <p className="service-card__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          CONTACT US SECTION: Address, Google Maps, Phone, Timings & Concierge
          ========================================================================= */}
      <section id="contact" className="luxury-contact-section">
        <div className="section-container">
          {/* Section Header matching Services */}
          <div className="contact-header">
            <span className="section-eyebrow">
              Studio Concierge &amp; Visit
            </span>
            <h2 className="section-heading">
              Ready to Drape Your Next Occasion?
            </h2>
            <p className="section-subtext">
              Visit our Hyderabad studio atelier, connect directly on WhatsApp,
              or schedule doorstep pickup &amp; delivery.
            </p>
          </div>

          <div className="contact-main-grid">
            {/* Contact Details Column */}
            <div className="contact-details-col">
              {/* Studio Location Card */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon-box">
                  <LocationOnOutlinedIcon className="c-icon" />
                </div>
                <div className="contact-info-card__content">
                  <h4>Studio Atelier Address</h4>
                  <p className="address-text">
                    Hno 4715, 1st Floor, Road No 17, New Mig, BHEL, Hyderabad,
                    Telangana - 502032
                  </p>
                  <a
                    href="https://maps.app.goo.gl/MbEPdnL6Am9kcfdc8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-action-link"
                  >
                    <span>Get Directions on Google Maps</span>
                    <LaunchOutlinedIcon className="link-icon" />
                  </a>
                </div>
              </div>

              {/* Call & WhatsApp Card */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon-box">
                  <CallIcon className="c-icon" />
                </div>
                <div className="contact-info-card__content">
                  <h4>Direct Booking &amp; Concierge</h4>
                  <p className="phone-highlight">+91 95539 00003</p>
                  <div className="contact-card-btn-row">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="luxury-cta-gold-sm"
                    >
                      <WhatsAppIcon className="btn-icon" />
                      <span>Chat on WhatsApp</span>
                    </a>
                    <a href="tel:+919553900003" className="luxury-cta-glass-sm">
                      <CallIcon className="btn-icon" />
                      <span>Call Studio</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Timings & Availability Card */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon-box">
                  <AccessTimeOutlinedIcon className="c-icon" />
                </div>
                <div className="contact-info-card__content">
                  <h4>Studio Hours &amp; Express Delivery</h4>
                  <p className="hours-text">
                    Monday – Sunday: <strong>9:00 AM – 10:00 PM</strong>
                  </p>
                  <span className="timing-badge">
                    Same-Day &amp; 24hr Express Bridal Turnaround Available
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps Column */}
            <div className="contact-map-col">
              <div className="map-frame-card">
                <div className="map-frame-card__header">
                  <div className="map-header-left">
                    <span className="live-dot" />
                    <span className="map-title">
                      Aparna Studio Atelier • Hyderabad
                    </span>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/MbEPdnL6Am9kcfdc8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-ext-btn"
                  >
                    <span>Open Maps</span>
                    <LaunchOutlinedIcon className="map-icon" />
                  </a>
                </div>

                <div className="map-iframe-container">
                  <iframe
                    title="Aparna Saree Pre-Pleating Studio Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.614959005629!2d78.2830474!3d17.478133799999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcbed005220c969%3A0x752f34793b2e37f4!2sAparna%20Saree%20Pre%20Pleating!5e0!3m2!1sen!2sin!4v1789224855541!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <Footer />

      {/* =========================================================================
          FLOATING NAVIGATION DOCK: Sits at bottom on hero, moves to top on scroll
          ========================================================================= */}
      <nav
        className={`luxury-floating-dock-nav ${isScrolled ? "dock-scrolled-top" : "dock-at-bottom"}`}
        aria-label="Navigation"
      >
        <div className="bottom-dock-inner">
          <button
            type="button"
            className={`dock-nav-item ${activeSection === "home" ? "active" : ""}`}
            onClick={scrollToTop}
            title="Home"
          >
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "about" ? "active" : ""}`}
            onClick={() => scrollToSection("about")}
            title="About Us"
          >
            <span>About Us</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "services" ? "active" : ""}`}
            onClick={() => scrollToSection("services")}
            title="Services"
          >
            <span>Services</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "contact" ? "active" : ""}`}
            onClick={() => scrollToSection("contact")}
            title="Contact Us"
          >
            <span>Contact Us</span>
          </button>

          {/* Android App Download Link */}
          <a
            href="/app-release.apk"
            download="Aparna-Saree-Pre-Pleating.apk"
            className="dock-nav-item dock-nav-item--android"
            title="Download Android App"
          >
            <AndroidIcon className="dock-icon" />
          </a>

          {/* WhatsApp Concierge */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dock-nav-item dock-nav-item--whatsapp"
            title="WhatsApp Booking"
          >
            <WhatsAppIcon className="dock-icon" />
          </a>

          {/* Instagram Concierge */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dock-nav-item dock-nav-item--instagram"
            title="Instagram Profile"
          >
            <InstagramIcon className="dock-icon" />
          </a>

          {/* Login Link */}
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            className="dock-nav-item dock-nav-item--auth"
            title="Login"
          >
            <LoginIcon className="dock-icon" />
            <span>Login</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default LandingPageNew;
