import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";

// Material UI Icons
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import LocalParkingOutlinedIcon from "@mui/icons-material/LocalParkingOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import { AppButton, AppInput, AppTabs } from "../../../components/common";
import "./HelpSupport.scss";

// Studio Contact & Location Constants
const STUDIO_PHONE = "+91 98490 12345";
const STUDIO_PHONE_RAW = "919849012345";
const STUDIO_WHATSAPP = "+91 98490 12345";
const STUDIO_WHATSAPP_RAW = "919849012345";
const STUDIO_EMAIL = "support@aparnasaree.com";
const STUDIO_ADDRESS = "Plot No. 42, Road No. 10, Banjara Hills, Hyderabad, Telangana 500034";
const STUDIO_MAPS_SEARCH_URL = "https://maps.google.com/?q=Banjara+Hills,+Hyderabad,+Telangana+500034";
const STUDIO_MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Banjara+Hills,+Hyderabad,+Telangana+500034";
const STUDIO_MAPS_EMBED_URL = "https://maps.google.com/maps?q=Banjara+Hills,+Hyderabad,+Telangana+500034&t=&z=15&ie=UTF8&iwloc=&output=embed";

// FAQ Database
const FAQ_CATEGORIES = [
  { label: "All Topics", value: "ALL" },
  { label: "Orders & Bookings", value: "ORDERS" },
  { label: "Measurements & Sizing", value: "MEASUREMENTS" },
  { label: "Fabrics & Steam Press", value: "FABRICS" },
  { label: "Payments & Invoices", value: "PAYMENTS" },
  { label: "Pickup & Delivery", value: "DELIVERY" },
];

const FAQS = [
  {
    id: "faq_1",
    category: "ORDERS",
    question: "How do I place a saree pre-pleating order?",
    answer:
      "You can place an order directly from the Orders section by clicking '+ Create Order'. Select your saree fabric type, choose your desired pre-pleating service package, select or enter your measurements, choose your delivery date, and confirm your booking. Our studio team will immediately receive your order request.",
    tags: ["Order", "Booking", "Process"],
  },
  {
    id: "faq_2",
    category: "ORDERS",
    question: "What is the standard turnaround time for pre-pleating?",
    answer:
      "Our standard delivery turnaround is 3 days from saree handover. For urgent bridal, muhurtham, or event requirements, express same-day and 24-hour turnaround services are available upon request.",
    tags: ["Turnaround", "Delivery", "Express"],
  },
  {
    id: "faq_3",
    category: "MEASUREMENTS",
    question: "What measurements are needed for tailored pre-pleating?",
    answer:
      "For a flawless custom fit, we record 8 key parameters: Pallu Length, Shoulder to Tight, Chest Size, Hip Size, First Pleat Width, Number of Chest Pleats, Height, and Dress Size (XS-XXL). You can save multiple measurement profiles for yourself or family members.",
    tags: ["Tailoring", "Measurements", "Profile"],
  },
  {
    id: "faq_4",
    category: "MEASUREMENTS",
    question: "Can I save measurement profiles for future orders?",
    answer:
      "Yes! When creating an order or in the Clients section, you can save custom measurement profiles (e.g. 'Bridal Fit', 'Mom Wedding Saree', 'Sister Farewell'). Saved profiles are instantly reusable for all future bookings.",
    tags: ["Profiles", "Saved", "Client"],
  },
  {
    id: "faq_5",
    category: "FABRICS",
    question: "Which saree fabrics are suitable for pre-pleating?",
    answer:
      "We specialize in all luxury and traditional Indian fabrics including Pure Zari Kanjeevaram Silk, Banarasi Brocade, Organza & Tissue Silk, Soft Silk, Chiffon, Georgette, Gadwal, Pochampally Pattu, Handloom Cotton, and Designer Net/Velvet sarees.",
    tags: ["Kanjeevaram", "Organza", "Silk", "Fabrics"],
  },
  {
    id: "faq_6",
    category: "FABRICS",
    question: "Will the steam press or pleat setting damage pure zari or delicate silk?",
    answer:
      "Not at all. We employ precision multi-temperature industrial steam presses and zero-contact fabric guards designed specifically for pure gold/silver zari and delicate mulberry silks. Each saree is pinned with rust-proof pearl head safety pins.",
    tags: ["Zari", "Safety", "Steam Press"],
  },
  {
    id: "faq_7",
    category: "PAYMENTS",
    question: "What payment methods are supported and how does advance payment work?",
    answer:
      "We accept UPI (Google Pay, PhonePe, Paytm), Cash on Delivery/Pickup, and Net Banking/Cards. When an order is placed, you can make a partial deposit or full payment. The status automatically updates to Pending, Partial Paid, or Paid.",
    tags: ["UPI", "Advance", "Payment"],
  },
  {
    id: "faq_8",
    category: "PAYMENTS",
    question: "How do I download my official Order Details / Invoice PDF?",
    answer:
      "Open the Orders section, click on any order to view details, and click 'Download PDF' or 'Order Details'. On mobile and desktop, the system will generate a crisp high-resolution printable PDF with itemized breakdown and studio seal.",
    tags: ["Invoice", "PDF", "Download"],
  },
  {
    id: "faq_9",
    category: "DELIVERY",
    question: "How are pre-pleated sarees packaged to prevent wrinkles?",
    answer:
      "Every finished saree is reinforced with anti-snag rust-free pins and placed in our signature luxury anti-crease rigid boxes or heavy-duty dust-proof garment hanger bags, ensuring 100% crease-free draping on your event day.",
    tags: ["Box Packaging", "Hanger", "Wrinkle-Free"],
  },
  {
    id: "faq_10",
    category: "DELIVERY",
    question: "Do you offer doorstep pickup and delivery?",
    answer:
      "Yes! We provide safe doorstep pickup and delivery across Hyderabad and surrounding districts. You can also drop off and pick up sarees in person at our Banjara Hills boutique.",
    tags: ["Pickup", "Doorstep", "Hyderabad"],
  },
];

