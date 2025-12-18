// ---------------- FOOTER YEAR ----------------
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ---- Reservation date: allow only today to +30 days ----
const resDateInput = document.getElementById("resDate");
if (resDateInput) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // max = today + 30 days
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxStr = maxDate.toISOString().split("T")[0];

  resDateInput.setAttribute("min", todayStr);
  resDateInput.setAttribute("max", maxStr);
}

// ---------------- SMOOTH SCROLL NAV ----------------
document.querySelectorAll("header nav a").forEach(link => {
  link.addEventListener("click", e => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});

/* ===================== CUSTOM POPUP (replaces alert) ===================== */

/**
 * This block injects a small popup overlay into the DOM if it's not already present,
 * and exposes showPopup(message) which displays it. showPopup returns a Promise that
 * resolves when user clicks OK.
 */
(function initPopup() {
  if (document.getElementById("popupOverlay")) return;

  // basic styles (kept inline here so you don't need to edit styles.css)
  const style = document.createElement("style");
  style.id = "popupStyles_injected";
  style.textContent = `
    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.66);
      display: none;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
      z-index: 99999;
    }
    .popup-box {
      background: rgba(15,23,42,0.98);
      padding: 1.2rem 1.3rem;
      width: min(420px, 92%);
      border-radius: 16px;
      border: 1px solid rgba(34,197,94,0.14);
      box-shadow: 0 18px 40px rgba(2,6,23,0.6);
      text-align: center;
      color: var(--text, #f9fafb);
      transform-origin: center;
      animation: popupScale .22s cubic-bezier(.2,.9,.3,1);
    }
    .popup-box p { margin: 0; font-size: 1rem; color: var(--text, #f9fafb); }
    .popup-actions { margin-top: 0.9rem; display:flex; justify-content:center; gap:0.6rem; }
    @keyframes popupScale {
      from { transform: scale(.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .popup-ok { min-width: 88px; }
  `;
  document.head.appendChild(style);

  // markup
  const overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  overlay.className = "popup-overlay";
  overlay.innerHTML = `
    <div class="popup-box" role="dialog" aria-modal="true" aria-labelledby="popupMessage">
      <p id="popupMessage"></p>
      <div class="popup-actions">
        <button id="popupClose" class="btn primary popup-ok">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // keyboard support: close on Escape
  overlay.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      const closeBtn = document.getElementById("popupClose");
      if (closeBtn) closeBtn.click();
    }
  });
})();

/**
 * showPopup(message) -> displays popup and returns a Promise resolved when closed.
 */
function showPopup(message) {
  return new Promise(resolve => {
    const overlay = document.getElementById("popupOverlay");
    const msg = document.getElementById("popupMessage");
    const closeBtn = document.getElementById("popupClose");
    if (!overlay || !msg || !closeBtn) {
      // fallback to native alert if DOM failed
      alert(message);
      resolve();
      return;
    }

    msg.textContent = message;
    overlay.style.display = "flex";

    // focus management
    closeBtn.focus();

    function cleanup() {
      overlay.style.display = "none";
      closeBtn.removeEventListener("click", onClose);
      resolve();
    }
    function onClose() {
      cleanup();
    }

    closeBtn.addEventListener("click", onClose, { once: true });
  });
}

/* ======================= CART LOGIC ======================= */

// key for saving cart in localStorage
const CART_KEY = "glv_cart";

// in-memory cart object
const cart = {}; // { itemName: { price, qty } }

// try to load saved cart from localStorage
const savedCart = localStorage.getItem(CART_KEY);
if (savedCart) {
  try {
    const parsed = JSON.parse(savedCart);
    if (parsed && typeof parsed === "object") {
      Object.assign(cart, parsed);
    }
  } catch (e) {
    console.error("Failed to parse saved cart", e);
  }
}

const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const clearCartBtn = document.getElementById("clear-cart");
const placeOrderBtn = document.getElementById("place-order");

// Customer detail fields
const custNameInput = document.getElementById("custName");
const custPhoneInput = document.getElementById("custPhone");
const custAddressInput = document.getElementById("custAddress");

/* ======================= ORDER DRAFT (NAME / PHONE / ADDRESS) ======================= */

const ORDER_DRAFT_KEY = "glv_order_draft";

function loadOrderDraft() {
  const raw = localStorage.getItem(ORDER_DRAFT_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (custNameInput && data.name) custNameInput.value = data.name;
    if (custPhoneInput && data.phone) custPhoneInput.value = data.phone;
    if (custAddressInput && data.address) custAddressInput.value = data.address;
  } catch (e) {
    console.error("Failed to parse order draft", e);
  }
}

function saveOrderDraft() {
  const draft = {
    name: custNameInput ? custNameInput.value : "",
    phone: custPhoneInput ? custPhoneInput.value : "",
    address: custAddressInput ? custAddressInput.value : ""
  };
  localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft));
}

// load any previous draft
loadOrderDraft();

// save whenever user types
if (custNameInput)  custNameInput.addEventListener("input", saveOrderDraft);
if (custPhoneInput) custPhoneInput.addEventListener("input", saveOrderDraft);
if (custAddressInput) custAddressInput.addEventListener("input", saveOrderDraft);

// ---------------- CART STORAGE HELPER ----------------
function saveCartToStorage() {
  const keys = Object.keys(cart);
  if (keys.length === 0) {
    localStorage.removeItem(CART_KEY);
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
}

/* -------------------- MENU FILTERING & ADD-BUTTON ANIMATION -------------------- */

/*
  Expects:
  - Category buttons container with id="menuCategories"
    buttons with data-cat attributes (e.g. data-cat="north", data-cat="all")
  - Menu items: elements with class .menu-item and data-category attributes
  - Add buttons have class .add-to-cart and data-name / data-price attributes
*/

/* Category filtering */
(function attachMenuFiltering() {
  const catNav = document.getElementById('menuCategories');
  const menuGrid = document.getElementById('menuGrid');
  if (!catNav || !menuGrid) return;

  const items = Array.from(menuGrid.querySelectorAll('.menu-item'));
  const noResults = document.getElementById('menuNoResults');

  function matchesCategory(item, cat) {
    if (!cat || cat === 'all') return true;
    const cats = (item.getAttribute('data-category') || '').toLowerCase().split(',').map(s => s.trim());
    return cats.includes(cat);
  }

  catNav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    const cat = btn.getAttribute('data-cat');

    // toggle active states
    catNav.querySelectorAll('button').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // filter items
    let visible = 0;
    items.forEach(it => {
      if (matchesCategory(it, cat)) {
        it.classList.remove('hidden');
        visible++;
      } else {
        it.classList.add('hidden');
      }
    });

    if (noResults) noResults.style.display = visible ? 'none' : 'block';
  });
})();

/* Add button visual feedback */
(function attachAddButtonAnimation() {
  const menuGrid = document.getElementById('menuGrid') || document;
  menuGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;

    // visual feedback
    btn.classList.add('added');
    btn.focus();
    setTimeout(() => btn.classList.remove('added'), 650);
  });
})();

/* ======================= ADD TO CART (EXISTING) ======================= */

// Add to cart buttons (this logic increments quantities and saves to storage)
document.querySelectorAll(".add-to-cart").forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);

    if (!name || isNaN(price)) {
      console.warn("add-to-cart button missing data-name or data-price", btn);
      return;
    }

    if (!cart[name]) {
      cart[name] = { price, qty: 1 };
    } else {
      cart[name].qty += 1;
    }
    renderCart();
  });
});

function renderCart() {
  if (!cartItemsEl || !cartTotalEl) return;

  cartItemsEl.innerHTML = "";
  let total = 0;

  const entries = Object.entries(cart);

  if (entries.length === 0) {
    cartItemsEl.innerHTML = `<li class="cart-empty">Cart is empty. Add some dishes!</li>`;
  } else {
    entries.forEach(([name, item]) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <div>
          <div class="cart-item-name">${escapeHtml(name)}</div>
          <div class="cart-item-price">&#8377;${item.price} x ${item.qty} = &#8377;${itemTotal}</div>
        </div>
        <div class="cart-controls">
          <button class="qty-btn" data-action="dec" data-name="${escapeHtmlAttr(name)}">-</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-name="${escapeHtmlAttr(name)}">+</button>
          <button class="qty-btn" data-action="remove" data-name="${escapeHtmlAttr(name)}">&times;</button>
        </div>
      `;
      cartItemsEl.appendChild(li);
    });
  }

  cartTotalEl.textContent = `\u20B9${total}`;

  // keep localStorage in sync
  saveCartToStorage();
}

