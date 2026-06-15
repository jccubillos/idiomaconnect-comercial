# Material gráfico para afiliados — IdiomaConnect

Esta carpeta tiene los **banners vectoriales de marca** (hechos por nosotros) y los
**prompts** para generar las imágenes que necesitan ilustración o foto (mascota Lumi,
personas, fondos) en un generador de imágenes.

## Banners listos (SVG → exporta a PNG)

| Archivo | Formato | Uso |
|---|---|---|
| `banner-historia-1080x1920.svg` | 9:16 vertical | Historias / Reels (IG, TikTok, Facebook) |
| `banner-post-1080x1080.svg` | 1:1 cuadrado | Posts de feed |
| `banner-web-1200x628.svg` | 1.91:1 horizontal | Banner web, link de WhatsApp, blog |

Son **vectoriales**: se ven nítidos a cualquier tamaño y el texto se puede editar
abriendo el `.svg` con un editor de texto (cambia las frases entre `<text>...</text>`).

### Cómo convertirlos a PNG (3 opciones)
1. **Navegador:** abre el `.svg` (doble clic) → clic derecho → "Guardar como imagen", o
   toma captura. Rápido para probar.
2. **Online (recomendado, alta resolución):** sube el `.svg` a un convertidor SVG→PNG
   (por ejemplo cloudconvert) y descarga el PNG al tamaño exacto del archivo.
3. **Canva / Figma:** importa el `.svg`, ajústalo o agrégale la mascota/foto, y exporta PNG.

## Banners CON Lumi (usando las imágenes de la carpeta `Lumi/`)

Las imágenes de Lumi son **verticales con fondo oscuro** → perfectas como fondo de
Historia/Reel. Para armar la historia con Lumi:

- `overlay-historia-1080x1920.svg` = **solo el texto** (logo + mensaje + botón), fondo
  TRANSPARENTE y un degradado abajo para que el texto siempre se lea.

### Receta en Canva (2 minutos)
1. Crea un diseño 1080×1920.
2. Sube una pose de Lumi (ej. `Lumi/stitch/lumi_friendly_wave/screen.png`) y ponla de **fondo**.
3. Sube `overlay-historia-1080x1920.svg` y ponlo **encima**, a tamaño completo.
4. Exporta como PNG. Listo: Historia con Lumi + tu mensaje.

> Para el banner cuadrado y el horizontal con Lumi conviene una versión de Lumi en
> **PNG transparente** (solo el personaje). Con eso armo esos dos formatos con Lumi al lado del texto.

## Imágenes a generar (con IA) — ver `PROMPTS_IMAGENES.md`
La parte de **ilustración y foto** (mascota Lumi, foto de familia, fondo neón, niño
celebrando) se genera con los prompts de ese archivo. Luego puedes:
- Usar esas imágenes solas en posts, o
- Componerlas **detrás/al lado** del texto de estos banners (en Canva/Figma).

## Reglas de uso (recordatorio del kit)
- No nombrar ni comparar con otras apps por su marca.
- No prometer resultados garantizados ("bilingüe en X días").
- Mantener el logo y los colores de marca (cian #00EEFC, verde #39FF14, morado #C464FF,
  fondo #0B1020).
