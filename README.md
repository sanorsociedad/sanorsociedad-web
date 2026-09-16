# Sanor — Sanitarios Norte

Sitio web de Sanor: catálogo público de productos sanitarios + acceso privado de clientes para descargar la lista de precios.

## Estructura

```
index.html          Home (categorías destacadas + contacto)
catalogo.html        Catálogo completo con filtro por categoría
producto.html         Ficha de un producto (código, descripción, medidas, fotos)
clientes.html          Login de clientes + descarga de lista de precios
assets/css/style.css    Estilos
assets/js/config.js      Configuración (URL del Apps Script, WhatsApp, categorías)
assets/js/*.js           Lógica de cada página
apps-script/Code.gs      Backend (Google Apps Script)
```

No hay build step: es HTML/CSS/JS plano. Se puede abrir `index.html` directo o servir la carpeta con cualquier hosting estático.

## 1. Cargar los datos en Google Sheets / Drive

Ya están creadas en tu Drive (carpeta **Pagina Web**) las carpetas:
- `Fotos Productos/<categoría>` — subí ahí las fotos de cada producto. El nombre del archivo debe **empezar con el código del producto** (ej: `1024_frente.jpg`).
- `Lista de Precios` — subí ahí el Excel/PDF con la lista de precios. Cada vez que la actualices, subí el archivo nuevo a esa carpeta (podés borrar el viejo o dejarlo, el sitio siempre toma el más reciente).

Faltan crear los dos Google Sheets (te los mandé como archivos `.xlsx` para que subas a Drive y abras con "Abrir con → Google Sheets"):
- **Catalogo Sanor**: una pestaña por categoría, con columnas Código / Nombre / Descripción / Medidas / Activo.
- **Accesos Clientes Sanor**: pestaña "Clientes" con columnas Usuario / Contraseña / Nombre-Empresa / Activo.

Una vez creados, copiá el **ID de cada Sheet** (está en la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`).

## 2. Desplegar el backend (Google Apps Script)

1. Andá a [script.google.com](https://script.google.com) con la cuenta `sanor.sociedad@gmail.com` → **Nuevo proyecto**.
2. Borrá el contenido default y pegá el contenido de `apps-script/Code.gs`.
3. Completá en el objeto `CONFIG`:
   - `CATALOG_SHEET_ID`: el ID del Sheets "Catalogo Sanor".
   - `LOGIN_SHEET_ID`: el ID del Sheets "Accesos Clientes Sanor".
   - `TOKEN_SECRET`: cambialo por cualquier texto random propio (es la clave que firma las sesiones de clientes).
4. Guardá el proyecto (nombralo "Sanor Backend").
5. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo** (tu cuenta).
   - Quién tiene acceso: **Cualquier usuario**.
6. Autorizá los permisos que pida (acceso a Sheets y Drive de esa cuenta).
7. Copiá la **URL de la aplicación web** que te da (termina en `/exec`).

Cada vez que edites `Code.gs` tenés que hacer **Implementar → Administrar implementaciones → Editar (lápiz) → Nueva versión → Implementar** para que los cambios se apliquen.

## 3. Conectar el frontend al backend

En `assets/js/config.js`, reemplazá:

```js
APPS_SCRIPT_URL: "PEGAR_AQUI_LA_URL_DEL_APPS_SCRIPT",
```

por la URL `/exec` que copiaste. Guardá y volvé a publicar el sitio (ver paso 5).

## 4. Cómo funciona el acceso de clientes

- Vos gestionás usuarios y contraseñas **a mano** en el Sheets "Accesos Clientes Sanor" (pestaña Clientes). No hay panel de administración: es una planilla.
- Cuando un cliente inicia sesión, el Apps Script valida usuario/contraseña contra esa planilla y devuelve un token temporal (dura 12hs).
- Con ese token, el cliente puede pedir el link de descarga de la última lista de precios.
- **Importante (seguridad):** el link de descarga que se genera es de tipo "cualquiera con el enlace puede ver". Esto significa que si un cliente comparte ese link puntual, otra persona podría abrirlo sin loguearse. Es un esquema simple pensado para una lista de precios mayorista de bajo riesgo, no para datos sensibles.

## 5. Publicar el sitio (hosting)

Cualquier hosting estático sirve. La opción más simple y gratuita:

**GitHub Pages** (recomendado para arrancar):
1. En GitHub → Settings → Pages → Source: rama `main` (o la que uses), carpeta `/ (root)`.
2. El sitio queda en `https://<usuario>.github.io/<repo>/`.
3. Cuando quieras usar el dominio propio, agregá un archivo `CNAME` con `sanitariosnorte.com.ar` y configurá el DNS del dominio (registro `A`/`CNAME`) apuntando a GitHub Pages.

## 6. Apuntar el dominio sanitariosnorte.com.ar

Una vez elegido el hosting definitivo, hay que cambiar los registros DNS del dominio (desde donde lo tengas registrado) para que apunten al hosting nuevo. Avisame cuando estemos en ese paso y lo hacemos juntos.

## Categorías

Abrazaderas, Accesorios Agua, Accesorios Baño, Accesorios Geriátricos, Accesorios Gas, Broncería cromada, Cabezales, Volantes y Campanas, Flexibles, Flotantes y Boyas, Grampas, Grifería, Mensulas, Nichos con Puerta, Puertas Agua, Puertas gas, Rejas piso, Rejas Ventilación, Soportes, Tapa Camaras, Tornillos y Bulones, Torniquetes.

Si agregás una categoría nueva, sumala también en `assets/js/config.js` (`CATEGORIES`) y como pestaña nueva en el Sheets del catálogo.
