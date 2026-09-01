"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  methodologySteps,
  quranicVerses,
  propheticDuas,
  spiritualMeasures,
  RuqyahItem,
} from "./data/ruqyahData";

/* ==========================================================================
   Sound & Haptics Helper (Web Audio API - Zero Asset Dependency)
   ========================================================================== */
class FeedbackAudio {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  static playClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context might be restricted before interaction
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
  }

  static playComplete() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  }
}

export default function RuqyahApp() {
  const [, startTransition] = useTransition();

  // State Management
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontScale, setFontScale] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("methodology");

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Theme and Font Scale from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("ruqyah_theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    const savedScale = localStorage.getItem("ruqyah_font_scale");
    if (savedScale) {
      const scaleNum = parseFloat(savedScale);
      setFontScale(scaleNum);
      document.documentElement.style.setProperty("--font-scale", scaleNum.toString());
    }

    // Scroll listener for back-to-top button
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("ruqyah_theme", nextTheme);
  };

  // Font Scaler Handlers
  const handleIncreaseFont = () => {
    if (fontScale < 1.4) {
      const nextScale = Math.min(1.4, +(fontScale + 0.1).toFixed(2));
      setFontScale(nextScale);
      document.documentElement.style.setProperty("--font-scale", nextScale.toString());
      localStorage.setItem("ruqyah_font_scale", nextScale.toString());
    }
  };

  const handleDecreaseFont = () => {
    if (fontScale > 0.85) {
      const nextScale = Math.max(0.85, +(fontScale - 0.1).toFixed(2));
      setFontScale(nextScale);
      document.documentElement.style.setProperty("--font-scale", nextScale.toString());
      localStorage.setItem("ruqyah_font_scale", nextScale.toString());
    }
  };

  const handleResetFont = () => {
    setFontScale(1);
    document.documentElement.style.setProperty("--font-scale", "1");
    localStorage.setItem("ruqyah_font_scale", "1");
  };

  // Toast System
  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3200);
  };

  // Counter Handler
  const handleCounterClick = (item: RuqyahItem) => {
    const current = counts[item.id] || 0;
    if (current < item.targetCount) {
      const next = current + 1;
      setCounts((prev) => ({ ...prev, [item.id]: next }));
      FeedbackAudio.playClick();

      if (next === item.targetCount) {
        FeedbackAudio.playComplete();
        showToast(`ما شاء اللہ! تلاوت مکمل ہوئی۔ (${item.targetLabel})`);
      }
    } else {
      // Completed, clicking restarts
      setCounts((prev) => ({ ...prev, [item.id]: 0 }));
      FeedbackAudio.playClick();
    }
  };

  const handleCounterReset = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
    FeedbackAudio.playClick();
  };

  const handleResetAllCounters = () => {
    setCounts({});
    FeedbackAudio.playClick();
    showToast("تمام کاؤنٹرز دوبارہ شروع کر دیے گئے۔");
  };

  // Copy Verse to Clipboard
  const handleCopy = (item: RuqyahItem) => {
    const targetInfo = item.targetLabel ? `(تعداد: ${item.targetLabel})` : "";
    const textToCopy = `${item.title} ${targetInfo}\n\n${item.arabic}\n\nاردو ترجمہ:\n${item.translation}\n\n— الرقیۃ الشرعیۃ مسنون رہنمائی`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("کلمات اردو ترجمہ سمیت کاپی کر لیے گئے ہیں۔");
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("کلمات کاپی کر لیے گئے ہیں۔");
    }
  };

  // PDF Export Generation via html2pdf.js with Flawless Pagination
  const handleExportPdf = async () => {
    const element = document.getElementById("printable-ruqyah-manual");
    if (!element) return;

    // Check if html2pdf is available
    const win = window as unknown as {
      html2pdf?: () => {
        set: (opt: object) => {
          from: (el: HTMLElement) => {
            save: () => Promise<void>;
          };
        };
      };
    };

    if (!win.html2pdf) {
      window.print();
      return;
    }

    setIsPdfGenerating(true);
    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);
    document.body.classList.add("pdf-export-mode");

    await new Promise((resolve) => setTimeout(resolve, 400));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: "Al-Ruqyah-Al-Shariah-Complete-Guide.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [
          ".ruqyah-card",
          ".step-card",
          ".measure-card",
          ".pdf-keep-together",
          ".app-footer",
        ],
      },
    };

    try {
      await win.html2pdf().set(opt).from(element).save();
      showToast("پی ڈی ایف کامیابی سے ڈاؤنلوڈ ہو گئی ہے۔");
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      document.body.classList.remove("pdf-export-mode");
      window.scrollTo(0, prevScrollY);
      setIsPdfGenerating(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter Data based on Search Query
  const q = searchQuery.trim().toLowerCase();

  const filteredSteps = methodologySteps.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q) ||
      (s.reference && s.reference.toLowerCase().includes(q))
  );

  const filteredQuran = quranicVerses.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q) ||
      item.arabic.toLowerCase().includes(q) ||
      item.translation.toLowerCase().includes(q) ||
      (item.subsectionHeader && item.subsectionHeader.toLowerCase().includes(q))
  );

  const filteredDuas = propheticDuas.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q) ||
      item.arabic.toLowerCase().includes(q) ||
      item.translation.toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
  );

  const filteredMeasures = spiritualMeasures.filter(
    (m) =>
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q)
  );

  const hasAnyResults =
    filteredSteps.length > 0 ||
    filteredQuran.length > 0 ||
    filteredDuas.length > 0 ||
    filteredMeasures.length > 0;

  return (
    <>
      {/* Sticky Application Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            {/* Brand / App Logo */}
            <div className="brand-section">
              <div className="brand-logo-icon" aria-hidden="true" style={{ overflow: "hidden", padding: 0 }}>
                <img
                  src="/icon.jpg"
                  alt="الرقیۃ الشرعیۃ"
                  width={44}
                  height={44}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                  }}
                />
              </div>
              <div className="brand-titles">
                <h1 className="brand-main-title">الرقیۃ الشرعیۃ</h1>
                <span className="brand-subtitle">مسنون قرآنی و نبوی علاج</span>
              </div>
            </div>

            {/* Header Actions: Font Scaler, Theme Toggler, PDF Export */}
            <div className="header-actions">
              {/* Font Size Adjustment */}
              <div className="font-scale-controls" title="فونٹ سائز تبدیل کریں">
                <button
                  id="btn-font-increase"
                  className="font-scale-btn"
                  aria-label="فونٹ بڑا کریں"
                  onClick={handleIncreaseFont}
                >
                  A+
                </button>
                <button
                  id="btn-font-reset"
                  className="font-scale-btn"
                  aria-label="فونٹ اصل سائز کریں"
                  onClick={handleResetFont}
                >
                  A
                </button>
                <button
                  id="btn-font-decrease"
                  className="font-scale-btn"
                  aria-label="فونٹ چھوٹا کریں"
                  onClick={handleDecreaseFont}
                >
                  A-
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                id="theme-toggle-btn"
                className="action-btn"
                aria-label="تھیم تبدیل کریں"
                onClick={toggleTheme}
              >
                <span id="theme-icon" className="icon-span">
                  {theme === "dark" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  )}
                </span>
                <span id="theme-label">
                  {theme === "dark" ? "دن کا موڈ" : "رات کا موڈ"}
                </span>
              </button>

              {/* Export to PDF Button */}
              <button
                id="btn-export-pdf"
                className="action-btn btn-primary"
                aria-label="پی ڈی ایف ڈاؤنلوڈ کریں"
                onClick={handleExportPdf}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>پی ڈی ایف محفوظ کریں</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Navigation Category Bar */}
        <div className="category-nav-wrapper">
          <div className="container">
            <nav className="category-nav" aria-label="فہرست کے لنکس">
              <button
                className={`nav-pill ${activeSection === "methodology" ? "active" : ""}`}
                onClick={() => scrollToSection("methodology")}
              >
                <span>طریقہ کار (۵ مراحل)</span>
              </button>
              <button
                className={`nav-pill ${activeSection === "quranic-verses" ? "active" : ""}`}
                onClick={() => scrollToSection("quranic-verses")}
              >
                <span>قرآنی آیات (۸ ابواب)</span>
              </button>
              <button
                className={`nav-pill ${activeSection === "prophetic-duas" ? "active" : ""}`}
                onClick={() => scrollToSection("prophetic-duas")}
              >
                <span>مسنون دعائیں (۱۳ ادعیہ)</span>
              </button>
              <button
                className={`nav-pill ${activeSection === "spiritual-measures" ? "active" : ""}`}
                onClick={() => scrollToSection("spiritual-measures")}
              >
                <span>اضافی روحانی تدابیر</span>
              </button>
              <button
                id="btn-reset-all-counters"
                className="nav-pill"
                style={{ marginRight: "auto", color: "var(--text-gold)" }}
                onClick={handleResetAllCounters}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span>تمام کاؤنٹرز ری سیٹ کریں</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Printable / Scrollable Manual Content */}
      <main id="printable-ruqyah-manual" className="container">
        {/* Hero Header Banner */}
        <section className="hero-section">
          <div className="hero-card">
            {/* Decorative Islamic Geometry SVG Ornaments */}
            <svg
              className="islamic-ornament-corner corner-top-right"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M0 0 L100 0 L100 20 C60 20 20 60 20 100 L0 100 Z M35 35 C45 25 55 25 65 35 C75 45 75 55 65 65 C55 75 45 75 35 65 C25 55 25 45 35 35 Z" />
            </svg>
            <svg
              className="islamic-ornament-corner corner-top-left"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M0 0 L100 0 L100 20 C60 20 20 60 20 100 L0 100 Z M35 35 C45 25 55 25 65 35 C75 45 75 55 65 65 C55 75 45 75 35 65 C25 55 25 45 35 35 Z" />
            </svg>

            <div className="bismillah-calligraphy">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <h2 className="hero-main-title">
              الرقیۃ الشرعیۃ — مسنون علاج اور دم کی مکمل رہنمائی
            </h2>
            <p className="hero-intro-text">
              یہ مستند قرآنی آیات، نبوی احادیث کی دعاؤں اور بیری (Sidr) کے پتوں کے مسنون طریقہ کار پر مشتمل مکمل و حتمی الرقیۃ الشرعیۃ ہے۔ سحر، نظرِ بد، گھبراہٹ، جسمانی و روحانی تکالیف کے علاج کے لیے پورے خشوع، یقین اور توکل علی اللہ کے ساتھ معمول بنائیں۔
            </p>

            {/* Stats Chips */}
            <div className="hero-stats">
              <span className="stat-chip">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ۵ اہم عملی مراحل
              </span>
              <span className="stat-chip">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                ۸ جامع قرآنی ابواب
              </span>
              <span className="stat-chip">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                ۱۳ مسنون احادیثِ مبارکہ
              </span>
            </div>

            {/* Live Search Input */}
            <div className="search-container no-print">
              <input
                type="text"
                id="ruqyah-search-input"
                className="search-input"
                placeholder="آیت، دعا، بیماری، یا حوالہ تلاش کریں (مثلاً: سحر، بخاری، شفا، آیت الکرسی)..."
                aria-label="تلاش کریں"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  startTransition(() => {
                    setSearchQuery(val);
                  });
                }}
              />
              <span className="search-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>
          </div>
        </section>

        {/* Empty Search State Warning */}
        {!hasAnyResults && (
          <div
            id="no-search-results"
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "1.2rem" }}>
              کوئی مطابقت رکھنے والا کلمہ یا آیت نہیں ملی۔ براہِ کرم کوئی دوسرا لفظ تلاش کریں۔
            </p>
          </div>
        )}

        {/* ====================================================================
             SECTION 1: طریقہ کار (عمل کا مکمل طریقہ)
             ==================================================================== */}
        {filteredSteps.length > 0 && (
          <section id="methodology" className="section-wrapper">
            <div className="section-header-box">
              <div className="section-title-group">
                <div className="section-icon-badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h2 className="section-title">طریقہ کار (عمل کا مکمل طریقہ)</h2>
              </div>
              <span className="section-badge-counter">{filteredSteps.length} مراحل</span>
            </div>

            <div className="methodology-grid">
              {filteredSteps.map((step) => (
                <article key={step.id} className="step-card">
                  <div className="step-header">
                    <div className="step-num-badge">{step.num}</div>
                    <h3 className="step-title">{step.title}</h3>
                  </div>
                  <p className="step-body">{step.body}</p>
                  {step.reference && (
                    <div className="step-reference">
                      <strong>حوالہ:</strong> {step.reference}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ====================================================================
             SECTION 2: حصہ 1: قرآنی آیات (سحر، نظرِ بد، گھبراہٹ اور شفا کے لیے)
             ==================================================================== */}
        {filteredQuran.length > 0 && (
          <section id="quranic-verses" className="section-wrapper">
            <div className="section-header-box">
              <div className="section-title-group">
                <div className="section-icon-badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                <h2 className="section-title">
                  حصہ ۱: قرآنی آیات (سحر، نظرِ بد، گھبراہٹ اور شفا کے لیے)
                </h2>
              </div>
              <span className="section-badge-counter">۸ ابواب</span>
            </div>

            {filteredQuran.map((item) => {
              const currentCount = counts[item.id] || 0;
              const isCompleted = currentCount >= item.targetCount;

              const cardContent = (
                <article className="ruqyah-card" data-target={item.targetCount}>
                  <div className="card-header-bar">
                    <div className="card-title-meta">
                      <span className="card-number-tag">{item.cardNum}</span>
                      <h3 className="card-title">{item.title}</h3>
                      <span className="card-reference-badge">{item.reference}</span>
                    </div>
                    <div className="card-actions-top no-print">
                      <button
                        className="card-action-btn copy-card-btn"
                        title="متن کاپی کریں"
                        aria-label="کاپی کریں"
                        onClick={() => handleCopy(item)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {item.note && (
                    <div className="benefit-note-box">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span>{item.note}</span>
                    </div>
                  )}

                  <div className="arabic-verse-container">
                    <p className="arabic-text">{item.arabic}</p>
                  </div>

                  <div className="translation-container">
                    <span className="translation-label">اردو ترجمہ:</span>
                    <p className="translation-text">&ldquo;{item.translation}&rdquo;</p>
                  </div>

                  <div className="card-footer-bar">
                    <div className="target-repeat-info">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>
                        مقررہ تعداد: <strong>{item.targetLabel}</strong>
                      </span>
                    </div>
                    <div className="counter-interactive-group no-print">
                      <button
                        className={`tasbeeh-btn ${isCompleted ? "completed" : ""}`}
                        aria-label="تسبیح کاؤنٹر"
                        onClick={() => handleCounterClick(item)}
                      >
                        <span className="current-count">{currentCount}</span> /{" "}
                        <span>{item.targetCount}</span> مرتبہ
                      </button>
                      <button
                        className="counter-reset-btn"
                        title="کاؤنٹر ری سیٹ کریں"
                        aria-label="ری سیٹ"
                        onClick={() => handleCounterReset(item.id)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );

              // If this item begins a new subsection, wrap header + note + card in a unbreakable block
              if (item.subsectionHeader) {
                return (
                  <div key={item.id} className="pdf-keep-together">
                    <div className="subsection-header">
                      <h3 className="subsection-title">{item.subsectionHeader}</h3>
                    </div>
                    {item.subsectionNote && (
                      <div className="benefit-note-box">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>({item.subsectionNote})</span>
                      </div>
                    )}
                    {cardContent}
                  </div>
                );
              }

              return <React.Fragment key={item.id}>{cardContent}</React.Fragment>;
            })}
          </section>
        )}

        {/* ====================================================================
             SECTION 3: حصہ 2: احادیثِ مبارکہ سے مسنون دعائیں
             ==================================================================== */}
        {filteredDuas.length > 0 && (
          <section id="prophetic-duas" className="section-wrapper">
            <div className="section-header-box">
              <div className="section-title-group">
                <div className="section-icon-badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                </div>
                <h2 className="section-title">حصہ ۲: احادیثِ مبارکہ سے مسنون دعائیں</h2>
              </div>
              <span className="section-badge-counter">{filteredDuas.length} دعائیں</span>
            </div>

            {filteredDuas.map((item) => {
              const currentCount = counts[item.id] || 0;
              const isCompleted = currentCount >= item.targetCount;

              return (
                <article key={item.id} className="ruqyah-card" data-target={item.targetCount}>
                  <div className="card-header-bar">
                    <div className="card-title-meta">
                      <span className="card-number-tag">{item.cardNum}</span>
                      <h3 className="card-title">{item.title}</h3>
                      <span className="card-reference-badge">{item.reference}</span>
                    </div>
                    <div className="card-actions-top no-print">
                      <button
                        className="card-action-btn copy-card-btn"
                        title="متن کاپی کریں"
                        aria-label="کاپی کریں"
                        onClick={() => handleCopy(item)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {item.note && (
                    <div className="benefit-note-box">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span>{item.note}</span>
                    </div>
                  )}

                  <div className="arabic-verse-container">
                    <p className="arabic-text">{item.arabic}</p>
                  </div>

                  <div className="translation-container">
                    <span className="translation-label">اردو ترجمہ:</span>
                    <p className="translation-text">&ldquo;{item.translation}&rdquo;</p>
                  </div>

                  <div className="card-footer-bar">
                    <div className="target-repeat-info">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>
                        مقررہ تعداد: <strong>{item.targetLabel}</strong>
                      </span>
                    </div>
                    <div className="counter-interactive-group no-print">
                      <button
                        className={`tasbeeh-btn ${isCompleted ? "completed" : ""}`}
                        aria-label="تسبیح کاؤنٹر"
                        onClick={() => handleCounterClick(item)}
                      >
                        <span className="current-count">{currentCount}</span> /{" "}
                        <span>{item.targetCount}</span> مرتبہ
                      </button>
                      <button
                        className="counter-reset-btn"
                        title="کاؤنٹر ری سیٹ کریں"
                        aria-label="ری سیٹ"
                        onClick={() => handleCounterReset(item.id)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* ====================================================================
             SECTION 4: اضافی روحانی تدابیر
             ==================================================================== */}
        {filteredMeasures.length > 0 && (
          <section id="spiritual-measures" className="section-wrapper">
            <div className="section-header-box">
              <div className="section-title-group">
                <div className="section-icon-badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h2 className="section-title">اضافی روحانی تدابیر و حفاظتی امور</h2>
              </div>
              <span className="section-badge-counter">۴ ہدایات</span>
            </div>

            <div className="measures-grid">
              {filteredMeasures.map((measure) => (
                <article key={measure.id} className="measure-card">
                  <h3 className="measure-card-title">
                    {measure.iconType === "clock" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: "var(--color-emerald-500)" }}
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 14 14"></polyline>
                      </svg>
                    )}
                    {measure.iconType === "heart" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: "var(--color-emerald-500)" }}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    )}
                    {measure.iconType === "home" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: "var(--color-emerald-500)" }}
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    )}
                    {measure.iconType === "volume" && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: "var(--color-emerald-500)" }}
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    )}
                    {measure.title}
                  </h3>
                  <p className="measure-card-body">{measure.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Application Footer */}
      <footer className="app-footer">
        <div className="container">
          <p className="footer-dua">
            اللَّهُمَّ اشْفِ كُلَّ مَرِيضٍ وَعَافِ كُلَّ مُبْتَلًى • آمين يا رب العالمين
          </p>
          <p className="footer-disclaimer">
            تنبیہ و ہدایت: الرقیۃ الشرعیۃ اور مسنون دعائیں شفاء کا روحانی سبب اور باعثِ برکت ہیں۔ حقیقی شفاء دینے والی ذات صرف اور صرف اللہ تعالیٰ کی ہے۔ روحانی دم کے ساتھ ساتھ مستند طبی علاج، ڈاکٹر کے مشورے اور احتیاطی تدابیر کو ہرگز ترک نہ کریں۔
          </p>
          <p className="footer-copyright">
            الرقیۃ الشرعیۃ مسنون گائیڈ • تمام حقوق محفوظ ہیں
          </p>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <div className="floating-actions-container no-print">
        <button
          id="btn-back-to-top"
          className="fab-btn"
          title="اوپر جائیں"
          aria-label="اوپر جائیں"
          style={{
            opacity: showBackToTop ? 1 : 0,
            pointerEvents: showBackToTop ? "auto" : "none",
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>

      {/* Toast Alert */}
      <div
        id="toast-alert"
        className={`toast-alert ${toastVisible ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: "var(--color-emerald-500)" }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span className="toast-message">{toastMessage}</span>
      </div>

      {/* PDF Loading Overlay */}
      <div
        id="pdf-loading-overlay"
        className={`pdf-loading-overlay ${isPdfGenerating ? "active" : ""}`}
        aria-hidden={!isPdfGenerating}
      >
        <div className="loading-spinner"></div>
        <div className="pdf-loading-text">
          پی ڈی ایف تیار کی جا رہی ہے، براہِ کرم چند لمحے انتظار فرمائیں...
        </div>
      </div>
    </>
  );
}
