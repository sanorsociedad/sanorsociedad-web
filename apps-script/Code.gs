/**
 * Sanor — Backend en Google Apps Script.
 * Sirve el catálogo (Sheets + Drive) y gestiona el login/descarga de lista de precios.
 * Ver apps-script/README.md para instrucciones de despliegue.
 */

const CONFIG = {
  CATALOG_SHEET_ID: "1PCEDI7E_GTFxWLQsVwa8G6m4oGRUKTZRAekqSg1-GTo",
  LOGIN_SHEET_ID: "1S46uGvaOLZZAWIg1IE3KYdctB5a2yTStRctEgy8Jr3c",
  // Carpeta "Fotos Productos" (todas las fotos sueltas, sin subcarpetas por categoría).
  FOTOS_PRODUCTOS_FOLDER_ID: "1YHp2OAtz7ecb9KMIHkGoVEXEGPyQt_Qr",
  // Carpeta "Categorías" (una foto por categoría, nombrada igual que la categoría) para la home.
  CATEGORY_IMAGES_FOLDER_ID: "1o4Z3JQMpYqzxK01YXA6Q-0WRG0C76K6k",
  // Carpeta de Drive donde se sube la última lista de precios (reemplazar el archivo, no la carpeta).
  PRICELIST_FOLDER_ID: "1bL0JCeUVHgXbQF_wJmxI2ZbSULAIkUw-",
  // Secreto usado para firmar los tokens de sesión de clientes. Cambiarlo por un valor propio.
  TOKEN_SECRET: "sanor-cambiar-este-secreto",
  TOKEN_TTL_MS: 1000 * 60 * 60 * 12, // 12 horas
  // Cuánto tiempo se guarda en caché el catálogo armado (evita releer Sheets/Drive en cada visita).
  CATALOG_CACHE_TTL_SECONDS: 1800, // 30 minutos
};

const CATALOG_CACHE_KEY = "sanor_catalog_v1_";

function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase();
  try {
    switch (action) {
      case "catalog":
        return jsonOutput(getCatalogCached());
      case "refreshcatalog":
        clearCatalogCache();
        return jsonOutput(getCatalogCached());
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

function getCatalogCached() {
  const cache = CacheService.getScriptCache();
  const cached = readCatalogCache(cache);
  if (cached) return cached;

  const data = buildCatalog();
  writeCatalogCache(cache, data);
  return data;
}

function clearCatalogCache() {
  const cache = CacheService.getScriptCache();
  const countStr = cache.get(CATALOG_CACHE_KEY + "count");
  if (!countStr) return;
  const count = Number(countStr);
  const keys = [CATALOG_CACHE_KEY + "count"];
  for (let i = 0; i < count; i++) keys.push(CATALOG_CACHE_KEY + i);
  cache.removeAll(keys);
}

function readCatalogCache(cache) {
  const countStr = cache.get(CATALOG_CACHE_KEY + "count");
  if (!countStr) return null;
  const count = Number(countStr);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const part = cache.get(CATALOG_CACHE_KEY + i);
    if (part == null) return null; // algún fragmento venció, reconstruimos todo
    parts.push(part);
  }
  try {
    return JSON.parse(parts.join(""));
  } catch (err) {
    return null;
  }
}

function writeCatalogCache(cache, data) {
  const json = JSON.stringify(data);
  const CHUNK_SIZE = 90000; // margen bajo el límite de 100KB por clave de CacheService
  const chunks = [];
  for (let i = 0; i < json.length; i += CHUNK_SIZE) {
    chunks.push(json.slice(i, i + CHUNK_SIZE));
  }
  const entries = { [CATALOG_CACHE_KEY + "count"]: String(chunks.length) };
  chunks.forEach((chunk, i) => {
    entries[CATALOG_CACHE_KEY + i] = chunk;
  });
  cache.putAll(entries, CONFIG.CATALOG_CACHE_TTL_SECONDS);
}

function buildCatalog() {
  const ss = SpreadsheetApp.openById(CONFIG.CATALOG_SHEET_ID);
  const sheet = ss.getSheetByName("Productos");
  const products = [];
  const categoriesSeen = {};
  const categories = [];
  const imageCache = { byCode: null }; // CODIGO -> [file, ...], una sola carpeta plana
  // Fotos ya confirmadas como públicas en corridas anteriores: evita volver a
  // consultarle el permiso a Drive por cada foto en cada reconstrucción del caché.
  const verifiedProps = PropertiesService.getScriptProperties();
  const verified = verifiedProps.getProperties();
  const newlyVerified = {};

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const [codigoCell, nombre, descripcion, medidas, categoriaCell, activo] = values[i];
    if (!codigoCell) continue;
    const isActive = String(activo || "").trim().toUpperCase() === "SI";
    if (!isActive) continue;

    const categoria = String(categoriaCell || "").trim();
    if (!categoria) continue;
    if (!categoriesSeen[categoria]) {
      categoriesSeen[categoria] = true;
      categories.push(categoria);
    }

    // La celda Código puede tener uno o varios códigos (separados por salto de
    // línea, coma o espacio) cuando una misma publicación agrupa varias
    // medidas/variantes.
    const codigoRaw = String(codigoCell).trim();
    const codigos = codigoRaw
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const images = [];
    codigos.forEach((c) => {
      getProductImages(c, imageCache, verified, newlyVerified).forEach((url) => {
        if (images.indexOf(url) === -1) images.push(url);
      });
    });

    products.push({
      codigo: codigoRaw,
      codigos: codigos,
      nombre: String(nombre || "").trim(),
      descripcion: String(descripcion || "").trim(),
      medidas: String(medidas || "").trim(),
      categoria: categoria,
      images: images,
    });
  }

  categories.sort((a, b) => a.localeCompare(b, "es"));

  const categoryImages = getCategoryImages(categories, verified, newlyVerified);

  if (Object.keys(newlyVerified).length) {
    verifiedProps.setProperties(newlyVerified, false);
  }

  return {
    ok: true,
    categories: categories,
    products: products,
    categoryImages: categoryImages,
  };
}

