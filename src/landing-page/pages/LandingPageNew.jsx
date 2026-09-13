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
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import { useAuth } from "../../auth/context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Footer from "../components/Footer/Footer";
import brandLogo from "../../assets/logo.png";
import logoLight from "../../assets/logo-light.png";
import logoDark from "../../assets/logo-dark.png";
import heroBg from "../../assets/hero1.png";
import ladyLogo from "../../assets/lady-logo.png";
import appIconImg from "../../assets/app-icon.png";
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

const FOUNDER_QUOTES = [
  {
    quote:
      "A beautifully draped saree shouldn't take an hour of struggle. When every pleat falls into place with ease, you can truly immerse yourself in the celebration.",
  },
  {
    quote:
      "Wore my bridal Kanchipuram in under 2 minutes! Every pleat stayed razor-sharp through 8 hours of muhurtham rituals.",
  },
  {
    quote:
      "Archival box packaging was a lifesaver for our destination wedding in Udaipur. Unpacked and wore it wrinkle-free.",
  },
  {
    quote:
      "Zero damage to my heirloom Banarasi zari. Aparna's atelier handles precious silks with true reverence.",
  },
  {
    quote:
      "Effortless elegance is real. Draping used to be exhausting with pins; now it is pure royal luxury.",
  },
];

