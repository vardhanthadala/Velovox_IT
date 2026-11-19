/**
 * Advanced Scroll-Triggered Entrance Animations Engine
 * 
 * - Full 3D kinetic character & word splitting for headings
 * - Staggered card fade-up with spring physics easing
 * - Directional block & media slide-ins
 * - Alternating depth elevations for grid showcases
 * - Ambient floating micro-motions
 * - Complete accessibility (aria-label/aria-hidden) & reduced-motion fallback
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.documentElement.classList.add('js-animations-active');
  }

  /**
   * Split heading into characters and words
   */
  function setupSplitHeading(heading) {
    if (heading.dataset.splitDone) return;
    const text = heading.textContent.trim();
    if (!text) return;

    heading.setAttribute('aria-label', text);
    heading.dataset.splitDone = 'true';

    const isCenter = heading.dataset.variant === 'A' || window.getComputedStyle(heading).textAlign === 'center';
    heading.dataset.variant = isCenter ? 'A' : 'B';

    const nodes = Array.from(heading.childNodes);
    heading.innerHTML = '';

    let charCounter = 0;

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) {
            heading.appendChild(document.createTextNode(w));
          } else {
            const wordEl = document.createElement('span');
            wordEl.className = 'anim-word';
            wordEl.setAttribute('aria-hidden', 'true');

            for (let i = 0; i < w.length; i++) {
              const charEl = document.createElement('span');
              charEl.className = 'anim-char';
              charEl.textContent = w[i];
              charEl.style.transitionDelay = `${charCounter * 0.022}s`;
              charEl.style.transitionDuration = '0.75s';
              wordEl.appendChild(charEl);
              charCounter++;
            }
            heading.appendChild(wordEl);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrap = node.cloneNode(false);
        wrap.setAttribute('aria-hidden', 'true');
        const words = node.textContent.split(/(\s+)/);

        words.forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) {
            wrap.appendChild(document.createTextNode(w));
          } else {
            const wordEl = document.createElement('span');
            wordEl.className = 'anim-word';

            for (let i = 0; i < w.length; i++) {
              const charEl = document.createElement('span');
              charEl.className = 'anim-char';
              charEl.textContent = w[i];
              charEl.style.transitionDelay = `${charCounter * 0.022}s`;
              charEl.style.transitionDuration = '0.75s';
              wordEl.appendChild(charEl);
              charCounter++;
            }
            wrap.appendChild(wordEl);
          }
        });
        heading.appendChild(wrap);
      }
    });
  }

  /**
   * Animated Number Counter
   */
  function runCounter(el) {
    if (el.dataset.counterDone) return;
    el.dataset.counterDone = 'true';

    const target = parseFloat(el.getAttribute('data-count') || el.textContent.replace(/[^0-9.]/g, ''));
    if (isNaN(target)) return;

    const prefix = el.getAttribute('data-count-prefix') || '';
    const suffix = el.getAttribute('data-count-suffix') || '';
    const duration = parseFloat(el.getAttribute('data-count-duration') || '1600');
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const val = Math.floor(ease * target);
      el.textContent = `${prefix}${val}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${target}${suffix}`;
      }
    }
    requestAnimationFrame(step);
  }

  /**
   * Main observer
   */
  function init() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.title-animation, [data-anim], [data-count]').forEach((el) => {
        el.classList.add('is-animated');
        if (el.hasAttribute('data-count')) runCounter(el);
      });
      return;
    }

    // Process all headings
    document.querySelectorAll('.title-animation').forEach(setupSplitHeading);

    // Intersection Observer setup
    if (!window.__siteAnimObserver) {
      window.__siteAnimObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;

              const delay = el.getAttribute('data-anim-delay');
              if (delay) el.style.transitionDelay = `${delay}ms`;

              const duration = el.getAttribute('data-anim-duration');
              if (duration) el.style.transitionDuration = `${duration}ms`;

              // Trigger transition
              requestAnimationFrame(() => {
                el.classList.add('is-animated');
              });

              // Counter trigger
              if (el.hasAttribute('data-count')) {
                runCounter(el);
              }
              el.querySelectorAll('[data-count]').forEach(runCounter);

              if (!el.hasAttribute('data-anim-repeat')) {
                obs.unobserve(el);
              }
            } else {
              // Lazy-load entrance animation on scroll (replay when scrolling into view)
              el.classList.remove('is-animated');
            }
          });
        },
        { root: null, rootMargin: '50px 0px -5% 0px', threshold: 0.05 }
      );
    }

    document.querySelectorAll('.title-animation, [data-anim], [data-count], .split-lines-reveal').forEach((el) => {
      if (!el.dataset.animObserved) {
        el.dataset.animObserved = 'true';
        window.__siteAnimObserver.observe(el);
      }
      // If element is already in the viewport upon page load, immediately mark active
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        requestAnimationFrame(() => {
          el.classList.add('is-animated');
        });
      }
    });
  }

  // Bind initial DOM and load events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);

  // Re-run hook for React lifecycle
  window.refreshSiteAnimations = init;

  // React dynamic component observer
  const mutObserver = new MutationObserver(() => {
    init();
  });
  if (document.body) {
    mutObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      mutObserver.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Periodic poll to ensure zero race conditions during React render
  let ticks = 0;
  const poll = setInterval(() => {
    init();
    ticks++;
    if (ticks > 20) clearInterval(poll);
  }, 250);

})();
