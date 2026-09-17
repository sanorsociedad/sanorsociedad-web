// Lógica de login de clientes y descarga de la lista de precios.
(function () {
  const STORAGE_KEY = "sanor_client_session";

  function saveSession(token, nombre) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, nombre }));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function showLogin() {
    document.getElementById("login-view").style.display = "block";
    document.getElementById("client-view").style.display = "none";
  }

  async function showClientPanel(session) {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("client-view").style.display = "block";
    document.getElementById("client-name").textContent = session.nombre;

    const status = document.getElementById("pricelist-status");
    const link = document.getElementById("pricelist-link");
    link.style.display = "none";
    status.textContent = "Buscando la última lista de precios…";

    try {
      const data = await SanorAPI.getPriceList(session.token);
      if (!data.ok) {
        if (String(data.error || "").includes("vencida")) {
          clearSession();
          showLogin();
          return;
        }
        status.textContent = data.error || "No se pudo obtener la lista de precios.";
        return;
      }
      status.textContent = `Lista disponible: ${data.nombre}`;
      link.href = data.url;
      link.style.display = "inline-block";
    } catch (err) {
      status.textContent = "No se pudo obtener la lista de precios. Intentá de nuevo más tarde.";
      console.error(err);
    }
  }

  function setupLoginForm() {
    const form = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const usuario = document.getElementById("usuario").value.trim();
      const password = document.getElementById("password").value;

      if (!SANOR_CONFIG.APPS_SCRIPT_URL || SANOR_CONFIG.APPS_SCRIPT_URL.startsWith("PEGAR_AQUI")) {
        errorEl.textContent = "El acceso de clientes todavía no está configurado.";
        return;
      }

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Ingresando…";
      try {
        const data = await SanorAPI.login(usuario, password);
        if (!data.ok) {
          errorEl.textContent = data.error || "No se pudo iniciar sesión.";
          return;
        }
        saveSession(data.token, data.nombre);
        showClientPanel(getSession());
      } catch (err) {
        errorEl.textContent = "Error de conexión. Intentá de nuevo.";
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Ingresar";
      }
    });
  }

  function setupPasswordToggle() {
    const toggle = document.getElementById("toggle-password");
    const input = document.getElementById("password");
    if (!toggle || !input) return;

    const show = () => (input.type = "text");
    const hide = () => (input.type = "password");

    toggle.addEventListener("mousedown", show);
    toggle.addEventListener("touchstart", (e) => {
      e.preventDefault(); // evita que el toque dispare también un click/foco raro
      show();
    });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) =>
      toggle.addEventListener(evt, hide)
    );
  }

  function setupLogout() {
    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      showLogin();
    });
  }

  function init() {
    setupLoginForm();
    setupPasswordToggle();
    setupLogout();
    const session = getSession();
    if (session && session.token) {
      showClientPanel(session);
    } else {
      showLogin();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
