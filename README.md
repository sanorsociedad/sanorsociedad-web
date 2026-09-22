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
- `Fotos Productos` — subí ahí **todas** las fotos de producto, sueltas (sin subcarpetas por categoría). El nombre del archivo debe **empezar con el código del producto** (ej: `1024_frente.jpg`, `1024_lateral.jpg`).
- `Categorías` — una foto por categoría, nombrada igual que la categoría (ej: `Grifería.jpg`), para las tarjetas destacadas de la home.
- `Lista de Precios` — subí ahí el Excel/PDF con la lista de precios. Cada vez que la actualices, subí el archivo nuevo a esa carpeta (podés borrar el viejo o dejarlo, el sitio siempre toma el más reciente).

El Google Sheets del catálogo (`Catalogo Sanor`) tiene una sola pestaña de datos, **"Productos"**, con columnas: Código, Nombre, Descripción, Medidas, **Categoría**, Activo (SI/NO). Una fila por producto. Su ID ya está cargado en `apps-script/Code.gs`.

### Agregar una categoría nueva (sin tocar código)

Las categorías del sitio se arman automáticamente a partir de lo que escribas en la columna **Categoría** de la pestaña "Productos" — no hay una lista fija en ningún lado. Para sumar una categoría nueva alcanza con:

1. Escribir el nombre de la categoría en la columna Categoría de cualquier fila nueva de "Productos".
2. Subir las fotos de esos productos a `Fotos Productos` (sueltas, nombradas con el código).
3. (Opcional) Subir una foto a `Categorías` con ese mismo nombre, si querés que aparezca destacada en la home.

Con eso alcanza — la categoría nueva aparece sola la próxima vez que alguien entre al catálogo, sin avisarle a nadie ni tocar código.

### Los cambios en el Sheets/Drive se ven al instante

El catálogo **no usa caché**: cada visita lee el Sheets y Drive en el momento, así que cualquier producto, categoría o foto que agregues aparece apenas alguien entra a la página, sin esperar ni tener que refrescar nada.

Lo único que sigue "recordado para siempre" es qué fotos ya se hicieron públicas en Drive (para no perder tiempo revisando el permiso de una foto que ya se sabe que está bien) — eso no afecta que los datos se vean actualizados.

**Importante:** cada vez que actualices `Code.gs` con una mejora nueva, tenés que volver a hacer **Implementar → Administrar implementaciones → lápiz ✏️ → Nueva versión → Implementar** (paso 2) — si no, el sitio sigue usando la versión vieja del código aunque lo hayas pegado en el editor. (Si tenés activado el despliegue automático, esto pasa solo.)

### Productos con varias medidas/variantes en una sola publicación

Una fila puede tener **varios códigos** en la celda **Código** (uno por renglón, con `Alt+Enter` en Windows o `Cmd+Enter` en Mac para el salto de línea dentro de la celda) cuando la publicación agrupa varias medidas del mismo producto — por ejemplo, un flexible de gas que viene en 4 medidas:

- **Código:**
  ```
  8060
  8061
  8062
  8063
  ```
- **Medidas:**
  ```
  Código 8060 – 1/2" 20-42cm
  Código 8061 – 1/2" 40-90cm
  Código 8062 – 3/4" 20-42cm
  Código 8063 – 3/4" 40-90cm
  ```

El sitio junta automáticamente **todas las fotos de los 4 códigos** en una sola galería de esa publicación (subiendo fotos como `8060_frente.jpg`, `8061_frente.jpg`, etc. a `Fotos Productos`).

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

Si en el futuro modificás `apps-script/Code.gs` (por ejemplo si yo te paso una versión actualizada), tenés que volver a script.google.com, pegar el código nuevo, y hacer **Implementar → Administrar implementaciones → ícono de lápiz ✏️ → Versión: Nueva versión → Implementar** (la URL no cambia). Salvo que hayas activado el despliegue automático (siguiente sección) — en ese caso esto pasa solo.

### (Opcional) Despliegue automático con clasp

Para no tener que copiar/pegar el código cada vez, se puede automatizar: cuando se sube un cambio en `apps-script/` a este repositorio, GitHub despliega solo el backend. Es una configuración **única**, con 3 pasos:

**Paso A — En tu computadora (una sola vez):**
1. Instalá [Node.js](https://nodejs.org) (versión LTS, "Siguiente" en todo el instalador).
2. Abrí la Terminal (Mac) o el Símbolo del sistema/PowerShell (Windows).
3. Ejecutá: `npm install -g @google/clasp`
4. Ejecutá: `clasp login` — se abre el navegador, iniciá sesión con `sanor.sociedad@gmail.com` y aceptá los permisos.
5. Eso crea un archivo llamado `.clasprc.json` en tu carpeta de usuario (Windows: `C:\Users\TU_USUARIO\.clasprc.json`; Mac: `/Users/TU_USUARIO/.clasprc.json`). Abrilo con el Bloc de notas / TextEdit y copiá **todo** su contenido.

**Paso B — Guardarlo como secreto en GitHub (nunca me pases este contenido a mí ni lo subas al repositorio, es como una contraseña):**
1. Andá a `github.com/sanorsociedad/sanorsociedad-web` → **Settings** → **Secrets and variables** → **Actions**.
2. **"New repository secret"**.
3. Name: `CLASPRC_JSON`
4. Value: pegá el contenido del `.clasprc.json`.
5. **Add secret**.

**Paso C — Decirme el Script ID (esto sí es seguro compartirlo, no es una contraseña):**
1. En script.google.com, abrí "Sanor Backend" → ícono de engranaje ⚙️ ("Configuración del proyecto") en el menú de la izquierda.
2. Copiá el **"ID de secuencia de comandos"** (un texto largo).
3. Pasámelo.

Con eso completo la configuración (`apps-script/.clasp.json`) y a partir de ahí, cada actualización que yo suba al backend se despliega sola.

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
