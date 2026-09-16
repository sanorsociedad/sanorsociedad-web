/**
 * Sanor — Backend en Google Apps Script.
 * Sirve el catálogo (Sheets + Drive) y gestiona el login/descarga de lista de precios.
 * Ver apps-script/README.md para instrucciones de despliegue.
 */

const CONFIG = {
  // TODO: completar con el ID del Google Sheets "Catalogo Sanor" (una vez creado desde la plantilla).
  CATALOG_SHEET_ID: "PEGAR_AQUI_EL_ID_DEL_SHEETS_CATALOGO",
  // TODO: completar con el ID del Google Sheets "Accesos Clientes Sanor".
  LOGIN_SHEET_ID: "PEGAR_AQUI_EL_ID_DEL_SHEETS_CLIENTES",
  // Carpeta de Drive donde se sube la última lista de precios (reemplazar el archivo, no la carpeta).
  PRICELIST_FOLDER_ID: "1bL0JCeUVHgXbQF_wJmxI2ZbSULAIkUw-",
  // Secreto usado para firmar los tokens de sesión de clientes. Cambiarlo por un valor propio.
  TOKEN_SECRET: "sanor-cambiar-este-secreto",
  TOKEN_TTL_MS: 1000 * 60 * 60 * 12, // 12 horas

  // Carpetas de Drive con las fotos de cada categoría (Fotos Productos/<categoria>).
  CATEGORY_FOLDERS: {
    "Abrazaderas": "1wX2dXWK-osuuuJITQ4CjJiVrPWJqgMWB",
    "Accesorios Agua": "1dYSL4Xs5VYXyocYi8j0dt0rpYIMMs-Jb",
    "Accesorios Baño": "10Xyo9NiZycW4WRFy3o4T2TCEpXwW4fY_",
    "Accesorios Geriatricos": "1ZHHgy25AoqZruEG3fEmv-koASFRX1o2o",
    "Accesorios Gas": "1InshVnKqe_Om6ZfcCuhIZyj67X_1Lj7c",
    "Broncería cromada": "1Ske_IHVxsTpkKo0CX4TweTYsDDMQN_np",
    "Cabezales": "1sEquNLw0sMF6aiZyo8UA5FUFWMGOxd_k",
    "Volantes y Campanas": "1VFTMYhUWIJndDveGT6-jGFrK-bb8RKfD",
    "Flexibles": "1s2XpbQkTZ2cwkbQKGAop-y7CmiXu9kVa",
    "Flotantes y Boyas": "19J5uBHqmheIMTp64kPjCx-68FqOY51OB",
    "Grampas": "12MGlgkLliLFSy8egVaNzl4CpiKesr57f",
    "Grifería": "1QgELqksntStOmwJ9nJ7cLRd34Yvq9P8n",
    "Mensulas": "11EqnfxhoJyCjmB6Bzf1Aj7ErWoQboOSG",
    "Nichos con Puerta": "1SGneOjg3QNvAjcETL46PKxvzU2hA5cMm",
    "Puertas Agua": "1jp8YojNQFuXYNOTcnwbj40mVSunMZXP2",
    "Puertas gas": "1HHgdXkaIBxTmCXoQvHHXies4XAxS8nt2",
    "Rejas piso": "1dYiaUO9iF14y-upP-zYm8z24GJiXFatS",
    "Rejas Ventilación": "1tUBf7K9sO4Sv-5uNgd8cN7NuocVk961O",
    "Soportes": "1GQXFUUTB7S1RENO5_SXNEHQQmxsnCpj0",
    "Tapa Camaras": "1g0Ye8Uej9ajBNk3dBmQoGaX1LC6Lmsq0",
    "Tornillos y Bulones": "1KVa194b7OGV_FtG84mbc7Hj9UMOSBgDd",
    "Torniquetes": "1mhyOYqG1T-5eJWAz4d01_9YX2x37M-ae",
  },
};

