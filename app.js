/**
 * AI QUIZ APPLICATION V2 - CORE CONTROLLER
 * Target: IOAI 2026 Master Exam (Syllabus & Contest Tasks) - 40 Questions
 * Font Scale: +2 Levels Enhanced Typography with Interactive Font Scaling
 */

(function () {
  'use strict';

  // --- STATE MANAGEMENT ---
  const STATE = {
    allQuestions: [],
    activeQuestions: [], // May be filtered for sections or "Retry Mistakes Only" mode
    currentIndex: 0,
    userAnswers: {},     // { [questionId]: 'A' | 'B' | 'C' | 'D' }
    flagged: {},         // { [questionId]: boolean }
    sectionFilter: 'all', // 'all' | 1 | 2 | 3 | 4
    viewMode: 'focus',   // 'focus' | 'all'
    isSubmitted: false,
    reviewFilter: 'all', // 'all' | 'wrong' | 'correct' | 'unanswered' | 'flagged'
    isMistakesOnlyMode: false,
    
    // Timer (in seconds) - 40 minutes = 2400s
    totalTimeSeconds: 40 * 60,
    timeRemaining: 40 * 60,
    timerInterval: null,
    isTimerPaused: false,
    timeElapsed: 0,
    
    theme: 'dark',
    fontSize: 'normal'    // 'normal' (standard balanced) | 'large' | 'xlarge'
  };

  // --- DOM SELECTORS ---
  const DOM = {
    // Header
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    fontSizeWidget: document.getElementById('fontSizeWidget'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerToggleBtn: document.getElementById('timerToggleBtn'),
    timerPill: document.getElementById('timerPill'),
    progressText: document.getElementById('progressText'),
    progressBarFill: document.getElementById('progressBarFill'),
    btnPaletteToggle: document.getElementById('btnPaletteToggle'),
    paletteCounterBadge: document.getElementById('paletteCounterBadge'),
    btnSubmitHeader: document.getElementById('btnSubmitHeader'),

    // Main App Views
    testView: document.getElementById('testView'),
    resultView: document.getElementById('resultView'),
    reviewView: document.getElementById('reviewView'),

    // Collapsible Question Palette Drawer
    paletteDrawer: document.getElementById('paletteDrawer'),
    paletteOverlay: document.getElementById('paletteOverlay'),
    btnPaletteClose: document.getElementById('btnPaletteClose'),

    // Test View Controls
    sectionFilterBar: document.getElementById('sectionFilterBar'),
    viewModeToggles: document.getElementById('viewModeToggles'),
    questionsContainer: document.getElementById('questionsContainer'),
    
    // Matrix Stats & Grid (now inside Drawer)
    statAnswered: document.getElementById('statAnswered'),
    statFlagged: document.getElementById('statFlagged'),
    statRemain: document.getElementById('statRemain'),
    matrixGrid: document.getElementById('matrixGrid'),
    btnSubmitMain: document.getElementById('btnSubmitMain'),

    // Confirmation Modal
    submitModal: document.getElementById('submitModal'),
    modalAnswered: document.getElementById('modalAnswered'),
    modalRemain: document.getElementById('modalRemain'),
    modalFlagged: document.getElementById('modalFlagged'),
    btnModalCancel: document.getElementById('btnModalCancel'),
    btnModalConfirm: document.getElementById('btnModalConfirm'),

    // Lightbox Modal Elements (Diagram & Image Zoom)
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxBackdrop: document.getElementById('lightboxBackdrop'),
    lightboxTitleText: document.getElementById('lightboxTitleText'),
    lightboxContentScaler: document.getElementById('lightboxContentScaler'),
    lightboxZoomVal: document.getElementById('lightboxZoomVal'),
    btnLightboxZoomIn: document.getElementById('btnLightboxZoomIn'),
    btnLightboxZoomOut: document.getElementById('btnLightboxZoomOut'),
    btnLightboxReset: document.getElementById('btnLightboxReset'),
    btnLightboxClose: document.getElementById('btnLightboxClose'),
    lightboxBody: document.getElementById('lightboxBody'),

    // Result View Elements
    heroScoreNum: document.getElementById('heroScoreNum'),
    heroAccuracy: document.getElementById('heroAccuracy'),
    heroScore10: document.getElementById('heroScore10'),
    heroTimeSpent: document.getElementById('heroTimeSpent'),
    heroTierBadge: document.getElementById('heroTierBadge'),
    breakdownGrid: document.getElementById('breakdownGrid'),
    btnReviewWrong: document.getElementById('btnReviewWrong'),
    btnReviewAll: document.getElementById('btnReviewAll'),
    btnRetryWrong: document.getElementById('btnRetryWrong'),
    btnRetakeAll: document.getElementById('btnRetakeAll'),
    btnPrintResult: document.getElementById('btnPrintResult'),

    // Review View Elements
    reviewFilterBar: document.getElementById('reviewFilterBar'),
    reviewQuestionsContainer: document.getElementById('reviewQuestionsContainer'),
    btnBackToResult: document.getElementById('btnBackToResult')
  };

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    ANSWERS: 'ioai_quiz_answers',
    FLAGGED: 'ioai_quiz_flagged',
    TIME: 'ioai_quiz_time',
    SUBMITTED: 'ioai_quiz_submitted',
    THEME: 'ioai_quiz_theme',
    FONT_SIZE: 'ioai_quiz_fontsize'
  };

  function updateStorageKeys() {
    const isV2 = window.QUIZ_VERSION === 'v2' || 
                 (STATE.allQuestions.length > 0 && 
                  (Boolean(STATE.allQuestions[0]?.prompt?.includes('lò phản ứng')) || 
                   Boolean(STATE.allQuestions[0]?.tag?.includes('Syllabus - Practice'))));
    const prefix = isV2 ? 'ioai_quiz_v2' : 'ioai_quiz_v1';
    STORAGE_KEYS.ANSWERS = `${prefix}_answers`;
    STORAGE_KEYS.FLAGGED = `${prefix}_flagged`;
    STORAGE_KEYS.TIME = `${prefix}_time`;
    STORAGE_KEYS.SUBMITTED = `${prefix}_submitted`;
  }

  // --- INITIALIZATION ---
  function init() {
    loadQuestions();
    updateStorageKeys();
    loadTheme();
    loadFontSize();
    loadPersistedState();
    setupEventListeners();
    initLightboxListeners();
    setupKeyboardNavigation();
    renderSectionFilters();
    startTimer();
    render();
  }

  function loadQuestions() {
    if (window.QUIZ_DATA && Array.isArray(window.QUIZ_DATA)) {
      STATE.allQuestions = window.QUIZ_DATA;
    } else {
      console.warn("QUIZ_DATA not found on window, fallback to empty array.");
      STATE.allQuestions = [];
    }
    STATE.activeQuestions = [...STATE.allQuestions];
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    STATE.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
  }

  function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', STATE.theme);
    localStorage.setItem(STORAGE_KEYS.THEME, STATE.theme);
    updateThemeIcon();
    // Re-render Mermaid if present
    if (window.mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: STATE.theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        themeVariables: {
          fontSize: '18px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis'
        }
      });
      runMermaid();
    }
  }

  function updateThemeIcon() {
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.innerHTML = STATE.theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  // --- DYNAMIC FONT SIZE CONTROLLER ---
  function loadFontSize() {
    // Default is 'normal' (standard balanced size)
    const savedSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 'normal';
    setFontSize(savedSize);
  }

  function setFontSize(size) {
    STATE.fontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);

    if (DOM.fontSizeWidget) {
      DOM.fontSizeWidget.querySelectorAll('.btn-font-size').forEach(btn => {
        if (btn.getAttribute('data-size') === size) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  function loadPersistedState() {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      if (savedAnswers) STATE.userAnswers = JSON.parse(savedAnswers);

      const savedFlagged = localStorage.getItem(STORAGE_KEYS.FLAGGED);
      if (savedFlagged) STATE.flagged = JSON.parse(savedFlagged);

      const savedTime = localStorage.getItem(STORAGE_KEYS.TIME);
      if (savedTime) {
        const parsed = parseInt(savedTime, 10);
        if (!isNaN(parsed)) {
          STATE.timeRemaining = Math.min(parsed, STATE.totalTimeSeconds);
        }
      }

      const savedSubmitted = localStorage.getItem(STORAGE_KEYS.SUBMITTED);
      if (savedSubmitted === 'true') {
        STATE.isSubmitted = true;
      }
    } catch (e) {
      console.error("Error reading saved state:", e);
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(STATE.userAnswers));
      localStorage.setItem(STORAGE_KEYS.FLAGGED, JSON.stringify(STATE.flagged));
      localStorage.setItem(STORAGE_KEYS.TIME, STATE.timeRemaining.toString());
      localStorage.setItem(STORAGE_KEYS.SUBMITTED, STATE.isSubmitted ? 'true' : 'false');
    } catch (e) {
      console.error("Error persisting state:", e);
    }
  }

  function clearPersistedState() {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.FLAGGED);
    localStorage.removeItem(STORAGE_KEYS.TIME);
    localStorage.removeItem(STORAGE_KEYS.SUBMITTED);
    STATE.userAnswers = {};
    STATE.flagged = {};
    STATE.timeRemaining = STATE.totalTimeSeconds;
    STATE.isSubmitted = false;
    STATE.currentIndex = 0;
  }

  // --- TIMER LOGIC ---
  function startTimer() {
    if (STATE.isSubmitted) return;
    updateTimerDisplay();

    if (STATE.timerInterval) clearInterval(STATE.timerInterval);

    STATE.timerInterval = setInterval(() => {
      if (STATE.isTimerPaused || STATE.isSubmitted) return;

      if (STATE.timeRemaining > 0) {
        STATE.timeRemaining--;
        STATE.timeElapsed++;
        updateTimerDisplay();
        if (STATE.timeRemaining % 10 === 0) {
          persistState();
        }
      } else {
        clearInterval(STATE.timerInterval);
        submitTest(true); // Auto-submit when time expires
      }
    }, 1000);
  }

  function toggleTimerPause() {
    STATE.isTimerPaused = !STATE.isTimerPaused;
    if (DOM.timerToggleBtn) {
      DOM.timerToggleBtn.innerHTML = STATE.isTimerPaused
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    }
  }

  function updateTimerDisplay() {
    if (!DOM.timerDisplay) return;
    const minutes = Math.floor(STATE.timeRemaining / 60);
    const seconds = STATE.timeRemaining % 60;
    DOM.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (DOM.timerPill) {
      if (STATE.timeRemaining <= 180) { // <= 3 mins (Danger)
        DOM.timerPill.className = 'timer-pill danger';
      } else if (STATE.timeRemaining <= 600) { // <= 10 mins (Warning)
        DOM.timerPill.className = 'timer-pill warning';
      } else {
        DOM.timerPill.className = 'timer-pill';
      }
    }
  }

  // --- MARKDOWN, LATEX & MERMAID RENDERING HELPERS ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMarkdown(text) {
    if (!text) return '';

    // Step 1: Protect math blocks ($...$ and $$...$$)
    const mathBlocks = [];
    let processed = text.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
      mathBlocks.push(match);
      return `@@@MATH_${mathBlocks.length - 1}@@@`;
    });

    // Step 2: Protect code blocks (```python ... ```)
    const codeBlocks = [];
    processed = processed.replace(/```python([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(`<pre><code class="language-python">${escapeHtml(code.trim())}</code></pre>`);
      return `@@@CODE_${codeBlocks.length - 1}@@@`;
    });
    processed = processed.replace(/```([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
      return `@@@CODE_${codeBlocks.length - 1}@@@`;
    });

    // Step 3: Escape HTML characters in remaining text
    processed = escapeHtml(processed);

    // Step 4: Inline code `...`
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Step 5: Bold **text**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Step 6: Italic *text*
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Step 6.5: Markdown images ![alt](url)
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="question-img-wrapper"><img src="$2" alt="$1" class="question-img zoomable-image" loading="lazy" /></div>');

    // Step 7: Paragraphs & Lists
    const paragraphs = processed.split(/\n\s*\n/);
    let html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.includes('@@@CODE_')) return p;
      
      // Handle bullet lists
      if (p.includes('\n- ') || p.startsWith('- ')) {
        const lines = p.split('\n');
        let inList = false;
        let listHtml = '';
        lines.forEach(l => {
          if (l.trim().startsWith('- ')) {
            if (!inList) { listHtml += '<ul>'; inList = true; }
            listHtml += `<li>${l.trim().substring(2)}</li>`;
          } else {
            if (inList) { listHtml += '</ul>'; inList = false; }
            listHtml += `<p>${l}</p>`;
          }
        });
        if (inList) listHtml += '</ul>';
        return listHtml;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // Step 8: Restore code blocks
    html = html.replace(/@@@CODE_(\d+)@@@/g, (_, idx) => codeBlocks[idx]);

    // Step 9: Restore math blocks
    html = html.replace(/@@@MATH_(\d+)@@@/g, (_, idx) => mathBlocks[idx]);

    return html;
  }

  // --- DIAGRAM BUILDER & INTERACTIVE CONTROLS ---
  function buildDiagramHtml(diagramCode, title) {
    if (!diagramCode) return '';
    const heading = title || 'Sơ đồ luồng xử lý / Kiến trúc hệ thống:';
    return `
      <div class="question-diagram-wrapper">
        <div class="diagram-header">
          <div class="diagram-label">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>${heading}</span>
          </div>
          <div class="diagram-toolbar">
            <button type="button" class="btn-diagram-tool btn-diagram-zoom-out" title="Thu nhỏ (-25%)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <span class="diagram-zoom-label">100%</span>
            <button type="button" class="btn-diagram-tool btn-diagram-zoom-in" title="Phóng to (+25%)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button type="button" class="btn-diagram-tool btn-diagram-reset" title="Đặt lại 100%">100%</button>
            <button type="button" class="btn-diagram-tool btn-diagram-lightbox" title="Xem toàn màn hình & Phóng cực đại">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              <span>Phóng to</span>
            </button>
          </div>
        </div>
        <div class="question-diagram" title="Nhấp đúp hoặc bấm nút Phóng to để mở toàn màn hình">
          <div class="diagram-svg-container">
            <pre class="mermaid">${diagramCode}</pre>
          </div>
        </div>
      </div>
    `;
  }

  function attachDiagramControls(container) {
    if (!container) return;
    const wrappers = container.querySelectorAll('.question-diagram-wrapper');
    wrappers.forEach(wrapper => {
      if (wrapper.dataset.controlsAttached) return;
      wrapper.dataset.controlsAttached = 'true';

      const zoomLabel = wrapper.querySelector('.diagram-zoom-label');
      const btnIn = wrapper.querySelector('.btn-diagram-zoom-in');
      const btnOut = wrapper.querySelector('.btn-diagram-zoom-out');
      const btnReset = wrapper.querySelector('.btn-diagram-reset');
      const btnLightbox = wrapper.querySelector('.btn-diagram-lightbox');
      const diagramBox = wrapper.querySelector('.question-diagram');
      const svgContainer = wrapper.querySelector('.diagram-svg-container');

      let currentScale = 1.0;

      function updateScale(newScale) {
        currentScale = Math.max(0.6, Math.min(2.5, Math.round(newScale * 100) / 100));
        if (svgContainer) {
          svgContainer.style.transform = `scale(${currentScale})`;
        }
        if (zoomLabel) {
          zoomLabel.textContent = `${Math.round(currentScale * 100)}%`;
        }
      }

      if (btnIn) {
        btnIn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateScale(currentScale + 0.25);
        });
      }

      if (btnOut) {
        btnOut.addEventListener('click', (e) => {
          e.stopPropagation();
          updateScale(currentScale - 0.25);
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', (e) => {
          e.stopPropagation();
          updateScale(1.0);
        });
      }

      if (btnLightbox) {
        btnLightbox.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightboxFromWrapper(wrapper);
        });
      }

      if (diagramBox) {
        diagramBox.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          openLightboxFromWrapper(wrapper);
        });
      }
    });

    // Also attach click-to-lightbox for general images
    container.querySelectorAll('.zoomable-image, .question-img, .question-prompt img').forEach(img => {
      if (img.dataset.lightboxAttached) return;
      img.dataset.lightboxAttached = 'true';
      img.addEventListener('click', () => {
        openLightboxImage(img.src, img.alt || 'Hình ảnh minh họa');
      });
    });
  }

  // --- LIGHTBOX STATE & HANDLERS ---
  let lightboxState = {
    scale: 1.0,
    isPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  };

  function openLightboxFromWrapper(wrapper) {
    if (!DOM.lightboxModal || !DOM.lightboxContentScaler) return;
    const svgEl = wrapper.querySelector('svg');
    const labelEl = wrapper.querySelector('.diagram-label');
    const titleText = labelEl ? labelEl.textContent.trim() : 'Sơ đồ luồng xử lý kiến trúc';

    if (DOM.lightboxTitleText) DOM.lightboxTitleText.textContent = titleText;
    DOM.lightboxContentScaler.innerHTML = '';
    
    if (svgEl) {
      const clonedSvg = svgEl.cloneNode(true);
      clonedSvg.style.transform = '';
      DOM.lightboxContentScaler.appendChild(clonedSvg);
    } else {
      const preEl = wrapper.querySelector('.diagram-svg-container') || wrapper.querySelector('.question-diagram');
      if (preEl) {
        DOM.lightboxContentScaler.innerHTML = preEl.innerHTML;
      }
    }

    lightboxState.scale = 1.0;
    updateLightboxTransform();
    DOM.lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openLightboxImage(src, title) {
    if (!DOM.lightboxModal || !DOM.lightboxContentScaler) return;
    if (DOM.lightboxTitleText) DOM.lightboxTitleText.textContent = title || 'Hình ảnh minh họa';
    DOM.lightboxContentScaler.innerHTML = `<img src="${src}" alt="${title}" style="max-height:80vh; max-width:90vw;" />`;

    lightboxState.scale = 1.0;
    updateLightboxTransform();
    DOM.lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!DOM.lightboxModal) return;
    DOM.lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxTransform() {
    if (DOM.lightboxContentScaler) {
      DOM.lightboxContentScaler.style.transform = `scale(${lightboxState.scale})`;
    }
    if (DOM.lightboxZoomVal) {
      DOM.lightboxZoomVal.textContent = `${Math.round(lightboxState.scale * 100)}%`;
    }
  }

  function zoomLightbox(delta) {
    lightboxState.scale = Math.max(0.5, Math.min(3.5, Math.round((lightboxState.scale + delta) * 100) / 100));
    updateLightboxTransform();
  }

  function resetLightboxZoom() {
    lightboxState.scale = 1.0;
    updateLightboxTransform();
  }

  function initLightboxListeners() {
    if (DOM.btnLightboxClose) {
      DOM.btnLightboxClose.addEventListener('click', closeLightbox);
    }
    if (DOM.lightboxBackdrop) {
      DOM.lightboxBackdrop.addEventListener('click', closeLightbox);
    }
    if (DOM.btnLightboxZoomIn) {
      DOM.btnLightboxZoomIn.addEventListener('click', () => zoomLightbox(0.25));
    }
    if (DOM.btnLightboxZoomOut) {
      DOM.btnLightboxZoomOut.addEventListener('click', () => zoomLightbox(-0.25));
    }
    if (DOM.btnLightboxReset) {
      DOM.btnLightboxReset.addEventListener('click', resetLightboxZoom);
    }

    // Mouse wheel zoom in lightbox
    if (DOM.lightboxBody) {
      DOM.lightboxBody.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        zoomLightbox(delta);
      }, { passive: false });

      // Click & drag panning
      DOM.lightboxBody.addEventListener('mousedown', (e) => {
        if (e.target.closest('.lightbox-actions') || e.target.closest('.btn-lightbox-close')) return;
        lightboxState.isPanning = true;
        DOM.lightboxBody.classList.add('grabbing');
        lightboxState.startX = e.pageX - DOM.lightboxBody.offsetLeft;
        lightboxState.startY = e.pageY - DOM.lightboxBody.offsetTop;
        lightboxState.scrollLeft = DOM.lightboxBody.scrollLeft;
        lightboxState.scrollTop = DOM.lightboxBody.scrollTop;
      });

      window.addEventListener('mousemove', (e) => {
        if (!lightboxState.isPanning || !DOM.lightboxBody) return;
        e.preventDefault();
        const x = e.pageX - DOM.lightboxBody.offsetLeft;
        const y = e.pageY - DOM.lightboxBody.offsetTop;
        const walkX = (x - lightboxState.startX) * 1.5;
        const walkY = (y - lightboxState.startY) * 1.5;
        DOM.lightboxBody.scrollLeft = lightboxState.scrollLeft - walkX;
        DOM.lightboxBody.scrollTop = lightboxState.scrollTop - walkY;
      });

      window.addEventListener('mouseup', () => {
        if (lightboxState.isPanning) {
          lightboxState.isPanning = false;
          if (DOM.lightboxBody) DOM.lightboxBody.classList.remove('grabbing');
        }
      });
    }
  }

  function runMermaid() {
    if (window.mermaid) {
      try {
        const promise = mermaid.run({
          nodes: document.querySelectorAll('.mermaid')
        });
        if (promise && typeof promise.then === 'function') {
          promise.then(() => {
            attachDiagramControls(document.body);
          }).catch(err => {
            console.warn("Mermaid run error:", err);
          });
        } else {
          attachDiagramControls(document.body);
        }
      } catch (err) {
        console.warn("Mermaid render error:", err);
      }
    }
  }

  function applyKaTeXAndPrism(container) {
    if (!container) return;

    // KaTeX auto-render
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn("KaTeX rendering warning:", err);
      }
    }

    // Prism syntax highlighting
    if (window.Prism && typeof Prism.highlightAllUnder === 'function') {
      Prism.highlightAllUnder(container);
    }

    // Mermaid rendering & controls
    runMermaid();
    attachDiagramControls(container);
  }

  // --- ACTIONS: ANSWER SELECTION & FLAGGING ---
  function selectAnswer(questionId, optionLetter) {
    if (STATE.isSubmitted) return;
    if (STATE.userAnswers[questionId] === optionLetter) {
      delete STATE.userAnswers[questionId]; // Deselect if clicked again
    } else {
      STATE.userAnswers[questionId] = optionLetter;
    }
    persistState();
    updateUIProgress();
    renderMatrix();
    updateCurrentQuestionOptions(questionId);
  }

  function clearAnswer(questionId) {
    if (STATE.isSubmitted) return;
    delete STATE.userAnswers[questionId];
    persistState();
    updateUIProgress();
    renderMatrix();
    updateCurrentQuestionOptions(questionId);
  }

  function toggleFlag(questionId) {
    if (STATE.isSubmitted) return;
    STATE.flagged[questionId] = !STATE.flagged[questionId];
    persistState();
    updateUIProgress();
    renderMatrix();
    
    // Update button in active question card
    const flagBtn = document.querySelector(`.btn-flag[data-qid="${questionId}"]`);
    if (flagBtn) {
      if (STATE.flagged[questionId]) {
        flagBtn.className = 'btn-flag flagged';
        flagBtn.innerHTML = `⚑ Đã đánh dấu`;
      } else {
        flagBtn.className = 'btn-flag';
        flagBtn.innerHTML = `⚐ Đánh dấu xem lại`;
      }
    }
  }

  function updateCurrentQuestionOptions(questionId) {
    const card = document.querySelector(`.question-card[data-qid="${questionId}"]`);
    if (!card) return;
    const selected = STATE.userAnswers[questionId];
    card.querySelectorAll('.option-item').forEach(opt => {
      const letter = opt.getAttribute('data-letter');
      if (letter === selected) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }

  // --- COLLAPSIBLE QUESTION PALETTE DRAWER ---
  function openPaletteDrawer() {
    if (DOM.paletteDrawer) DOM.paletteDrawer.classList.add('active');
    if (DOM.paletteOverlay) DOM.paletteOverlay.classList.add('active');
  }

  function closePaletteDrawer() {
    if (DOM.paletteDrawer) DOM.paletteDrawer.classList.remove('active');
    if (DOM.paletteOverlay) DOM.paletteOverlay.classList.remove('active');
  }

  function togglePaletteDrawer() {
    if (DOM.paletteDrawer && DOM.paletteDrawer.classList.contains('active')) {
      closePaletteDrawer();
    } else {
      openPaletteDrawer();
    }
  }

  function jumpToQuestion(index) {
    if (index < 0 || index >= STATE.activeQuestions.length) return;
    STATE.currentIndex = index;
    if (STATE.viewMode === 'focus') {
      renderActiveQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetCard = document.querySelector(`.question-card[data-qid="${STATE.activeQuestions[index].id}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    // Auto-close drawer on question selection in focus mode or mobile
    closePaletteDrawer();
    renderMatrix();
  }

  // --- FILTER QUESTIONS BY SECTION ---
  // --- FILTER QUESTIONS BY SECTION ---
  function renderSectionFilters() {
    if (!DOM.sectionFilterBar) return;
    DOM.sectionFilterBar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = `filter-tab ${STATE.sectionFilter === 'all' ? 'active' : ''}`;
    allBtn.setAttribute('data-filter', 'all');
    allBtn.innerHTML = `Tất cả <span class="filter-count">${STATE.allQuestions.length}</span>`;
    allBtn.addEventListener('click', () => setSectionFilter('all'));
    DOM.sectionFilterBar.appendChild(allBtn);

    const sectionMap = new Map();
    STATE.allQuestions.forEach(q => {
      const part = q.section.part_number;
      if (!sectionMap.has(part)) {
        sectionMap.set(part, {
          name: q.section.short_name || q.section.name,
          count: 0
        });
      }
      sectionMap.get(part).count++;
    });

    sectionMap.forEach((info, partNum) => {
      const tab = document.createElement('button');
      tab.className = `filter-tab ${String(STATE.sectionFilter) === String(partNum) ? 'active' : ''}`;
      tab.setAttribute('data-filter', String(partNum));
      tab.innerHTML = `${info.name} <span class="filter-count">${info.count}</span>`;
      tab.addEventListener('click', () => setSectionFilter(partNum));
      DOM.sectionFilterBar.appendChild(tab);
    });
  }

  function setSectionFilter(filter) {
    STATE.sectionFilter = String(filter);
    
    if (DOM.sectionFilterBar) {
      DOM.sectionFilterBar.querySelectorAll('.filter-tab').forEach(tab => {
        if (tab.getAttribute('data-filter') === String(filter)) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }

    if (filter === 'all') {
      STATE.activeQuestions = [...STATE.allQuestions];
    } else {
      const partNum = parseInt(filter, 10);
      STATE.activeQuestions = STATE.allQuestions.filter(q => q.section.part_number === partNum);
    }
    STATE.currentIndex = 0;
    renderTestView();
    renderMatrix();
  }

  // --- SUBMIT WORKFLOW & MODAL ---
  function openSubmitModal() {
    const total = STATE.allQuestions.length;
    const answered = Object.keys(STATE.userAnswers).length;
    const remain = total - answered;
    const flagged = Object.values(STATE.flagged).filter(Boolean).length;

    DOM.modalAnswered.textContent = answered;
    DOM.modalRemain.textContent = remain;
    DOM.modalFlagged.textContent = flagged;

    DOM.submitModal.classList.add('active');
  }

  function closeSubmitModal() {
    DOM.submitModal.classList.remove('active');
  }

  function submitTest(isAuto = false) {
    closeSubmitModal();
    STATE.isSubmitted = true;
    if (STATE.timerInterval) clearInterval(STATE.timerInterval);
    persistState();
    showResultScreen();
  }

  // --- RESULTS & SCORECARD ---
  function calculateScore() {
    const total = STATE.allQuestions.length;
    let correctCount = 0;
    const breakdown = {};

    STATE.allQuestions.forEach(q => {
      const part = q.section.part_number;
      if (!breakdown[part]) {
        breakdown[part] = {
          name: q.section.name,
          total: 0,
          correct: 0
        };
      }
      breakdown[part].total++;

      const userAns = STATE.userAnswers[q.id];
      if (userAns && userAns === q.correct_answer) {
        correctCount++;
        breakdown[part].correct++;
      }
    });

    const accuracy = Math.round((correctCount / total) * 100);
    const score10 = ((correctCount / total) * 10).toFixed(1);

    let tier = { title: 'Cần nỗ lực thêm', class: 'bronze', icon: '🥉' };
    if (accuracy >= 85) {
      tier = { title: 'Xuất sắc (Mastery)', class: 'gold', icon: '🏆' };
    } else if (accuracy >= 70) {
      tier = { title: 'Giỏi (Proficient)', class: 'silver', icon: '🥇' };
    } else if (accuracy >= 50) {
      tier = { title: 'Khá / Đạt chuẩn', class: 'blue', icon: '🥈' };
    }

    return {
      total,
      correctCount,
      accuracy,
      score10,
      tier,
      breakdown,
      wrongCount: total - correctCount
    };
  }

  function showResultScreen() {
    DOM.testView.style.display = 'none';
    DOM.reviewView.style.display = 'none';
    DOM.resultView.style.display = 'block';

    const score = calculateScore();

    // Populate Hero Card
    DOM.heroScoreNum.textContent = score.correctCount;
    DOM.heroAccuracy.textContent = `${score.accuracy}%`;
    DOM.heroScore10.textContent = score.score10;

    const timeUsedSeconds = STATE.totalTimeSeconds - STATE.timeRemaining;
    const usedMin = Math.floor(timeUsedSeconds / 60);
    const usedSec = timeUsedSeconds % 60;
    DOM.heroTimeSpent.textContent = `${usedMin}m ${usedSec}s`;

    DOM.heroTierBadge.textContent = `${score.tier.icon} ${score.tier.title}`;
    DOM.heroTierBadge.style.background = score.accuracy >= 70 ? 'var(--success-bg)' : 'var(--warning-bg)';
    DOM.heroTierBadge.style.color = score.accuracy >= 70 ? 'var(--success)' : 'var(--warning)';
    DOM.heroTierBadge.style.border = `1px solid ${score.accuracy >= 70 ? 'var(--success-border)' : 'var(--warning-border)'}`;

    // Category Breakdown
    DOM.breakdownGrid.innerHTML = '';
    Object.keys(score.breakdown).forEach(partKey => {
      const item = score.breakdown[partKey];
      const partAcc = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <div class="breakdown-row-header">
          <span>${item.name}</span>
          <span style="color: ${partAcc >= 70 ? 'var(--success)' : (partAcc >= 50 ? 'var(--primary)' : 'var(--danger)')}">
            ${item.correct} / ${item.total} (${partAcc}%)
          </span>
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-fill" style="width: ${partAcc}%; background: ${partAcc >= 70 ? 'var(--success)' : (partAcc >= 50 ? 'var(--primary)' : 'var(--danger)')}"></div>
        </div>
      `;
      DOM.breakdownGrid.appendChild(row);
    });

    // Update CTA button with count of wrong questions
    if (DOM.btnReviewWrong) {
      DOM.btnReviewWrong.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Xem lại ${score.wrongCount} câu sai
      `;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- REVIEW MODE (CÂU SAI & TẤT CẢ CÂU) ---
  function openReviewMode(filter = 'all') {
    STATE.reviewFilter = filter;
    DOM.testView.style.display = 'none';
    DOM.resultView.style.display = 'none';
    DOM.reviewView.style.display = 'block';

    updateReviewFilterButtons();
    renderReviewQuestions();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateReviewFilterButtons() {
    DOM.reviewFilterBar.querySelectorAll('.review-filter-btn').forEach(btn => {
      if (btn.getAttribute('data-review-filter') === STATE.reviewFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function renderReviewQuestions() {
    DOM.reviewQuestionsContainer.innerHTML = '';

    let list = STATE.allQuestions.filter(q => {
      const userAns = STATE.userAnswers[q.id];
      const isCorrect = userAns === q.correct_answer;
      const isUnanswered = !userAns;
      const isFlagged = Boolean(STATE.flagged[q.id]);

      if (STATE.reviewFilter === 'wrong') {
        return !isCorrect; // Wrong or unanswered
      } else if (STATE.reviewFilter === 'correct') {
        return isCorrect;
      } else if (STATE.reviewFilter === 'unanswered') {
        return isUnanswered;
      } else if (STATE.reviewFilter === 'flagged') {
        return isFlagged;
      }
      return true; // 'all'
    });

    if (list.length === 0) {
      DOM.reviewQuestionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <h3>Không có câu hỏi nào trong mục này!</h3>
          <p>${STATE.reviewFilter === 'wrong' ? 'Tuyệt vời! Bạn không làm sai câu nào.' : 'Vui lòng chọn bộ lọc khác để xem.'}</p>
        </div>
      `;
      return;
    }

    list.forEach(q => {
      const userAns = STATE.userAnswers[q.id];
      const isCorrect = userAns === q.correct_answer;
      const isUnanswered = !userAns;

      const card = document.createElement('div');
      card.className = `review-card ${isCorrect ? 'is-correct' : (isUnanswered ? 'is-unanswered' : 'is-wrong')}`;

      // Status badge
      let statusBadgeHtml = '';
      if (isCorrect) {
        statusBadgeHtml = `<span class="status-badge correct">✔ Làm đúng</span>`;
      } else if (isUnanswered) {
        statusBadgeHtml = `<span class="status-badge unanswered">○ Chưa trả lời</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge wrong">✖ Làm sai (Đã chọn ${userAns})</span>`;
      }

      // Diagram
      let diagramHtml = buildDiagramHtml(q.diagram_code, '📊 Sơ đồ kiến trúc / Luồng dữ liệu (Mermaid)');

      // Code Snippet
      let codeHtml = '';
      if (q.code_snippet) {
        codeHtml = `
          <div class="question-code-snippet">
            <div class="code-snippet-header">
              <span>PYTHON CODE SNIPPET</span>
            </div>
            <pre><code class="language-python">${escapeHtml(q.code_snippet)}</code></pre>
          </div>
        `;
      }

      // Render Options
      let optionsHtml = '<div class="options-list">';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const optText = q.options[letter] || '';
        const isUserChoice = userAns === letter;
        const isCorrectChoice = q.correct_answer === letter;

        let optClass = 'option-item';
        let badgeHtml = '';

        if (isCorrectChoice) {
          optClass += ' review-correct';
          badgeHtml = `<span class="option-review-tag correct-answer">★ Đáp án đúng</span>`;
        }
        if (isUserChoice && !isCorrectChoice) {
          optClass += ' review-wrong';
          badgeHtml = `<span class="option-review-tag user-wrong">✖ Bạn chọn</span>`;
        } else if (isUserChoice && isCorrectChoice) {
          badgeHtml = `<span class="option-review-tag user-correct">✔ Bạn chọn đúng</span>`;
        }

        optionsHtml += `
          <div class="${optClass}">
            <div class="option-letter">${letter}</div>
            <div class="option-content">${formatMarkdown(optText)}</div>
            ${badgeHtml}
          </div>
        `;
      });
      optionsHtml += '</div>';

      card.innerHTML = `
        <div class="question-header">
          <div class="question-meta">
            <span class="q-badge-num">Câu ${q.id}</span>
            <span class="q-badge-section">${q.section.name}</span>
            ${q.tag ? `<span class="q-badge-tag">${q.tag}</span>` : ''}
            ${statusBadgeHtml}
          </div>
        </div>

        <div class="question-prompt">
          ${formatMarkdown(q.prompt)}
        </div>

        ${diagramHtml}
        ${codeHtml}
        ${optionsHtml}

        <div class="explanation-box">
          <div class="explanation-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/>
            </svg>
            Giải thích chi tiết (Đáp án ${q.correct_answer}):
          </div>
          <div class="explanation-content">
            ${formatMarkdown(q.explanation)}
          </div>
        </div>
      `;

      DOM.reviewQuestionsContainer.appendChild(card);
    });

    applyKaTeXAndPrism(DOM.reviewQuestionsContainer);
  }

  // --- RETRY MISTAKES ONLY MODE ---
  function retryMistakesOnly() {
    const wrongQuestions = STATE.allQuestions.filter(q => STATE.userAnswers[q.id] !== q.correct_answer);
    if (wrongQuestions.length === 0) {
      alert("Tuyệt vời! Bạn không có câu nào làm sai cả.");
      return;
    }

    if (confirm(`Bạn chuẩn bị làm lại ${wrongQuestions.length} câu đã làm sai. Sẵn sàng bắt đầu?`)) {
      STATE.activeQuestions = wrongQuestions;
      STATE.currentIndex = 0;
      STATE.isSubmitted = false;
      STATE.isMistakesOnlyMode = true;
      STATE.timeRemaining = wrongQuestions.length * 2 * 60;
      
      wrongQuestions.forEach(q => {
        delete STATE.userAnswers[q.id];
      });

      DOM.resultView.style.display = 'none';
      DOM.reviewView.style.display = 'none';
      DOM.testView.style.display = 'block';

      startTimer();
      render();
    }
  }

  function retakeFullTest() {
    if (confirm("Bạn có chắc chắn muốn làm lại từ đầu toàn bộ đề thi? Tất cả câu trả lời trước đó sẽ được làm mới.")) {
      clearPersistedState();
      STATE.activeQuestions = [...STATE.allQuestions];
      DOM.resultView.style.display = 'none';
      DOM.reviewView.style.display = 'none';
      DOM.testView.style.display = 'block';
      startTimer();
      render();
    }
  }

  // --- RENDER MAIN TEST INTERFACE ---
  function render() {
    if (STATE.isSubmitted) {
      showResultScreen();
      return;
    }
    DOM.testView.style.display = 'block';
    DOM.resultView.style.display = 'none';
    DOM.reviewView.style.display = 'none';

    updateUIProgress();
    renderTestView();
    renderMatrix();
  }

  function renderTestView() {
    DOM.questionsContainer.innerHTML = '';

    if (STATE.viewMode === 'focus') {
      renderActiveQuestion();
    } else {
      renderAllQuestionsPaper();
    }
  }

  function renderActiveQuestion() {
    if (STATE.activeQuestions.length === 0) {
      DOM.questionsContainer.innerHTML = '<div class="empty-state">Không tìm thấy câu hỏi phù hợp.</div>';
      return;
    }

    const q = STATE.activeQuestions[STATE.currentIndex];
    const isFirst = STATE.currentIndex === 0;
    const isLast = STATE.currentIndex === STATE.activeQuestions.length - 1;
    const isFlagged = Boolean(STATE.flagged[q.id]);
    const currentSelected = STATE.userAnswers[q.id];

    const card = document.createElement('div');
    card.className = 'question-card';
    card.setAttribute('data-qid', q.id);

    // Diagram HTML
    let diagramHtml = buildDiagramHtml(q.diagram_code, '📊 Sơ đồ trực quan luồng xử lý:');

    // Code Snippet HTML
    let codeHtml = '';
    if (q.code_snippet) {
      codeHtml = `
        <div class="question-code-snippet">
          <div class="code-snippet-header">
            <span>PYTHON CODE SNIPPET</span>
            <button class="btn-copy-code" data-code="${escapeHtml(q.code_snippet)}">📋 Sao chép code</button>
          </div>
          <pre><code class="language-python">${escapeHtml(q.code_snippet)}</code></pre>
        </div>
      `;
    }

    // Options HTML
    let optionsHtml = '<div class="options-list">';
    ['A', 'B', 'C', 'D'].forEach(letter => {
      const optText = q.options[letter] || '';
      const isSelected = currentSelected === letter;
      optionsHtml += `
        <div class="option-item ${isSelected ? 'selected' : ''}" data-qid="${q.id}" data-letter="${letter}">
          <div class="option-letter">${letter}</div>
          <div class="option-content">${formatMarkdown(optText)}</div>
        </div>
      `;
    });
    optionsHtml += '</div>';

    card.innerHTML = `
      <div class="question-header">
        <div class="question-meta">
          <span class="q-badge-num">Câu ${q.id}</span>
          <span class="q-badge-section">${q.section.name}</span>
          ${q.tag ? `<span class="q-badge-tag">${q.tag}</span>` : ''}
        </div>
        <button class="btn-flag ${isFlagged ? 'flagged' : ''}" data-qid="${q.id}">
          ${isFlagged ? '⚑ Đã đánh dấu' : '⚐ Đánh dấu xem lại'}
        </button>
      </div>

      <div class="question-prompt">
        ${formatMarkdown(q.prompt)}
      </div>

      ${diagramHtml}
      ${codeHtml}
      ${optionsHtml}

      <div class="question-footer">
        <button class="btn-nav" id="btnPrev" ${isFirst ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Câu trước
        </button>

        <button class="btn-clear" id="btnClearSelection" ${!currentSelected ? 'style="visibility:hidden;"' : ''}>
          ✕ Bỏ chọn câu này
        </button>

        <button class="btn-nav primary" id="btnNext">
          ${isLast ? 'Hoàn thành' : 'Câu tiếp theo'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    `;

    DOM.questionsContainer.appendChild(card);
    applyKaTeXAndPrism(card);

    // Copy code button
    const copyBtn = card.querySelector('.btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(q.code_snippet).then(() => {
          copyBtn.textContent = '✔ Đã sao chép!';
          setTimeout(() => { copyBtn.textContent = '📋 Sao chép code'; }, 2000);
        });
      });
    }

    // Attach local card event listeners
    card.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        const qid = parseInt(item.getAttribute('data-qid'), 10);
        const letter = item.getAttribute('data-letter');
        selectAnswer(qid, letter);
      });
    });

    const flagBtn = card.querySelector('.btn-flag');
    if (flagBtn) {
      flagBtn.addEventListener('click', () => toggleFlag(q.id));
    }

    const prevBtn = card.querySelector('#btnPrev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => jumpToQuestion(STATE.currentIndex - 1));
    }

    const nextBtn = card.querySelector('#btnNext');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isLast) {
          openSubmitModal();
        } else {
          jumpToQuestion(STATE.currentIndex + 1);
        }
      });
    }

    const clearBtn = card.querySelector('#btnClearSelection');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => clearAnswer(q.id));
    }
  }

  function renderAllQuestionsPaper() {
    STATE.activeQuestions.forEach((q) => {
      const isFlagged = Boolean(STATE.flagged[q.id]);
      const currentSelected = STATE.userAnswers[q.id];

      const card = document.createElement('div');
      card.className = 'question-card';
      card.setAttribute('data-qid', q.id);

      let diagramHtml = buildDiagramHtml(q.diagram_code, '📊 Sơ đồ luồng xử lý:');

      let codeHtml = '';
      if (q.code_snippet) {
        codeHtml = `
          <div class="question-code-snippet">
            <div class="code-snippet-header">
              <span>PYTHON CODE SNIPPET</span>
            </div>
            <pre><code class="language-python">${escapeHtml(q.code_snippet)}</code></pre>
          </div>
        `;
      }

      let optionsHtml = '<div class="options-list">';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const optText = q.options[letter] || '';
        const isSelected = currentSelected === letter;
        optionsHtml += `
          <div class="option-item ${isSelected ? 'selected' : ''}" data-qid="${q.id}" data-letter="${letter}">
            <div class="option-letter">${letter}</div>
            <div class="option-content">${formatMarkdown(optText)}</div>
          </div>
        `;
      });
      optionsHtml += '</div>';

      card.innerHTML = `
        <div class="question-header">
          <div class="question-meta">
            <span class="q-badge-num">Câu ${q.id}</span>
            <span class="q-badge-section">${q.section.name}</span>
            ${q.tag ? `<span class="q-badge-tag">${q.tag}</span>` : ''}
          </div>
          <button class="btn-flag ${isFlagged ? 'flagged' : ''}" data-qid="${q.id}">
            ${isFlagged ? '⚑ Đã đánh dấu' : '⚐ Đánh dấu'}
          </button>
        </div>

        <div class="question-prompt">
          ${formatMarkdown(q.prompt)}
        </div>

        ${diagramHtml}
        ${codeHtml}
        ${optionsHtml}
      `;

      DOM.questionsContainer.appendChild(card);

      card.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', () => {
          const qid = parseInt(item.getAttribute('data-qid'), 10);
          const letter = item.getAttribute('data-letter');
          selectAnswer(qid, letter);
        });
      });

      const flagBtn = card.querySelector('.btn-flag');
      if (flagBtn) {
        flagBtn.addEventListener('click', () => toggleFlag(q.id));
      }
    });

    applyKaTeXAndPrism(DOM.questionsContainer);
  }

  // --- RENDER MATRIX PALETTE ---
  function renderMatrix() {
    if (!DOM.matrixGrid) return;
    DOM.matrixGrid.innerHTML = '';

    STATE.allQuestions.forEach((q) => {
      const cell = document.createElement('button');
      cell.className = 'matrix-cell';
      cell.textContent = q.id;
      cell.setAttribute('title', `Câu ${q.id}: ${q.section.name}`);

      const isAnswered = Boolean(STATE.userAnswers[q.id]);
      const isFlagged = Boolean(STATE.flagged[q.id]);
      const isCurrent = STATE.viewMode === 'focus' && STATE.activeQuestions[STATE.currentIndex]?.id === q.id;

      if (isAnswered) cell.classList.add('answered');
      if (isFlagged) cell.classList.add('flagged');
      if (isCurrent) cell.classList.add('current');

      cell.addEventListener('click', () => {
        let activeIdx = STATE.activeQuestions.findIndex(item => item.id === q.id);
        if (activeIdx === -1) {
          setSectionFilter('all');
          activeIdx = STATE.activeQuestions.findIndex(item => item.id === q.id);
        }
        jumpToQuestion(activeIdx);
      });

      DOM.matrixGrid.appendChild(cell);
    });
  }

  function updateUIProgress() {
    const total = STATE.allQuestions.length;
    const answered = Object.keys(STATE.userAnswers).length;
    const flagged = Object.values(STATE.flagged).filter(Boolean).length;
    const remain = total - answered;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    if (DOM.progressText) DOM.progressText.textContent = `${answered}/${total}`;
    if (DOM.paletteCounterBadge) DOM.paletteCounterBadge.textContent = `${answered}/${total}`;
    if (DOM.progressBarFill) DOM.progressBarFill.style.width = `${percentage}%`;

    if (DOM.statAnswered) DOM.statAnswered.textContent = answered;
    if (DOM.statFlagged) DOM.statFlagged.textContent = flagged;
    if (DOM.statRemain) DOM.statRemain.textContent = remain;
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Question Palette Drawer Toggles
    if (DOM.btnPaletteToggle) {
      DOM.btnPaletteToggle.addEventListener('click', togglePaletteDrawer);
    }
    if (DOM.btnPaletteClose) {
      DOM.btnPaletteClose.addEventListener('click', closePaletteDrawer);
    }
    if (DOM.paletteOverlay) {
      DOM.paletteOverlay.addEventListener('click', closePaletteDrawer);
    }

    // Font size controls
    if (DOM.fontSizeWidget) {
      DOM.fontSizeWidget.querySelectorAll('.btn-font-size').forEach(btn => {
        btn.addEventListener('click', () => {
          const size = btn.getAttribute('data-size');
          setFontSize(size);
        });
      });
    }

    if (DOM.timerToggleBtn) {
      DOM.timerToggleBtn.addEventListener('click', toggleTimerPause);
    }

    if (DOM.btnSubmitHeader) {
      DOM.btnSubmitHeader.addEventListener('click', openSubmitModal);
    }

    if (DOM.btnSubmitMain) {
      DOM.btnSubmitMain.addEventListener('click', openSubmitModal);
    }

    if (DOM.btnModalCancel) {
      DOM.btnModalCancel.addEventListener('click', closeSubmitModal);
    }

    if (DOM.btnModalConfirm) {
      DOM.btnModalConfirm.addEventListener('click', () => submitTest(false));
    }

    // Section Filters
    if (DOM.sectionFilterBar) {
      DOM.sectionFilterBar.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const filter = tab.getAttribute('data-filter');
          setSectionFilter(filter);
        });
      });
    }

    // View Mode Toggles
    if (DOM.viewModeToggles) {
      DOM.viewModeToggles.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-mode');
          STATE.viewMode = mode;
          DOM.viewModeToggles.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderTestView();
        });
      });
    }

    // Results Actions
    if (DOM.btnReviewWrong) {
      DOM.btnReviewWrong.addEventListener('click', () => openReviewMode('wrong'));
    }

    if (DOM.btnReviewAll) {
      DOM.btnReviewAll.addEventListener('click', () => openReviewMode('all'));
    }

    if (DOM.btnRetryWrong) {
      DOM.btnRetryWrong.addEventListener('click', retryMistakesOnly);
    }

    if (DOM.btnRetakeAll) {
      DOM.btnRetakeAll.addEventListener('click', retakeFullTest);
    }

    if (DOM.btnPrintResult) {
      DOM.btnPrintResult.addEventListener('click', () => window.print());
    }

    // Review Filter Bar
    if (DOM.reviewFilterBar) {
      DOM.reviewFilterBar.querySelectorAll('.review-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-review-filter');
          openReviewMode(filter);
        });
      });
    }

    if (DOM.btnBackToResult) {
      DOM.btnBackToResult.addEventListener('click', showResultScreen);
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  function setupKeyboardNavigation() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // Escape closes lightbox, drawer or modal
      if (e.key === 'Escape') {
        if (DOM.lightboxModal && DOM.lightboxModal.classList.contains('active')) {
          closeLightbox();
          return;
        }
        if (DOM.paletteDrawer && DOM.paletteDrawer.classList.contains('active')) {
          closePaletteDrawer();
          return;
        }
        if (DOM.submitModal && DOM.submitModal.classList.contains('active')) {
          closeSubmitModal();
          return;
        }
      }

      // If Lightbox is open, don't trigger quiz shortcuts
      if (DOM.lightboxModal && DOM.lightboxModal.classList.contains('active')) return;

      // M or B key toggles question palette drawer
      if ((e.key === 'm' || e.key === 'M' || e.key === 'b' || e.key === 'B') && !DOM.submitModal.classList.contains('active')) {
        togglePaletteDrawer();
        return;
      }

      if (DOM.submitModal.classList.contains('active')) return;
      if (STATE.isSubmitted) return;

      const currentQ = STATE.activeQuestions[STATE.currentIndex];
      if (!currentQ) return;

      // Arrow navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (STATE.currentIndex > 0) jumpToQuestion(STATE.currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (STATE.currentIndex < STATE.activeQuestions.length - 1) {
          jumpToQuestion(STATE.currentIndex + 1);
        }
      }

      // 1, 2, 3, 4 or A, B, C, D to pick options
      const keyMap = {
        '1': 'A', 'a': 'A', 'A': 'A',
        '2': 'B', 'b': 'B', 'B': 'B',
        '3': 'C', 'c': 'C', 'C': 'C',
        '4': 'D', 'd': 'D', 'D': 'D'
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        selectAnswer(currentQ.id, keyMap[e.key]);
      }

      // F to flag
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlag(currentQ.id);
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
