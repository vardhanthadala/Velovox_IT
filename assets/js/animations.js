/**
 * Advanced Scroll-Triggered Entrance Animations Engine
 * 
 * - Full 3D kinetic character & word splitting for headings
 * - Staggered card fade-up with spring physics easing
 * - 4-way directional smooth entrances (Left-Right, Right-Left, Top-Bottom, Bottom-Top)
 * - Single-Page-App (SPA) & Dynamic Route Aware: Replays animations cleanly on navigation
 * - Re-triggering scroll reveal (lazy load on scroll into view and out of view)
 * - Strict accessibility & reduced-motion fallback
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
   * Shared IntersectionObserver for continuous scroll entrance
   */
  let animObserver = null;

  function getObserver() {
    if (!animObserver) {
      animObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            if (entry.isIntersecting) {
              const delay = el.getAttribute('data-anim-delay');
              if (delay) el.style.transitionDelay = `${delay}ms`;

              const duration = el.getAttribute('data-anim-duration');
              if (duration) el.style.transitionDuration = `${duration}ms`;

              requestAnimationFrame(() => {
                el.classList.add('is-animated');
              });

              if (el.hasAttribute('data-count')) {
                runCounter(el);
              }
              el.querySelectorAll('[data-count]').forEach(runCounter);
            } else {
              // Reset state when scrolled completely out of view so it re-animates smoothly on re-entry
              el.classList.remove('is-animated');
            }
          });
        },
        { root: null, rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
      );
    }
    return animObserver;
  }

  /**
   * Main initializer: observes new or existing DOM elements
   */
  function init() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.title-animation, [data-anim], [data-count]').forEach((el) => {
        el.classList.add('is-animated');
        if (el.hasAttribute('data-count')) runCounter(el);
      });
      return;
    }

    const obs = getObserver();

    // Process all headings
    document.querySelectorAll('.title-animation').forEach(setupSplitHeading);

    // Observe all animatable elements
    document.querySelectorAll('.title-animation, [data-anim], [data-count], .split-lines-reveal').forEach((el) => {
      if (!el.dataset.animObserved) {
        el.dataset.animObserved = 'true';
        obs.observe(el);
      }

      // Check if already in viewport
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        const delay = el.getAttribute('data-anim-delay');
        if (delay) el.style.transitionDelay = `${delay}ms`;

        requestAnimationFrame(() => {
          el.classList.add('is-animated');
        });
        if (el.hasAttribute('data-count')) runCounter(el);
      }
    });
  }

  let replayTimeout = null;

  /**
   * Reset & Replay: specifically invoked when navigating between routes/slugs
   * Debounced so rapid triggers never stutter or re-fire 3-4 times.
   */
  function resetAndReplay() {
    if (replayTimeout) {
      clearTimeout(replayTimeout);
    }
    replayTimeout = setTimeout(() => {
      const obs = getObserver();

      // Unobserve and reset elements
      document.querySelectorAll('.title-animation, [data-anim], [data-count], .split-lines-reveal').forEach((el) => {
        el.classList.remove('is-animated');
        delete el.dataset.counterDone;
        obs.unobserve(el);
        delete el.dataset.animObserved;
      });

      // Reset headings if their text or structure changed
      document.querySelectorAll('.title-animation').forEach((heading) => {
        delete heading.dataset.splitDone;
      });

      // Re-initialize with clean micro-tick
      requestAnimationFrame(() => {
        init();
      });
    }, 40);
  }

  // Bind initial DOM and load events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', init);

  // Expose global methods for React router / SPA
  window.refreshSiteAnimations = init;
  window.replaySiteAnimations = resetAndReplay;

  // MutationObserver for SPA DOM updates (debounced to avoid re-triggering during render cycles)
  let mutTimeout = null;
  const mutObserver = new MutationObserver((mutations) => {
    let hasRelevantAdd = false;
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length > 0) {
        hasRelevantAdd = true;
        break;
      }
    }
    if (hasRelevantAdd) {
      if (mutTimeout) clearTimeout(mutTimeout);
      mutTimeout = setTimeout(() => {
        init();
      }, 100);
    }
  });

  if (document.body) {
    mutObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      mutObserver.observe(document.body, { childList: true, subtree: true });
    });
  }

})();
