// Lógica de la página de inicio: categorías destacadas y contacto.
(function () {
  function categoryCard(nombre, imageUrl) {
    const bg = imageUrl
      ? `<img src="${imageUrl}" alt="${nombre}" loading="lazy">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-light),var(--color-bg-alt));font-size:2.4rem;">🔧</div>`;
    return `
      <a class="category-card" href="catalogo.html?categoria=${encodeURIComponent(nombre)}">
        ${bg}
        <span class="category-label">${nombre}</span>
      </a>
    `;
  }

  function renderFeatured(imagesByCategory) {
    const el = document.getElementById("featured-categories");
    if (!el) return;
    const featured = SANOR_CONFIG.FEATURED_CATEGORIES || SANOR_CONFIG.CATEGORIES.slice(0, 6);
    el.innerHTML = featured
      .map((cat) => categoryCard(cat, imagesByCategory[cat]))
      .join("");
  }

  function setupContactLinks() {
    const wa = document.getElementById("contact-whatsapp");
    const email = document.getElementById("contact-email");
    if (wa) {
      wa.href = `https://wa.me/${SANOR_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(
        SANOR_CONFIG.WHATSAPP_MESSAGE
      )}`;
    }
    if (email) {
      email.href = `mailto:${SANOR_CONFIG.CONTACT_EMAIL}`;
      email.textContent = SANOR_CONFIG.CONTACT_EMAIL;
    }
  }

  async function loadFeaturedImages() {
    const imagesByCategory = {};
    if (!SANOR_CONFIG.APPS_SCRIPT_URL || SANOR_CONFIG.APPS_SCRIPT_URL.startsWith("PEGAR_AQUI")) {
      renderFeatured(imagesByCategory);
      return;
    }
    try {
      const data = await SanorAPI.getCatalog();
      // Respaldo: si una categoría todavía no tiene foto propia en Drive/Categorías,
      // usamos la primera foto de producto que encontremos en esa categoría.
      data.products.forEach((p) => {
        if (p.images && p.images.length && !imagesByCategory[p.categoria]) {
          imagesByCategory[p.categoria] = p.images[0];
        }
      });
      // Las fotos dedicadas de categoría (carpeta "Categorías") tienen prioridad.
      Object.assign(imagesByCategory, data.categoryImages || {});
    } catch (err) {
      console.warn("No se pudo cargar el catálogo para la home:", err);
    }
    renderFeatured(imagesByCategory);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupContactLinks();
    loadFeaturedImages();
  });
})();
