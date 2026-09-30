# Portafolio · Omar Cardona

Sitio estático (HTML, CSS y JavaScript sin dependencias) pensado para publicarse en GitHub Pages.

Tiene dos entradas:

- `index.html` · **modo interactivo**: un escritorio en 3D (Three.js desde CDN, geometría y materiales propios, luz de lámpara con sombras, pantalla del monitor pintada en canvas) a pantalla completa y con precarga. Cada objeto abre información y el computador hace un vuelo de cámara hacia la pantalla para entrar a *OmarOS*, un sistema con ventanas, explorador de proyectos y una consola PowerShell que responde comandos reales (`help`, `proyectos`, `open domiva`, `neofetch`…). Cada proyecto se muestra en su propia consola con captura, stack y enlaces.
- `clasico.html` · **versión clásica**: la página larga de secciones (hero, experiencia, proyectos con visor, habilidades, contacto).

Al tocar un objeto la cámara se acerca a él y se abre un panel lateral (la libreta trae un triqui jugable; el teléfono muestra el contacto en su propia pantalla). Los cuadros muestran diplomas dibujados en canvas con los datos del CV; para usar los escaneos reales basta con guardar `assets/diplomas/sena.jpg` y `assets/diplomas/campusland.jpg` (se cargan solos si existen). Dentro de OmarOS hay una app **Juegos** con Snake y triqui (`js/games.js`).

Si el navegador no tiene WebGL o el CDN de Three.js no responde en 12 s, `game.js` muestra la escena dibujada en SVG que sigue dentro de `index.html` como respaldo.

Los datos de proyectos, experiencia, habilidades y contacto del modo interactivo viven al inicio de `js/game.js` (`PROJECTS`, `EXPERIENCE`, `SKILLS`, `CONTACT`). Se puede entrar directo al sistema con `index.html#os` o a un proyecto con `index.html#os/domiva`.

## Estructura

```
portafolio/
├── index.html          # modo interactivo: escena SVG + OmarOS
├── clasico.html        # versión clásica por secciones
├── css/game.css        # precarga, escena, ventanas, consola, explorador
├── js/scene3d.js       # escena 3D con Three.js (módulo ES, import map en index.html)
├── css/styles.css      # versión clásica: tokens, tema claro/oscuro y componentes
├── js/game.js          # datos, escena, gestor de ventanas, apps y PowerShell
├── js/main.js          # versión clásica: tema, menú, animaciones, filtros y repos de GitHub
└── assets/
    ├── favicon.svg
    ├── omar.jpg        # foto de perfil (opcional; si no existe se muestran las iniciales)
    └── cv/Omar-Cardona-CV.pdf
```

## Personalizar

- **Foto:** copia una foto cuadrada a `assets/omar.jpg`.
- **CV:** copia tu hoja de vida a `assets/cv/Omar-Cardona-CV.pdf`.
- **Proyectos:** cada tarjeta es un `<article class="project">` en `index.html`. El atributo `data-cat` (`web`, `backend`, `front`) controla los filtros.
- **Capturas:** viven en `assets/projects/*.webp` (1280 px de ancho, tomadas con el navegador en modo headless). Cada portada es un `<button class="cover-btn">` con `data-preview` (imagen grande) y, si el proyecto está publicado, `data-live` (URL que se abre en un iframe dentro del visor). Para actualizar una captura basta con reemplazar el archivo.
- **Consolas:** los proyectos sin interfaz gráfica (C#, Python) usan una portada tipo terminal con la salida real del programa dentro de `<pre>`.
- **Colores:** el acento y los neutros están en las variables de `:root` al inicio de `css/styles.css`.
- **Repos de GitHub:** se cargan en vivo desde la API pública. La lista de repos a excluir está en `js/main.js`.

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Portafolio"
git branch -M main
git remote add origin https://github.com/Omarjr33/portafolio.git
git push -u origin main
```

Luego en el repo: Settings → Pages → Source: `main` / root. El sitio queda en `https://omarjr33.github.io/portafolio/`.