// Step-by-Step Draping Guide Cards
const DRAPING_GUIDES = [
  {
    step: "01",
    title: "Unbox & Align Pallu",
    desc: "Remove the saree from the luxury box. Hold the pre-pleated pallu and place it over your left shoulder, securing it with the pre-attached shoulder safety pin.",
    badge: "30 Seconds",
    icon: <AutoAwesomeOutlinedIcon />,
  },
  {
    step: "02",
    title: "Tuck & Wrap Waist",
    desc: "Wrap the inner edge smoothly around your waist and tuck firmly into your petticoat/shapewear from right to left, matching your recorded height.",
    badge: "45 Seconds",
    icon: <StraightenOutlinedIcon />,
  },
  {
    step: "03",
    title: "Insert Center Pleats",
    desc: "Hold the ready-pressed fan pleats at your navel. Tuck the pleat bundle neatly into your waistband and gently fan out the front pleat cascade.",
    badge: "30 Seconds",
    icon: <DryCleaningOutlinedIcon />,
  },
  {
    step: "04",
    title: "Perfect Draped Look",
    desc: "Check your chest pleat alignment in the mirror. You are ready for your event in under 2 minutes with crisp, zero-wrinkle perfection!",
    badge: "Ready to Glow ✨",
    icon: <CelebrationOutlinedIcon />,
  },
];

