// Catalysta — small interaction layer

document.addEventListener('DOMContentLoaded', () => {
  /* Catalysta office photo stack: clicking sends the front photo to the back */
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

  /* Team card flip toggle */
  document.querySelectorAll('.flip-card[role="button"]').forEach((card) => {
    const toggleCard = () => {
      const isFlipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(isFlipped));
    };

    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleCard();
    });
  });

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

  /* PRODUCTS & CART (DISABLED) — contact form prefill from ?cart=
     To re-enable: remove this comment wrapper (see also the other "PRODUCTS & CART (DISABLED)" block below).
  const contactCart = new URLSearchParams(window.location.search).get('cart');
  if (contactCart && form) {
    try {
      const requestedItems = JSON.parse(contactCart);
      if (!Array.isArray(requestedItems) || !requestedItems.every((item) =>
        item && typeof item.name === 'string' && typeof item.size === 'string'
        && typeof item.color === 'string' && Number.isInteger(item.quantity) && item.quantity > 0
      )) {
        throw new Error('Invalid cart details.');
      }

      const cartSummary = requestedItems.map((item) =>
        `${item.name} — Size ${item.size}, ${item.color} (Qty: ${item.quantity})`
      ).join('\n');
      const messageField = form.querySelector('#message');
      if (messageField) {
        messageField.value = `Product enquiry:\n${cartSummary}\n\n${messageField.value}`.trim();
      }
      const serviceField = form.querySelector('#service');
      if (serviceField && Array.from(serviceField.options).some((option) => option.value === 'Product enquiry')) {
        serviceField.value = 'Product enquiry';
      }
    } catch (error) {
      const messageField = form.querySelector('#message');
      if (messageField) {
        messageField.value = 'We could not load the cart details. Please describe the products you are interested in.\n\n';
      }
      console.error('Unable to load cart details for the product enquiry.', error);
    }
  }
  END PRODUCTS & CART (DISABLED) — contact prefill */

  /* Blog filters */
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

  /* PRODUCTS & CART (DISABLED) — product options, persistent cart, cart dialog, checkout
     To re-enable: remove this comment wrapper and the HTML/CSS comment wrappers marked
     "PRODUCTS & CART (DISABLED)" in the pages and styles.css. Inner comments below use // on purpose.

  // Product card option selection
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach((card) => {
    card.querySelectorAll('.product-size-option').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('.product-size-option').forEach((option) => {
          option.setAttribute('aria-pressed', String(option === button));
        });
      });
    });

    card.querySelectorAll('.product-color-option').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('.product-color-option').forEach((option) => {
          const isSelected = option === button;
          option.classList.toggle('is-selected', isSelected);
          option.setAttribute('aria-pressed', String(isSelected));
        });
        const selectedColor = card.querySelector('.product-selected-color');
        if (selectedColor) selectedColor.textContent = button.getAttribute('aria-label') || '';
      });
    });
  });

  // Persistent shopping cart
  const cartKey = 'catalysta-cart-v1';
  const cartDialog = document.getElementById('cartDialog');
  const cartItemsElement = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartStatus = document.getElementById('cartStatus');
  const cartEnquire = document.getElementById('cartEnquire');
  const cartLiveStatus = document.getElementById('cartLiveStatus');
  const cartButtons = document.querySelectorAll('.btn-cart');
  let cart = [];

  const setCartStatus = (message) => {
    if (cartStatus) cartStatus.textContent = message;
  };
  const setProductStatus = (message) => {
    if (cartLiveStatus) cartLiveStatus.textContent = message;
  };
  const getCartCount = () => cart.reduce((total, item) => total + item.quantity, 0);

  try {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (!Array.isArray(parsedCart) || !parsedCart.every((item) =>
        item && typeof item.key === 'string' && typeof item.id === 'string'
        && typeof item.name === 'string' && typeof item.size === 'string'
        && typeof item.color === 'string' && Number.isInteger(item.quantity) && item.quantity > 0
      )) {
        throw new Error('Saved cart data is invalid.');
      }
      cart = parsedCart;
    }
  } catch (error) {
    console.error('Unable to load the saved shopping cart.', error);
    setCartStatus('Your saved cart could not be loaded. Add items again to start a new cart.');
  }

  const updateCartButtons = () => {
    const count = getCartCount();
    cartButtons.forEach((button) => {
      button.dataset.quantity = String(count);
      button.setAttribute('aria-label', `Shopping cart, ${count} ${count === 1 ? 'item' : 'items'}`);
      const quantity = button.querySelector('.quantity');
      if (quantity) quantity.textContent = count > 0 ? String(count) : '';
    });
  };

  const updateEnquiryLink = () => {
    if (!cartEnquire) return;
    cartEnquire.href = '#checkout';
    cartEnquire.hidden = cart.length === 0;
  };

  const renderCart = () => {
    updateCartButtons();
    if (!cartItemsElement || !cartEmpty) return;

    cartItemsElement.replaceChildren();
    cartEmpty.hidden = cart.length > 0;
    cart.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'cart-line-item';

      const details = document.createElement('div');
      details.className = 'cart-line-details';
      const name = document.createElement('h3');
      name.textContent = item.name;
      const variant = document.createElement('p');
      variant.textContent = `Size ${item.size} · ${item.color}`;
      details.append(name, variant);

      const controls = document.createElement('div');
      controls.className = 'cart-line-controls';
      controls.setAttribute('aria-label', `Quantity for ${item.name}, size ${item.size}, ${item.color}`);
      const decrease = document.createElement('button');
      decrease.type = 'button';
      decrease.className = 'cart-quantity-button';
      decrease.dataset.cartAction = 'decrease';
      decrease.dataset.cartKey = item.key;
      decrease.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
      decrease.textContent = '−';
      const quantity = document.createElement('span');
      quantity.textContent = String(item.quantity);
      const increase = document.createElement('button');
      increase.type = 'button';
      increase.className = 'cart-quantity-button';
      increase.dataset.cartAction = 'increase';
      increase.dataset.cartKey = item.key;
      increase.setAttribute('aria-label', `Increase quantity of ${item.name}`);
      increase.textContent = '+';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-remove-button';
      remove.dataset.cartAction = 'remove';
      remove.dataset.cartKey = item.key;
      remove.textContent = 'Remove';
      controls.append(decrease, quantity, increase, remove);
      row.append(details, controls);
      cartItemsElement.append(row);
    });
    updateEnquiryLink();
  };

  const saveCart = (nextCart) => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(nextCart));
    } catch (error) {
      console.error('Unable to save the shopping cart.', error);
      setCartStatus('Your cart could not be saved in this browser. Check storage settings and try again.');
      setProductStatus('Your cart could not be saved. Check browser storage settings and try again.');
      return false;
    }
    cart = nextCart;
    renderCart();
    return true;
  };

  const openCart = () => {
    if (!cartDialog || cartDialog.open) return;
    renderCart();
    cartDialog.showModal();
  };

  renderCart();
  cartButtons.forEach((button) => {
    button.addEventListener('click', openCart);
  });
  cartDialog?.querySelector('[data-cart-close]')?.addEventListener('click', () => cartDialog.close());
  cartDialog?.addEventListener('click', (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });

  // Checkout view inside the cart dialog
  const PRICES = { 'product-01': 1299, 'product-02': 1599, 'product-03': 1899, 'product-04': 2299 };
  const SHIPPING = { standard: 58, express: 120 };
  const VOUCHERS = {
    SAVE50: { label: '₱50 off your items' },
    FREESHIP: { label: 'Free shipping up to ₱60' }
  };
  const formatPeso = (amount) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  productCards.forEach((card) => {
    const priceLabel = card.querySelector('.product-price');
    const price = PRICES[card.dataset.productId];
    if (priceLabel && price) priceLabel.textContent = formatPeso(price);
  });

  const dialogContent = cartDialog?.querySelector('.cart-dialog-content');
  const dialogTitle = cartDialog?.querySelector('.cart-dialog-header h2');
  const cartViewElements = [cartStatus, cartItemsElement, cartEmpty, cartEnquire];
  let checkoutView = null;
  let checkoutVoucher = null;
  let orderPlaced = false;

  const buildCheckoutView = () => {
    const view = document.createElement('div');
    view.className = 'co-view';
    view.hidden = true;
    view.innerHTML = `
      <form class="co-form" novalidate>
        <section class="co-section"><h3>Your order</h3><div class="co-order" data-co="order"></div></section>
        <section class="co-section"><h3>Delivery details</h3>
          <div class="co-grid">
            <label>Full name<input name="name" autocomplete="name" required></label>
            <label>Mobile number<input name="phone" inputmode="tel" autocomplete="tel" required></label>
          </div>
          <label>Street, barangay<input name="line" autocomplete="street-address" required></label>
          <div class="co-grid">
            <label>City / municipality<input name="city" autocomplete="address-level2" required></label>
            <label>Postal code<input name="zip" inputmode="numeric" autocomplete="postal-code"></label>
          </div>
          <label>Message for the rider (optional)<textarea name="note" maxlength="200" rows="2"></textarea></label>
        </section>
        <section class="co-section"><h3>Shipping</h3>
          <label class="co-opt"><input type="radio" name="ship" value="standard" checked><span>Standard delivery<small>Arrives in 2&ndash;4 days</small></span><b>${formatPeso(SHIPPING.standard)}</b></label>
          <label class="co-opt"><input type="radio" name="ship" value="express"><span>Express delivery<small>Arrives tomorrow</small></span><b>${formatPeso(SHIPPING.express)}</b></label>
        </section>
        <section class="co-section"><h3>Voucher</h3>
          <div class="co-voucher"><input name="voucher" placeholder="Enter voucher code" aria-label="Voucher code" autocomplete="off"><button type="button" class="co-alt" data-co="apply">Apply</button></div>
          <p class="co-msg" data-co="voucher-msg" role="status">Optional. Try SAVE50 or FREESHIP.</p>
        </section>
        <section class="co-section"><h3>Payment method</h3>
          <label class="co-opt"><input type="radio" name="pay" value="cod" checked><span>Cash on Delivery<small>Pay the rider when your order arrives</small></span></label>
          <label class="co-opt"><input type="radio" name="pay" value="qrph"><span>QR Ph<small>Scan with any bank or e-wallet app</small></span></label>
          <label class="co-opt"><input type="radio" name="pay" value="card"><span>Visa or Mastercard<small>Credit or debit card</small></span></label>
          <div class="co-sub" data-co="card" hidden>
            <label>Card number<input name="cardNumber" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" autocomplete="cc-number"></label>
            <div class="co-grid">
              <label>Expiry (MM/YY)<input name="cardExp" maxlength="5" placeholder="MM/YY" autocomplete="cc-exp"></label>
              <label>CVC<input name="cardCvc" inputmode="numeric" maxlength="4" autocomplete="cc-csc"></label>
            </div>
            <label>Name on card<input name="cardName" autocomplete="cc-name"></label>
          </div>
          <label class="co-opt"><input type="radio" name="pay" value="ewallet"><span>E-wallet<small>GCash, Maya, or ShopeePay</small></span></label>
          <div class="co-sub" data-co="ewallet" hidden>
            <label>Choose your e-wallet<select name="wallet"><option>GCash</option><option>Maya</option><option>ShopeePay</option></select></label>
          </div>
        </section>
        <section class="co-section co-summary"><h3>Payment details</h3>
          <div class="co-line"><span>Merchandise subtotal</span><span data-co="merch"></span></div>
          <div class="co-line"><span>Shipping subtotal</span><span data-co="ship"></span></div>
          <div class="co-line"><span>Item discount</span><span data-co="disc"></span></div>
          <div class="co-line"><span>Shipping discount</span><span data-co="sdisc"></span></div>
          <div class="co-line co-total"><span>Total payment</span><span data-co="total"></span></div>
          <p class="co-note" data-co="paynote"></p>
          <button type="submit" class="co-pay" data-co="place">
            <span class="co-pay-text">Place Order</span>
            <span class="co-icons" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="co-icon co-icon-card"><path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor"/></svg>
              <svg viewBox="0 0 24 24" class="co-icon co-icon-terminal"><path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor"/></svg>
              <svg viewBox="0 0 24 24" class="co-icon co-icon-dollar"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/></svg>
              <svg viewBox="0 0 24 24" class="co-icon co-icon-wallet"><path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor"/></svg>
              <svg viewBox="0 0 24 24" class="co-icon co-icon-check"><path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" fill="currentColor"/></svg>
            </span>
          </button>
          <p class="co-error" data-co="error" role="alert"></p>
          <p class="co-done" data-co="done" role="status" hidden></p>
        </section>
      </form>`;
    return view;
  };

  const getCheckoutTotals = () => {
    const merch = cart.reduce((sum, item) => sum + (PRICES[item.id] || 0) * item.quantity, 0);
    const ship = SHIPPING[checkoutView.querySelector('[name="ship"]:checked').value];
    const disc = checkoutVoucher === 'SAVE50' ? Math.min(50, merch) : 0;
    const sdisc = checkoutVoucher === 'FREESHIP' ? Math.min(60, ship) : 0;
    return { merch, ship, disc, sdisc, total: merch + ship - disc - sdisc };
  };

  const renderCheckout = () => {
    if (!checkoutView) return;
    const part = (name) => checkoutView.querySelector(`[data-co="${name}"]`);
    const order = part('order');
    order.replaceChildren();
    cart.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'co-line';
      const label = document.createElement('span');
      label.textContent = `${item.name} (${item.size}, ${item.color}) × ${item.quantity}`;
      const amount = document.createElement('span');
      amount.textContent = formatPeso((PRICES[item.id] || 0) * item.quantity);
      row.append(label, amount);
      order.append(row);
    });
    const t = getCheckoutTotals();
    part('merch').textContent = formatPeso(t.merch);
    part('ship').textContent = formatPeso(t.ship);
    part('disc').textContent = t.disc ? `−${formatPeso(t.disc)}` : formatPeso(0);
    part('sdisc').textContent = t.sdisc ? `−${formatPeso(t.sdisc)}` : formatPeso(0);
    part('total').textContent = formatPeso(t.total);
    const pay = checkoutView.querySelector('[name="pay"]:checked').value;
    part('paynote').textContent = pay === 'cod'
      ? `Please prepare ${formatPeso(t.total)} in cash for the rider.`
      : `You’ll pay ${formatPeso(t.total)} online.`;
    part('card').hidden = pay !== 'card';
    part('ewallet').hidden = pay !== 'ewallet';
    if (checkoutVoucher) part('voucher-msg').textContent = `${checkoutVoucher} applied: ${VOUCHERS[checkoutVoucher].label}.`;
  };

  const showCheckout = () => {
    if (!cartDialog || !dialogContent || cart.length === 0) return;
    if (!checkoutView) {
      checkoutView = buildCheckoutView();
      dialogContent.append(checkoutView);
      wireCheckout();
    }
    cartViewElements.forEach((element) => { if (element) element.hidden = true; });
    cartDialog.classList.add('is-checkout');
    if (dialogTitle) dialogTitle.textContent = 'Checkout';
    checkoutView.hidden = false;
    renderCheckout();
    checkoutView.querySelector('[name="name"]')?.focus();
  };

  const showCartView = () => {
    if (checkoutView) checkoutView.hidden = true;
    cartDialog?.classList.remove('is-checkout');
    if (dialogTitle) dialogTitle.textContent = 'Your cart';
    [cartStatus, cartItemsElement].forEach((element) => { if (element) element.hidden = false; });
    renderCart();
  };

  const wireCheckout = () => {
    const form = checkoutView.querySelector('form');
    const part = (name) => checkoutView.querySelector(`[data-co="${name}"]`);
    const fieldValue = (name) => form.elements[name].value.trim();

    form.addEventListener('change', renderCheckout);
    form.elements.cardNumber.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
    form.elements.cardExp.addEventListener('input', (event) => {
      const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
      event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });

    const applyVoucher = () => {
      const code = fieldValue('voucher').toUpperCase();
      const message = part('voucher-msg');
      if (!code) { message.textContent = 'Enter a code to apply a voucher.'; return; }
      if (!VOUCHERS[code]) { message.textContent = 'That code isn’t valid. Check it and try again.'; return; }
      checkoutVoucher = code;
      form.elements.voucher.value = '';
      renderCheckout();
    };
    part('apply').addEventListener('click', applyVoucher);
    form.elements.voucher.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); applyVoucher(); }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const error = part('error');
      error.textContent = '';
      if (orderPlaced || cart.length === 0) return;
      if (!['name', 'phone', 'line', 'city'].every((name) => fieldValue(name))) {
        error.textContent = 'Fill in your name, mobile number, street, and city.';
        return;
      }
      const pay = form.elements.pay.value;
      if (pay === 'card' && (fieldValue('cardNumber').replace(/\s/g, '').length < 15
        || fieldValue('cardExp').length < 5 || fieldValue('cardCvc').length < 3 || !fieldValue('cardName'))) {
        error.textContent = 'Complete your card details to continue.';
        return;
      }
      const method = { cod: 'Cash on Delivery', qrph: 'QR Ph', card: 'card', ewallet: fieldValue('wallet') }[pay];
      const { total } = getCheckoutTotals();
      const done = part('done');
      done.textContent = `Order placed. Total ${formatPeso(total)} via ${method}. We’ll contact you to confirm delivery.`;
      done.hidden = false;
      orderPlaced = true;
      part('place').disabled = true;
      part('place').querySelector('.co-pay-text').textContent = 'Order placed';
      if (saveCart([])) {
        setCartStatus('');
        if (cartEmpty) cartEmpty.hidden = true;
      }
    });
  };

  const resetCheckout = () => {
    if (!checkoutView) return;
    if (orderPlaced) {
      checkoutView.remove();
      checkoutView = null;
      checkoutVoucher = null;
      orderPlaced = false;
    }
    showCartView();
  };

  cartEnquire?.addEventListener('click', (event) => {
    event.preventDefault();
    showCheckout();
  });
  cartDialog?.addEventListener('close', resetCheckout);

  productCards.forEach((card) => {
    const addButton = card.querySelector('.add-to-cart');
    addButton?.addEventListener('click', () => {
      const selectedSize = card.querySelector('.product-size-option[aria-pressed="true"]');
      const selectedColor = card.querySelector('.product-color-option[aria-pressed="true"]');
      const productId = card.dataset.productId;
      const productName = card.querySelector('.product-title')?.textContent?.trim();
      if (!selectedSize || !selectedColor || !productId || !productName) {
        setProductStatus('Choose a size and color before adding this product.');
        return;
      }

      const size = selectedSize.textContent.trim();
      const color = selectedColor.getAttribute('aria-label');
      if (!color) {
        setProductStatus('The selected color is unavailable. Please choose another color.');
        return;
      }
      const key = `${productId}:${size}:${color}`;
      const existing = cart.find((item) => item.key === key);
      const nextCart = existing
        ? cart.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...cart, { key, id: productId, name: productName, size, color, quantity: 1 }];

      if (saveCart(nextCart)) {
        setProductStatus(`${productName}, size ${size}, ${color} added to your cart.`);
        setCartStatus('Item added to your cart.');
      }
    });
  });

  cartItemsElement?.addEventListener('click', (event) => {
    const control = event.target.closest('[data-cart-action]');
    if (!control) return;
    const { cartAction, cartKey: itemKey } = control.dataset;
    const selectedItem = cart.find((item) => item.key === itemKey);
    if (!selectedItem) return;

    let nextCart;
    if (cartAction === 'remove' || (cartAction === 'decrease' && selectedItem.quantity === 1)) {
      nextCart = cart.filter((item) => item.key !== itemKey);
    } else if (cartAction === 'increase') {
      nextCart = cart.map((item) => item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item);
    } else if (cartAction === 'decrease') {
      nextCart = cart.map((item) => item.key === itemKey ? { ...item, quantity: item.quantity - 1 } : item);
    } else {
      return;
    }
    if (saveCart(nextCart)) setCartStatus('Cart updated.');
  });

  if (window.location.hash === '#cart' && cartDialog) openCart();

  END PRODUCTS & CART (DISABLED) */
});