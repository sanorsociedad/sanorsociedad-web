// Lógica de la página de catálogo: filtro por categoría + grilla de productos.
(function () {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderCategoryList(categorias, activa) {
    const el = document.getElementById("category-list");
    const items = [`<li><a href="catalogo.html"${!activa ? ' class="active"' : ""}>Todas</a></li>`];
    categorias.forEach((cat) => {
      const isActive = cat === activa;
      items.push(
        `<li><a href="catalogo.html?categoria=${encodeURIComponent(cat)}"${
          isActive ? ' class="active"' : ""
        }>${cat}</a></li>`
      );
    });
    el.innerHTML = items.join("");
  }

  function productCard(p) {
    const img = p.images && p.images.length
      ? `<img src="${p.images[0]}" alt="${p.nombre}" loading="lazy">`
      : `<div style="font-size:2rem;">🔧</div>`;
    return `
      <a class="product-card" href="producto.html?categoria=${encodeURIComponent(
        p.categoria
      )}&codigo=${encodeURIComponent(p.codigo)}">
        <div class="product-image">${img}</div>
        <div class="product-info">
          <div class="product-code">Cód. ${p.codigo}</div>
          <div class="product-name">${p.nombre}</div>
          <div class="product-category">${p.categoria}</div>
        </div>
      </a>
    `;
  }

  function renderProducts(products) {
    const grid = document.getElementById("product-grid");
    const empty = document.getElementById("empty-state");
    if (!products.length) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    grid.innerHTML = products.map(productCard).join("");
  }

  async function init() {
    const categoriaActiva = getParam("categoria");
    const loading = document.getElementById("loading");

    if (!SANOR_CONFIG.APPS_SCRIPT_URL || SANOR_CONFIG.APPS_SCRIPT_URL.startsWith("PEGAR_AQUI")) {
      renderCategoryList(SANOR_CONFIG.CATEGORIES, categoriaActiva);
      loading.textContent =
        "El catálogo todavía no está conectado a los datos (falta configurar el Apps Script). Avisá al administrador del sitio.";
      return;
    }

    try {
      const data = await SanorAPI.getCatalog();
      renderCategoryList(data.categories, categoriaActiva);
      const filtered = categoriaActiva
        ? data.products.filter((p) => p.categoria === categoriaActiva)
        : data.products;
      loading.style.display = "none";
      renderProducts(filtered);
    } catch (err) {
      loading.textContent = "No se pudo cargar el catálogo. Intentá de nuevo más tarde.";
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
