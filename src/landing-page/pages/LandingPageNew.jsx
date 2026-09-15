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
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
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
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { useAuth } from "../../auth/context/AuthContext";
import Footer from "../components/Footer/Footer";
import brandLogo from "../../assets/logo.png";
import hero1 from "../../assets/hero1.jpg";
import hero2 from "../../assets/hero2.jpg";
import hero3 from "../../assets/hero3.jpg";
import mhero1 from "../../assets/mhero1.jpg";
import mhero2 from "../../assets/mhero2.jpg";
import mhero3 from "../../assets/mhero3.jpg";
import ladyLogo from "../../assets/lady-logo.png";
import appIconImg from "../../assets/app-icon.png";
import g1 from "../../assets/g1.jpg";
import g2 from "../../assets/g2.jpg";
import g3 from "../../assets/g3.jpg";
import g4 from "../../assets/g4.jpg";
import g5 from "../../assets/g5.jpg";
import g6 from "../../assets/g6.jpg";
import g7 from "../../assets/g7.jpg";
import g8 from "../../assets/g8.jpg";
import g9 from "../../assets/g9.jpg";
import g10 from "../../assets/g10.jpg";
import g11 from "../../assets/g11.jpg";
import g12 from "../../assets/g12.jpg";
import g13 from "../../assets/g13.jpg";
import g14 from "../../assets/g14.jpg";
import g15 from "../../assets/g15.jpg";
import g16 from "../../assets/g16.jpg";
import g17 from "../../assets/g17.jpg";
import g18 from "../../assets/g18.jpg";
import g19 from "../../assets/g19.jpg";
import g20 from "../../assets/g20.jpg";
import "./LandingPageNew.scss";

const HERO_SLIDES = [
  { desktop: hero1, mobile: mhero1 },
  { desktop: hero2, mobile: mhero2 },
  { desktop: hero3, mobile: mhero3 },
];

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

const GALLERY_CATEGORIES = [
  { id: "all", label: "All Drapes", count: "20" },
  { id: "bridal", label: "Bridal Couture", count: "5" },
  { id: "heritage", label: "Heritage Weaves", count: "7" },
  { id: "contemporary", label: "Contemporary & Party", count: "5" },
  { id: "mastercraft", label: "Mastercraft & 2-Min Fit", count: "3" },
];

