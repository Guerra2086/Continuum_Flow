const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const calendarButton = document.querySelector("[data-calendar]");

const SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwVV0tNZHPUCipahgdb22nOnhte9-znpYphU8EaPM1yEUkvKyOfxb4Go-bc_ekgHOlr/exec";

const VISITOR_KEY = "continuumFlowVisitorId";
const LEAD_KEY = "continuumFlowLead";

/* -----------------------------
   VISITOR ID
------------------------------ */
const getVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_KEY);

  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  return visitorId;
};

/* -----------------------------
   LEAD STORAGE
------------------------------ */
const getStoredLead = () => {
  try {
    return JSON.parse(localStorage.getItem(LEAD_KEY) || "{}");
  } catch {
    return {};
  }
};

const getFormLead = () => {
  if (!form) return {};

  const data = new FormData(form);

  return {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    company: String(data.get("company") || "").trim(),
  };
};

const getKnownLead = () => {
  const current = getFormLead();
  const stored = getStoredLead();

  return {
    name: current.name || stored.name || "",
    email: current.email || stored.email || "",
    company: current.company || stored.company || "",
  };
};

/* -----------------------------
   BASE PAYLOAD
------------------------------ */
const basePayload = (tipo) => ({
  data: new Date().toISOString(),
  tipo,
  page_url: window.location.href,
  referer: document.referrer || "",
  visitor_id: getVisitorId(),
  user_agent: navigator.userAgent,
  language: navigator.language || "",
  screen: `${window.innerWidth}x${window.innerHeight}`,
});

/* -----------------------------
   SEND TO SHEET (FIXED)
------------------------------ */
const sendToSheet = async (payload) => {
  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("Sheet error:", err);
  }
};

/* -----------------------------
   MENU TOGGLE
------------------------------ */
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    document.body.classList.toggle("menu-open", nav.classList.contains("open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("open");
      document.body.classList.remove("menu-open");
    }
  });
}

/* -----------------------------
   SMOOTH SCROLL
------------------------------ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = targetId ? document.querySelector(targetId) : null;

    if (!target) return;

    event.preventDefault();
    const offset = header ? header.offsetHeight + 12 : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
  });
});

/* -----------------------------
   BUTTON TRACKING
------------------------------ */
document.addEventListener("click", (event) => {
  const clicked = event.target.closest("a.btn, button.btn");
  if (!clicked) return;

  const lead = getKnownLead();
  const label = clicked.textContent.replace(/\s+/g, " ").trim();

  sendToSheet({
    ...basePayload("button_click"),
    ...lead,
    button_text: label,
    button_href: clicked.href || ""
  });
});

/* -----------------------------
   FORM SUBMIT
------------------------------ */
if (form && formStatus) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);

    const lead = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      company: String(data.get("company") || "").trim(),
    };

    const message = String(data.get("message") || "").trim();

    localStorage.setItem(LEAD_KEY, JSON.stringify(lead));

    formStatus.textContent = "A enviar...";

    await sendToSheet({
      ...basePayload("form_submit"),
      ...lead,
      message,
      button_text: "form_submit",
      button_href: "#contact"
    });

    formStatus.textContent =
      "Obrigado! O teu pedido foi registado.";

    form.reset();
  });
}

/* -----------------------------
   CALENDAR BUTTON
------------------------------ */
if (calendarButton && formStatus) {
  calendarButton.addEventListener("click", () => {
    sendToSheet({
      ...basePayload("calendar_click"),
      button_text: "calendar",
      button_href: "calendar"
    });

    formStatus.textContent =
      "Calendário clicado.";
  });
}

/* ==============================
   MODAIS DOS SERVIÇOS
============================== */

const modalOverlay = document.querySelector("[data-modal-overlay]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const serviceCards = document.querySelectorAll("[data-modal-open]");
const modals = document.querySelectorAll(".modal");

function closeAllModals() {
  modals.forEach((modal) => modal.classList.remove("open"));

  if (modalOverlay) {
    modalOverlay.classList.remove("open");
  }

  document.body.style.overflow = "";
}

function openModal(modalName) {
  const modal = document.querySelector(`[data-modal="${modalName}"]`);

  if (!modal) return;

  if (modalOverlay) {
    modalOverlay.classList.add("open");
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  // tracking opcional
  if (typeof sendToSheet === "function") {
    sendToSheet({
      ...basePayload("modal_open"),
      botao: modalName,
      destino: "service_modal",
    });
  }
}

serviceCards.forEach((card) => {
  card.style.cursor = "pointer";

  card.addEventListener("click", () => {
    const modalName = card.dataset.modalOpen;
    openModal(modalName);
  });
});

modalCloseButtons.forEach((btn) => {
  btn.addEventListener("click", closeAllModals);
});

if (modalOverlay) {
  modalOverlay.addEventListener("click", closeAllModals);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
  }
});