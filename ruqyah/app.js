/**
 * الرقیۃ الشرعیۃ (Ruqyah Shariah) - Main Application Controller
 * Handles Theme Toggling, Font Scaling, Interactive Tasbeeh Counters,
 * Audio/Haptics, Real-time Search, and html2pdf Generation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all application modules
  ThemeManager.init();
  FontScaleManager.init();
  TasbeehCounterManager.init();
  SearchAndFilterManager.init();
  ClipboardManager.init();
  PdfExportManager.init();
  ScrollNavigationManager.init();
});

/* ==========================================================================
   1. Theme Management (Light / Dark Mode with Persistence)
   ========================================================================== */
const ThemeManager = {
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeIcon: document.getElementById('theme-icon'),
  themeLabel: document.getElementById('theme-label'),

  init() {
    const savedTheme = localStorage.getItem('ruqyah_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.applyTheme(initialTheme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
      });
    }
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ruqyah_theme', theme);

    if (this.themeIcon) {
      if (theme === 'dark') {
        // Show Sun icon for switching to light
        this.themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        `;
        if (this.themeLabel) this.themeLabel.textContent = 'دن کا موڈ';
      } else {
        // Show Moon icon for switching to dark
        this.themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
        if (this.themeLabel) this.themeLabel.textContent = 'رات کا موڈ';
      }
    }
  }
};

/* ==========================================================================
   2. Font Scaling System
   ========================================================================== */
const FontScaleManager = {
  scale: 1,
  minScale: 0.85,
  maxScale: 1.4,
  step: 0.1,

  init() {
    const savedScale = localStorage.getItem('ruqyah_font_scale');
    if (savedScale) {
      this.scale = parseFloat(savedScale);
      this.applyScale();
    }

    const btnIncrease = document.getElementById('btn-font-increase');
    const btnDecrease = document.getElementById('btn-font-decrease');
    const btnReset = document.getElementById('btn-font-reset');

    if (btnIncrease) {
      btnIncrease.addEventListener('click', () => {
        if (this.scale < this.maxScale) {
          this.scale = Math.min(this.maxScale, +(this.scale + this.step).toFixed(2));
          this.applyScale();
        }
      });
    }

    if (btnDecrease) {
      btnDecrease.addEventListener('click', () => {
        if (this.scale > this.minScale) {
          this.scale = Math.max(this.minScale, +(this.scale - this.step).toFixed(2));
          this.applyScale();
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.scale = 1;
        this.applyScale();
      });
    }
  },

  applyScale() {
    document.documentElement.style.setProperty('--font-scale', this.scale);
    localStorage.setItem('ruqyah_font_scale', this.scale);
  }
};

/* ==========================================================================
   3. Synthesized Sound & Haptics (Zero External Asset Dependency)
   ========================================================================== */
const FeedbackHelper = {
  audioCtx: null,

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playClick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio context might be restricted before gesture
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },

  playComplete() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch (e) {}

    if ('vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  }
};

/* ==========================================================================
   4. Interactive Tasbeeh Counters
   ========================================================================== */
const TasbeehCounterManager = {
  init() {
    const cards = document.querySelectorAll('.ruqyah-card');

    cards.forEach((card, idx) => {
      const target = parseInt(card.dataset.target || '1', 10);
      const counterBtn = card.querySelector('.tasbeeh-btn');
      const resetBtn = card.querySelector('.counter-reset-btn');
      const countDisplay = card.querySelector('.current-count');

      let currentCount = 0;

      if (counterBtn && countDisplay) {
        counterBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (currentCount < target) {
            currentCount++;
            countDisplay.textContent = currentCount;
            FeedbackHelper.playClick();

            if (currentCount === target) {
              counterBtn.classList.add('completed');
              FeedbackHelper.playComplete();
              ToastManager.show(`ما شاء اللہ! تلاوت مکمل ہوئی۔ (${target} مرتبہ)`);
            }
          } else {
            // Clicking when completed resets or prompts
            currentCount = 0;
            countDisplay.textContent = currentCount;
            counterBtn.classList.remove('completed');
            FeedbackHelper.playClick();
          }
        });
      }

      if (resetBtn && countDisplay && counterBtn) {
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentCount = 0;
          countDisplay.textContent = '0';
          counterBtn.classList.remove('completed');
          FeedbackHelper.playClick();
        });
      }
    });

    // Reset all counters button if available
    const resetAllBtn = document.getElementById('btn-reset-all-counters');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.ruqyah-card').forEach((card) => {
          const countDisplay = card.querySelector('.current-count');
          const counterBtn = card.querySelector('.tasbeeh-btn');
          if (countDisplay) countDisplay.textContent = '0';
          if (counterBtn) counterBtn.classList.remove('completed');
        });
        ToastManager.show('تمام کاؤنٹرز دوبارہ شروع کر دیے گئے۔');
      });
    }
  }
};

/* ==========================================================================
   5. Clipboard Copy Utility
   ========================================================================== */
const ClipboardManager = {
  init() {
    document.querySelectorAll('.copy-card-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.ruqyah-card');
        if (!card) return;

        const title = card.querySelector('.card-title')?.innerText || '';
        const arabic = card.querySelector('.arabic-text')?.innerText || '';
        const translation = card.querySelector('.translation-text')?.innerText || '';
        const target = card.dataset.target ? `(تعداد: ${card.dataset.target} مرتبہ)` : '';

        const textToCopy = `${title} ${target}\n\n${arabic}\n\nاردو ترجمہ:\n${translation}\n\n— الرقیۃ الشرعیۃ مسنون رہنمائی`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            ToastManager.show('کلمات اردو ترجمہ سمیت کاپی کر لیے گئے ہیں۔');
          });
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          ToastManager.show('کلمات کاپی کر لیے گئے ہیں۔');
        }
      });
    });
  }
};

/* ==========================================================================
   6. Search & Live Filter
   ========================================================================== */
const SearchAndFilterManager = {
  searchInput: document.getElementById('ruqyah-search-input'),
  noResultsMsg: document.getElementById('no-search-results'),

  init() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      this.filterContent(query);
    });

    // Category Filter Pills
    const navPills = document.querySelectorAll('.nav-pill');
    navPills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        navPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  },

  filterContent(query) {
    const cards = document.querySelectorAll('.ruqyah-card, .step-card, .measure-card');
    let visibleCount = 0;

    if (!query) {
      cards.forEach((card) => {
        card.style.display = '';
      });
      if (this.noResultsMsg) this.noResultsMsg.style.display = 'none';
      return;
    }

    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      if (text.includes(query)) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (this.noResultsMsg) {
      this.noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }
};

/* ==========================================================================
   7. Flawless PDF Export with html2pdf (Canvas Rendering for Urdu/Arabic Ligatures)
   ========================================================================== */
const PdfExportManager = {
  exportBtn: document.getElementById('btn-export-pdf'),
  loadingOverlay: document.getElementById('pdf-loading-overlay'),

  init() {
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        this.generatePdf();
      });
    }
  },

  async generatePdf() {
    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    // Target the main printable manual
    const element = document.getElementById('printable-ruqyah-manual');
    if (!element) return;

    // Show loading overlay
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('active');
    }

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // Apply clean print/export mode styling
    document.body.classList.add('pdf-export-mode');

    // Wait a brief moment for layout repaint
    await new Promise((resolve) => setTimeout(resolve, 300));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'Al-Ruqyah-Al-Shariah-Complete-Guide.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      ToastManager.show('پی ڈی ایف کامیابی سے ڈاؤنلوڈ ہو گئی ہے۔');
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      document.body.classList.remove('pdf-export-mode');
      window.scrollTo(0, prevScrollY);
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.remove('active');
      }
    }
  }
};

/* ==========================================================================
   8. Toast Notification Utility
   ========================================================================== */
const ToastManager = {
  toastEl: document.getElementById('toast-alert'),
  timeoutId: null,

  show(message) {
    if (!this.toastEl) return;
    const msgContainer = this.toastEl.querySelector('.toast-message');
    if (msgContainer) msgContainer.textContent = message;
    else this.toastEl.textContent = message;

    this.toastEl.classList.add('show');

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 3200);
  }
};

/* ==========================================================================
   9. Scroll Navigation & Back-to-Top FAB
   ========================================================================== */
const ScrollNavigationManager = {
  backToTopBtn: document.getElementById('btn-back-to-top'),

  init() {
    if (this.backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          this.backToTopBtn.style.opacity = '1';
          this.backToTopBtn.style.pointerEvents = 'auto';
        } else {
          this.backToTopBtn.style.opacity = '0';
          this.backToTopBtn.style.pointerEvents = 'none';
        }
      });

      this.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
};