const GALLERY_ITEMS = [
  {
    id: "img-1",
    title: "Bridal Kanchipuram",
    subtitle: "Pure Mulberry Silk & Real Gold Zari",
    category: "Bridal Couture",
    categoryKey: "bridal",
    badge: "Royal Pattu",
    fabric: "Pure Mulberry Kanchipuram Silk",
    pleatStyle: "Calibrated Knife Pleats with Micro-Steam Hold",
    wearTime: "Under 120 Seconds",
    img: g1,
    desc: "Exquisite temple border with heavy golden zari pallu, hand-pleated with precision razor symmetry that stays intact through 8+ hours of muhurtham rituals.",
    highlights: [
      "Pure Gold Zari Protection",
      "Razor-Sharp Symmetrical Folds",
      "Pre-Pinned Pallu Drop",
    ],
  },
  {
    id: "img-2",
    title: "Banarasi Royal Brocade",
    subtitle: "Intricate Floral Kadwa Weave",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Handloom Kadwa",
    fabric: "Katan Silk with Real Silver & Gold Brocade",
    pleatStyle: "Flat Calibrated Pressing",
    wearTime: "2 Minutes",
    img: g2,
    desc: "Regal Varanasi gold floral weave crafted with flat calibrated folds that drape cleanly without puffing around the hip.",
    highlights: [
      "Non-Bulky Waist Line",
      "Thermal Steam Preserved Zari",
      "Seamless Fall & Movement",
    ],
  },
  {
    id: "img-3",
    title: "Modern Organza Silk",
    subtitle: "Featherlight Drape with Crisp Fluff",
    category: "Contemporary & Party",
    categoryKey: "contemporary",
    badge: "Trending Volume",
    fabric: "Sheer Silk Organza",
    pleatStyle: "Semi-Fluffy Sculpted Pleats",
    wearTime: "90 Seconds",
    img: g3,
    desc: "Voluminous dreamy pleats engineered to hold their shape comfortably from dawn till dusk without flattening or crumpling.",
    highlights: [
      "Featherlight Cloud Feel",
      "Sculpted Shape Retention",
      "Zero Sagging Guarantee",
    ],
  },
  {
    id: "img-4",
    title: "Maharani Double Pallu",
    subtitle: "Royal Court Muhurtham Silhouette",
    category: "Bridal Couture",
    categoryKey: "bridal",
    badge: "Atelier Bespoke",
    fabric: "Bridal Raw Silk & Tissue Dupatta",
    pleatStyle: "Dual Tier Pallu with Fitted Chest Fan",
    wearTime: "Under 3 Minutes",
    img: g4,
    desc: "Double-dupatta layering with structured chest pleats and sweeping cathedral-length pallu for regal wedding receptions.",
    highlights: [
      "Symmetrical Double-Drape",
      "Secure Pin-Free Feel",
      "Grand Photographic Impact",
    ],
  },
  {
    id: "img-5",
    title: "Archival Box Pleats",
    subtitle: "Geometric Precision & Travel Pack",
    category: "Mastercraft & 2-Min Fit",
    categoryKey: "mastercraft",
    badge: "Destination Ready",
    fabric: "All Pure Silks & Blends",
    pleatStyle: "Archival Crease-Lock Box Fold",
    wearTime: "Ready to Slip On",
    img: g5,
    desc: "Compact travel-safe box folding preserving pristine crease lines for flight travel and destination weddings across India.",
    highlights: [
      "Suitcase & Flight Friendly",
      "Zero Crushed Pleats",
      "Dust-Proof Archival Packaging",
    ],
  },
  {
    id: "img-6",
    title: "Tissue Silk Radiance",
    subtitle: "Liquid Metallic Shimmer & Sleek Lines",
    category: "Contemporary & Party",
    categoryKey: "contemporary",
    badge: "Ultra Glam",
    fabric: "Pure Metallic Tissue Silk",
    pleatStyle: "Ultra-Flat Sleek Press",
    wearTime: "2 Minutes",
    img: g6,
    desc: "Gleaming tissue silk pressed with zero heat damage to highlight shimmering metallic highlights and body-hugging lines.",
    highlights: [
      "Liquid Metal Shimmer",
      "Zero Scratch or Fraying",
      "Perfect Body Posture Line",
    ],
  },
  {
    id: "img-7",
    title: "Paithani Peacock Pallu",
    subtitle: "Maharashtrian Tapestry Heritage",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Vintage Gold",
    fabric: "Pure Yeola Paithani Silk",
    pleatStyle: "Traditional Pleat Fan",
    wearTime: "2 Minutes",
    img: g7,
    desc: "Heavy kaleidoscopic peacock pallu balanced with structured shoulder pin-points for zero slipping during rituals.",
    highlights: [
      "Heavy Pallu Weight Distribution",
      "Vibrant Tapestry Reveal",
      "Zero Slip Shoulder Hold",
    ],
  },
  {
    id: "img-8",
    title: "Bandhani Silk Drapes",
    subtitle: "Traditional Tie-Dye with Clean Pleats",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Sangeet Favorite",
    fabric: "Fine Georgette & Gharchola Silk",
    pleatStyle: "Micro-Pleat Swirl",
    wearTime: "2 Minutes",
    img: g8,
    desc: "Fine Georgette bandhej with micro-pleats that swirl naturally with every dance step at Sangeet celebrations.",
    highlights: [
      "Dynamic Swirl Flow",
      "Dance & Walk Ease",
      "Rich Texture Definition",
    ],
  },
  {
    id: "img-9",
    title: "Half Saree Langa Voni",
    subtitle: "Youthful Grace with Fitted Waist Pleats",
    category: "Mastercraft & 2-Min Fit",
    categoryKey: "mastercraft",
    badge: "Half Saree",
    fabric: "Pattu Lehenga with Silk Voni",
    pleatStyle: "Cross-Body Pleated Voni",
    wearTime: "2 Minutes",
    img: g9,
    desc: "South Indian traditional half-saree draping with fitted waist pleats and neat cross-body voni for half-saree functions.",
    highlights: [
      "Snug Waistband Fit",
      "Graceful Voni Drop",
      "Youthful Traditional Look",
    ],
  },
  {
    id: "img-10",
    title: "Pure Georgette Cascade",
    subtitle: "Fluid Cascading Drapes for Evening Gala",
    category: "Contemporary & Party",
    categoryKey: "contemporary",
    badge: "Slimming Fit",
    fabric: "60-Gram Pure Silk Georgette",
    pleatStyle: "Flowing Waterfall Pleats",
    wearTime: "90 Seconds",
    img: g10,
    desc: "Ultra-slimming silhouette designed to accentuate body posture with zero bulkiness around the waist.",
    highlights: [
      "Hourglass Contour Drape",
      "Fluid Motion",
      "Red Carpet Evening Look",
    ],
  },
  {
    id: "img-11",
    title: "Mysore Crepe Silk",
    subtitle: "Butter-Soft Drape with Minimalist Grace",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Pure Crepe",
    fabric: "Original Mysore Silk (100% Pure Zari)",
    pleatStyle: "Soft-Pressed Natural Folds",
    wearTime: "2 Minutes",
    img: g11,
    desc: "Pure zari gold border with supple drape, customized to height for an effortless 2-minute wear.",
    highlights: [
      "Butter-Soft Touch",
      "Featherweight Draping",
      "Effortless All-Day Wear",
    ],
  },
  {
    id: "img-12",
    title: "Chanderi Gold Motif",
    subtitle: "Sheer Elegance with Handwoven Buttis",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Handloom Heritage",
    fabric: "Silk-Cotton Chanderi with Zari Buttis",
    pleatStyle: "Delicate Steamed Micro-Pleats",
    wearTime: "2 Minutes",
    img: g12,
    desc: "Lightweight handloom weave pleated with delicate care to preserve fine gold and silver buttis.",
    highlights: [
      "Breathable & Light",
      "Preserved Handwoven Motifs",
      "Crisp Summer Finish",
    ],
  },
  {
    id: "img-13",
    title: "Velvet Embroidered Saree",
    subtitle: "Rich Texture for Winter Weddings",
    category: "Bridal Couture",
    categoryKey: "bridal",
    badge: "Winter Royal",
    fabric: "Micro-Velvet with Zardozi Work",
    pleatStyle: "Structured Micro-Steamed Folds",
    wearTime: "Under 3 Minutes",
    img: g13,
    desc: "Structured micro-steamed pleating for dense velvet fabrics, reducing heaviness and improving drape flow.",
    highlights: [
      "Reduced Heavy Bulk",
      "Zardozi Thread Protection",
      "Opulent Royal Silhouette",
    ],
  },
  {
    id: "img-14",
    title: "Ready-to-Wear Pattu",
    subtitle: "Instant 2-Minute Pre-Stitched Perfection",
    category: "Mastercraft & 2-Min Fit",
    categoryKey: "mastercraft",
    badge: "Ready-in-120s",
    fabric: "Bridal Pattu & Designer Silks",
    pleatStyle: "Hook & Zip Quick-Snap Band",
    wearTime: "120 Seconds Flat",
    img: g14,
    desc: "Pre-measured waistband and calibrated pleats — wear in under 120 seconds with zero pins or assistance required.",
    highlights: [
      "Zero Safety Pins Needed",
      "Fits Perfectly in 2 Minutes",
      "Ideal for NRI & Busy Brides",
    ],
  },
  {
    id: "img-15",
    title: "Temple Border Silk",
    subtitle: "Architectural Korvai Pleated Borders",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Korvai Weave",
    fabric: "Traditional Korvai Handloom Silk",
    pleatStyle: "Evenly Staggered Temple Folds",
    wearTime: "2 Minutes",
    img: g15,
    desc: "Evenly staggered pleats highlighting each architectural temple motif with crisp visual cadence.",
    highlights: [
      "Aligned Temple Motifs",
      "Crisp Symmetrical Steaming",
      "Classic South Indian Charm",
    ],
  },
  {
    id: "img-16",
    title: "Cocktail Pleat Flurry",
    subtitle: "Modern Silhouette for Sangeet & Reception",
    category: "Contemporary & Party",
    categoryKey: "contemporary",
    badge: "Party Glam",
    fabric: "Metallic Lurex Shimmer Crepe",
    pleatStyle: "Contemporary Dynamic Flares",
    wearTime: "2 Minutes",
    img: g16,
    desc: "Contemporary pleating geometry creating striking silhouettes for evening receptions and red carpet events.",
    highlights: [
      "Striking Modern Silhouette",
      "Fluid Twirl Dynamics",
      "Glamorous Gold Accents",
    ],
  },
  {
    id: "img-17",
    title: "Royal Uppada Silk",
    subtitle: "Jamdani Floral Border Masterpiece",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Uppada Jamdani",
    fabric: "Pure Uppada Handloom Silk",
    pleatStyle: "Fine Pressed Symmetrical Pleats",
    wearTime: "2 Minutes",
    img: g17,
    desc: "Delicate Uppada weave styled with feather-soft folds that accentuate intricate Jamdani zari motifs.",
    highlights: [
      "Feather-light Feel",
      "Intricate Zari Alignment",
      "Graceful Traditional Fall",
    ],
  },
  {
    id: "img-18",
    title: "Gadwal Zari Contrast",
    subtitle: "Handloom Cotton-Silk Fusion",
    category: "Heritage Weaves",
    categoryKey: "heritage",
    badge: "Gadwal Pure",
    fabric: "Gadwal Silk-Cotton Blend",
    pleatStyle: "Crisp Knife Folds",
    wearTime: "2 Minutes",
    img: g18,
    desc: "Classic Gadwal with pure silk borders structured cleanly with zero sagging during long poojas and rituals.",
    highlights: [
      "Crisp Cotton-Silk Hold",
      "Contrast Border Focus",
      "Comfort All-Day Wear",
    ],
  },
  {
    id: "img-19",
    title: "Tussar Handloom Saree",
    subtitle: "Organic Golden Sheen with Floral Pallu",
    category: "Contemporary & Party",
    categoryKey: "contemporary",
    badge: "Raw Texture",
    fabric: "Wild Tussar Silk",
    pleatStyle: "Textured Natural Pleats",
    wearTime: "90 Seconds",
    img: g19,
    desc: "Rich textured organic wild silk pleated with thermal steam to maintain natural rustic lustre.",
    highlights: [
      "Natural Gold Sheen",
      "Breathable Texture",
      "Contemporary Chic Look",
    ],
  },
  {
    id: "img-20",
    title: "Grand Reception Silhouette",
    subtitle: "Designer Bridal Drape with Shimmer Trail",
    category: "Bridal Couture",
    categoryKey: "bridal",
    badge: "Grand Finale",
    fabric: "Heavy Embroidered Bridal Pattu",
    pleatStyle: "Cathedral Trail & Sculpted Waist",
    wearTime: "Under 3 Minutes",
    img: g20,
    desc: "Showstopper bridal drape with structured waist pleats and sweeping red carpet pallu for unforgettable grand entrances.",
    highlights: [
      "Showstopper Trail",
      "Ultra Secure Fit",
      "Royal Photographic Allure",
    ],
  },
];

