const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const calendarButton = document.querySelector("[data-calendar]");

const SHEETS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwVV0tNZHPUCipahgdb22nOnhte9-znpYphU8EaPM1yEUkvKyOfxb4Go-bc_ekgHOlr/exec";

const VISITOR_KEY = "continuumFlowVisitorId";

const getVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_KEY);

  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  return visitorId;
};

const basePayload = () => ({
  tipo: "form_submit",
  page_url: window.location.href,
  referer: document.referrer || "",
  visitor_id: getVisitorId(),
  user_agent: navigator.userAgent,
  language: navigator.language || "",
  screen: `${window.innerWidth}x${window.innerHeight}`,
});

const sendToSheet = async (payload) => {
  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn("Sheet error:", err);
  }
};

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

const sections = ["services", "process", "about", "results", "clients"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const navLinks = [...document.querySelectorAll(".main-nav a")];

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: [0.1, 0.3, 0.6],
    }
  );

  sections.forEach((section) => observer.observe(section));
}

if (form && formStatus) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      ...basePayload(),
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      company: String(data.get("company") || "").trim(),
      message: String(data.get("message") || "").trim(),
      button_text: "",
      button_href: "",
    };

    formStatus.textContent = "A enviar...";

    await sendToSheet(payload);

    formStatus.textContent = "Obrigado! O teu pedido foi registado.";
    form.reset();
  });
}

if (calendarButton && formStatus) {
  calendarButton.addEventListener("click", () => {
    formStatus.textContent = "Calendário clicado.";
  });
}

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