/* Helper: simple escaping for HTML insertion (name in attributes & text) */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeHtmlAttr(str) {
  if (!str) return "";
  return String(str)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Handle quantity buttons
if (cartItemsEl) {
  cartItemsEl.addEventListener("click", e => {
    const btn = e.target.closest(".qty-btn");
    if (!btn) return;

    const action = btn.dataset.action;
    const name = btn.dataset.name;
    if (!cart[name]) return;

    if (action === "inc") {
      cart[name].qty += 1;
    } else if (action === "dec") {
      cart[name].qty -= 1;
      if (cart[name].qty <= 0) {
        delete cart[name];
      }
    } else if (action === "remove") {
      delete cart[name];
    }
    renderCart();
  });
}

// Clear cart
if (clearCartBtn) {
  clearCartBtn.addEventListener("click", () => {
    Object.keys(cart).forEach(key => delete cart[key]);
    renderCart();
  });
}

/* ---------------- PLACE ORDER (BACKEND) ---------------- */

if (placeOrderBtn) {
  placeOrderBtn.addEventListener("click", async () => {
    const entries = Object.entries(cart);
    if (entries.length === 0) {
      showPopup("Your cart is empty! Please add some dishes first.");
      return;
    }

    const name = custNameInput ? custNameInput.value.trim() : "";
    const phone = custPhoneInput ? custPhoneInput.value.trim() : "";
    const address = custAddressInput ? custAddressInput.value.trim() : "";

    if (!name || !address) {
      showPopup("Please enter your name and address before placing the order.");
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      showPopup("Please enter a valid 10-digit phone number.");
      return;
    }

    // Build items + calculate total
    let total = 0;
    const items = entries.map(([itemName, item]) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      return {
        name: itemName,
        price: item.price,
        quantity: item.qty
      };
    });

    const payload = {
      customerName: name,
      phone: phone,
      email: "",
      notes: address,
      items: items
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      if (response.status === 201) {
        // Save details for order-success page
        sessionStorage.setItem("orderMsg", text);
        sessionStorage.setItem("orderName", name);
        sessionStorage.setItem("orderPhone", phone);
        sessionStorage.setItem("orderAddress", address);
        sessionStorage.setItem("orderTotal", total.toString());
        sessionStorage.setItem("orderItems", JSON.stringify(items));

        // Clear cart and customer fields
        Object.keys(cart).forEach(key => delete cart[key]);
        renderCart();
        if (custNameInput) custNameInput.value = "";
        if (custPhoneInput) custPhoneInput.value = "";
        if (custAddressInput) custAddressInput.value = "";

        // clear stored order draft & cart
        localStorage.removeItem(ORDER_DRAFT_KEY);
        localStorage.removeItem(CART_KEY);

        // Redirect to Order Success page
        window.location.href = "order-success.html";
      } else if (response.status === 400) {
        showPopup("Order not valid: " + text);
      } else {
        showPopup("Something went wrong placing the order: " + text);
      }
    } catch (err) {
      console.error(err);
      showPopup("Unable to connect to server. Please try again later.");
    }
  });
}

