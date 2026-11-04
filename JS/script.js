// Catalysta — small interaction layer

document.addEventListener('DOMContentLoaded', () => {
  /* About page: office photo carousel */
  const companyCarousel = document.querySelector('[data-company-carousel]');

  if (companyCarousel) {
    const slides = Array.from(companyCarousel.querySelectorAll('.company-slide'));
    const viewport = companyCarousel.querySelector('.company-carousel-viewport');
    let order = slides.map((_, index) => index);

    const render = () => {
      order.forEach((slideIndex, position) => {
        const slide = slides[slideIndex];
        const isFront = position === 0;
        slide.dataset.pos = String(position);
        slide.setAttribute('aria-hidden', String(!isFront));
        slide.querySelectorAll('a').forEach((link) => {
          if (isFront) link.removeAttribute('tabindex');
          else link.setAttribute('tabindex', '-1');
        });
      });
    };

    let isAnimating = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sendFrontToBack = () => {
      if (isAnimating) return;
      if (reducedMotion.matches) {
        order.push(order.shift());
        render();
        return;
      }
      isAnimating = true;
      const front = slides[order[0]];
      front.classList.add('is-leaving');
      setTimeout(() => {
        order.push(order.shift());
        render();
        front.classList.remove('is-leaving');
        setTimeout(() => { isAnimating = false; }, 450);
      }, 320);
    };

    render();
    viewport?.addEventListener('click', (event) => {
      if (event.target.closest('a')) return;
      sendFrontToBack();
    });
    viewport?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      sendFrontToBack();
    });
  }

  /* Shared header: mobile menu, dropdowns, active links, and page transitions */
  const header = document.querySelector('.site-header');
  const navToggle = document.getElementById('navToggle');

  if (navToggle && header) {
    const navLinks = header.querySelectorAll('.main-nav a');

    const setActiveNav = (currentLink) => {
      navLinks.forEach(link => {
        const isActive = link === currentLink;
        link.classList.toggle('active', isActive);
      });
    };

    // Touch devices: tapping the dropdown trigger toggles the submenu instead of navigating
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    header.querySelectorAll('.nav-dropdown-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        if (!touchQuery.matches) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        trigger.parentElement.classList.toggle('dropdown-open');
      }, true);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setActiveNav(link);
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Shared navigation: fade between pages while leaving same-page anchors immediate.
    document.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const destination = new URL(link.href, window.location.href);
        const isInternalPage = destination.origin === window.location.origin
          && destination.pathname !== window.location.pathname
          && !link.hasAttribute('download');

        if (!isInternalPage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        event.preventDefault();
        document.body.classList.add('page-leaving');
        window.setTimeout(() => {
          window.location.href = destination.href;
        }, 200);
      });
    });

    const getLinkUrl = (link) => new URL(link.href, window.location.href);
    const setActiveFromLocation = () => {
      const currentUrl = new URL(window.location.href);
      const matchingLink = Array.from(navLinks).find((link) => {
        const linkUrl = getLinkUrl(link);
        const samePage = linkUrl.pathname === currentUrl.pathname;
        const sameHash = !linkUrl.hash
          || linkUrl.hash === currentUrl.hash
          || (!currentUrl.hash && linkUrl.hash === '#home');
        return samePage && sameHash;
      });

      setActiveNav(matchingLink || null);
    };

    setActiveFromLocation();
    window.addEventListener('hashchange', setActiveFromLocation);

    navToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the mobile menu after choosing a link
    header.querySelectorAll('.nav-cta').forEach(link => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Shared contact form placeholder; connect a backend before relying on submissions. */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!email || !message) {
        status.textContent = 'Please fill in both fields before sending.';
        return;
      }

      // Swap this block out for a real API call / mail service when ready.
      status.textContent = 'Thanks — your message has been sent.';
      form.reset();
    });
  }

  /* Blogs page: filter article cards by search text and publication date */
  const blogFilters = document.getElementById('blogFilters');
  const blogSearch = document.getElementById('blogSearch');
  const blogDate = document.getElementById('blogDate');
  const clearBlogFilters = document.getElementById('clearBlogFilters');
  const blogArticles = document.querySelectorAll('.blog-article');
  const blogEmpty = document.getElementById('blogEmpty');

  if (blogFilters && blogSearch && blogDate && clearBlogFilters && blogEmpty) {
    const filterArticles = () => {
      const searchTerm = blogSearch.value.trim().toLowerCase();
      const selectedDate = blogDate.value;
      let visibleCount = 0;

      blogArticles.forEach((article) => {
        const matchesSearch = article.dataset.title.toLowerCase().includes(searchTerm);
        const matchesDate = !selectedDate || article.dataset.date === selectedDate;
        const isVisible = matchesSearch && matchesDate;

        article.hidden = !isVisible;
        visibleCount += Number(isVisible);
      });

      blogEmpty.hidden = visibleCount > 0;
    };

    blogFilters.addEventListener('submit', (event) => {
      event.preventDefault();
      filterArticles();
    });
    blogSearch.addEventListener('input', filterArticles);
    blogDate.addEventListener('change', filterArticles);
    clearBlogFilters.addEventListener('click', () => {
      blogFilters.reset();
      filterArticles();
    });
  }

});