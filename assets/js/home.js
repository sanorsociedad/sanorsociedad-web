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

  function renderFeatured(featured, imagesByCategory) {
    const el = document.getElementById("featured-categories");
    if (!el) return;
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
    if (!SANOR_CONFIG.APPS_SCRIPT_URL || SANOR_CONFIG.APPS_SCRIPT_URL.startsWith("PEGAR_AQUI")) {
      renderFeatured(SANOR_CONFIG.CATEGORIES.slice(0, 6), {});
      return;
    }
    try {
      const data = await SanorAPI.getCatalog();
      const categoryImages = data.categoryImages || {};
      // Las categorías destacadas de la home son las que tienen foto propia
      // en la carpeta de Drive "Categorías" — para cambiarlas alcanza con
      // subir/sacar fotos ahí, sin tocar código. Máximo 6.
      const featured = Object.keys(categoryImages).slice(0, 6);

      if (featured.length) {
        renderFeatured(featured, categoryImages);
        return;
      }

      // Respaldo (todavía no subieron ninguna foto a "Categorías"): usamos
      // las categorías configuradas y, si hay, la primera foto de producto
      // de cada una.
      const imagesByCategory = {};
      data.products.forEach((p) => {
        if (p.images && p.images.length && !imagesByCategory[p.categoria]) {
          imagesByCategory[p.categoria] = p.images[0];
        }
      });
      renderFeatured(SANOR_CONFIG.FEATURED_CATEGORIES || SANOR_CONFIG.CATEGORIES.slice(0, 6), imagesByCategory);
    } catch (err) {
      console.warn("No se pudo cargar el catálogo para la home:", err);
      renderFeatured(SANOR_CONFIG.CATEGORIES.slice(0, 6), {});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupContactLinks();
    loadFeaturedImages();
  });
})();