// Initial cart render (also loads from storage into UI)
renderCart();

/* ======================= RESERVATION LOGIC (FRONTEND) ======================= */

// In-memory reservations for conflict demo (not used for backend now but kept for future)
const reservations = [];

const reservationForm = document.getElementById("reservation-form");

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/* --------- RESERVATION DRAFT (KEEP FORM ON REFRESH) --------- */

const RES_DRAFT_KEY = "glv_reservation_draft";

function loadReservationDraft() {
  const raw = localStorage.getItem(RES_DRAFT_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    const f = document;
    const n = f.getElementById("resName");
    const ph = f.getElementById("resPhone");
    const em = f.getElementById("resEmail");
    const dt = f.getElementById("resDate");
    const tm = f.getElementById("resTime");
    const tb = f.getElementById("resTable");
    const gs = f.getElementById("resGuests");
    const nt = f.getElementById("resNotes");

    if (n && d.name) n.value = d.name;
    if (ph && d.phone) ph.value = d.phone;
    if (em && d.email) em.value = d.email;
    if (dt && d.date) dt.value = d.date;
    if (tm && d.time) tm.value = d.time;
    if (tb && d.table) tb.value = d.table;
    if (gs && d.guests) gs.value = d.guests;
    if (nt && d.notes) nt.value = d.notes;
  } catch (e) {
    console.error("Failed to parse reservation draft", e);
  }
}

