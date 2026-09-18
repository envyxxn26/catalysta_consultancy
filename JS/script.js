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

    const getLinkHash = (link) => new URL(link.href, window.location.href).hash;
    const setActiveFromHash = () => {
      const matchingLink = Array.from(navLinks).find(link => getLinkHash(link) === window.location.hash);
      setActiveNav(matchingLink || navLinks[0]);
    };

    setActiveFromHash();
    window.addEventListener('hashchange', setActiveFromHash);

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

});