const HelpSupport = () => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedFaqId, setExpandedFaqId] = useState("faq_1");

  // Copy helper
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // WhatsApp launcher
  const handleOpenWhatsApp = (customMsg = "") => {
    const text = customMsg || "Hello Aparna Saree Pre-Pleating Studio, I need assistance regarding my saree booking.";
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${STUDIO_WHATSAPP_RAW}?text=${encoded}`;
    window.open(url, "_blank");
  };

  // Dynamic FAQ Category Tabs with Counts
  const faqTabs = useMemo(() => {
    const counts = {
      ALL: FAQS.length,
      ORDERS: FAQS.filter((f) => f.category === "ORDERS").length,
      MEASUREMENTS: FAQS.filter((f) => f.category === "MEASUREMENTS").length,
      FABRICS: FAQS.filter((f) => f.category === "FABRICS").length,
      PAYMENTS: FAQS.filter((f) => f.category === "PAYMENTS").length,
      DELIVERY: FAQS.filter((f) => f.category === "DELIVERY").length,
    };

    return [
      { label: `All Topics (${counts.ALL})`, value: "ALL" },
      { label: `Orders & Bookings (${counts.ORDERS})`, value: "ORDERS" },
      { label: `Measurements & Sizing (${counts.MEASUREMENTS})`, value: "MEASUREMENTS" },
      { label: `Fabrics & Steam Press (${counts.FABRICS})`, value: "FABRICS" },
      { label: `Payments & Invoices (${counts.PAYMENTS})`, value: "PAYMENTS" },
      { label: `Pickup & Delivery (${counts.DELIVERY})`, value: "DELIVERY" },
    ];
  }, []);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((item) => {
      if (activeTab !== "ALL" && item.category !== activeTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const questionMatch = item.question.toLowerCase().includes(q);
        const answerMatch = item.answer.toLowerCase().includes(q);
        const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));
        return questionMatch || answerMatch || tagMatch;
      }
      return true;
    });
  }, [activeTab, searchTerm]);

  return (
    <div className="help-support-page">
      {/* ========================================================= */}
      {/* 1. LUXURY HERO & SEARCH HEADER                            */}
      {/* ========================================================= */}
      <section className="help-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <SupportAgentOutlinedIcon className="badge-icon" />
            <span>Dedicated Client Concierge</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-text">How can we </span>
            <span className="gold-text">help you</span>
            <span className="hero-title-text"> today?</span>
          </h1>
          <p className="hero-subtitle">
            Explore step-by-step saree draping guides, answers to common tailoring
            questions, or connect directly with our master pre-pleaters.
          </p>

          {/* Quick FAQ Search Bar */}
          <div className="hero-search-bar">
            <AppInput
              placeholder="Search help topics, Kanjeevaram care, sizing, order tracking, invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={<SearchOutlinedIcon />}
              className="hero-search-input"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. DIRECT CONCIERGE CHANNELS (4 Luxury Interactive Cards) */}
      {/* ========================================================= */}
      <section className="concierge-channels-grid">
        {/* Channel 1: WhatsApp Support */}
        <div className="channel-card channel-card--whatsapp">
          <div className="channel-icon-wrap whatsapp-glow">
            <WhatsAppIcon className="channel-icon" />
          </div>
          <div className="channel-info">
            <span className="channel-tag">Instant Response (&lt; 15 mins)</span>
            <h3 className="channel-title">WhatsApp Concierge</h3>
            <p className="channel-desc">
              Chat directly with our master drapers for order updates, rush bookings & saree videos.
            </p>
            <div className="channel-value">{STUDIO_WHATSAPP}</div>
          </div>
          <AppButton
            variant="primary"
            size="sm"
            startIcon={<WhatsAppIcon />}
            onClick={() => handleOpenWhatsApp()}
            className="channel-action-btn whatsapp-btn"
          >
            Chat on WhatsApp
          </AppButton>
        </div>

        {/* Channel 2: Studio Hotline Phone */}
        <div className="channel-card channel-card--phone">
          <div className="channel-icon-wrap gold-glow">
            <PhoneIphoneOutlinedIcon className="channel-icon" />
          </div>
          <div className="channel-info">
            <span className="channel-tag">9:00 AM – 8:30 PM IST</span>
            <h3 className="channel-title">Studio Direct Helpline</h3>
            <p className="channel-desc">
              Speak with our boutique team for bookings, measurement consultation, and scheduling.
            </p>
            <div className="channel-value">{STUDIO_PHONE}</div>
          </div>
          <div className="channel-btn-group">
            <AppButton
              variant="secondary"
              size="sm"
              startIcon={<PhoneIphoneOutlinedIcon />}
              onClick={() => (window.location.href = `tel:${STUDIO_PHONE_RAW}`)}
              className="channel-action-btn"
            >
              Call Studio
            </AppButton>
            <button
              type="button"
              className="copy-icon-btn"
              title="Copy Phone Number"
              onClick={() => handleCopyText(STUDIO_PHONE, "Phone number")}
            >
              <ContentCopyOutlinedIcon style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Channel 3: Email Care Desk */}
        <div className="channel-card channel-card--email">
          <div className="channel-icon-wrap gold-glow">
            <EmailOutlinedIcon className="channel-icon" />
          </div>
          <div className="channel-info">
            <span className="channel-tag">Official Inquiries & Invoicing</span>
            <h3 className="channel-title">Concierge Email Desk</h3>
            <p className="channel-desc">
              Send detailed requests, bulk wedding orders, invoice inquiries, and collaborations.
            </p>
            <div className="channel-value">{STUDIO_EMAIL}</div>
          </div>
          <div className="channel-btn-group">
            <AppButton
              variant="secondary"
              size="sm"
              startIcon={<EmailOutlinedIcon />}
              onClick={() =>
                (window.location.href = `mailto:${STUDIO_EMAIL}?subject=Aparna%20Saree%20Pre-Pleating%20Support%20Inquiry`)
              }
              className="channel-action-btn"
            >
              Send Email
            </AppButton>
            <button
              type="button"
              className="copy-icon-btn"
              title="Copy Email Address"
              onClick={() => handleCopyText(STUDIO_EMAIL, "Email address")}
            >
              <ContentCopyOutlinedIcon style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Channel 4: Studio Location */}
        <div className="channel-card channel-card--location">
          <div className="channel-icon-wrap gold-glow">
            <LocationOnOutlinedIcon className="channel-icon" />
          </div>
          <div className="channel-info">
            <span className="channel-tag">Boutique & Handover</span>
            <h3 className="channel-title">Visit Boutique Studio</h3>
            <p className="channel-desc">
              Experience pre-pleated trial draping in person at our flagship Banjara Hills boutique.
            </p>
            <div className="channel-value studio-address-text">
              Banjara Hills, Hyderabad, TS
            </div>
          </div>
          <AppButton
            variant="secondary"
            size="sm"
            startIcon={<LaunchOutlinedIcon />}
            onClick={() => window.open(STUDIO_MAPS_SEARCH_URL, "_blank")}
            className="channel-action-btn"
          >
            Google Maps
          </AppButton>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. GOOGLE MAPS & BOUTIQUE LOCATION INTERACTIVE SECTION   */}
      {/* ========================================================= */}
      <section className="support-section maps-section">
        <div className="section-header-wrap">
          <div className="section-title-wrap">
            <LocationOnOutlinedIcon className="section-header-icon" />
            <div>
              <h2 className="section-title">Visit Our Flagship Studio</h2>
              <p className="section-subtitle">
                Find interactive Google Maps directions, boutique amenities, and in-person saree handover
              </p>
            </div>
          </div>
          <span className="location-badge">Banjara Hills • Hyderabad</span>
        </div>

        <div className="maps-container-card">
          {/* Studio Boutique Information & Amenities */}
          <div className="maps-info-panel">
            <div className="boutique-brand">
              <div className="boutique-badge">
                <AutoAwesomeOutlinedIcon style={{ fontSize: 14 }} />
                <span>Flagship Design Studio</span>
              </div>
              <h3 className="boutique-name">Aparna Saree Pre-Pleating Studio</h3>
              <p className="boutique-address">
                <LocationOnOutlinedIcon className="address-pin" />
                <span>{STUDIO_ADDRESS}</span>
              </p>
            </div>

            {/* Studio Amenities */}
            <div className="boutique-amenities-grid">
              <div className="amenity-item">
                <div className="amenity-icon-wrap">
                  <LocalParkingOutlinedIcon className="amenity-icon" />
                </div>
                <div>
                  <h5 className="amenity-title">Valet & Parking</h5>
                  <p className="amenity-desc">Complimentary dedicated valet</p>
                </div>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-wrap">
                  <CheckroomOutlinedIcon className="amenity-icon" />
                </div>
                <div>
                  <h5 className="amenity-title">Trial Fitting Rooms</h5>
                  <p className="amenity-desc">Private mirrors & drape check</p>
                </div>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-wrap">
                  <Inventory2OutlinedIcon className="amenity-icon" />
                </div>
                <div>
                  <h5 className="amenity-title">Instant Handover</h5>
                  <p className="amenity-desc">Same-day inspection & drop-off</p>
                </div>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-wrap">
                  <CoffeeOutlinedIcon className="amenity-icon" />
                </div>
                <div>
                  <h5 className="amenity-title">Client Lounge</h5>
                  <p className="amenity-desc">Relaxed fabric consultation</p>
                </div>
              </div>
            </div>

            {/* Map Action Buttons */}
            <div className="maps-actions-row">
              <AppButton
                variant="primary"
                size="md"
                startIcon={<NearMeOutlinedIcon />}
                onClick={() => window.open(STUDIO_MAPS_DIRECTIONS_URL, "_blank")}
                className="directions-btn"
              >
                Get Live Directions
              </AppButton>
              <AppButton
                variant="secondary"
                size="md"
                startIcon={<LaunchOutlinedIcon />}
                onClick={() => window.open(STUDIO_MAPS_SEARCH_URL, "_blank")}
                className="maps-app-btn"
              >
                Open in Google Maps
              </AppButton>
              <AppButton
                variant="ghost"
                size="md"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={() => handleCopyText(STUDIO_ADDRESS, "Studio Address")}
                className="copy-address-btn"
              >
                Copy Address
              </AppButton>
            </div>
          </div>

          {/* Interactive Embedded Google Maps Iframe */}
          <div className="maps-embed-wrapper">
            <iframe
              title="Aparna Saree Pre-Pleating Studio Google Maps Location"
              src={STUDIO_MAPS_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="google-maps-iframe"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. STEP-BY-STEP WEARING & PRESERVATION GUIDES             */}
      {/* ========================================================= */}
      <section className="support-section guides-section">
        <div className="section-header-wrap">
          <div className="section-title-wrap">
            <AutoAwesomeOutlinedIcon className="section-header-icon" />
            <div>
              <h2 className="section-title">2-Minute Saree Draping Guide</h2>
              <p className="section-subtitle">
                How to wear your pre-pleated saree flawlessly right out of the box
              </p>
            </div>
          </div>
          <span className="guides-badge">Zero Hassle • 100% Wrinkle Free</span>
        </div>

        <div className="guides-grid">
          {DRAPING_GUIDES.map((g) => (
            <div key={g.step} className="guide-card">
              <div className="guide-card-top">
                <span className="guide-step-number">{g.step}</span>
                <span className="guide-badge">{g.badge}</span>
              </div>
              <div className="guide-icon-pill">{g.icon}</div>
              <h4 className="guide-title">{g.title}</h4>
              <p className="guide-desc">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE FAQ ACCORDION                              */}
      {/* ========================================================= */}
      <section className="support-section faq-section">
        <div className="section-header-wrap">
          <div className="section-title-wrap">
            <HelpOutlineOutlinedIcon className="section-header-icon" />
            <div>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">
                Quick answers regarding bookings, fabrics, sizing, payments, and delivery
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="faq-tabs-wrap">
          <AppTabs
            tabs={faqTabs}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="faq-accordion-list">
          {filteredFaqs.length === 0 ? (
            <div className="faq-empty-state">
              <SearchOutlinedIcon className="empty-icon" />
              <p className="empty-text">
                No questions found matching "${searchTerm}".
              </p>
              <AppButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setActiveTab("ALL");
                }}
              >
                Clear Search
              </AppButton>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`faq-accordion-item ${isExpanded ? "is-expanded" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() =>
                      setExpandedFaqId(isExpanded ? null : faq.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="faq-question-text">{faq.question}</span>
                    <span className={`faq-chevron ${isExpanded ? "rotated" : ""}`}>
                      <ExpandMoreIcon />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="faq-answer-body">
                      <p className="faq-answer-text">{faq.answer}</p>
                      <div className="faq-tags-row">
                        {faq.tags.map((tag) => (
                          <span key={tag} className="faq-tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. STUDIO GUARANTEE & SERVICE PILLARS                     */}
      {/* ========================================================= */}
      <section className="support-section guarantee-section">
        <div className="section-header-wrap">
          <div className="section-title-wrap">
            <VerifiedOutlinedIcon className="section-header-icon" />
            <div>
              <h2 className="section-title">Aparna Studio Guarantee</h2>
              <p className="section-subtitle">
                Our uncompromising commitment to luxury craftsmanship and fabric preservation
              </p>
            </div>
          </div>
          <span className="guarantee-badge">100% Quality Assurance</span>
        </div>

        <div className="studio-guarantee-card">
          <div className="guarantee-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon-wrap">
                <CheckCircleOutlineIcon className="pillar-icon" />
              </div>
              <div>
                <h4 className="pillar-title">100% Crease-Resistant Finish</h4>
                <p className="pillar-desc">
                  Every pleat is heat-set and secured to remain crisp throughout your wedding or party.
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-wrap">
                <ShieldOutlinedIcon className="pillar-icon" />
              </div>
              <div>
                <h4 className="pillar-title">Zero-Damage Fabric Protection</h4>
                <p className="pillar-desc">
                  Rust-free pearl head pins and gentle steam calibrated for pure silk, zari, and delicate organza.
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-wrap">
                <AccessTimeOutlinedIcon className="pillar-icon" />
              </div>
              <div>
                <h4 className="pillar-title">Prompt On-Time Delivery</h4>
                <p className="pillar-desc">
                  Strict adherence to your scheduled delivery date with real-time tracking.
                </p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-wrap">
                <LocalShippingOutlinedIcon className="pillar-icon" />
              </div>
              <div>
                <h4 className="pillar-title">Signature Luxury Packaging</h4>
                <p className="pillar-desc">
                  Delivered in rigid protective presentation boxes or breathable zippered garment bags.
                </p>
              </div>
            </div>
          </div>

          <div className="studio-hours-box">
            <div className="hours-title-row">
              <AccessTimeOutlinedIcon style={{ fontSize: 16 }} />
              <span>Studio Working Hours</span>
            </div>
            <div className="hours-grid">
              <div className="hours-row">
                <span>Monday – Saturday:</span>
                <strong>9:00 AM – 8:30 PM</strong>
              </div>
              <div className="hours-row">
                <span>Sunday:</span>
                <strong>10:00 AM – 6:00 PM</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpSupport;