function saveReservationDraft() {
  const f = document;
  const draft = {
    name:   (f.getElementById("resName")   || {}).value || "",
    phone:  (f.getElementById("resPhone")  || {}).value || "",
    email:  (f.getElementById("resEmail")  || {}).value || "",
    date:   (f.getElementById("resDate")   || {}).value || "",
    time:   (f.getElementById("resTime")   || {}).value || "",
    table:  (f.getElementById("resTable")  || {}).value || "",
    guests: (f.getElementById("resGuests") || {}).value || "",
    notes:  (f.getElementById("resNotes")  || {}).value || ""
  };
  localStorage.setItem(RES_DRAFT_KEY, JSON.stringify(draft));
}

if (reservationForm) {
  // load draft on page load
  loadReservationDraft();

  // save on any change
  ["resName","resPhone","resEmail","resDate","resTime","resTable","resGuests","resNotes"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", saveReservationDraft);
      if (id === "resDate" || id === "resTime" || id === "resTable") {
        el.addEventListener("change", saveReservationDraft);
      }
    });

  reservationForm.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("resName").value.trim();
    const phone = document.getElementById("resPhone").value.trim();
    const email = document.getElementById("resEmail").value.trim();
    const date = document.getElementById("resDate").value;
    const time = document.getElementById("resTime").value;
    const table = document.getElementById("resTable").value;
    const guests = document.getElementById("resGuests").value;
    const notes = document.getElementById("resNotes").value.trim();

    // Basic required check
    if (!name || !phone || !date || !time || !table || !guests) {
      showPopup("Please fill all required fields (Name, Phone, Date, Time, Table, Guests).");
      return;
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      showPopup("Please enter a valid 10-digit phone number.");
      return;
    }

    // Prevent booking for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date + "T00:00:00");
    if (selectedDate < today) {
      showPopup("You cannot reserve a table for a past date. Please choose today or a future date.");
      return;
    }

    // Prevent booking more than 30 days ahead
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(maxDate.getDate() + 30);
    if (selectedDate > maxDate) {
      showPopup("Reservations can be made only within the next 30 days.");
      return;
    }

    // Time window + duration
    const startMinutes = timeToMinutes(time);
    const duration = 90; // 1.5 hours
    const endMinutes = startMinutes + duration;
    const OPEN_MIN = 11 * 60;
    const CLOSE_MIN = 23 * 60;

    if (startMinutes < OPEN_MIN || endMinutes > CLOSE_MIN) {
      showPopup("Reservations are allowed only between 11:00 AM and 11:00 PM (1.5 hours per reservation).");
      return;
    }

    // Validate table fits guest count
    const selectedTableNum = parseInt(table, 10);
    const guestCount = parseInt(guests, 10);
    const allowedRange = getAllowedTableRange(guestCount);
    if (!selectedTableNum || selectedTableNum < allowedRange.from || selectedTableNum > allowedRange.to) {
      showPopup(`Selected table is not allowed for ${guestCount} guest(s). Allowed tables: ${allowedRange.from} to ${allowedRange.to}.`);
      return;
    }

    // Build payload – include BOTH naming styles just in case
    const payload = {
      customerName: name,
      phone,
      email,
      notes,
      guests: parseInt(guests, 10),
      tableNumber: parseInt(table, 10),
      reservationDate: date,
      startTime: time,
      name,
      date,
      time
    };

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      if (response.status === 201 || response.status === 200) {
        // Save for success page
        sessionStorage.setItem("resName", name);
        sessionStorage.setItem("resPhone", phone);
        sessionStorage.setItem("resEmail", email);
        sessionStorage.setItem("resDate", date);
        sessionStorage.setItem("resTime", time);
        sessionStorage.setItem("resTable", table);
        sessionStorage.setItem("resGuests", guests);
        sessionStorage.setItem("resNotes", notes);

        // clear reservation draft
        localStorage.removeItem(RES_DRAFT_KEY);

        window.location.href = "reservation-success.html";
      } else {
        showPopup("Reservation failed: " + text);
      }
    } catch (err) {
      console.error(err);
      showPopup("Unable to connect to server at the moment.");
    }
  });
}