// Normaliza texto para comparar nombres sin que importen mayúsculas, tildes
// (con distinta codificación Unicode) ni espacios extra.
function normalizeKey(s) {
  return String(s)
    .normalize("NFC")
    .trim()
    .toLowerCase();
}

// Una foto por categoría (carpeta "Categorías"), nombrada igual que la
// categoría, usada como imagen destacada en la home.
function getCategoryImages(categories, verified, newlyVerified) {
  const result = {};
  let folder;
  try {
    folder = DriveApp.getFolderById(CONFIG.CATEGORY_IMAGES_FOLDER_ID);
  } catch (err) {
    return result; // carpeta no configurada todavía: la home usa su respaldo
  }

  const byName = {};
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const nameNoExt = file.getName().replace(/\.[^.]+$/, "");
    byName[normalizeKey(nameNoExt)] = file;
  }

  categories.forEach((cat) => {
    const file = byName[normalizeKey(cat)];
    if (!file) return;
    const id = file.getId();
    if (!verified[id]) {
      ensurePublicView(file);
      newlyVerified[id] = "1";
      verified[id] = "1";
    }
    result[cat] = "https://drive.google.com/thumbnail?id=" + id + "&sz=w800";
  });

  return result;
}

function getProductImages(codigo, cache, verified, newlyVerified) {
  if (!cache.byCode) {
    cache.byCode = {};
    const folder = DriveApp.getFolderById(CONFIG.FOTOS_PRODUCTOS_FOLDER_ID);
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      const match = fileName.match(/^([^_.\s]+)/); // primer bloque antes de "_", espacio o "."
      const fileCode = match ? match[1] : fileName;
      if (!cache.byCode[fileCode]) cache.byCode[fileCode] = [];
      cache.byCode[fileCode].push(file);
    }
  }

  const matches = cache.byCode[codigo] || [];
  return matches.map((file) => {
    const id = file.getId();
    if (!verified[id]) {
      ensurePublicView(file);
      newlyVerified[id] = "1";
      verified[id] = "1";
    }
    return "https://drive.google.com/thumbnail?id=" + id + "&sz=w1000";
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
