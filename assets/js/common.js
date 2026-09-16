// Header, footer y botón de WhatsApp compartidos por todas las páginas.
(function () {
  const NAV_LINKS = [
    { href: "index.html", label: "Inicio" },
    { href: "catalogo.html", label: "Catálogo" },
    { href: "index.html#contacto", label: "Contacto" },
  ];

  function currentPage() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    return path;
  }

  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const page = currentPage();
    const links = NAV_LINKS.map((l) => {
      const isActive = l.href.startsWith(page) && !l.href.includes("#");
      return `<a href="${l.href}"${isActive ? ' class="active"' : ""}>${l.label}</a>`;
    }).join("");

    el.innerHTML = `
      <div class="container">
        <a href="index.html" class="brand">
          <img src="assets/img/logo.png" alt="Sanor - Sanitarios Norte">
        </a>
        <nav class="main-nav" id="main-nav">
          ${links}
          <a href="clientes.html" class="btn-clientes">Acceso Clientes</a>
        </nav>
        <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menú">☰</button>
      </div>
    `;

    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("main-nav");
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    const cfg = window.SANOR_CONFIG || {};
    el.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-brand">
          <img src="assets/img/logo.png" alt="Sanor">
          <p>Distribuidora y fabricante de productos sanitarios. Venta exclusiva a mayoristas y distribuidores.</p>
        </div>
        <div class="footer-col">
          <h4>Navegación</h4>
          <a href="index.html">Inicio</a>
          <a href="catalogo.html">Catálogo</a>
          <a href="clientes.html">Acceso Clientes</a>
        </div>
        <div class="footer-col">
          <h4>Contacto</h4>
          <a href="mailto:${cfg.CONTACT_EMAIL || ""}">${cfg.CONTACT_EMAIL || ""}</a>
          <a href="https://wa.me/${cfg.WHATSAPP_NUMBER || ""}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} Sanor — Sanitarios Norte. Todos los derechos reservados.</div>
    `;
  }

  function renderWhatsappButton() {
    if (document.querySelector(".whatsapp-float")) return;
    const cfg = window.SANOR_CONFIG || {};
    const number = cfg.WHATSAPP_NUMBER || "";
    const message = encodeURIComponent(cfg.WHATSAPP_MESSAGE || "Hola!");
    const a = document.createElement("a");
    a.href = `https://wa.me/${number}?text=${message}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "whatsapp-float";
    a.setAttribute("aria-label", "Chatear por WhatsApp");
    a.innerHTML = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.36.67 4.56 1.83 6.44L4 29l7.72-1.8a11.96 11.96 0 0 0 4.3.8h.01c6.62 0 12.02-5.4 12.02-12.02C28.04 8.4 22.64 3 16.02 3zm0 21.86c-1.38 0-2.73-.36-3.9-1.04l-.28-.16-4.6 1.08 1.1-4.48-.18-.29a9.83 9.83 0 0 1-1.52-5.25c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.13 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/></svg>`;
    document.body.appendChild(a);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    renderWhatsappButton();
  });
})();
