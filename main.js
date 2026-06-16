/**
 * ParthDeals — Premium Affiliate Marketing Blog
 * main.js — Complete vanilla JS (ES6+), no frameworks.
 * ─────────────────────────────────────────────────
 * Features: sticky header, mobile menu, smooth scroll, search,
 * deal filtering, scroll reveal, load-more, back-to-top,
 * affiliate tracking, star ratings, newsletter + toast system,
 * social share, breadcrumbs, hero carousel, lazy images,
 * keyboard a11y, debounced perf helpers, counter animation.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ──────────────────────────────────────────────
     0. UTILITY HELPERS
     ────────────────────────────────────────────── */

  /** Debounce — collapses rapid calls into one trailing invocation. */
  const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  /** Throttle via requestAnimationFrame (≈16 ms cap). */
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
    };
  };

  /** Shorthand selectors. */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ──────────────────────────────────────────────
     1. STICKY HEADER WITH SCROLL EFFECT
     ────────────────────────────────────────────── */
  const header = $('.header');
  const HEADER_SCROLL_THRESHOLD = 80;
  const HEADER_HEIGHT = 70; // used for smooth-scroll offset

  const handleHeaderScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > HEADER_SCROLL_THRESHOLD);
  };

  /* ──────────────────────────────────────────────
     2. MOBILE MENU TOGGLE
     ────────────────────────────────────────────── */
  const hamburger = $('.header__hamburger');
  const mobileMenu = $('.mobile-menu');

  const openMobileMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('active');
    hamburger?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('active');
    hamburger?.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', () => {
    mobileMenu?.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
  });

  // Close on link click inside menu
  $$('a', mobileMenu).forEach((link) =>
    link.addEventListener('click', closeMobileMenu)
  );

  // Close on overlay click (clicking the menu backdrop itself)
  mobileMenu?.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMobileMenu();
  });

  /* ──────────────────────────────────────────────
     3. SMOOTH SCROLL FOR ANCHOR LINKS
     ────────────────────────────────────────────── */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = $(targetId);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileMenu();
    });
  });

  /* ──────────────────────────────────────────────
     4. SEARCH FUNCTIONALITY
     ────────────────────────────────────────────── */
  const searchInput = $('.header__search-input');
  const dealCards = () => $$('.deal-card'); // live query

  const getOrCreateNoResults = () => {
    let el = $('#no-results-msg');
    if (!el) {
      el = document.createElement('p');
      el.id = 'no-results-msg';
      el.textContent = 'No deals found matching your search.';
      el.style.cssText =
        'text-align:center;padding:2rem;color:var(--clr-text-muted,#999);display:none;grid-column:1/-1;';
      const grid = $('.deals__grid') || $('.deal-grid');
      grid?.appendChild(el);
    }
    return el;
  };

  const handleSearch = debounce((e) => {
    const query = e.target.value.trim().toLowerCase();
    const cards = dealCards();
    let matchCount = 0;

    cards.forEach((card) => {
      const title = (card.dataset.title || card.textContent).toLowerCase();
      const isMatch = !query || title.includes(query);
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) matchCount++;
    });

    const noResults = getOrCreateNoResults();
    noResults.style.display = matchCount === 0 && query ? 'block' : 'none';
  }, 300);

  searchInput?.addEventListener('input', handleSearch);

  /* ──────────────────────────────────────────────
     5. DEAL FILTERING SYSTEM
     ────────────────────────────────────────────── */
  const filterPills = $$('.filter-pill');

  const matchesFilter = (card, filter) => {
    if (filter === 'all') return true;
    const platform = (card.dataset.platform || '').toLowerCase();
    const price = parseFloat(card.dataset.price) || 0;

    switch (filter) {
      case 'amazon':
      case 'extrape':
        return platform === filter;
      case 'under-500':
        return price < 500;
      case 'under-1000':
        return price < 1000;
      case 'under-2000':
        return price < 2000;
      default:
        return true;
    }
  };

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      // Toggle active pill
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.dataset.filter || pill.textContent.trim().toLowerCase();
      const cards = dealCards();

      cards.forEach((card) => {
        const show = matchesFilter(card, filter);
        // Fade animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(8px)';
        setTimeout(() => {
          card.style.display = show ? '' : 'none';
          if (show) {
            requestAnimationFrame(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          }
        }, 200);
      });
    });
  });

  /* ──────────────────────────────────────────────
     6. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
     ────────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = el.dataset.delay || '0';
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('active');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.1 }
  );

  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ──────────────────────────────────────────────
     7. LOAD MORE DEALS
     ────────────────────────────────────────────── */
  const INITIAL_VISIBLE = 8;
  const LOAD_BATCH = 4;
  const loadMoreBtn = $('.load-more-btn');

  // Hide cards beyond the initial set
  const initLoadMore = () => {
    const cards = dealCards();
    cards.forEach((card, i) => {
      if (i >= INITIAL_VISIBLE) card.classList.add('hidden');
    });
    if (cards.length <= INITIAL_VISIBLE && loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
  };
  initLoadMore();

  loadMoreBtn?.addEventListener('click', () => {
    const hiddenCards = dealCards().filter((c) => c.classList.contains('hidden'));
    const toShow = hiddenCards.slice(0, LOAD_BATCH);

    toShow.forEach((card, i) => {
      setTimeout(() => {
        card.classList.remove('hidden');
        card.style.opacity = '0';
        requestAnimationFrame(() => {
          card.style.transition = 'opacity .4s ease, transform .4s ease';
          card.style.opacity = '1';
        });
      }, i * 100);
    });

    if (hiddenCards.length <= LOAD_BATCH) {
      loadMoreBtn.textContent = 'All Deals Loaded';
      loadMoreBtn.disabled = true;
      loadMoreBtn.classList.add('disabled');
    }
  });

  /* ──────────────────────────────────────────────
     8. BACK TO TOP BUTTON
     ────────────────────────────────────────────── */
  const backToTop = $('.back-to-top');
  const BACK_TO_TOP_THRESHOLD = 500;

  const handleBackToTopVisibility = () => {
    backToTop?.classList.toggle('visible', window.scrollY > BACK_TO_TOP_THRESHOLD);
  };

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ──────────────────────────────────────────────
     9. AFFILIATE CLICK TRACKING
     ────────────────────────────────────────────── */
  $$('[data-affiliate-link]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const payload = {
        product: el.dataset.title || 'Unknown',
        platform: el.dataset.platform || 'Unknown',
        price: el.dataset.price || '0',
        timestamp: new Date().toISOString(),
      };

      // Console log
      console.log('[ParthDeals] Affiliate click:', payload);

      // Persist to localStorage
      const clicks = JSON.parse(localStorage.getItem('parthdeals_clicks') || '[]');
      clicks.push(payload);
      localStorage.setItem('parthdeals_clicks', JSON.stringify(clicks));

      // Open affiliate link in new tab
      const url = el.dataset.affiliateLink || el.href;
      if (url) window.open(url, '_blank', 'noopener');
    });
  });

  /* ──────────────────────────────────────────────
     10. PRODUCT STAR RATING RENDERER
     ────────────────────────────────────────────── */
  const renderStars = () => {
    $$('.deal-card__rating').forEach((el) => {
      const rating = parseFloat(el.dataset.rating) || 0;
      const clamped = Math.min(Math.max(rating, 0), 5);
      const full = Math.floor(clamped);
      const hasHalf = clamped % 1 >= 0.25 && clamped % 1 <= 0.75;
      const empty = 5 - full - (hasHalf ? 1 : 0);

      let stars = '';
      for (let i = 0; i < full; i++) stars += '<span class="star star--full">★</span>';
      if (hasHalf) stars += '<span class="star star--half">★</span>'; // CSS masks the half
      for (let i = 0; i < empty; i++) stars += '<span class="star star--empty">☆</span>';

      el.innerHTML = stars;
      el.setAttribute('aria-label', `${clamped} out of 5 stars`);
    });
  };
  renderStars();

  /* ──────────────────────────────────────────────
     11. TOAST NOTIFICATION SYSTEM
     ────────────────────────────────────────────── */
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast__icon">${type === 'success' ? '✓' : '✕'}</span>
      <span class="toast__message">${message}</span>
    `;

    // Inline styles for self-contained component
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 1.5rem',
      background: 'var(--clr-surface, #1a1a2e)',
      color: 'var(--clr-text, #fff)',
      border: `2px solid ${type === 'success' ? 'var(--clr-gold, #c9a84c)' : '#e74c3c'}`,
      borderRadius: 'var(--radius-md, 8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,.35)',
      fontFamily: 'inherit',
      fontSize: '0.95rem',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'opacity .3s ease, transform .3s ease',
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Auto-dismiss after 3 s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  };

  /* ──────────────────────────────────────────────
     12. NEWSLETTER FORM
     ────────────────────────────────────────────── */
  const subscribeForm = $('.subscribe__form');

  subscribeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = $('input[type="email"]', subscribeForm) || $('input', subscribeForm);
    const email = emailInput?.value.trim();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    // Persist
    const subs = JSON.parse(localStorage.getItem('parthdeals_subscribers') || '[]');
    if (subs.includes(email)) {
      showToast('You are already subscribed!', 'error');
      return;
    }
    subs.push(email);
    localStorage.setItem('parthdeals_subscribers', JSON.stringify(subs));

    showToast('🎉 Successfully subscribed to ParthDeals!', 'success');
    subscribeForm.reset();
  });

  /* ──────────────────────────────────────────────
     13. SOCIAL SHARE BUTTONS
     ────────────────────────────────────────────── */
  const pageURL = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title || 'ParthDeals');

  $('.share-whatsapp')?.addEventListener('click', () => {
    window.open(
      `https://api.whatsapp.com/send?text=${pageTitle}%20${pageURL}`,
      '_blank',
      'noopener'
    );
  });

  $('.share-twitter')?.addEventListener('click', () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${pageTitle}&url=${pageURL}`,
      '_blank',
      'noopener'
    );
  });

  $('.share-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied!', 'success');
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Link copied!', 'success');
    }
  });

  /* ──────────────────────────────────────────────
     14. BREADCRUMB GENERATOR
     ────────────────────────────────────────────── */
  const breadcrumbContainer = $('.breadcrumb');
  const sections = $$('section[id]');

  const updateBreadcrumb = () => {
    if (!breadcrumbContainer || sections.length === 0) return;
    let currentSection = 'Home';

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= HEADER_HEIGHT + 50 && rect.bottom > HEADER_HEIGHT + 50) {
        currentSection =
          section.dataset.breadcrumb ||
          section.querySelector('h2,h3')?.textContent.trim() ||
          section.id;
        break;
      }
    }

    breadcrumbContainer.innerHTML = `
      <a href="#" class="breadcrumb__link">Home</a>
      <span class="breadcrumb__sep">›</span>
      <span class="breadcrumb__current">${currentSection}</span>
    `;
  };

  /* ──────────────────────────────────────────────
     15. HERO TRENDING CAROUSEL
     ────────────────────────────────────────────── */
  const heroTrending = $('.hero__trending');

  const initCarousel = () => {
    if (!heroTrending) return;
    const items = $$('.hero__trending-item', heroTrending);
    if (items.length <= 1) return;

    let current = 0;

    // Show first, hide rest
    items.forEach((item, i) => {
      Object.assign(item.style, {
        position: i === 0 ? 'relative' : 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        opacity: i === 0 ? '1' : '0',
        transition: 'opacity .6s ease',
        pointerEvents: i === 0 ? 'auto' : 'none',
      });
    });

    // Ensure container is position-relative
    heroTrending.style.position = 'relative';
    heroTrending.style.overflow = 'hidden';

    setInterval(() => {
      const prev = current;
      current = (current + 1) % items.length;

      items[prev].style.opacity = '0';
      items[prev].style.pointerEvents = 'none';
      items[prev].style.position = 'absolute';

      items[current].style.opacity = '1';
      items[current].style.pointerEvents = 'auto';
      items[current].style.position = 'relative';
    }, 4000);
  };
  initCarousel();

  /* ──────────────────────────────────────────────
     16. LAZY LOADING IMAGES
     ────────────────────────────────────────────── */
  const lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.removeAttribute('loading'); // clean up
        lazyObserver.unobserve(img);
      });
    },
    { rootMargin: '200px' }
  );

  $$('img[data-src]').forEach((img) => {
    // Native lazy-load attribute as progressive enhancement
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    }
    lazyObserver.observe(img);
  });

  /* ──────────────────────────────────────────────
     17. KEYBOARD NAVIGATION & FOCUS TRAP
     ────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    // ESC closes mobile menu
    if (e.key === 'Escape' && mobileMenu?.classList.contains('active')) {
      closeMobileMenu();
      hamburger?.focus();
    }
  });

  /** Focus trap: keeps Tab focus inside the mobile menu while open. */
  const trapFocus = (e) => {
    if (!mobileMenu?.classList.contains('active') || e.key !== 'Tab') return;

    const focusable = $$('a, button, input, [tabindex]:not([tabindex="-1"])', mobileMenu);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', trapFocus);

  /* ──────────────────────────────────────────────
     18. COUNTER ANIMATION
     ────────────────────────────────────────────── */
  /** Ease-out quart: 1 - (1 - t)^4 */
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = parseInt(el.dataset.duration, 10) || 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOutQuart(progress) * target);
      el.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  $$('.counter').forEach((el) => counterObserver.observe(el));

  /* ──────────────────────────────────────────────
     19. UNIFIED SCROLL HANDLER (debounced via rAF)
     ────────────────────────────────────────────── */
  const onScroll = rafThrottle(() => {
    handleHeaderScroll();
    handleBackToTopVisibility();
    updateBreadcrumb();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  // Fire once on load to set initial state
  handleHeaderScroll();
  handleBackToTopVisibility();
  updateBreadcrumb();

  /* ──────────────────────────────────────────────
     20. EXPOSE UTILITIES FOR EXTERNAL USE
     ────────────────────────────────────────────── */
  window.ParthDeals = {
    showToast,
    closeMobileMenu,
    openMobileMenu,
  };
});