/* ------------------ Dynamic Table Selection Based On Guests ------------------ */

/**
 * Guest -> allowed table ranges:
 *  - guests <= 2  -> tables 1..10
 *  - 3 <= guests <= 10 -> tables 10..15
 *  - guests > 10 -> tables 16..25
 */

function getAllowedTableRange(guests) {
  guests = Number(guests) || 0;
  if (guests <= 2) {
    return { from: 1, to: 10, label: "Small (1–2 guests) — tables 1 to 10" };
  } else if (guests <= 10) {
    return { from: 10, to: 15, label: "Family (3–10 guests) — tables 10 to 15" };
  } else {
    return { from: 16, to: 25, label: "Party (>10 guests) — tables 16 to 25" };
  }
}

const resGuestsEl = document.getElementById("resGuests");
const resTableEl = document.getElementById("resTable");
let resTableHint = document.getElementById("resTableHint");
let resGuestsHint = document.getElementById("resGuestsHint");

if (!resTableHint && resTableEl && resTableEl.parentNode) {
  resTableHint = document.createElement("div");
  resTableHint.id = "resTableHint";
  resTableHint.style.fontSize = "0.85rem";
  resTableHint.style.color = "var(--muted)";
  resTableHint.style.marginTop = "0.35rem";
  resTableEl.parentNode.insertBefore(resTableHint, resTableEl.nextSibling);
}
if (!resGuestsHint && resGuestsEl && resGuestsEl.parentNode) {
  resGuestsHint = document.createElement("div");
  resGuestsHint.id = "resGuestsHint";
  resGuestsHint.style.fontSize = "0.85rem";
  resGuestsHint.style.color = "var(--muted)";
  resGuestsHint.style.marginTop = "0.35rem";
  resGuestsEl.parentNode.insertBefore(resGuestsHint, resGuestsEl.nextSibling);
}

function populateTableOptions(from, to) {
  if (!resTableEl) return;
  const current = resTableEl.value;
  resTableEl.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a table";
  resTableEl.appendChild(placeholder);

  for (let i = from; i <= to; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Table ${i}`;
    resTableEl.appendChild(opt);
  }

  if (current && Number(current) >= from && Number(current) <= to) {
    resTableEl.value = current;
  } else {
    resTableEl.value = "";
  }
}

function updateTableOptionsFromGuests() {
  if (!resGuestsEl || !resTableEl) return;
  const guests = Number(resGuestsEl.value) || 0;
  const range = getAllowedTableRange(guests);

  populateTableOptions(range.from, range.to);

  if (resTableHint) {
    resTableHint.textContent = `Allowed tables based on guests: ${range.label}`;
  }
  if (resGuestsHint) {
    resGuestsHint.textContent = `Guests: ${guests} — ${range.label}`;
  }

  const selected = Number(resTableEl.value);
  if (selected && (selected < range.from || selected > range.to)) {
    resTableEl.value = "";
    resTableEl.classList.add("invalid-selection");
    setTimeout(() => resTableEl.classList.remove("invalid-selection"), 1000);
  }

  if (typeof saveReservationDraft === "function") {
    saveReservationDraft();
  }
}

// add a tiny CSS rule for invalid-selection (inject style tag if not present)
const dynStyleId = "res-table-dynamic-style";
if (!document.getElementById(dynStyleId)) {
  const style = document.createElement("style");
  style.id = dynStyleId;
  style.textContent = `
    #resTable.invalid-selection { box-shadow: 0 0 0 4px rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.8) !important; }
    #resTableHint, #resGuestsHint { transition: opacity 180ms ease; color: var(--muted); font-size: 0.85rem; margin-top: 0.35rem; }
  `;
  document.head.appendChild(style);
}

// Attach listeners if elements exist
if (resGuestsEl) {
  updateTableOptionsFromGuests(); // initial update (picks options based on draft or default)
  let guestTimer = null;
  resGuestsEl.addEventListener("input", () => {
    clearTimeout(guestTimer);
    guestTimer = setTimeout(updateTableOptionsFromGuests, 140);
  });
  resGuestsEl.addEventListener("change", updateTableOptionsFromGuests);
}

// ensure resTable also saves draft on change
if (resTableEl) {
  resTableEl.addEventListener("change", saveReservationDraft);
}





