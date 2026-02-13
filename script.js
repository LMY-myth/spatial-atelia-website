document.addEventListener('DOMContentLoaded', function () {
  (function initHamburgerMenu() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;

    var overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function closeMenu() {
      navMenu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    function openMenu() {
      navMenu.classList.add('is-open');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }

    hamburger.addEventListener('click', function () {
      if (navMenu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener('click', closeMenu);

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  })();

  (function initNavbarAutoHide() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastY = window.scrollY || 0;
    let ticking = false;
    const threshold = 8;

    let hasInteractedScroll = false;

    navbar.classList.remove('hidden');

    // Some browsers restore scroll position after DOMContentLoaded (or via bfcache).
    // If we initialize lastY too early, the first scroll event can incorrectly hide the navbar.
    requestAnimationFrame(() => {
      lastY = window.scrollY || 0;
      if (lastY <= 20) navbar.classList.remove('hidden');
    });

    window.addEventListener(
      'pageshow',
      () => {
        hasInteractedScroll = false;
        lastY = window.scrollY || 0;
        if (lastY <= 20) navbar.classList.remove('hidden');
      },
      { passive: true }
    );

    function update() {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu && navMenu.classList.contains('is-open')) {
        navbar.classList.remove('hidden');
        ticking = false;
        return;
      }

      const y = window.scrollY || 0;
      const delta = y - lastY;

      if (y <= 20) {
        navbar.classList.remove('hidden');
        lastY = y;
        ticking = false;
        return;
      }

      // If the browser restored scroll position, ignore the first scroll event so we don't
      // hide the navbar before the user actually scrolls.
      if (!hasInteractedScroll) {
        hasInteractedScroll = true;
        lastY = y;
        ticking = false;
        return;
      }

      if (Math.abs(delta) >= threshold) {
        if (delta > 0 && y > 20) {
          navbar.classList.add('hidden');
        } else {
          navbar.classList.remove('hidden');
        }
        lastY = y;
      }

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    window.addEventListener(
      'hashchange',
      () => {
        if ((window.scrollY || 0) <= 20) navbar.classList.remove('hidden');
      },
      { passive: true }
    );
  })();

  (function initAnchorSmoothScroll() {
    const anchors = document.querySelectorAll('a[href^="#"]:not(.plans-card)');
    if (!anchors.length) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const navbar = document.querySelector('.navbar');
    const navbarOffset = () => {
      if (!navbar) return 0;
      const rect = navbar.getBoundingClientRect();
      if (!rect.height) return 0;
      return Math.ceil(rect.height + 12);
    };

    const anchorLandingPadding = 0;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const easeInCubic = (t) => t * t * t;
    let activeAnim = null;

    function animateScrollTo(targetY, durationMs) {
      if (activeAnim) {
        window.cancelAnimationFrame(activeAnim);
        activeAnim = null;
      }

      const startY = window.scrollY || 0;
      const doc = document.documentElement;
      const maxY = Math.max(0, (doc?.scrollHeight || 0) - window.innerHeight);
      const endY = clamp(targetY, 0, maxY);
      const distance = endY - startY;

      if (Math.abs(distance) < 2) {
        window.scrollTo(0, endY);
        return Promise.resolve();
      }

      const duration = Math.max(220, durationMs || 780);
      const start = performance.now();

      return new Promise((resolve) => {
        const tick = (now) => {
          const elapsed = now - start;
          const t = clamp(elapsed / duration, 0, 1);
          const eased = easeInCubic(t);
          window.scrollTo(0, startY + distance * eased);

          if (t >= 1) {
            activeAnim = null;
            resolve();
            return;
          }

          activeAnim = window.requestAnimationFrame(tick);
        };

        activeAnim = window.requestAnimationFrame(tick);
      });
    }

    anchors.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        if (!href || href === '#') return;

        const id = href.slice(1);
        if (!id) return;

        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();

        const targetTop =
          (window.scrollY || 0) +
          target.getBoundingClientRect().top -
          navbarOffset() +
          anchorLandingPadding;

        if (prefersReducedMotion) {
          window.scrollTo(0, targetTop);
          if (history && typeof history.pushState === 'function') {
            history.pushState(null, '', href);
          } else {
            window.location.hash = href;
          }
          return;
        }

        animateScrollTo(targetTop, 820).then(() => {
          if (history && typeof history.pushState === 'function') {
            history.pushState(null, '', href);
          } else {
            window.location.hash = href;
          }
        });
      });
    });
  })();

  // Promo 文本入场动画：滚动进入视口时向上滑动淡入
  (function initPromoReveal() {
    const promoContent = document.querySelector('.promo-content');
    if (!promoContent) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            promoContent.classList.add('is-visible');
            obs.unobserve(promoContent);
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(promoContent);
  })();

  // Commercial Grid 入场动画：两侧向内滑动，中间向上滑动
  (function initCommercialReveal() {
    const cards = document.querySelectorAll('.commercial-grid .commercial-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    cards.forEach((card) => observer.observe(card));
  })();

  // Feature Gallery 标题入场动画：向上滑动淡入
  (function initFeatureGalleryHeaderReveal() {
    const header = document.querySelector('.feature-gallery-header');
    if (!header) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            header.classList.add('is-visible');
            obs.unobserve(header);
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(header);
  })();

  // Lighting / Image Showcase 入场动画（用于 interior/architecture 等页面复用区块）
  (function initSectionAnimateOnView() {
    const targets = document.querySelectorAll(
      '.title-section, .image-slider-section, .lighting-section, .image-showcase-section, .blog-section, .workflow-section, .workflow-step'
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('animate');
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    targets.forEach((el) => observer.observe(el));
  })();

  (function initImageSliderSection() {
    const sliderSection = document.querySelector('.image-slider-section');
    if (!sliderSection) return;
    if (sliderSection.dataset.sliderInit === '1') return;
    sliderSection.dataset.sliderInit = '1';

    const slider = sliderSection.querySelector('.image-slider');
    const slides = sliderSection.querySelectorAll('.slide');
    const categoryBtns = sliderSection.querySelectorAll('.category-btn');
    const prevBtn = sliderSection.querySelector('#prevBtn');
    const nextBtn = sliderSection.querySelector('#nextBtn');
    if (!slider || !slides.length || !categoryBtns.length || !prevBtn || !nextBtn) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function updateArrowButtons() {
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function showSlide(index) {
      const safeIndex = Math.max(0, Math.min(totalSlides - 1, index));

      slides.forEach((slide) => slide.classList.remove('active'));
      categoryBtns.forEach((btn) => btn.classList.remove('active'));

      slides[safeIndex].classList.add('active');
      if (categoryBtns[safeIndex]) {
        categoryBtns[safeIndex].classList.add('active');
        if (typeof categoryBtns[safeIndex].scrollIntoView === 'function') {
          categoryBtns[safeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }

      currentSlide = safeIndex;
      updateArrowButtons();
    }

    function nextSlide() {
      showSlide(currentSlide + 1);
    }

    function prevSlide() {
      showSlide(currentSlide - 1);
    }

    categoryBtns.forEach((btn, index) => {
      btn.addEventListener('mouseenter', () => showSlide(index));
    });

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    document.addEventListener('keydown', (e) => {
      if (!sliderSection.isConnected) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    let startX = 0;
    let endX = 0;

    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    slider.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const swipeThreshold = 50;
      const diff = startX - endX;
      if (Math.abs(diff) <= swipeThreshold) return;
      if (diff > 0) nextSlide();
      else prevSlide();
    });

    function handleResize() {
      const buttonNav = sliderSection.querySelector('.button-navigation');
      if (!buttonNav) return;
      if (window.innerWidth <= 768) buttonNav.style.flexDirection = 'column';
      else buttonNav.style.flexDirection = 'row';
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    showSlide(0);
  })();

  (function initPlansCardAnchorScroll() {
    const cards = document.querySelectorAll('.plans-card[href^="#"]');
    if (!cards.length) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const navbar = document.querySelector('.navbar');
    const navbarOffset = () => {
      if (!navbar) return 0;
      const rect = navbar.getBoundingClientRect();
      if (!rect.height) return 0;
      return Math.ceil(rect.height + 12);
    };

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const easeInCubic = (t) => t * t * t;

    let activeAnim = null;

    function animateScrollTo(targetY, durationMs) {
      if (activeAnim) {
        window.cancelAnimationFrame(activeAnim);
        activeAnim = null;
      }

      const startY = window.scrollY || 0;
      const doc = document.documentElement;
      const maxY = Math.max(0, (doc?.scrollHeight || 0) - window.innerHeight);
      const endY = clamp(targetY, 0, maxY);
      const distance = endY - startY;

      if (Math.abs(distance) < 2) {
        window.scrollTo(0, endY);
        return Promise.resolve();
      }

      const duration = Math.max(200, durationMs || 700);
      const start = performance.now();

      return new Promise((resolve) => {
        const tick = (now) => {
          const elapsed = now - start;
          const t = clamp(elapsed / duration, 0, 1);
          const eased = easeInCubic(t);
          window.scrollTo(0, startY + distance * eased);

          if (t >= 1) {
            activeAnim = null;
            resolve();
            return;
          }

          activeAnim = window.requestAnimationFrame(tick);
        };

        activeAnim = window.requestAnimationFrame(tick);
      });
    }

    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const href = card.getAttribute('href') || '';
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const targetTop =
          (window.scrollY || 0) + target.getBoundingClientRect().top - navbarOffset();

        if (prefersReducedMotion) {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
          if (history && typeof history.pushState === 'function') {
            history.pushState(null, '', href);
          } else {
            window.location.hash = href;
          }
          return;
        }

        animateScrollTo(targetTop, 720).then(() => {
          if (history && typeof history.pushState === 'function') {
            history.pushState(null, '', href);
          } else {
            window.location.hash = href;
          }
        });
      });
    });
  })();

  (function initInteriorFurnitureCarousel() {
    const nextBtn = document.getElementById('interior-furniture-next');
    const grid = document.getElementById('interior-furniture-grid');
    const img1 = document.getElementById('interior-furniture-img-1');
    const img2 = document.getElementById('interior-furniture-img-2');
    const img3 = document.getElementById('interior-furniture-img-3');
    const img4 = document.getElementById('interior-furniture-img-4');
    if (!nextBtn || !grid || !img1 || !img2 || !img3 || !img4) return;

    const total = 7;
    let start = 1;

    const imageCache = new Map();

    const srcFor = (n) => {
      const ext = n === 5 ? 'png' : 'jpg';
      return `image/3-interior-6-${n}.${ext}`;
    };
    const normalize = (n) => ((n - 1) % total) + 1;

    const preloadAndDecode = (src) => {
      const cached = imageCache.get(src);
      if (cached) return cached.ready;

      const img = new Image();
      img.decoding = 'async';
      img.src = src;

      const ready = (typeof img.decode === 'function'
        ? img.decode()
        : new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      ).catch(() => undefined);

      // Keep a strong reference to the Image so the decoded result is more likely to stay warm.
      imageCache.set(src, { img, ready });
      return ready;
    };

    let animating = false;

    function render() {
      const a = normalize(start);
      const b = normalize(start + 1);
      const c = normalize(start + 2);
      const d = normalize(start + 3);

      img1.src = srcFor(a);
      img2.src = srcFor(b);
      img3.src = srcFor(c);
      img4.src = srcFor(d);
    }

    function stepNext() {
      if (animating) return;
      animating = true;

      const nextStart = normalize(start + 1);
      const nextA = normalize(nextStart);
      const nextB = normalize(nextStart + 1);
      const nextC = normalize(nextStart + 2);
      const nextD = normalize(nextStart + 3);
      const nextReady = Promise.all([
        preloadAndDecode(srcFor(nextA)),
        preloadAndDecode(srcFor(nextB)),
        preloadAndDecode(srcFor(nextC)),
        preloadAndDecode(srcFor(nextD)),
      ]);

      const gap = Number.parseFloat(getComputedStyle(grid).columnGap || '0') || 0;
      const cardWidth = img1.closest('.interior-furniture-card')?.getBoundingClientRect().width || 0;
      const shift = cardWidth + gap;

      grid.style.transition = 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)';
      grid.style.transform = `translateX(${-shift}px)`;

      const onEnd = (e) => {
        if (e.target !== grid) return;
        if (e.propertyName && e.propertyName !== 'transform') return;
        grid.removeEventListener('transitionend', onEnd);

        // Prevent any intermediate paint from animating while we swap sources + snap back.
        grid.style.transition = 'none';

        nextReady.finally(() => {
          // Swap to the next set while still at -shift so the visible images remain consistent.
          start = nextStart;
          render();

          // Snap back in the same tick (no transition) to avoid flicker.
          grid.style.transform = 'translateX(0px)';
          void grid.offsetHeight;

          // Decode in background; do not block the snap.
          if (typeof img1.decode === 'function') img1.decode().catch(() => undefined);
          if (typeof img2.decode === 'function') img2.decode().catch(() => undefined);
          if (typeof img3.decode === 'function') img3.decode().catch(() => undefined);
          if (typeof img4.decode === 'function') img4.decode().catch(() => undefined);

          animating = false;
        });
      };

      grid.addEventListener('transitionend', onEnd);
    }

    nextBtn.addEventListener('click', () => {
      stepNext();
    });

    render();
    // Preload all 7 images once; only a few images, so this removes per-click loading jitter.
    for (let n = 1; n <= total; n += 1) preloadAndDecode(srcFor(n));
  })();

  (function initUspVideoAccordion() {
    const root = document.getElementById('usp-accordion');
    const video = document.getElementById('usp-accordion-video');
    const source = document.getElementById('usp-accordion-video-source');
    if (!root || !video || !source) return;

    const items = Array.from(root.querySelectorAll('.usp-accordion-item'));
    if (!items.length) return;

    function setVideo(src) {
      if (!src) return;
      if (source.getAttribute('src') === src) return;
      source.setAttribute('src', src);
      video.load();
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => undefined);
    }

    function openItem(target) {
      items.forEach((it) => {
        const header = it.querySelector('.usp-accordion-header');
        const isOpen = it === target;
        it.classList.toggle('is-open', isOpen);
        if (header) header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      setVideo(target.getAttribute('data-video'));
    }

    root.addEventListener('click', (e) => {
      const header = e.target.closest('.usp-accordion-header');
      if (!header) return;
      const item = header.closest('.usp-accordion-item');
      if (!item) return;
      openItem(item);
    });

    // Keep all items collapsed by default; video uses the initial <source> in HTML.
    items.forEach((it) => {
      it.classList.remove('is-open');
      const header = it.querySelector('.usp-accordion-header');
      if (header) header.setAttribute('aria-expanded', 'false');
    });
  })();

  // Gallery 图片入场动画：两侧图片向内滑动
  (function initPortfolioGalleryReveal() {
    const items = document.querySelectorAll(
      '.portfolio-extra-images > div, .portfolio-extra-images2 > div, .portfolio-extra-images3 > div, .portfolio-extra-images4 > div'
    );
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    items.forEach((el) => observer.observe(el));
  })();

  // 场景类别切换：按钮/箭头切换大图，并让按钮条自动滑动到可见区域
  (function initCategorySwitcher() {
    const sections = document.querySelectorAll('.category-switcher-section');
    if (!sections.length) return;

    sections.forEach((section) => {
      const track = section.querySelector('.cat-track');
      const buttonsWrap = section.querySelector('.cat-buttons');
      const buttonsTrack = section.querySelector('.cat-buttons-track');
      if (!track || !buttonsWrap) return;

      const slides = track.querySelectorAll('.cat-slide');
      const buttons = buttonsWrap.querySelectorAll('.cat-btn');
      const prevBtn = section.querySelector('.cat-nav.cat-prev');
      const nextBtn = section.querySelector('.cat-nav.cat-next');

      const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

      function parseIndex(btn) {
        const raw = btn.getAttribute('data-index');
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
      }

      // 用 active 按钮推断当前 index（防止你改了 HTML 顺序后 current 写死不一致）
      let current = 0;
      const activeBtn = buttonsWrap.querySelector('.cat-btn.active');
      if (activeBtn) current = clamp(parseIndex(activeBtn), 0, slides.length - 1);

      function syncButtonsTrack() {
        if (!buttonsTrack) return;
        const active = buttonsWrap.querySelector('.cat-btn.active');
        if (!active) return;

        const wrapWidth = buttonsWrap.clientWidth;
        const trackWidth = buttonsTrack.scrollWidth;
        if (!wrapWidth || trackWidth <= wrapWidth) {
          buttonsTrack.style.transform = 'translateX(0px)';
          return;
        }

        const activeRect = active.getBoundingClientRect();
        const wrapRect = buttonsWrap.getBoundingClientRect();
        const activeCenter = activeRect.left - wrapRect.left + activeRect.width / 2;

        const desiredLeft = activeCenter - wrapWidth / 2;
        const maxLeft = trackWidth - wrapWidth;
        const left = clamp(desiredLeft, 0, maxLeft);
        buttonsTrack.style.transform = `translateX(${-left}px)`;
      }

      function syncArrowState() {
        if (prevBtn) prevBtn.disabled = current <= 0;
        if (nextBtn) nextBtn.disabled = current >= slides.length - 1;
      }

      function goTo(index) {
        current = clamp(index, 0, slides.length - 1);
        track.style.transform = `translateX(${-100 * current}%)`;

        buttons.forEach((b) => b.classList.remove('active'));
        // 你的按钮 data-index 不等于 DOM 顺序，所以要按 data-index 找
        const btnByIndex = Array.from(buttons).find((b) => parseIndex(b) === current);
        if (btnByIndex) btnByIndex.classList.add('active');

        syncButtonsTrack();
        syncArrowState();
      }

      buttons.forEach((btn) => {
        const idx = parseIndex(btn);
        btn.addEventListener('mouseenter', () => goTo(idx));
        btn.addEventListener('focus', () => goTo(idx));
        btn.addEventListener('click', () => goTo(idx));
      });

      if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

      goTo(current);
    });
  })();

  (function initResidentialPricingTabs() {
    const residential = document.getElementById('residential-interiors');
    if (!residential) return;

    const tabList = residential.querySelector('.pricing-plan-tabs');
    const tabs = Array.from(residential.querySelectorAll('.pricing-plan-tab'));
    const panels = Array.from(residential.querySelectorAll('.residential-plan-panel'));
    if (!tabList || !tabs.length || !panels.length) return;

    const clampPlan = (plan) => (plan === 'package' ? 'package' : 'area');

    function setActive(planRaw) {
      const plan = clampPlan(planRaw);

      tabs.forEach((tab) => {
        const isActive = tab.getAttribute('data-plan') === plan;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute('data-plan') === plan;
        panel.classList.toggle('is-active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    }

    function planFromEvent(e) {
      const tab = e.target.closest('.pricing-plan-tab');
      if (!tab) return null;
      return tab.getAttribute('data-plan');
    }

    tabList.addEventListener('mouseenter', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('mousemove', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('focusin', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('click', (e) => {
      const plan = planFromEvent(e);
      if (!plan) return;
      e.preventDefault();
      setActive(plan);
    });

    setActive(tabs.find((t) => t.classList.contains('is-active'))?.getAttribute('data-plan') || 'area');
  })();

  (function initResidentialDisclaimerToggle() {
    const residential = document.getElementById('residential-interiors');
    if (!residential) return;

    const button = residential.querySelector('.pricing-expand');
    const panel = residential.querySelector('#residential-disclaimer');
    if (!button || !panel) return;

    const setExpanded = (expanded) => {
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.setAttribute('aria-label', expanded ? 'Collapse details' : 'Expand details');
      panel.hidden = !expanded;
    };

    setExpanded(false);
    button.addEventListener('click', function () {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });
  })();

  (function initProductVisualizationPricingTabs() {
    const root = document.getElementById('product-furniture-visualization');
    if (!root) return;

    const tabList = root.querySelector('.pricing-plan-tabs');
    const tabs = Array.from(root.querySelectorAll('.pricing-plan-tab'));
    const panels = Array.from(root.querySelectorAll('.product-plan-panel'));
    if (!tabList || !tabs.length || !panels.length) return;

    const clampPlan = (plan) => (plan === 'editorial' ? 'editorial' : 'studio');

    function setActive(planRaw) {
      const plan = clampPlan(planRaw);

      tabs.forEach((tab) => {
        const isActive = tab.getAttribute('data-plan') === plan;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute('data-plan') === plan;
        panel.classList.toggle('is-active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    }

    function planFromEvent(e) {
      const tab = e.target.closest('.pricing-plan-tab');
      if (!tab) return null;
      return tab.getAttribute('data-plan');
    }

    tabList.addEventListener('mouseenter', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('mousemove', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('focusin', (e) => {
      const plan = planFromEvent(e);
      if (plan) setActive(plan);
    });

    tabList.addEventListener('click', (e) => {
      const plan = planFromEvent(e);
      if (!plan) return;
      e.preventDefault();
      setActive(plan);
    });

    setActive(tabs.find((t) => t.classList.contains('is-active'))?.getAttribute('data-plan') || 'studio');
  })();

  (function initPricingTableAmountHighlight() {
    const tables = document.querySelectorAll('.pricing-table');
    if (!tables.length) return;

    const amountPattern = /(\$\d[\d,]*(?:\.\d+)?(?:\s*[+-]\s*\$?\d[\d,]*(?:\.\d+)?)?(?:\s*\+)?(?:\s*\/\s*[^\s<]+)?)/g;

    tables.forEach((table) => {
      const cells = table.querySelectorAll('th, td');
      cells.forEach((cell) => {
        const html = cell.innerHTML;
        if (!html || html.includes('pricing-amount')) return;
        if (!html.includes('$')) return;
        cell.innerHTML = html.replace(amountPattern, '<span class="pricing-amount">$1</span>');
      });
    });
  })();

  (function initContactBubble() {
    var contactEmail = 'allenwang.awdesign@gmail.com';
    var fiverrUrl = 'https://www.fiverr.com/archi_dwell?source=gig_page&gigs=slug%3Adesign-high-roi-airbnb-interiors-with-amenity-maps-and-360-tours%2Cpckg_id%3A1';

    var bubble = document.createElement('button');
    bubble.type = 'button';
    bubble.className = 'crisp-chat-bubble';
    bubble.setAttribute('aria-label', 'Contact us');
    bubble.innerHTML =
      '<span class="crisp-chat-bubble__icon" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      '<path fill="currentColor" d="M32 10c-11 0-20 8.1-20 18 0 5.1 2.4 9.7 6.4 12.9-.2 2.5-1.2 5.5-3.4 7.8 3.4-.4 6.5-1.6 8.7-3 2.5.8 5.2 1.3 8.3 1.3 11 0 20-8.1 20-18S43 10 32 10Zm-9 20.2a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Zm9 0a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Zm9 0a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z"/>' +
      '</svg>' +
      '</span>';
    document.body.appendChild(bubble);

    var panel = document.createElement('div');
    panel.className = 'contact-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Contact options');
    panel.style.display = 'none';
    panel.innerHTML =
      '<h3 class="contact-panel__title">Ready to Start?</h3>' +
      '<p class="contact-panel__desc">Choose the way that works best for you.</p>' +

      '<a class="contact-panel__card" href="mailto:' + contactEmail + '">' +
        '<span class="contact-panel__card-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/></svg>' +
        '</span>' +
        '<span class="contact-panel__card-body">' +
          '<strong>Email Us Directly</strong>' +
          '<small>' + contactEmail + '</small>' +
        '</span>' +
        '<span class="contact-panel__arrow">&#8250;</span>' +
      '</a>' +

      '<a class="contact-panel__card contact-panel__card--fiverr" href="' + fiverrUrl + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="contact-panel__card-icon contact-panel__card-icon--fiverr">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.25 16.25v-10h-4.5v-1.5c0-0.83 0.67-1.5 1.5-1.5h1.5V0h-1.5c-2.49 0-4.5 2.01-4.5 4.5v1.75H6.5v3.5h2.25v6.5h-3.5v3.5h10v-3.5h-3.5v-6.5h4.5v6.5h-1v3.5h4.5v-3.5h-1z"/></svg>' +
        '</span>' +
        '<span class="contact-panel__card-body">' +
          '<strong>Order on Fiverr</strong>' +
          '<small>Secure payment &amp; money-back guarantee</small>' +
        '</span>' +
        '<span class="contact-panel__arrow">&#8250;</span>' +
      '</a>' +

      '<p class="contact-panel__footer">Share your floor plan or reference images — we\'ll respond within 24 h.</p>';

    document.body.appendChild(panel);

    function setOpen(open) {
      panel.style.display = open ? 'flex' : 'none';
      bubble.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function isOpen() {
      return panel.style.display !== 'none';
    }

    bubble.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!isOpen());
    });

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    document.addEventListener('click', function () {
      if (isOpen()) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });
  })();

  /* ---------- Footer Social Share ---------- */
  (function initSocialShare() {
    var links = document.querySelectorAll('[data-share]');
    if (!links.length) return;

    var toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = 'Link copied! Paste it on Instagram.';
    document.body.appendChild(toast);

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var url = encodeURIComponent(window.location.href);
        var platform = link.getAttribute('data-share');

        if (platform === 'facebook') {
          window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'width=600,height=400');
        } else if (platform === 'twitter') {
          window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + encodeURIComponent('Check out Spatial Atélia — elite design & visualization'), '_blank', 'width=600,height=400');
        } else if (platform === 'instagram') {
          navigator.clipboard.writeText(window.location.href).then(function () {
            toast.classList.add('is-visible');
            setTimeout(function () { toast.classList.remove('is-visible'); }, 2500);
          });
        }
      });
    });
  })();

  /* ---------- Back to Top Button ---------- */
  (function initBackToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 15l-6-6-6 6"/>' +
      '</svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  /* ---------- Contact form → mailto handler ---------- */
  (function initContactForm() {
    var form = document.querySelector('.contact-form-new');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var subject   = form.querySelector('[name="subject"]');
      var firstName = form.querySelector('[name="firstName"]');
      var lastName  = form.querySelector('[name="lastName"]');
      var email     = form.querySelector('[name="email"]');
      var phone     = form.querySelector('[name="phone"]');
      var message   = form.querySelector('[name="message"]');

      var subjectText = subject.options[subject.selectedIndex]
        ? subject.options[subject.selectedIndex].text
        : '';

      var mailSubject = 'New Enquiry – ' + subjectText;
      var mailBody =
        'Subject: ' + subjectText + '\n' +
        'Name: ' + firstName.value + ' ' + lastName.value + '\n' +
        'Email: ' + email.value + '\n' +
        'Phone: ' + (phone.value || 'N/A') + '\n\n' +
        'Message:\n' + message.value;

      window.location.href =
        'mailto:allenwang.awdesign@gmail.com' +
        '?subject=' + encodeURIComponent(mailSubject) +
        '&body='    + encodeURIComponent(mailBody);
    });
  })();

  /* ---------- Project Lightbox ---------- */
  (function initProjectLightbox() {
    var cards = document.querySelectorAll('[data-project]');
    if (!cards.length) return;

    // Build lightbox DOM
    var lb = document.createElement('div');
    lb.className = 'project-lightbox';
    lb.innerHTML =
      '<button class="project-lightbox__close" aria-label="Close">&times;</button>' +
      '<button class="project-lightbox__nav project-lightbox__nav--prev" aria-label="Previous">&#10094;</button>' +
      '<img class="project-lightbox__img" src="" alt="">' +
      '<button class="project-lightbox__nav project-lightbox__nav--next" aria-label="Next">&#10095;</button>' +
      '<div class="project-lightbox__counter"></div>';
    document.body.appendChild(lb);

    var img = lb.querySelector('.project-lightbox__img');
    var counter = lb.querySelector('.project-lightbox__counter');
    var closeBtn = lb.querySelector('.project-lightbox__close');
    var prevBtn = lb.querySelector('.project-lightbox__nav--prev');
    var nextBtn = lb.querySelector('.project-lightbox__nav--next');

    var images = [];
    var currentIdx = 0;

    function open(srcs, startIdx) {
      images = srcs;
      currentIdx = startIdx || 0;
      show();
      lb.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lb.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    function show() {
      img.src = images[currentIdx];
      img.alt = 'Image ' + (currentIdx + 1);
      counter.textContent = (currentIdx + 1) + ' / ' + images.length;
    }

    function prev() {
      currentIdx = (currentIdx - 1 + images.length) % images.length;
      show();
    }

    function next() {
      currentIdx = (currentIdx + 1) % images.length;
      show();
    }

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });

    lb.addEventListener('click', function (e) {
      if (e.target === lb) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    // Attach click to each card
    cards.forEach(function (card) {
      var sliderWrap = card.querySelector('.project-slider-wrap');
      var srcs = [];
      if (sliderWrap) {
        var imgs = sliderWrap.querySelectorAll('.project-slider img');
        imgs.forEach(function (i) { srcs.push(i.getAttribute('src')); });
      }
      if (!srcs.length) return;

      var clickTarget = card.querySelector('.blog-image') || card.querySelector('.project-card-cover');
      if (clickTarget) {
        clickTarget.style.cursor = 'pointer';
        clickTarget.addEventListener('click', function () { open(srcs, 0); });
      }
      var titleTarget = card.querySelector('.blog-card-title') || card.querySelector('.project-card-info');
      if (titleTarget) {
        titleTarget.style.cursor = 'pointer';
        titleTarget.addEventListener('click', function () { open(srcs, 0); });
      }
    });
  })();
});