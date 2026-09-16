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

Los dos Google Sheets ya están creados y sus IDs ya están cargados en `apps-script/Code.gs` (`Catalogo_Sanor` y `Accesos_Clientes_Sanor`, dentro de la carpeta **Pagina Web**).

### Agregar una categoría nueva (sin tocar código)

El sitio lee **todas las pestañas** del Sheets del catálogo automáticamente, y busca las fotos de cada categoría por **nombre de carpeta**, no por una lista fija. Para sumar una categoría nueva:

1. En el Sheets "Catalogo_Sanor", agregá una pestaña nueva con el nombre de la categoría (copiá el formato de columnas de cualquier otra pestaña: Código / Nombre / Descripción / Medidas / Activo).
2. Dentro de la carpeta de Drive `Fotos Productos`, creá una subcarpeta con el **mismo nombre exacto** de la pestaña, y subí ahí las fotos.

Con eso alcanza — la próxima vez que alguien entre al catálogo, la categoría nueva va a aparecer sola, sin avisarle a nadie ni tocar el código. (Si el nombre de la carpeta no coincide exactamente con el de la pestaña, los productos van a aparecer pero sin fotos.)

### Por qué el catálogo puede tardar un poco en cargar (y cómo forzar que se actualice ya)

El catálogo se guarda en caché por **30 minutos**, y además el script recuerda qué fotos ya verificó como públicas (no vuelve a chequear los permisos de una foto que ya confirmó antes). Efectos de esto:

- Solo la primera vez que se ve cada foto nueva puede tardar un poco más (tiene que hacerla pública en Drive). Las visitas siguientes, y las fotos ya vistas antes, cargan rápido.
- Si acabás de agregar/editar un producto o subir una foto y querés verlo **ya mismo** sin esperar los 30 minutos, abrí esta URL en el navegador (con tu propia URL del Apps Script):
  `TU_URL_DEL_APPS_SCRIPT/exec?action=refreshcatalog`
  Eso limpia el caché y arma el catálogo de nuevo al toque.
- **Importante:** cada vez que actualices `Code.gs` con una mejora nueva, tenés que volver a hacer **Implementar → Administrar implementaciones → lápiz ✏️ → Nueva versión → Implementar** (paso 2) — si no, el sitio sigue usando la versión vieja del código aunque lo hayas pegado en el editor.

### Productos con varias medidas/variantes en una sola publicación

El campo **Medidas** admite texto libre con varios renglones (Enter dentro de la celda de Sheets = renglón nuevo, se respeta tal cual en la web). Para un producto que viene en varias medidas bajo un mismo código "familia" (ej. flexibles de gas), cargá una sola fila con todas las variantes listadas, una por renglón, por ejemplo:

```
Código 8060 – 1/2" 20-42cm
Código 8061 – 1/2" 40-90cm
Código 8062 – 3/4" 20-42cm
Código 8063 – 3/4" 40-90cm
```

Así queda todo junto en una sola ficha de producto. (Para cargar un salto de línea dentro de una celda de Sheets: `Alt+Enter` en Windows, `Cmd+Enter` en Mac.)

## 2. Desplegar el backend (Google Apps Script)

Esto conecta el sitio con tus Sheets y Drive. Se hace **una sola vez**; después el sitio funciona solo. Son ~10 minutos.

1. Con el navegador logueado en `sanor.sociedad@gmail.com`, entrá a **script.google.com**.
2. Arriba a la izquierda, hacé clic en **"+ Nuevo proyecto"**.
3. Vas a ver un editor de código con un archivo `Código.gs` que dice `function myFunction() {}`. Seleccioná todo ese texto (Ctrl+A) y borralo.
4. Abrí el archivo `apps-script/Code.gs` de este repositorio, copiá **todo** su contenido, y pegalo en el editor de script.google.com.
5. Arriba, donde dice "Proyecto sin título", hacé clic y ponele de nombre **"Sanor Backend"**.
6. Guardá con el ícono de disquete (o Ctrl+S).
7. Arriba a la derecha, hacé clic en el botón azul **"Implementar"** → **"Nueva implementación"**.
8. Al lado de "Seleccionar tipo", hacé clic en el ícono de engranaje ⚙️ y elegí **"Aplicación web"**.
9. Completá:
   - **Ejecutar como:** Yo (`sanor.sociedad@gmail.com`)
   - **Quién tiene acceso:** Cualquier usuario
10. Hacé clic en **"Implementar"**.
11. Te va a pedir autorizar permisos: elegí tu cuenta, hacé clic en "Avanzado" si aparece una advertencia, y "Ir a Sanor Backend (no seguro)" — es normal, es tu propio script. Aceptá los permisos de Sheets y Drive.
12. Te va a mostrar una **URL de la aplicación web** que termina en `/exec`. **Copiala**, es la que necesitás para el paso 3.

Si en el futuro modificás `apps-script/Code.gs` (por ejemplo si yo te paso una versión actualizada), tenés que volver a script.google.com, pegar el código nuevo, y hacer **Implementar → Administrar implementaciones → ícono de lápiz ✏️ → Versión: Nueva versión → Implementar** (la URL no cambia).

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

Categorías nuevas se agregan solo en Sheets + Drive (ver sección 1), no hace falta tocar código. `assets/js/config.js` (`CATEGORIES`/`FEATURED_CATEGORIES`) solo se usa como respaldo visual antes de que el Apps Script esté conectado y para elegir qué 6 categorías se destacan en la home — no limita qué categorías puede tener el catálogo.