const LandingPageNew = () => {
  const { currentUser } = useAuth();
  const [isLoaded, setIsLoaded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Ensure landing page is strictly isolated in default luxury obsidian gold theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "default");

    return () => {
      // Restore dashboard theme when navigating away
      try {
        const savedTheme =
          localStorage.getItem("aparna_app_theme") || "default";
        root.setAttribute("data-theme", savedTheme);
      } catch {
        // Ignore storage errors
      }
    };
  }, []);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuotePaused, setIsQuotePaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);

  // Hero Background Slideshow Interval (Transitions across hero1.png, hero2.png, hero3.png)
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, []);

  // Filtered gallery items based on activeCategory
  const filteredGalleryItems =
    activeCategory === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.categoryKey === activeCategory);

  useEffect(() => {
    if (isQuotePaused) return;
    const timer = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % FOUNDER_QUOTES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isQuotePaused]);

  // Gallery Auto-Slide Interval
  useEffect(() => {
    if (!isAutoPlaying || selectedGalleryItem) return;
    const interval = setInterval(() => {
      setActiveGalleryIdx((prev) => (prev + 1) % filteredGalleryItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedGalleryItem, filteredGalleryItems.length]);

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

      // Track active section for nav highlight (Check bottom-to-top: Contact -> App -> Gallery -> Services -> About -> Home)
      const contactEl = document.getElementById("contact");
      const appEl = document.getElementById("app");
      const galleryEl = document.getElementById("gallery");
      const servicesEl = document.getElementById("services");
      const aboutEl = document.getElementById("about");

      const threshold = Math.min(window.innerHeight * 0.45, 360);

      if (contactEl && contactEl.getBoundingClientRect().top <= threshold) {
        setActiveSection("contact");
      } else if (appEl && appEl.getBoundingClientRect().top <= threshold) {
        setActiveSection("app");
      } else if (
        galleryEl &&
        galleryEl.getBoundingClientRect().top <= threshold
      ) {
        setActiveSection("gallery");
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
            // Re-arm animation when scrolled out
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

  const getLogo = () => brandLogo;

  const WHATSAPP_NUMBER = import.meta.env.VITE_STUDIO_WHATSAPP_RAW || "919553900003";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello Aparna ji, I would like to book a saree pre-pleating and draping service with you.",
  )}`;
  const instagramUrl = import.meta.env.VITE_STUDIO_INSTAGRAM_URL || "https://www.instagram.com/aparna_saree_prepleating/";

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

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setActiveGalleryIdx(0);
  };

  const handlePrevGallery = () => {
    setActiveGalleryIdx((prev) => {
      return (
        (prev - 1 + filteredGalleryItems.length) % filteredGalleryItems.length
      );
    });
  };

  const handleNextGallery = () => {
    setActiveGalleryIdx((prev) => {
      return (prev + 1) % filteredGalleryItems.length;
    });
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current;
    if (deltaX > 45) {
      handlePrevGallery();
    } else if (deltaX < -45) {
      handleNextGallery();
    }
    touchStartRef.current = null;
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
        {/* Multi-Image Hero Background Slideshow (hero1.png -> hero2.png -> hero3.png) */}
        <div className="luxury-hero-backdrop">
          {/* Deep dark base layer behind images */}
          <div className="luxury-hero-dark-base" />

          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`luxury-hero-bg-slide ${idx === heroSlideIdx ? "is-active" : ""}`}
              style={{
                "--hero-bg-desktop": `url(${slide.desktop})`,
                "--hero-bg-mobile": `url(${slide.mobile})`,
              }}
            />
          ))}

          {/* Dual-layer dark gradient overlay: Clear on left for lady, deep dark on right for text */}
          <div className="luxury-hero-overlay" />
          <div className="luxury-hero-right-dark-layer" />

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

        {/* Hero Background Slide Pagination Indicators */}
        <div className="hero-slide-indicators anim-hero-scroll">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`hero-slide-dot ${idx === heroSlideIdx ? "is-active" : ""}`}
              onClick={() => setHeroSlideIdx(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

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
          GALLERY SECTION: 3D Perspective Runway Stage & Haute Lookbook Carousel
          ========================================================================= */}
      <section id="gallery" className="luxury-runway-gallery-section">
        <div className="section-ambient-aura section-ambient-aura--gallery" />

        <div className="section-container">
          {/* Section Header */}
          <div className="gallery-header-wrap reveal-on-scroll">
            <span className="section-eyebrow">Our Gallery</span>
            <h2 className="section-heading">
              Couture Saree Draping &amp; Pleating
            </h2>
            <p className="section-subtext">
              Explore our mastercrafted silhouettes, bridal pattu folds, and
              2-minute ready-to-wear saree perfection.
            </p>
          </div>

          {/* Category Filter Tabs Bar (Commented out as requested) */}
          {/* <div className="gallery-category-tabs reveal-on-scroll">
            <div className="category-tabs-track">
              {GALLERY_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-pill-btn ${isActive ? "active" : ""}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className="cat-label">{cat.label}</span>
                    <span className="cat-count">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div> */}

          {/* 3D Runway Stage Container */}
          <div
            className="luxury-runway-stage-container reveal-on-scroll reveal-pop"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient Spotlight Auras */}
            <div className="stage-spotlight-beam" />

            {/* 3D Cards Track */}
            <div className="runway-3d-track">
              {filteredGalleryItems.map((item, idx) => {
                const total = filteredGalleryItems.length;
                let offset = idx - activeGalleryIdx;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const isActive = offset === 0;

                let cardClass = "runway-card";
                if (isActive) cardClass += " card--active";
                else if (offset === 1) cardClass += " card--next-1";
                else if (offset === -1) cardClass += " card--prev-1";
                else if (offset === 2) cardClass += " card--next-2";
                else if (offset === -2) cardClass += " card--prev-2";
                else cardClass += " card--hidden";

                return (
                  <div
                    key={item.id}
                    className={cardClass}
                    style={{
                      "--offset": offset,
                    }}
                    onClick={() => {
                      if (isActive) {
                        setSelectedGalleryItem(item);
                      } else {
                        setActiveGalleryIdx(idx);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${item.title}`}
                  >
                    <div className="runway-card-inner">
                      <img
                        src={item.img}
                        alt={item.title || "Aparna Saree Pre-Pleating"}
                        loading="lazy"
                        className="runway-card-img"
                      />
                      <div className="card-gold-sheen-border" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Left & Right Navigation Arrows */}
            <button
              type="button"
              className="runway-arrow-btn runway-arrow-btn--prev"
              onClick={handlePrevGallery}
              aria-label="Previous Saree"
            >
              <ChevronLeftIcon />
            </button>

            <button
              type="button"
              className="runway-arrow-btn runway-arrow-btn--next"
              onClick={handleNextGallery}
              aria-label="Next Saree"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Navigation Controls Bar */}
          <div className="runway-controls-bar">
            {/* Prev Button */}
            <button
              type="button"
              className="ctrl-nav-btn"
              onClick={handlePrevGallery}
              aria-label="Previous Drape"
            >
              <ChevronLeftIcon />
            </button>

            {/* Slide Counter */}
            <div className="ctrl-info-pill">
              <span className="ctrl-current">
                {String(activeGalleryIdx + 1).padStart(2, "0")}
              </span>
              <span className="ctrl-sep">/</span>
              <span className="ctrl-total">
                {String(filteredGalleryItems.length).padStart(2, "0")}
              </span>
              {/* <span className="ctrl-divider">|</span>
              <span className="ctrl-active-title">
                {filteredGalleryItems[activeGalleryIdx]?.title || "Haute Saree"}
              </span> */}
            </div>

            {/* Next Button */}
            <button
              type="button"
              className="ctrl-nav-btn"
              onClick={handleNextGallery}
              aria-label="Next Drape"
            >
              <ChevronRightIcon />
            </button>

            {/* Auto-Play Toggle */}
            <button
              type="button"
              className={`ctrl-autoplay-btn ${isAutoPlaying ? "is-playing" : ""}`}
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              title={isAutoPlaying ? "Pause Autoplay" : "Resume Autoplay"}
              aria-label="Toggle Autoplay"
            >
              {isAutoPlaying ? (
                <PauseIcon className="play-ico" />
              ) : (
                <PlayArrowIcon className="play-ico" />
              )}
              <span className="autoplay-label">
                {isAutoPlaying ? "Auto" : "Paused"}
              </span>
            </button>
          </div>

          {/* Interactive Miniature Thumbnail Strip */}
          <div className="runway-thumbnail-strip">
            <div className="thumb-track">
              {filteredGalleryItems.map((item, idx) => {
                const isActive = idx === activeGalleryIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`thumb-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveGalleryIdx(idx)}
                    aria-label={`Go to ${item.title}`}
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      loading="lazy"
                      className="thumb-img"
                    />
                    <span className="thumb-idx">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fullscreen High-Res Lightbox Modal */}
        {selectedGalleryItem && (
          <div
            className="luxury-lightbox-backdrop"
            onClick={() => setSelectedGalleryItem(null)}
          >
            <div
              className="luxury-lightbox-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setSelectedGalleryItem(null)}
                aria-label="Close Preview"
              >
                <CloseIcon />
              </button>

              <div className="lightbox-image-wrap">
                <img
                  src={selectedGalleryItem.img}
                  alt={selectedGalleryItem.title}
                  className="lightbox-main-img"
                />
                {/* <div className="lightbox-img-overlay">
                  <span className="lightbox-badge">
                    {selectedGalleryItem.badge || selectedGalleryItem.category}
                  </span>
                  <span className="lightbox-time-badge">
                    ⏱ {selectedGalleryItem.wearTime || "2 Minutes Wear"}
                  </span>
                </div> */}
              </div>

              <div className="lightbox-details-panel">
                <span className="lightbox-category">
                  {selectedGalleryItem.category}
                </span>
                <h3 className="lightbox-title">{selectedGalleryItem.title}</h3>
                <p className="lightbox-subtitle">
                  {selectedGalleryItem.subtitle}
                </p>
                <p className="lightbox-desc">{selectedGalleryItem.desc}</p>

                {/* Mastercraft Specs Grid */}
                <div className="lightbox-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Fabric Care</span>
                    <span className="spec-val">
                      {selectedGalleryItem.fabric || "Pure Handloom Silk"}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Pleat Geometry</span>
                    <span className="spec-val">
                      {selectedGalleryItem.pleatStyle || "Calibrated Precision"}
                    </span>
                  </div>
                </div>

                {/* Highlights List */}
                {selectedGalleryItem.highlights && (
                  <div className="lightbox-features">
                    {selectedGalleryItem.highlights.map((feat, fIdx) => (
                      <div key={fIdx} className="l-feat">
                        <span className="l-star">✦</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Booking Action */}
                <div className="lightbox-cta-wrap">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hello Aparna ji, I would like to book the ${selectedGalleryItem.title} (${selectedGalleryItem.category}) pre-pleating and draping service.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="luxury-cta-gold"
                  >
                    <WhatsAppIcon className="cta-icon-wa" />
                    <span>Book This Drape on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          ANDROID APP DOWNLOAD SECTION: Official Android App & Tracking Experience
          ========================================================================= */}
      {/* =========================================================================
          ANDROID APP DOWNLOAD SECTION: Official Android App & Tracking Experience
          ========================================================================= */}
      <section id="app" className="luxury-app-download-section">
        {/* Animated Background Aura for App Section */}
        <div className="section-ambient-aura section-ambient-aura--app" />
        <div className="section-container">
          {/* Section Header */}
          <div className="app-download-header reveal-on-scroll">
            <span className="section-eyebrow">Official Mobile App</span>
            <h2 className="section-heading">Download Our Android App</h2>
            <p className="section-subtext">
              Direct booking, live order tracking &amp; doorstep pickup across
              Hyderabad.
            </p>
          </div>

          <div className="app-single-card-wrap">
            <div className="app-feature-card reveal-on-scroll reveal-pop">
              {/* App Brand Identity Badge */}
              <div className="app-badge-identity">
                <div className="app-icon-glow-wrap">
                  <img
                    src={appIconImg || ladyLogo}
                    alt="Aparna Saree App"
                    className="app-icon-img"
                  />
                </div>
                <div className="app-identity-text">
                  <h3 className="app-name-title">Aparna Saree Pre-Pleating</h3>
                  <span className="app-version-pill">
                    <VerifiedUserOutlinedIcon className="v-pill-icon" />
                    Official Android App • v1.0.0 (Production)
                  </span>
                </div>
              </div>

              {/* 3 Direct Feature Highlights */}
              <div className="app-quick-highlights">
                <div className="app-highlight-chip">
                  <div className="chip-ico-box">
                    <TouchAppOutlinedIcon className="chip-mui-icon" />
                  </div>
                  <div className="chip-text">
                    <strong>Instant Saree Booking</strong>
                    <span>Select flat, fluffy or box pleats in seconds</span>
                  </div>
                </div>
                <div className="app-highlight-chip">
                  <div className="chip-ico-box">
                    <NotificationsActiveOutlinedIcon className="chip-mui-icon" />
                  </div>
                  <div className="chip-text">
                    <strong>Live Steaming Milestones</strong>
                    <span>Real-time updates from pickup to dispatch</span>
                  </div>
                </div>
                <div className="app-highlight-chip">
                  <div className="chip-ico-box">
                    <LocalShippingOutlinedIcon className="chip-mui-icon" />
                  </div>
                  <div className="chip-text">
                    <strong>Doorstep Pickup &amp; Delivery</strong>
                    <span>Seamless home valet across Hyderabad</span>
                  </div>
                </div>
              </div>

              {/* Big Prominent Download CTA */}
              <div className="app-card-cta-row">
                <a
                  href="/aparna-saree-pre-pleating-prod.apk"
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
                  <VerifiedUserOutlinedIcon className="v-icon" />
                  <span>
                    100% Virus-Free &amp; Verified APK • 30MB • Safe Install
                  </span>
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
            <WomanOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">About Us</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "services" ? "active" : ""}`}
            onClick={() => scrollToSection("services")}
            title="Services"
            aria-label="Services"
          >
            <IronOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">Services</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "gallery" ? "active" : ""}`}
            onClick={() => scrollToSection("gallery")}
            title="Gallery"
            aria-label="Gallery"
          >
            <CollectionsOutlinedIcon className="dock-icon" />
            <span className="dock-nav-label">Gallery</span>
          </button>

          <button
            type="button"
            className={`dock-nav-item ${activeSection === "app" ? "active" : ""}`}
            onClick={() => scrollToSection("app")}
            title="App"
            aria-label="App"
          >
            <AndroidIcon className="dock-icon" />
            <span className="dock-nav-label">App</span>
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
