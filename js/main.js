/* =========================================================
   Hazem Salah · Portfolio
   Small, dependency-free scripts:
     1. Theme toggle (saved in localStorage)
     2. Mobile menu
     3. Header shadow on scroll
     4. Scroll-reveal animations
     5. RAG demo animation in the hero
     6. Footer year
   ========================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Theme toggle ---------- */
  var themeBtn = document.querySelector('.theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var isDark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: ignore */ }
  });

  /* ---------- 2. Mobile menu ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navMenu = document.getElementById('nav-menu');

  function setMenu(open) {
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
  }

  navToggle.addEventListener('click', function () {
    setMenu(!navMenu.classList.contains('is-open'));
  });

  // Close after choosing a link, or with Escape
  navMenu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /* ---------- 3. Header border once the page is scrolled ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 5. RAG demo (hero card) ----------
     Stages: "typing" -> "retrieving" -> "answer", then loop.
     The HTML already shows the final state, so with reduced motion
     (or if this script fails) visitors still see the full result. */
  var card = document.querySelector('.rag-card');

  if (card) {
    var qText = card.querySelector('.rag-q-text');
    var fullQuestion = qText.getAttribute('data-full');
    var pauseBtn = card.querySelector('.rag-pause');

    if (reduceMotion) {
      card.classList.add('is-static');
    } else {
      var paused = false;      // paused by the button
      var offscreen = false;   // paused because the card is not visible

      var sleep = function (ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
      };

      // Wait `ms` of *running* time (time while paused does not count)
      var wait = async function (ms) {
        var step = 50;
        while (ms > 0) {
          await sleep(step);
          if (!paused && !offscreen) ms -= step;
        }
      };

      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        card.classList.toggle('is-paused', paused);
        pauseBtn.setAttribute('aria-pressed', String(paused));
        pauseBtn.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
      });

      // Don't burn CPU when the card is scrolled out of view
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          offscreen = !entries[0].isIntersecting;
        }).observe(card);
      }

      var runLoop = async function () {
        card.classList.add('is-animated');

        while (true) {
          // 1. Type the question
          card.setAttribute('data-stage', 'typing');
          qText.textContent = '';
          await wait(700);
          for (var i = 1; i <= fullQuestion.length; i++) {
            qText.textContent = fullQuestion.slice(0, i);
            await wait(65);
          }
          await wait(500);

          // 2. Retrieve top-k documents (CSS staggers the bars)
          card.setAttribute('data-stage', 'retrieving');
          await wait(2200);

          // 3. Show the answer with its source chip
          card.setAttribute('data-stage', 'answer');
          await wait(4500);
        }
      };

      runLoop();
    }
  }

  /* ---------- 6. Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
