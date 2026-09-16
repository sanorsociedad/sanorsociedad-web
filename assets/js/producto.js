// Lógica de la ficha de producto individual.
(function () {
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function render(p) {
    document.getElementById("page-title").textContent = `${p.nombre} — Sanor`;
    const images = p.images && p.images.length ? p.images : [];
    const mainImage = images[0];
    const nombreSafe = escapeHtml(p.nombre);

    const gallery = mainImage
      ? `
        <div>
          <div class="product-gallery-main">
            <img id="main-image" src="${mainImage}" alt="${nombreSafe}">
          </div>
          ${
            images.length > 1
              ? `<div class="product-gallery-thumbs">${images
                  .map(
                    (src, i) =>
                      `<img src="${src}" alt="${nombreSafe} foto ${i + 1}" class="${
                        i === 0 ? "active" : ""
                      }" data-src="${src}">`
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
      `
      : `<div class="product-gallery-main"><span style="font-size:3rem;">🔧</span></div>`;

    document.getElementById("product-content").outerHTML = `
      <div id="product-content" class="product-detail">
        ${gallery}
        <div>
          <div class="product-detail-code">Código ${escapeHtml(p.codigo)}</div>
          <h1>${nombreSafe}</h1>
          <div class="detail-row">
            <div class="label">Categoría</div>
            <div><a href="catalogo.html?categoria=${encodeURIComponent(p.categoria)}">${escapeHtml(
      p.categoria
    )}</a></div>
          </div>
          ${
            p.descripcion
              ? `<div class="detail-row"><div class="label">Descripción</div><div class="multiline">${escapeHtml(
                  p.descripcion
                )}</div></div>`
              : ""
          }
          ${
            p.medidas
              ? `<div class="detail-row"><div class="label">Medidas</div><div class="multiline">${escapeHtml(
                  p.medidas
                )}</div></div>`
              : ""
          }
        </div>
      </div>
    `;

    document.querySelectorAll(".product-gallery-thumbs img").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        document.getElementById("main-image").src = thumb.dataset.src;
        document
          .querySelectorAll(".product-gallery-thumbs img")
          .forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
  }

  async function init() {
    const categoria = getParam("categoria");
    const codigo = getParam("codigo");
    const content = document.getElementById("product-content");

    if (!SANOR_CONFIG.APPS_SCRIPT_URL || SANOR_CONFIG.APPS_SCRIPT_URL.startsWith("PEGAR_AQUI")) {
      content.textContent = "El catálogo todavía no está conectado a los datos.";
      return;
    }
    if (!codigo) {
      content.textContent = "Producto no especificado.";
      return;
    }

    try {
      const data = await SanorAPI.getCatalog();
      const product = data.products.find(
        (p) => p.codigo === codigo && (!categoria || p.categoria === categoria)
      );
      if (!product) {
        content.textContent = "No encontramos ese producto.";
        return;
      }
      render(product);
    } catch (err) {
      content.textContent = "No se pudo cargar el producto. Intentá de nuevo más tarde.";
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