const LandingPageNew = () => {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuotePaused, setIsQuotePaused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isQuotePaused) return;
    const timer = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % FOUNDER_QUOTES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isQuotePaused]);

  useEffect(() => {
    document.title =
      "Aparna Saree Pre-Pleating & Draping Studio Hyderabad | 2-Min Ready to Wear Sarees";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos =
        window.scrollY ||
        (containerRef.current ? containerRef.current.scrollTop : 0);
      setIsScrolled(scrollPos > 40);

      // Track active section for nav highlight (Check bottom-to-top: Contact -> Services -> About -> Home)
      const contactEl = document.getElementById("contact");
      const servicesEl = document.getElementById("services");
      const aboutEl = document.getElementById("about");

      const threshold = Math.min(window.innerHeight * 0.45, 360);

      if (contactEl && contactEl.getBoundingClientRect().top <= threshold) {
        setActiveSection("contact");
      } else if (
        servicesEl &&
        servicesEl.getBoundingClientRect().top <= threshold
      ) {
        setActiveSection("services");
      } else if (aboutEl && aboutEl.getBoundingClientRect().top <= threshold) {
        setActiveSection("about");
      } else {
        setActiveSection("home");
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

  useEffect(() => {
    if (!isLoaded) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          } else {
            // Re-arm animation every time the element scrolls out of view
            entry.target.classList.remove("is-revealed");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isLoaded]);

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
          DYNAMIC LUXURY BACKGROUND ANIMATION SYSTEM
          (Fluid Gold Auroras, Shimmering Zari Mesh, Floating Stardust Particles & Silk Light Beams)
          ========================================================================= */}
      <div className="luxury-global-bg-canvas" aria-hidden="true">
        {/* Dynamic Fluid Ambient Auroras */}
        <div className="bg-aurora bg-aurora--1" />
        <div className="bg-aurora bg-aurora--2" />
        <div className="bg-aurora bg-aurora--3" />
        <div className="bg-aurora bg-aurora--4" />

        {/* Shimmering Zari Weave Lattice Mesh */}
        <div className="bg-zari-mesh" />

        {/* Floating Golden Stardust Particles */}
        <div className="bg-particle-field">
          <span className="gold-particle gold-particle--1" />
          <span className="gold-particle gold-particle--2" />
          <span className="gold-particle gold-particle--3" />
          <span className="gold-particle gold-particle--4" />
          <span className="gold-particle gold-particle--5" />
          <span className="gold-particle gold-particle--6" />
          <span className="gold-particle gold-particle--7" />
          <span className="gold-particle gold-particle--8" />
          <span className="gold-particle gold-particle--9" />
          <span className="gold-particle gold-particle--10" />
          <span className="gold-particle gold-particle--11" />
          <span className="gold-particle gold-particle--12" />
          <span className="gold-particle gold-particle--13" />
          <span className="gold-particle gold-particle--14" />
        </div>

        {/* Diagonal Silk Shimmer Light Beams */}
        <div className="bg-silk-light-beam" />
        <div className="bg-silk-light-beam bg-silk-light-beam--reverse" />
      </div>

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
        {/* Animated Background Aura for About Us */}
        <div className="section-ambient-aura section-ambient-aura--about" />
        <div className="section-container">
          {/* Section Header */}
          <div className="about-section-header reveal-on-scroll">
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
          <div className="about-stats-strip reveal-on-scroll">
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
            <div className="about-story-col reveal-on-scroll reveal-from-left">
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
            <div className="about-founder-col reveal-on-scroll reveal-from-right">
              <div className="founder-card">
                <div className="founder-card__glow" />
                <div className="founder-card__emblem-wrap">
                  <img
                    src={ladyLogo}
                    alt="Aparna Atelier Emblem"
                    className="founder-emblem"
                  />
                </div>

                <div
                  className="founder-quote-box"
                  onMouseEnter={() => setIsQuotePaused(true)}
                  onMouseLeave={() => setIsQuotePaused(false)}
                >
                  <span className="quote-mark">“</span>
                  <div className="quote-carousel-viewport">
                    <div
                      className="quote-slider-track"
                      style={{
                        transform: `translateX(-${currentQuoteIndex * 100}%)`,
                      }}
                    >
                      {FOUNDER_QUOTES.map((item, idx) => (
                        <div key={idx} className="quote-slide-item">
                          <p className="quote-text">{item.quote}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="quote-dots-nav">
                    {FOUNDER_QUOTES.map((_, qIdx) => (
                      <span
                        key={qIdx}
                        className={`quote-dot ${qIdx === currentQuoteIndex ? "active" : ""}`}
                        onClick={() => setCurrentQuoteIndex(qIdx)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Slide ${qIdx + 1}`}
                      />
                    ))}
                  </div>
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
        {/* Animated Background Aura for Services */}
        <div className="section-ambient-aura section-ambient-aura--services" />
        <div className="services-section__header reveal-on-scroll">
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
            <div
              key={index}
              className="service-card reveal-on-scroll"
              style={{ transitionDelay: `${(index % 6) * 0.05}s` }}
            >
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
          ANDROID APP DOWNLOAD SECTION: Official Android App & Tracking Experience
          ========================================================================= */}
      <section id="app" className="luxury-app-download-section">
        {/* Animated Background Aura for App Section */}
        <div className="section-ambient-aura section-ambient-aura--app" />
        <div className="section-container">
          {/* Standard Section Header matching Services, About & Contact */}
          <div className="app-download-header reveal-on-scroll">
            <span className="section-eyebrow">Official Mobile App</span>
            <h2 className="section-heading">Manage &amp; Track Your Sarees</h2>
            <p className="section-subtext">
              Download the official Android app to book pre-pleating services,
              get live order tracking, and schedule doorstep pickup across
              Hyderabad.
            </p>
          </div>

          <div className="app-main-grid">
            {/* Left Column: App Feature Card */}
            <div className="app-info-col reveal-on-scroll reveal-from-left">
              <div className="app-feature-card">
                <h3 className="card-heading">
                  Seamless Saree Styling in Your Pocket
                </h3>
                <p className="card-desc">
                  Enjoy the complete <strong>Aparna Saree Pre-Pleating</strong>{" "}
                  studio experience right on your Android device. Book
                  appointments, track pressing status, and manage your wardrobe
                  with effortless convenience.
                </p>

                {/* 4 App Highlights Grid */}
                <div className="app-pillars-grid">
                  <div className="app-pillar-item">
                    <div className="pillar-icon-box">
                      <NotificationsActiveOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Live Order Tracking</h4>
                      <p>
                        Real-time updates from doorstep pickup to steaming &amp;
                        dispatch.
                      </p>
                    </div>
                  </div>

                  <div className="app-pillar-item">
                    <div className="pillar-icon-box">
                      <LocalShippingOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Doorstep Pickup</h4>
                      <p>
                        Schedule home pickup &amp; delivery with one tap across
                        Hyderabad.
                      </p>
                    </div>
                  </div>

                  <div className="app-pillar-item">
                    <div className="pillar-icon-box">
                      <ShieldOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>Digital Wardrobe</h4>
                      <p>
                        Archival records of your pleating styles &amp; GST tax
                        invoices.
                      </p>
                    </div>
                  </div>

                  <div className="app-pillar-item">
                    <div className="pillar-icon-box">
                      <WorkspacePremiumOutlinedIcon className="p-icon" />
                    </div>
                    <div className="pillar-content">
                      <h4>VIP Priority Slots</h4>
                      <p>
                        Direct priority access for festive and bridal wedding
                        rushes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download CTA Row */}
                <div className="app-card-cta-row">
                  <a
                    href="/aparna-saree-pre-pleating.apk"
                    download="Aparna-Saree-Pre-Pleating.apk"
                    className="luxury-cta-gold app-download-btn"
                  >
                    <AndroidIcon className="cta-icon-android" />
                    <div className="btn-text-wrap">
                      <span className="btn-sub">Direct APK Download</span>
                      <span className="btn-main">Download Android App</span>
                    </div>
                    <GetAppOutlinedIcon className="cta-icon-download" />
                  </a>

                  <div className="app-verified-badge">
                    <VerifiedOutlinedIcon className="v-icon" />
                    <span>v1.0 • 100% Virus-Free &amp; Verified APK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Smartphone Mockup with Login Page UI */}
            <div className="app-showcase-col reveal-on-scroll reveal-from-right">
              <div className="app-phone-card">
                <div className="app-phone-card__glow" />

                <div className="phone-device-frame">
                  {/* Speaker & Camera Notch */}
                  <div className="phone-notch-bar">
                    <span className="phone-speaker" />
                    <span className="phone-lens" />
                  </div>

                  {/* Phone Screen: Login Page Mobile UI */}
                  <div className="phone-screen-content">
                    {/* Status Bar */}
                    <div className="phone-status-row">
                      <span className="status-time">9:41</span>
                      <div className="status-icons">
                        <span className="sig-bar" />
                        <span className="wifi-dot" />
                        <span className="battery-pill" />
                      </div>
                    </div>

                    {/* App Brand Header */}
                    <div className="phone-brand-header">
                      <img
                        src={ladyLogo}
                        alt="Aparna Atelier"
                        className="phone-brand-logo"
                      />
                      <h4 className="phone-brand-title">Aparna Pleats</h4>
                      <span className="phone-brand-tag">
                        Studio Atelier • Hyderabad
                      </span>
                    </div>

                    {/* Mobile Login Form Box */}
                    <div className="phone-login-box">
                      <div className="phone-login-heading">
                        <h5>Welcome Back</h5>
                        <p>Sign in to track your saree orders</p>
                      </div>

                      {/* Auth Mode Tabs */}
                      <div className="phone-auth-tabs">
                        <span className="auth-tab active">Phone OTP</span>
                        <span className="auth-tab">Email</span>
                      </div>

                      {/* Phone Number Input Mockup */}
                      <div className="phone-input-mock">
                        <span className="flag-code">🇮🇳 +91</span>
                        <span className="phone-digits">95539 00003</span>
                      </div>

                      {/* Get OTP Button */}
                      <button type="button" className="phone-submit-btn">
                        <span>Get Verification Code</span>
                      </button>

                      {/* Social Divider */}
                      <div className="phone-social-divider">
                        <span className="div-line" />
                        <span className="div-text">or continue with</span>
                        <span className="div-line" />
                      </div>

                      {/* Social Icons Row */}
                      <div className="phone-social-row">
                        <div className="social-pill">
                          <svg width="14" height="14" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          <span>Google</span>
                        </div>
                        <div className="social-pill">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="#1877F2"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          <span>Facebook</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTACT US SECTION: Address, Google Maps, Phone, Timings & Concierge
          ========================================================================= */}
      <section id="contact" className="luxury-contact-section">
        {/* Animated Background Aura for Contact Us */}
        <div className="section-ambient-aura section-ambient-aura--contact" />
        <div className="section-container">
          {/* Section Header matching Services */}
          <div className="contact-header reveal-on-scroll">
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
            <div className="contact-details-col reveal-on-scroll reveal-from-left">
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
            <div className="contact-map-col reveal-on-scroll reveal-from-right">
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
            aria-label="Home"
          >
            <HomeOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">Home</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "about" ? "active" : ""}`}
            onClick={() => scrollToSection("about")}
            title="About Us"
            aria-label="About Us"
          >
            <InfoOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">About Us</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "services" ? "active" : ""}`}
            onClick={() => scrollToSection("services")}
            title="Services"
            aria-label="Services"
          >
            <AutoAwesomeOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">Services</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "contact" ? "active" : ""}`}
            onClick={() => scrollToSection("contact")}
            title="Contact Us"
            aria-label="Contact Us"
          >
            <PhoneInTalkOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">Contact Us</span>
          </button>

          {/* Android App Download Link */}
          <a
            href="/aparna-saree-pre-pleating.apk"
            download="Aparna-Saree-Pre-Pleating.apk"
            className="dock-nav-item dock-nav-item--android"
            title="Download Android App"
            aria-label="Download Android App"
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
            aria-label="WhatsApp Booking"
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
            aria-label="Instagram Profile"
          >
            <InstagramIcon className="dock-icon" />
          </a>

          {/* Login Link */}
          <Link
            to={currentUser ? "/dashboard" : "/login"}
            className="dock-nav-item dock-nav-item--auth"
            title="Login"
            aria-label="Login"
          >
            <LoginIcon className="dock-icon" />
            <span className="dock-nav-label">Login</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default LandingPageNew;
