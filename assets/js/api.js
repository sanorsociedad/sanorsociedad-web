// Helpers para hablar con el backend de Google Apps Script.
const SanorAPI = (function () {
  function url(params) {
    const base = SANOR_CONFIG.APPS_SCRIPT_URL;
    const qs = new URLSearchParams(params).toString();
    return base + (base.includes("?") ? "&" : "?") + qs;
  }

  async function getCatalog() {
    const res = await fetch(url({ action: "catalog" }));
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "No se pudo cargar el catálogo.");
    return data;
  }

  async function login(usuario, password) {
    const res = await fetch(url({ action: "login", usuario, password }));
    return res.json();
  }

  async function getPriceList(token) {
    const res = await fetch(url({ action: "pricelist", token }));
    return res.json();
  }

  return { getCatalog, login, getPriceList };
})();
