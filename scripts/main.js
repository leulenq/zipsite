(function () {
  const header = document.querySelector('[data-component="header"]');
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  function setHeaderState() {
    if (!header) return;
    const scrolled = window.scrollY > 24;
    header.style.boxShadow = scrolled ? '0 20px 40px rgba(15, 23, 42, 0.08)' : 'none';
  }

  if (toggle && mobileNav) {
    function closeNav() {
      mobileNav.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }

    function openNav() {
      mobileNav.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeNav();
      } else {
        openNav();
      }
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeNav();
      });
    });
  }

  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15
    });

    document.querySelectorAll('.fade-in').forEach((el) => {
      const delay = Number(el.dataset.delay || 0);
      if (delay) {
        el.style.transitionDelay = `${delay}ms`;
      }
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.fade-in').forEach((el) => el.classList.add('is-visible'));
  }
})();
