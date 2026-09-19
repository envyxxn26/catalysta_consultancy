// Catalysta — small interaction layer

document.addEventListener('DOMContentLoaded', () => {

  /* Mobile nav toggle */
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

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setActiveNav(link);
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Fade between document pages while keeping same-page anchors immediate.
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

  /* Contact form — placeholder submit handling (no backend wired up yet) */
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

  /* Blog filters */
  const blogFilters = document.getElementById('blogFilters');
  const blogSearch = document.getElementById('blogSearch');
  const blogDate = document.getElementById('blogDate');
  const clearBlogFilters = document.getElementById('clearBlogFilters');
  const blogArticles = document.querySelectorAll('.blog-article');
  const blogEmpty = document.getElementById('blogEmpty');
  const blogResultsCount = document.getElementById('blogResultsCount');

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
      if (blogResultsCount) {
        blogResultsCount.textContent = `${String(visibleCount).padStart(2, '0')} ${visibleCount === 1 ? 'article' : 'articles'}`;
      }
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