function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase();
  try {
    switch (action) {
      case "catalog":
        return jsonOutput(buildCatalog());
      case "login":
        return jsonOutput(handleLogin(e.parameter.usuario, e.parameter.password));
      case "pricelist":
        return jsonOutput(handlePriceList(e.parameter.token));
      default:
        return jsonOutput({ ok: false, error: "Acción desconocida." });
    }
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ============ Catálogo ============ */

function buildCatalog() {
  const ss = SpreadsheetApp.openById(CONFIG.CATALOG_SHEET_ID);
  const sheets = ss.getSheets();
  const categories = [];
  const products = [];
  const imageCache = {}; // categoria -> { CODIGO: [urls] }

  sheets.forEach((sheet) => {
    const name = sheet.getName();
    if (name === "Instrucciones") return;
    categories.push(name);

    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const [codigo, nombre, descripcion, medidas, activo] = values[i];
      if (!codigo) continue;
      const isActive = String(activo || "").trim().toUpperCase() === "SI";
      if (!isActive) continue;

      const images = getProductImages(name, String(codigo).trim(), imageCache);
      products.push({
        codigo: String(codigo).trim(),
        nombre: String(nombre || "").trim(),
        descripcion: String(descripcion || "").trim(),
        medidas: String(medidas || "").trim(),
        categoria: name,
        images: images,
      });
    }
  });

  return { ok: true, categories: categories, products: products };
}

function getProductImages(categoria, codigo, cache) {
  const folderId = CONFIG.CATEGORY_FOLDERS[categoria];
  if (!folderId) return [];

  if (!cache[categoria]) {
    cache[categoria] = {};
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      const match = fileName.match(/^([^_.\s]+)/); // primer bloque antes de "_", espacio o "."
      const fileCode = match ? match[1] : fileName;
      if (!cache[categoria][fileCode]) cache[categoria][fileCode] = [];
      cache[categoria][fileCode].push(file);
    }
  }

  const matches = cache[categoria][codigo] || [];
  return matches.map((file) => {
    ensurePublicView(file);
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  });
}

function ensurePublicView(file) {
  try {
    const access = file.getSharingAccess();
    if (access !== DriveApp.Access.ANYONE_WITH_LINK && access !== DriveApp.Access.ANYONE) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (err) {
    // Si falla el cambio de permisos, seguimos: la imagen puede no visualizarse pero no rompe el catálogo.
  }
}

/* ============ Login de clientes ============ */

function handleLogin(usuario, password) {
  if (!usuario || !password) {
    return { ok: false, error: "Usuario y contraseña son obligatorios." };
  }
  const ss = SpreadsheetApp.openById(CONFIG.LOGIN_SHEET_ID);
  const sheet = ss.getSheetByName("Clientes");
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const [rowUser, rowPass, nombre, activo] = values[i];
    if (String(rowUser).trim() === usuario.trim()) {
      const isActive = String(activo || "").trim().toUpperCase() === "SI";
      if (!isActive) return { ok: false, error: "Usuario inactivo. Contactate con Sanor." };
      if (String(rowPass).trim() !== password) {
        return { ok: false, error: "Usuario o contraseña incorrectos." };
      }
      const token = makeToken(usuario.trim());
      return { ok: true, token: token, nombre: String(nombre || usuario) };
    }
  }
  return { ok: false, error: "Usuario o contraseña incorrectos." };
}

function makeToken(usuario) {
  const expiry = Date.now() + CONFIG.TOKEN_TTL_MS;
  const payload = usuario + "|" + expiry;
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, CONFIG.TOKEN_SECRET)
  );
  return Utilities.base64EncodeWebSafe(payload + "|" + signature);
}

function verifyToken(token) {
  try {
    const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
    const parts = decoded.split("|");
    const usuario = parts[0];
    const expiry = Number(parts[1]);
    const signature = parts[2];
    const payload = usuario + "|" + expiry;
    const expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(payload, CONFIG.TOKEN_SECRET)
    );
    if (signature !== expected) return null;
    if (Date.now() > expiry) return null;
    return usuario;
  } catch (err) {
    return null;
  }
}

/* ============ Lista de precios ============ */

function handlePriceList(token) {
  const usuario = verifyToken(token);
  if (!usuario) {
    return { ok: false, error: "Sesión inválida o vencida. Volvé a iniciar sesión." };
  }
  const folder = DriveApp.getFolderById(CONFIG.PRICELIST_FOLDER_ID);
  const files = folder.getFiles();
  let latest = null;
  while (files.hasNext()) {
    const file = files.next();
    if (!latest || file.getLastUpdated() > latest.getLastUpdated()) {
      latest = file;
    }
  }
  if (!latest) {
    return { ok: false, error: "Todavía no hay una lista de precios cargada." };
  }
  ensurePublicView(latest);
  return {
    ok: true,
    nombre: latest.getName(),
    url: "https://drive.google.com/uc?export=download&id=" + latest.getId(),
    actualizado: latest.getLastUpdated(),
  };
}
