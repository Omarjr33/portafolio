(() => {
  'use strict';

  /* =====================================================
     DATOS
     ===================================================== */
  const PROJECTS = [
    { id: 'domiva', name: 'Domiva', type: 'Aplicación web', cat: 'web', year: 2026, status: 'En producción', live: true,
      stack: ['Node.js', 'PostgreSQL', 'Docker', 'AWS EC2 · RDS · ECR', 'Caddy'],
      desc: 'Plataforma de pedidos a domicilio en motocarro para comercios y restaurantes de Manaure: catálogo por negocio, carrito, cuentas de cliente y panel para cada comercio. Desplegada en AWS con imagen construida en CodeBuild y HTTPS por Caddy.',
      demo: 'https://domiva-app.store', img: 'assets/projects/domiva.webp' },
    { id: 'asoprovipas', name: 'ASOPROVIPAS', type: 'Sitio + portal de asociados', cat: 'web', year: 2026, status: 'Entregado a cliente',
      stack: ['Next.js 16', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
      desc: 'Sitio institucional y portal del asociado para una asociación de vivienda: simulador de crédito con tabla de amortización, formularios por pasos con número de radicado, pagos por PSE, panel administrativo con tablero y exportación a CSV.',
      img: 'assets/projects/asoprovipas.webp' },
    { id: 'facial', name: 'Registro de asistencia facial', type: 'Sistema con visión por computador', cat: 'backend', year: 2026, status: 'Entregado a cliente',
      stack: ['Python', 'FastAPI', 'InsightFace', 'React', 'AWS Rekognition'],
      desc: 'Ingreso por reconocimiento facial con cámaras USB, RTSP y ONVIF. Panel en vivo con detecciones en tiempo real, personas registradas, pendientes, estadísticas y reportes. Versión alterna con AWS Rekognition.',
      img: 'assets/projects/facial.webp' },
    { id: 'f1', name: 'Simulador Fórmula 1', type: 'Web app', cat: 'front', year: 2025, status: 'Open source',
      stack: ['JavaScript', 'Web Components', 'Vite', 'Bootstrap', 'JSON Server'],
      desc: 'Gestión de escuderías, pilotos, circuitos y vehículos, más un simulador de carreras con clima variable. Web Components en JavaScript puro y una API REST con JSON Server.',
      code: 'https://github.com/Omarjr33/projectf1', img: 'assets/projects/f1.webp' },
    { id: 'boda', name: 'Invitaciones de boda', type: 'Sitio interactivo', cat: 'front', year: 2026, status: 'Entregado a cliente',
      stack: ['HTML', 'CSS', 'JavaScript', 'Netlify'],
      desc: 'Un sobre que se abre al tocarlo, confirmación de asistencia, cuenta regresiva, mapa y galería, con panel para los novios. Pensadas para compartir por WhatsApp.',
      img: 'assets/projects/boda.webp' },
    { id: 'movie', name: 'MovieFlix', type: 'Catálogo web', cat: 'front', year: 2025, status: 'Open source',
      stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Catálogo de películas estilo streaming con buscador, tendencias y fichas.',
      code: 'https://github.com/Omarjr33/movie', img: 'assets/projects/movie.webp' },
    { id: 'hamburguesa', name: 'Landing para restaurante', type: 'Landing page', cat: 'front', year: 2025, status: 'Open source',
      stack: ['HTML', 'CSS', 'JavaScript'],
      desc: 'Página de presentación de un restaurante de hamburguesas con menú del día, servicios y contacto.',
      code: 'https://github.com/Omarjr33/webhamburgesa', img: 'assets/projects/hamburguesa.webp' },
    { id: 'inventario', name: 'Gestión de compras e inventario', type: 'App de consola', cat: 'backend', year: 2025, status: 'Open source',
      stack: ['C#', '.NET', 'MySQL', 'Arquitectura por capas'],
      desc: 'Productos, ventas, compras, caja, planes promocionales y terceros. Separación en dominio, infraestructura y aplicación.',
      code: 'https://github.com/Omarjr33/inventario', console: true,
      ascii: ['╔════════════════════════════════════╗', '║            MENÚ PRINCIPAL          ║', '╠════════════════════════════════════╣', '║ 1. Gestión de Productos            ║', '║ 2. Gestión de Ventas               ║', '║ 3. Gestión de Compras              ║', '║ 4. Movimientos de Caja             ║', '║ 5. Gestión de Planes Promocionales ║', '║ 6. Gestión de Personas             ║', '║ 0. Salir                           ║', '╚════════════════════════════════════╝'] },
    { id: 'betplay', name: 'Liga BetPlay', type: 'App de consola', cat: 'backend', year: 2025, status: 'Open source',
      stack: ['Python', 'JSON'],
      desc: 'Gestión de equipos, plantillas y estadísticas de la liga colombiana, con persistencia en un archivo JSON.',
      code: 'https://github.com/Omarjr33/Betplay-json', console: true,
      ascii: ['Bienvenido al sistema de gestión de equipos de fútbol', '', '1. Registrar equipo', '2. Registrar integrante de equipo', '3. Ver estadísticas de equipos', '4. Ver estadísticas de jugadores', '5. Salir'] },
    { id: 'campuscar', name: 'CampusCar · base de datos', type: 'Diseño de base de datos', cat: 'backend', year: 2025, status: 'Open source',
      stack: ['MySQL', 'Modelo entidad-relación', 'Triggers', 'Índices'],
      desc: 'Diseño de base de datos para un concesionario: modelo entidad-relación, triggers de disponibilidad e índices.',
      code: 'https://github.com/Omarjr33/CampusCar', img: 'assets/projects/campuscar.webp' },
    { id: 'iglesia', name: 'Sistema de gestión para iglesias', type: 'Aplicación web', cat: 'web', year: 2025, status: 'Entregado a cliente',
      stack: ['Web app', 'MySQL', 'Informes PDF'],
      desc: 'Registro de miembros, control de asistencias, contaduría y emisión de informes en PDF.' },
  ];

  const ABOUT = `Omar David Cardona Romero
Desarrollador Full Stack · Colombia

Empecé en el mundo audiovisual y el marketing digital: dirigí
equipos creativos, produje campañas y construí las páginas web
de las empresas con las que trabajaba. Ese camino me llevó al
desarrollo de software, donde hoy me concentro por completo.

Me formé como Técnico en Sistemas en el SENA y como desarrollador
en Campusland. Pasé por Globant como trainee y luego como data
scientist junior, trabajando con Scrum en equipos remotos.

Hoy construyo aplicaciones completas: frontend, backend, base de
datos y despliegue en AWS. Lo que me diferencia es el ojo de
diseño: un producto no solo debe funcionar, también tiene que
sentirse bien al usarlo.

Idiomas: español nativo · inglés A2
Ubicación: Colombia · trabajo remoto`;

  const EXPERIENCE = [
    { when: 'Sep 2025 · Mar 2026', where: 'Remoto', role: 'Data Scientist Jr', company: 'Globant', text: 'Documentación y optimización de procesos de análisis de riesgo de tarjetas, mejorando trazabilidad y eficiencia operativa. Especificaciones funcionales y documentación técnica.', tags: ['SAS', 'Excel', 'Documentación'] },
    { when: 'Dic 2024 · Sep 2025', where: 'Remoto', role: 'Trainee Developer', company: 'Globant', text: 'Prototipos y proyectos pequeños con funcionalidades backend y frontend. Sprints Scrum: daily, planificación y retrospectivas.', tags: ['HTML · CSS', 'Python', 'Java', 'Scrum'] },
    { when: 'Oct 2023', where: 'Valledupar · Bucaramanga', role: 'Director de Marketing', company: 'Vishnu Security', text: 'Estrategia de expansión para captar nuevos clientes. Creación y gestión de la página web y contenido para atraer prospectos.', tags: ['Web', 'Estrategia'] },
    { when: 'Ago 2023 · Oct 2023', where: 'Valledupar', role: 'Editor y Community Manager', company: 'Campaña María Isabel Campo', text: 'Contenido estratégico que aumentó el engagement en redes un 20 %. Gestión de la comunidad digital.', tags: ['Redes', 'Edición'] },
    { when: 'Sep 2021 · Feb 2022', where: 'Valledupar', role: 'Realizador de Contenido y Páginas Web', company: 'MS Construcciones', text: 'Optimización del sitio web y redes sociales, con un 40 % más de tráfico web. Estrategias de marketing digital.', tags: ['Web', 'SEO'] },
    { when: 'Ago 2020 · Ene 2022', where: 'Valledupar', role: 'Director Creativo y Gerente', company: 'Pamaro Comunicaciones', text: 'Lideré la estrategia de marketing y un equipo. Campañas que aumentaron la cartera de clientes un 25 % y la productividad un 30 %.', tags: ['Liderazgo', 'Producción'] },
  ];

  const SKILLS = {
    'Frontend': ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Vite', 'Tailwind CSS', 'HTML · CSS', 'Bootstrap'],
    'Backend y datos': ['Node.js', 'Python', 'FastAPI', 'C#', 'Java', 'PostgreSQL', 'MySQL', 'Prisma', 'SQL'],
    'Cloud y herramientas': ['AWS', 'Docker', 'Git · GitHub', 'Linux', 'Caddy', 'Scrum'],
    'Diseño y audiovisual': ['UI/UX', 'Figma', 'Photoshop', 'After Effects', 'Premiere Pro', 'Lightroom'],
  };

  const EDUCATION = [
    ['Campusland', 'Desarrollo de software'],
    ['SENA', 'Técnico en Sistemas'],
    ['Universidad del Magdalena', 'Cine y Audiovisuales'],
    ['Southern New Hampshire University', 'Cursos en Administración y Gestión Laboral'],
  ];

  const CONTACT = {
    email: 'omarjrcardona33@gmail.com',
    whatsapp: 'https://wa.me/573013772740',
    linkedin: 'https://www.linkedin.com/in/omar-cardona33/',
    github: 'https://github.com/Omarjr33',
  };

  /* iconos del sistema (SVG) */
  const ICONS = {
    folder: `<svg viewBox="0 0 48 48"><defs><linearGradient id="gf1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#f0a92e"/></linearGradient><linearGradient id="gf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#f6c247"/></linearGradient></defs><path d="M4 12a4 4 0 0 1 4-4h11l4 4h17a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#d9921a"/><path d="M4 18h40v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="url(#gf1)"/><path d="M4 22h40v14a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="url(#gf2)" opacity=".55"/></svg>`,
    term: `<svg viewBox="0 0 48 48"><rect x="4" y="6" width="40" height="36" rx="6" fill="#1b1f2a" stroke="#3a3f4d" stroke-width="1.5"/><rect x="4" y="6" width="40" height="9" rx="6" fill="#2a2f3c"/><circle cx="10" cy="10.5" r="1.6" fill="#ff5f57"/><circle cx="15" cy="10.5" r="1.6" fill="#febc2e"/><circle cx="20" cy="10.5" r="1.6" fill="#28c840"/><path d="M12 24l6 5-6 5" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 34h12" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/></svg>`,
    txt: `<svg viewBox="0 0 48 48"><path d="M10 4h20l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f6fb"/><path d="M30 4v10h10z" fill="#c9d2e3"/><rect x="14" y="20" width="20" height="2.5" rx="1.2" fill="#8a94a8"/><rect x="14" y="26" width="20" height="2.5" rx="1.2" fill="#8a94a8"/><rect x="14" y="32" width="13" height="2.5" rx="1.2" fill="#8a94a8"/></svg>`,
    brief: `<svg viewBox="0 0 48 48"><rect x="4" y="14" width="40" height="28" rx="5" fill="#8b5e3c"/><rect x="4" y="14" width="40" height="12" rx="5" fill="#a8734a"/><rect x="18" y="8" width="12" height="8" rx="2" fill="none" stroke="#e0bd93" stroke-width="3"/><rect x="20" y="22" width="8" height="6" rx="1.5" fill="#e0bd93"/></svg>`,
    chip: `<svg viewBox="0 0 48 48"><rect x="10" y="10" width="28" height="28" rx="5" fill="#1e2a3b" stroke="#3a4c66" stroke-width="1.5"/><rect x="17" y="17" width="14" height="14" rx="3" fill="#7dd3fc"/><g stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"><path d="M17 4v6M24 4v6M31 4v6M17 38v6M24 38v6M31 38v6M4 17h6M4 24h6M4 31h6M38 17h6M38 24h6M38 31h6"/></g></svg>`,
    mail: `<svg viewBox="0 0 48 48"><rect x="4" y="10" width="40" height="28" rx="5" fill="#2b6fdb"/><path d="M6 14l18 13 18-13" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M4 15v18l14-9zM44 15v18l-14-9z" fill="#1f56b3"/></svg>`,
    pdf: `<svg viewBox="0 0 48 48"><path d="M10 4h20l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f6fb"/><path d="M30 4v10h10z" fill="#c9d2e3"/><rect x="6" y="22" width="30" height="13" rx="3" fill="#d92b2b"/><text x="21" y="32" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="9" fill="#fff">PDF</text></svg>`,
    git: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#24292f"/><path d="M24 10a14 14 0 0 0-4.4 27.3c.7.1 1-.3 1-.7v-2.6c-3.9.9-4.7-1.7-4.7-1.7-.6-1.6-1.6-2-1.6-2-1.3-.9.1-.9.1-.9 1.4.1 2.1 1.5 2.1 1.5 1.3 2.2 3.3 1.5 4.1 1.2.1-.9.5-1.5.9-1.9-3.1-.4-6.4-1.6-6.4-6.9 0-1.5.5-2.8 1.4-3.8-.1-.3-.6-1.8.1-3.7 0 0 1.2-.4 3.9 1.4a13 13 0 0 1 7 0c2.7-1.8 3.9-1.4 3.9-1.4.8 1.9.3 3.4.1 3.7.9 1 1.4 2.3 1.4 3.8 0 5.3-3.3 6.5-6.4 6.9.5.4 1 1.3 1 2.6v3.8c0 .4.3.8 1 .7A14 14 0 0 0 24 10z" fill="#fff"/></svg>`,
    power: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#2a1f24" stroke="#5a2a34" stroke-width="1.5"/><path d="M16.5 15.5a11 11 0 1 0 15 0" fill="none" stroke="#ff5f57" stroke-width="3.5" stroke-linecap="round"/><path d="M24 11v12" stroke="#ff5f57" stroke-width="3.5" stroke-linecap="round"/></svg>`,
    games: `<svg viewBox="0 0 48 48"><path d="M12 14h24a10 10 0 0 1 9.8 12l-1.6 8a6 6 0 0 1-10.6 2.4L31 33H17l-2.6 3.4A6 6 0 0 1 3.8 34l-1.6-8A10 10 0 0 1 12 14z" fill="#6d4cf2"/><path d="M13 21v8M9 25h8" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="23" r="2.2" fill="#ffd166"/><circle cx="38" cy="27" r="2.2" fill="#4ade80"/><circle cx="33" cy="27" r="2.2" fill="#7dd3fc"/><circle cx="38" cy="23" r="2.2" fill="#ff5f57"/></svg>`,
  };
  const icoHtml = name => ICONS[name] || ICONS.txt;
  function fillIcons(root = document) {
    root.querySelectorAll('.ico').forEach(i => {
      if (i.dataset.filled) return;
      const m = [...i.classList].find(c => c.startsWith('ico-'));
      i.innerHTML = icoHtml(m ? m.slice(4) : 'txt'); i.dataset.filled = '1';
    });
  }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = () => window.innerWidth < 720;

  /* =====================================================
     ESCENA
     ===================================================== */
  const scene = $('#scene');
  const sceneWrap = $('#scene-wrap');
  const tooltip = $('#tooltip');
  const panel = $('#panel');
  const hint = $('#scene-hint');

  const SPOT_LABELS = {
    monitor: 'Computador <b>· entrar a OmarOS</b>',
    notebook: 'Libreta <b>· sobre mí</b>',
    tray: 'Carpeta <b>· experiencia</b>',
    notes: 'Notas <b>· habilidades</b>',
    frames: 'Cuadros <b>· formación</b>',
    camera: 'Cámara <b>· audiovisual y marketing</b>',
    mug: 'Café <b>· disponibilidad</b>',
    phone: 'Teléfono <b>· contacto</b>',
    lamp: 'Lámpara <b>· luz</b>',
  };

  function showTooltip(spot, x, y) {
    tooltip.innerHTML = SPOT_LABELS[spot] || spot;
    tooltip.hidden = false;
    moveTooltip(x, y);
  }
  function moveTooltip(x, y) {
    const r = tooltip.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - r.width - 24);
    const py = Math.min(y, window.innerHeight - r.height - 24);
    tooltip.style.left = px + 'px';
    tooltip.style.top = py + 'px';
  }

  $$('.hotspot').forEach(h => {
    const spot = h.dataset.spot;
    h.addEventListener('mouseenter', e => showTooltip(spot, e.clientX, e.clientY));
    h.addEventListener('mousemove', e => moveTooltip(e.clientX, e.clientY));
    h.addEventListener('mouseleave', () => { tooltip.hidden = true; });
    h.addEventListener('click', () => activateSpot(spot));
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateSpot(spot); } });
  });

  function activateSpot(spot) {
    tooltip.hidden = true;
    hint.classList.add('is-hidden');
    if (spot === 'monitor') return enterOS();
    if (spot === 'lamp') { scene.classList.toggle('lights-off'); return; }
    openPanel(spot);
  }

  /* ---- puente con la escena 3D (js/scene3d.js) ---- */
  const fade = $('#fade');
  const exitHooks = [];
  let labelX = 0, labelY = 0;
  window.Portfolio = {
    activateSpot,
    openPanel,
    closePanel,
    onPanelClose: fn => panelCloseHooks.push(fn),
    enterOS: (app, opts) => enterOS(app, opts),
    fadeTo: v => fade.classList.toggle('is-on', v > 0),
    onExitOS: fn => exitHooks.push(fn),
    showLabel: html => { tooltip.innerHTML = html; tooltip.hidden = false; moveTooltip(labelX, labelY); },
    hideLabel: () => { tooltip.hidden = true; },
    moveLabel: (x, y) => { labelX = x; labelY = y; if (!tooltip.hidden) moveTooltip(x, y); },
  };

  /* si el 3D no arranca (sin WebGL o sin red), se muestra la escena dibujada */
  function useFallback(reason) {
    if (window.__scene3dReady) return;
    console.warn('Escena 3D no disponible:', reason);
    scene.classList.add('is-fallback');
    $('.room').hidden = false;
    const pre = $('#preloader');
    pre.classList.add('is-done'); setTimeout(() => { pre.hidden = true; }, 600);
    centerScene();
  }
  (function checkWebGL() {
    try {
      const c = document.createElement('canvas');
      if (!(c.getContext('webgl2') || c.getContext('webgl'))) useFallback('sin WebGL');
    } catch (_) { useFallback('sin WebGL'); }
  })();
  setTimeout(() => useFallback('tiempo de carga agotado'), 12000);
  window.addEventListener('error', e => { if (String(e.filename || '').includes('scene3d') || String(e.message || '').includes('three')) useFallback(e.message); }, true);

  const PANELS = {
    notebook: {
      kicker: 'Libreta · sobre mí', title: 'Del set de grabación al despliegue en la nube.',
      body: `<p>Empecé en el mundo audiovisual y el marketing digital: dirigí equipos creativos, produje campañas y construí las páginas web de las empresas con las que trabajaba. Ese camino me llevó al desarrollo de software, donde hoy me concentro por completo.</p>
             <p>Me formé como Técnico en Sistemas en el SENA y como desarrollador en Campusland. Pasé por Globant como trainee y luego como data scientist junior. Hoy construyo aplicaciones completas: frontend, backend, base de datos y despliegue en AWS.</p>
             <div class="tags"><span>Colombia · remoto</span><span>Español nativo</span><span>Inglés A2</span></div>`,
      actions: [['Entrar al computador', 'enter', 'primary'], ['Ver experiencia', 'spot:tray']],
    },
    tray: {
      kicker: 'Carpeta · experiencia', title: 'Dónde he trabajado.',
      body: `<ul>${EXPERIENCE.map(x => `<li><strong>${esc(x.role)}</strong> · ${esc(x.company)} <span class="muted">(${esc(x.when)})</span></li>`).join('')}</ul>
             <p class="muted">También he colaborado con Faitex, Film Master, Castro de Quintero, HR Construcciones y la IPUC en marketing, web y producción audiovisual.</p>`,
      actions: [['Abrir en OmarOS', 'app:experience', 'primary'], ['Descargar CV', 'cv']],
    },
    notes: {
      kicker: 'Notas · habilidades', title: 'Con qué construyo.',
      body: Object.entries(SKILLS).map(([g, items]) => `<p><strong>${esc(g)}</strong></p><div class="tags">${items.map(i => `<span>${esc(i)}</span>`).join('')}</div>`).join(''),
      actions: [['Ver proyectos en OmarOS', 'app:explorer', 'primary']],
    },
    frames: {
      kicker: 'Cuadros · formación', title: 'Formación.',
      body: `<ul>${EDUCATION.map(([a, b]) => `<li><strong>${esc(a)}</strong> · ${esc(b)}</li>`).join('')}</ul>`,
      actions: [['Descargar CV', 'cv', 'primary']],
    },
    camera: {
      kicker: 'Cámara · antes del código', title: 'Producción audiovisual y marketing.',
      body: `<p>Más de cinco años dirigiendo contenido: campañas, piezas para redes, video institucional y sitios web para empresas de seguridad, construcción y comunicación, y para organizaciones religiosas.</p>
             <p>Esa base es la que hoy me permite cuidar la interfaz y la comunicación de cada producto que desarrollo.</p>
             <div class="tags"><span>Premiere Pro</span><span>After Effects</span><span>Photoshop</span><span>Lightroom</span><span>Figma</span><span>Dirección creativa</span></div>`,
      actions: [['Ver experiencia', 'spot:tray', 'primary']],
    },
    mug: {
      kicker: 'Café · disponibilidad', title: 'Disponible para nuevos proyectos.',
      body: `<p>Respondo en menos de 24 horas. Trabajo remoto para cualquier zona horaria y también presencial en la costa colombiana.</p>
             <p>Cuéntame qué necesitas y te propongo cómo construirlo: desde una landing hasta una plataforma completa con backend y despliegue.</p>`,
      actions: [['Escribirme', 'spot:phone', 'primary']],
    },
    phone: {
      kicker: 'Teléfono · contacto', title: '¿Hablamos?',
      body: `<div class="contact-list">
               <a href="mailto:${CONTACT.email}">✉️ Correo <small>${esc(CONTACT.email)}</small></a>
               <a href="${CONTACT.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp <small>+57 301 377 2740</small></a>
               <a href="${CONTACT.linkedin}" target="_blank" rel="noopener">in LinkedIn <small>omar-cardona33</small></a>
               <a href="${CONTACT.github}" target="_blank" rel="noopener">⌥ GitHub <small>Omarjr33</small></a>
             </div>`,
      actions: [['Descargar CV', 'cv']],
    },
  };

  const panelCloseHooks = [];
  let panelOpenSpot = null;
  function openPanel(spot, side) {
    const p = PANELS[spot];
    if (!p) return;
    panelOpenSpot = spot;
    panel.classList.remove('side-left', 'side-right');
    if (side) panel.classList.add('side-' + side);
    $('#panel-kicker').textContent = p.kicker;
    $('#panel-title').textContent = p.title;
    $('#panel-body').innerHTML = p.body;
    if (spot === 'notebook' && window.Games) {
      const g = document.createElement('div'); g.className = 'paper-game';
      g.innerHTML = '<p class="paper-game-title">¿Un triqui mientras lees?</p>';
      const holder = document.createElement('div'); g.appendChild(holder);
      $('#panel-body').appendChild(g);
      window.Games.triqui(holder, { theme: 'paper' });
    }
    const acts = $('#panel-actions');
    acts.innerHTML = '';
    (p.actions || []).forEach(([label, action, kind]) => {
      const b = document.createElement(action === 'cv' ? 'a' : 'button');
      b.className = 'btn ' + (kind === 'primary' ? 'btn-primary' : 'btn-ghost');
      b.textContent = label;
      if (action === 'cv') { b.href = 'assets/cv/Omar-Cardona-CV.pdf'; b.download = ''; }
      else b.addEventListener('click', () => runAction(action));
      acts.appendChild(b);
    });
    panel.hidden = false;
    $('#panel-close').focus();
  }
  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    const s = panelOpenSpot; panelOpenSpot = null;
    panelCloseHooks.forEach(fn => fn(s));
  }
  $('#panel-close').addEventListener('click', closePanel);
  panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });

  function runAction(action) {
    if (action === 'enter') { closePanel(); enterOS(); }
    else if (action.startsWith('spot:')) openPanel(action.slice(5));
    else if (action.startsWith('app:')) { closePanel(); enterOS(action.slice(4)); }
  }

  /* en pantallas pequeñas la escena se recorre de lado: empezar centrada en el computador */
  function centerScene() {
    if (!isSmall() || !scene.classList.contains('is-fallback')) return;
    const room = $('.room');
    scene.scrollLeft = Math.max(0, room.getBoundingClientRect().width / 2 - scene.clientWidth / 2);
  }
  window.addEventListener('load', centerScene);
  setTimeout(centerScene, 300);
  window.addEventListener('resize', centerScene);
  centerScene();

  /* ayuda */
  const help = $('#help');
  $('#btn-help').addEventListener('click', () => { help.hidden = false; });
  $('#help-close').addEventListener('click', () => { help.hidden = true; });
  help.addEventListener('click', e => { if (e.target === help) help.hidden = true; });

  /* reloj de la pantalla de bloqueo */
  function clockText() {
    const d = new Date();
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  function tickClocks() {
    const t = clockText();
    const a = $('.screen-clock'); if (a) a.textContent = t;
    const b = $('#clock'); if (b) b.textContent = t;
  }
  tickClocks(); setInterval(tickClocks, 15000);

  /* =====================================================
     OmarOS
     ===================================================== */
  const os = $('#os');
  const boot = $('#boot');
  const bootLog = $('#boot-log');
  const desktop = $('#desktop');
  const windowsRoot = $('#windows');
  const tasks = $('#tasks');
  let booted = false;
  let osOpen = false;

  const BOOT_LINES = [
    ['OmarOS 1.0 · arrancando…', ''],
    ['[ OK ] Cargando perfil: Omar Cardona', 'ok'],
    ['[ OK ] Montando C:\\Users\\Omar\\proyectos (11 elementos)', 'ok'],
    ['[ OK ] Servicios: frontend · backend · cloud · diseño', 'ok'],
    ['[ OK ] Conectado a github.com/Omarjr33', 'ok'],
    ['[ .. ] Preparando escritorio', 'warn'],
  ];

  async function enterOS(openApp, opts = {}) {
    if (osOpen) { if (openApp) openAppById(openApp); return; }
    osOpen = true;
    closePanel();
    hint.classList.add('is-hidden');
    if (!opts.instant) {
      scene.classList.add('is-zooming');
      await wait(reduceMotion ? 50 : 700);
    }
    os.hidden = false;
    sceneWrap.classList.add('is-hidden');
    fade.classList.remove('is-on');
    if (!booted) {
      bootLog.innerHTML = '';
      boot.classList.remove('is-done');
      for (const [line, cls] of BOOT_LINES) {
        const span = document.createElement('span');
        if (cls) span.className = cls;
        span.textContent = line + '\n';
        bootLog.appendChild(span);
        await wait(reduceMotion ? 0 : 160 + Math.random() * 160);
      }
      await wait(reduceMotion ? 0 : 350);
      booted = true;
    }
    boot.classList.add('is-done');
    desktop.hidden = false;
    scene.classList.remove('is-zooming');
    if (openApp) openAppById(openApp);
    else if (!WM.list().length) openAppById('explorer');
  }

  async function exitOS() {
    if (!osOpen) return;
    WM.closeAll();
    desktop.hidden = true;
    boot.classList.remove('is-done');
    bootLog.innerHTML = '<span class="warn">Volviendo al escritorio…</span>';
    await wait(reduceMotion ? 0 : 500);
    os.hidden = true;
    sceneWrap.classList.remove('is-hidden');
    osOpen = false;
    hint.classList.remove('is-hidden');
    exitHooks.forEach(fn => fn());
  }
  $('#os-exit').addEventListener('click', exitOS);

  /* ---- gestor de ventanas ---- */
  const WM = (() => {
    const wins = new Map();
    let z = 10;
    let cascade = 0;

    function create({ id, title, icon = 'txt', body, w = 760, h = 520, cls = '' }) {
      if (wins.has(id)) { focus(id); const win = wins.get(id); if (win.classList.contains('is-min')) restore(id); return win; }
      const win = document.createElement('section');
      win.className = 'win ' + cls;
      win.dataset.id = id;
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', title);
      const vw = windowsRoot.clientWidth, vh = windowsRoot.clientHeight;
      const W = Math.min(w, vw - 24), H = Math.min(h, vh - 24);
      const off = (cascade++ % 6) * 28;
      win.style.width = W + 'px'; win.style.height = H + 'px';
      win.style.left = Math.max(12, Math.min(vw - W - 12, (vw - W) / 2 + off - 60)) + 'px';
      win.style.top = Math.max(12, Math.min(vh - H - 12, (vh - H) / 2 + off - 40)) + 'px';
      win.innerHTML = `
        <div class="win-bar">
          <i class="ico ico-${icon}">${icoHtml(icon)}</i>
          <span class="win-title">${esc(title)}</span>
          <div class="win-ctl">
            <button class="min" type="button" aria-label="Minimizar">—</button>
            <button class="max" type="button" aria-label="Maximizar">▢</button>
            <button class="close" type="button" aria-label="Cerrar">✕</button>
          </div>
        </div>
        <div class="win-body"></div>`;
      const bodyEl = $('.win-body', win);
      if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
      windowsRoot.appendChild(win);
      wins.set(id, win);
      if (isSmall()) win.classList.add('is-max');

      $('.min', win).addEventListener('click', e => { e.stopPropagation(); minimize(id); });
      $('.max', win).addEventListener('click', e => { e.stopPropagation(); win.classList.toggle('is-max'); });
      $('.close', win).addEventListener('click', e => { e.stopPropagation(); close(id); });
      $('.win-bar', win).addEventListener('dblclick', () => win.classList.toggle('is-max'));
      win.addEventListener('pointerdown', () => focus(id));
      drag(win, $('.win-bar', win));

      const task = document.createElement('button');
      task.className = 'task'; task.dataset.id = id; task.type = 'button';
      task.innerHTML = `<i class="ico ico-${icon}">${icoHtml(icon)}</i><span>${esc(title)}</span>`;
      task.addEventListener('click', () => {
        if (win.classList.contains('is-min')) restore(id);
        else if (win.classList.contains('is-active')) minimize(id);
        else focus(id);
      });
      tasks.appendChild(task);
      focus(id);
      return win;
    }
    function focus(id) {
      const win = wins.get(id); if (!win) return;
      win.style.zIndex = ++z;
      wins.forEach(w => w.classList.toggle('is-active', w === win));
      $$('.task', tasks).forEach(t => t.classList.toggle('is-active', t.dataset.id === id));
      const input = $('.term-input', win); if (input && !isSmall()) input.focus({ preventScroll: true });
    }
    function minimize(id) {
      const win = wins.get(id); if (!win) return;
      win.classList.add('is-min'); win.classList.remove('is-active');
      $(`.task[data-id="${id}"]`, tasks)?.classList.add('is-min');
      $(`.task[data-id="${id}"]`, tasks)?.classList.remove('is-active');
    }
    function restore(id) {
      const win = wins.get(id); if (!win) return;
      win.classList.remove('is-min');
      $(`.task[data-id="${id}"]`, tasks)?.classList.remove('is-min');
      focus(id);
    }
    function close(id) {
      const win = wins.get(id); if (!win) return;
      wins.delete(id);
      $(`.task[data-id="${id}"]`, tasks)?.remove();
      win.classList.add('is-closing');
      setTimeout(() => win.remove(), 170);
      const last = [...wins.keys()].pop(); if (last) focus(last);
    }
    function closeAll() { [...wins.keys()].forEach(close); }
    function top() { let best = null, bz = -1; wins.forEach(w => { const zz = Number(w.style.zIndex || 0); if (!w.classList.contains('is-min') && zz > bz) { bz = zz; best = w; } }); return best; }
    function list() { return [...wins.keys()]; }

    function drag(win, handle) {
      let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
      handle.addEventListener('pointerdown', e => {
        if (e.target.closest('button') || win.classList.contains('is-max')) return;
        dragging = true; sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener('pointermove', e => {
        if (!dragging) return;
        const nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
        win.style.left = Math.max(-win.offsetWidth + 80, Math.min(windowsRoot.clientWidth - 80, nx)) + 'px';
        win.style.top = Math.max(0, Math.min(windowsRoot.clientHeight - 40, ny)) + 'px';
      });
      handle.addEventListener('pointerup', () => { dragging = false; });
      handle.addEventListener('pointercancel', () => { dragging = false; });
    }
    return { create, focus, minimize, restore, close, closeAll, top, list };
  })();

  /* ---- apps ---- */
  function openAppById(app, arg) {
    switch (app) {
      case 'explorer': return appExplorer(arg);
      case 'terminal': return appTerminal();
      case 'about': return appAbout();
      case 'experience': return appExperience();
      case 'skills': return appSkills();
      case 'contact': return appContact();
      case 'games': return appGames(arg);
      case 'power': return exitOS();
    }
  }

  function appGames(which = 'snake') {
    const root = document.createElement('div'); root.className = 'games';
    root.innerHTML = `<div class="games-tabs"><button data-g="snake" class="is-active">🐍 Snake</button><button data-g="triqui">✕○ Triqui</button></div><div class="games-stage"></div>`;
    const stage = $('.games-stage', root);
    let current = null;
    function show(g) {
      if (current && current.stop) current.stop();
      stage.innerHTML = '';
      $$('.games-tabs button', root).forEach(b => b.classList.toggle('is-active', b.dataset.g === g));
      const holder = document.createElement('div'); stage.appendChild(holder);
      current = g === 'snake' ? window.Games.snake(holder) : window.Games.triqui(holder, { theme: 'dark' });
    }
    $$('.games-tabs button', root).forEach(b => b.addEventListener('click', () => show(b.dataset.g)));
    const win = WM.create({ id: 'games', title: 'Juegos', icon: 'games', body: root, w: 520, h: 600 });
    if (!root.dataset.ready) { root.dataset.ready = '1'; show(which); }
    return win;
  }
  $$('[data-app]').forEach(b => b.addEventListener('click', () => { closeStart(); openAppById(b.dataset.app); }));

  function catLabel(c) { return { web: 'Aplicaciones web', backend: 'Backend y datos', front: 'Frontend' }[c] || c; }

  function appExplorer(filter = 'all') {
    const root = document.createElement('div');
    root.className = 'explorer';
    const counts = { all: PROJECTS.length, web: 0, backend: 0, front: 0 };
    PROJECTS.forEach(p => counts[p.cat]++);
    root.innerHTML = `
      <aside class="ex-side">
        <h4>Carpetas</h4>
        <button data-f="all" class="is-active"><i class="ico sm">${icoHtml('folder')}</i>Todos <span class="cnt">${counts.all}</span></button>
        <button data-f="web"><i class="ico sm">${icoHtml('folder')}</i>Web apps <span class="cnt">${counts.web}</span></button>
        <button data-f="backend"><i class="ico sm">${icoHtml('folder')}</i>Backend <span class="cnt">${counts.backend}</span></button>
        <button data-f="front"><i class="ico sm">${icoHtml('folder')}</i>Frontend <span class="cnt">${counts.front}</span></button>
      </aside>
      <div class="ex-main">
        <div class="ex-path"><span class="crumb">C:</span>›<span class="crumb">Users</span>›<span class="crumb">Omar</span>›<span class="crumb">proyectos</span></div>
        <div class="ex-grid" role="list"></div>
        <div class="ex-status"></div>
      </div>`;
    const grid = $('.ex-grid', root), status = $('.ex-status', root);
    function render(f) {
      const items = PROJECTS.filter(p => f === 'all' || p.cat === f);
      grid.innerHTML = items.map(p => `
        <button class="file" data-id="${p.id}" role="listitem" title="Abrir ${esc(p.name)}">
          <span class="thumb">${p.img ? `<img src="${p.img}" alt="" loading="lazy">` : p.console ? `<span class="ps-thumb">&gt;_ consola</span>` : `<i class="ico">${icoHtml('folder')}</i>`}</span>
          <strong>${esc(p.name)}</strong>
          <small>${esc(p.type)} · ${p.year}${p.live ? ' · <span class="live">● en vivo</span>' : ''}</small>
        </button>`).join('');
      status.textContent = `${items.length} elemento${items.length === 1 ? '' : 's'} · toca uno para verlo en PowerShell`;
      $$('.file', grid).forEach(b => b.addEventListener('click', () => appProject(b.dataset.id)));
      $$('.ex-side button', root).forEach(b => b.classList.toggle('is-active', b.dataset.f === f));
    }
    $$('.ex-side button', root).forEach(b => b.addEventListener('click', () => render(b.dataset.f)));
    render(filter);
    return WM.create({ id: 'explorer', title: 'Proyectos', icon: 'folder', body: root, w: 860, h: 560 });
  }

  /* --- PowerShell: utilidades de tipeo --- */
  function makeTerm() {
    const term = document.createElement('div');
    term.className = 'term';
    return term;
  }
  function append(term, html) {
    const s = document.createElement('span');
    s.innerHTML = html;
    term.appendChild(s);
    term.scrollTop = term.scrollHeight;
    term.closest('.win-body') && (term.closest('.win-body').scrollTop = term.closest('.win-body').scrollHeight);
    return s;
  }
  async function typeCmd(term, prompt, cmd) {
    const line = append(term, `<span class="p">${esc(prompt)}</span> `);
    const t = document.createElement('span'); t.className = 'v'; line.appendChild(t);
    const caret = document.createElement('span'); caret.className = 'caret'; line.appendChild(caret);
    for (const ch of cmd) { t.textContent += ch; await wait(reduceMotion ? 0 : 18 + Math.random() * 40); }
    await wait(reduceMotion ? 0 : 220);
    caret.remove();
    append(term, '\n');
  }
  const PROMPT = 'PS C:\\Users\\Omar\\proyectos>';

  async function appProject(id) {
    const p = PROJECTS.find(x => x.id === id); if (!p) return;
    const term = makeTerm();
    const win = WM.create({ id: 'proj-' + id, title: `Windows PowerShell — ${p.name}`, icon: 'term', body: term, w: 800, h: 600, cls: 'ps' });
    if (term.dataset.done) return win;
    term.dataset.done = '1';
    append(term, `<span class="d">Windows PowerShell · OmarOS\nCopyright (c) Omar Cardona. Todos los derechos reservados.\n\n</span>`);
    await typeCmd(term, PROMPT, `Get-Project ${p.id} | Format-List`);
    const rows = [
      ['Nombre', p.name], ['Tipo', p.type], ['Año', String(p.year)], ['Estado', p.status],
      ['Stack', p.stack.join(', ')], ['Descripción', p.desc],
    ];
    if (p.demo) rows.push(['Demo', `<a class="link" href="${p.demo}" target="_blank" rel="noopener">${esc(p.demo)}</a>`]);
    if (p.code) rows.push(['Código', `<a class="link" href="${p.code}" target="_blank" rel="noopener">${esc(p.code)}</a>`]);
    append(term, '\n');
    for (const [k, v] of rows) {
      const isHtml = k === 'Demo' || k === 'Código';
      append(term, `<span class="k">${k.padEnd(12, ' ')}</span>: <span class="v">${isHtml ? v : esc(v)}</span>\n`);
      await wait(reduceMotion ? 0 : 70);
    }
    append(term, '\n');
    if (p.img) {
      await typeCmd(term, PROMPT, `Show-Preview ${p.id}`);
      const img = document.createElement('img');
      img.className = 'preview'; img.src = p.img; img.alt = `Captura de ${p.name}`;
      term.appendChild(img);
      append(term, '\n');
    } else if (p.ascii) {
      await typeCmd(term, PROMPT, p.id === 'betplay' ? 'python MainApp.py' : 'dotnet run');
      append(term, `<span class="ascii">${esc(p.ascii.join('\n'))}</span>\n\n`);
    } else {
      append(term, `<span class="d">Sin captura disponible para este proyecto.</span>\n\n`);
    }
    const acts = document.createElement('div'); acts.className = 'actions';
    if (p.demo) acts.innerHTML += `<a href="${p.demo}" target="_blank" rel="noopener">↗ Abrir demo</a>`;
    if (p.code) acts.innerHTML += `<a href="${p.code}" target="_blank" rel="noopener">⌥ Ver código</a>`;
    acts.innerHTML += `<a href="#" data-back>← Volver a proyectos</a>`;
    term.appendChild(acts);
    $('[data-back]', acts).addEventListener('click', e => { e.preventDefault(); appExplorer(); });
    append(term, `\n<span class="p">${esc(PROMPT)}</span> <span class="caret"></span>`);
    return win;
  }

  /* --- PowerShell interactivo --- */
  function appTerminal() {
    const term = makeTerm();
    const win = WM.create({ id: 'terminal', title: 'Windows PowerShell', icon: 'term', body: term, w: 760, h: 520, cls: 'ps' });
    if (term.dataset.ready) return win;
    term.dataset.ready = '1';
    append(term, `<span class="d">Windows PowerShell · OmarOS\nCopyright (c) Omar Cardona. Todos los derechos reservados.\n\nEscribe <span class="k">help</span> para ver los comandos.\n\n</span>`);
    const history = []; let hi = -1;
    const P = 'PS C:\\Users\\Omar>';

    function newLine() {
      const line = document.createElement('div'); line.className = 'term-line';
      line.innerHTML = `<span class="p">${esc(P)}</span>&nbsp;`;
      const input = document.createElement('input');
      input.className = 'term-input'; input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', 'Comando');
      line.appendChild(input);
      term.appendChild(line);
      if (!isSmall()) input.focus();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim();
          line.innerHTML = `<span class="p">${esc(P)}</span>&nbsp;<span class="v">${esc(cmd)}</span>`;
          if (cmd) { history.unshift(cmd); hi = -1; run(cmd); }
          if (!term.dataset.closed) newLine();
        } else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.min(history.length - 1, hi + 1); input.value = history[hi] || ''; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.max(-1, hi - 1); input.value = hi < 0 ? '' : history[hi]; }
        else if (e.key === 'Tab') {
          e.preventDefault();
          const v = input.value.toLowerCase();
          const m = [...COMMANDS, ...PROJECTS.map(p => 'open ' + p.id)].find(c => c.startsWith(v));
          if (m) input.value = m;
        } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); clear(); }
      });
      term.scrollTop = term.scrollHeight;
    }
    function out(html) { append(term, html + '\n'); }
    function clear() { term.innerHTML = ''; newLine(); }
    const COMMANDS = ['help', 'ls', 'dir', 'proyectos', 'open', 'cat', 'type', 'sobre-mi', 'experiencia', 'skills', 'contacto', 'cv', 'github', 'whoami', 'neofetch', 'date', 'clear', 'cls', 'exit', 'apagar'];

    function run(raw) {
      const [cmd, ...args] = raw.split(/\s+/);
      const c = cmd.toLowerCase();
      switch (c) {
        case 'help':
          out(`<span class="k">Comandos disponibles</span>
  help              esta ayuda
  ls | dir          lista los archivos del perfil
  proyectos         lista los proyectos
  open &lt;id&gt;         abre un proyecto (ej: open domiva)
  cat &lt;archivo&gt;     muestra un archivo (sobre-mi.txt, experiencia.txt, skills.txt, contacto.txt)
  sobre-mi | experiencia | skills | contacto
  neofetch          resumen del sistema
  cv                descarga la hoja de vida
  github            abre GitHub
  clear | cls       limpia la consola
  exit | apagar     vuelve al escritorio`);
          break;
        case 'ls': case 'dir':
          out(`<span class="d">    Directorio: C:\\Users\\Omar</span>\n\n<span class="k">Mode   Nombre</span>\n<span class="d">----   ------</span>\nd----  proyectos\n-a---  sobre-mi.txt\n-a---  experiencia.txt\n-a---  skills.txt\n-a---  contacto.txt\n-a---  CV.pdf`);
          break;
        case 'proyectos':
          out(`<span class="k">${'Id'.padEnd(13)}${'Año'.padEnd(6)}${'Estado'.padEnd(22)}Nombre</span>\n<span class="d">${'--'.padEnd(13)}${'---'.padEnd(6)}${'------'.padEnd(22)}------</span>\n` +
            PROJECTS.map(p => `${p.id.padEnd(13)}${String(p.year).padEnd(6)}${p.status.padEnd(22)}${esc(p.name)}`).join('\n') + `\n\n<span class="d">Usa</span> open &lt;id&gt; <span class="d">para ver uno.</span>`);
          break;
        case 'open': {
          const p = PROJECTS.find(x => x.id === (args[0] || '').toLowerCase());
          if (p) { out(`<span class="ok">Abriendo ${esc(p.name)}…</span>`); appProject(p.id); }
          else out(`<span class="err">open : no existe el proyecto "${esc(args[0] || '')}". Prueba con</span> proyectos`);
          break;
        }
        case 'cat': case 'type': {
          const f = (args[0] || '').toLowerCase().replace('.txt', '');
          if (f === 'sobre-mi') out(esc(ABOUT));
          else if (f === 'experiencia') out(EXPERIENCE.map(x => `<span class="k">${esc(x.when)}</span>  ${esc(x.role)} · ${esc(x.company)}\n           ${esc(x.text)}`).join('\n\n'));
          else if (f === 'skills') out(Object.entries(SKILLS).map(([g, i]) => `<span class="k">${esc(g)}</span>\n  ${i.join(' · ')}`).join('\n\n'));
          else if (f === 'contacto') out(contactText());
          else out(`<span class="err">cat : no se encuentra el archivo "${esc(args[0] || '')}".</span>`);
          break;
        }
        case 'sobre-mi': out(esc(ABOUT)); appAbout(); break;
        case 'experiencia': appExperience(); out('<span class="ok">Abriendo Experiencia…</span>'); break;
        case 'skills': appSkills(); out('<span class="ok">Abriendo Habilidades…</span>'); break;
        case 'contacto': out(contactText()); appContact(); break;
        case 'cv': out('<span class="ok">Descargando Omar-Cardona-CV.pdf…</span>'); { const a = document.createElement('a'); a.href = 'assets/cv/Omar-Cardona-CV.pdf'; a.download = ''; a.click(); } break;
        case 'github': out('<span class="ok">Abriendo github.com/Omarjr33…</span>'); window.open(CONTACT.github, '_blank', 'noopener'); break;
        case 'whoami': out('omaros\\omar'); break;
        case 'date': out(new Date().toLocaleString('es-CO')); break;
        case 'neofetch':
          out(`<span class="k">        ____   ____ </span>   <span class="k">omar</span>@<span class="k">omaros</span>
<span class="k">       / __ \\ / ___|</span>   ----------------
<span class="k">      | |  | | |    </span>   Rol: Desarrollador Full Stack
<span class="k">      | |__| | |___ </span>   Ubicación: Colombia
<span class="k">       \\____/ \\____|</span>   Experiencia: 5+ años
                        Proyectos: ${PROJECTS.length} · 3 en producción
                        Stack: Next.js · React · Node · Python · C#
                        Cloud: AWS · Docker
                        Diseño: Figma · Premiere · After Effects`);
          break;
        case 'clear': case 'cls': clear(); return;
        case 'exit': case 'apagar': out('<span class="warn">Cerrando sesión…</span>'); term.dataset.closed = '1'; setTimeout(exitOS, 500); return;
        case 'sudo': out('<span class="err">Aquí no hace falta, ya tienes todos los permisos 😉</span>'); break;
        default: out(`<span class="err">${esc(cmd)} : El término "${esc(cmd)}" no se reconoce como nombre de un cmdlet. Escribe</span> help<span class="err">.</span>`);
      }
    }
    function contactText() {
      return `<span class="k">Correo</span>    : <a class="link" href="mailto:${CONTACT.email}">${CONTACT.email}</a>\n<span class="k">WhatsApp</span>  : <a class="link" href="${CONTACT.whatsapp}" target="_blank" rel="noopener">+57 301 377 2740</a>\n<span class="k">LinkedIn</span>  : <a class="link" href="${CONTACT.linkedin}" target="_blank" rel="noopener">linkedin.com/in/omar-cardona33</a>\n<span class="k">GitHub</span>    : <a class="link" href="${CONTACT.github}" target="_blank" rel="noopener">github.com/Omarjr33</a>`;
    }
    term.addEventListener('click', e => { if (!e.target.closest('a')) $('.term-input', term)?.focus(); });
    newLine();
    return win;
  }

  function appAbout() {
    const d = document.createElement('div'); d.className = 'doc notepad'; d.textContent = ABOUT;
    return WM.create({ id: 'about', title: 'sobre-mi.txt — Bloc de notas', icon: 'txt', body: d, w: 640, h: 520 });
  }
  function appExperience() {
    const d = document.createElement('div'); d.className = 'doc';
    d.innerHTML = `<p class="kicker">Experiencia profesional</p><h2>Dónde he trabajado.</h2>
      <div class="xp">${EXPERIENCE.map(x => `<div class="xp-item"><div class="when">${esc(x.when)}<br>${esc(x.where)}</div><div><strong>${esc(x.role)}</strong><em>${esc(x.company)}</em><p>${esc(x.text)}</p><div class="tags" style="margin-top:8px">${x.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div></div>`).join('')}</div>
      <h3>Otras colaboraciones</h3><p>Faitex, Film Master, Castro de Quintero, HR Construcciones y la Iglesia Pentecostal Unida de Colombia, en marketing, web y producción audiovisual.</p>
      <h3>Formación</h3><div class="edu">${EDUCATION.map(([a, b]) => `<div><strong>${esc(a)}</strong>${esc(b)}</div>`).join('')}</div>`;
    return WM.create({ id: 'experience', title: 'Experiencia', icon: 'brief', body: d, w: 760, h: 580 });
  }
  function appSkills() {
    const d = document.createElement('div'); d.className = 'doc';
    d.innerHTML = `<p class="kicker">Habilidades</p><h2>Con qué construyo.</h2>` +
      Object.entries(SKILLS).map(([g, i]) => `<div class="skill-group"><h3>${esc(g)}</h3><div class="tags">${i.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`).join('') +
      `<h3>Habilidades blandas</h3><div class="tags"><span>Liderazgo y trabajo en equipo</span><span>Comunicación efectiva</span><span>Resolución de problemas</span><span>Creatividad</span><span>Pensamiento estratégico</span></div>`;
    return WM.create({ id: 'skills', title: 'Habilidades', icon: 'chip', body: d, w: 680, h: 520 });
  }
  function appContact() {
    const d = document.createElement('div'); d.className = 'doc';
    d.innerHTML = `<p class="kicker">Contacto</p><h2>¿Tienes un proyecto en mente?</h2><p>Respondo en menos de 24 horas. Cuéntame qué necesitas y te propongo cómo construirlo.</p>
      <div class="contact-list">
        <a href="mailto:${CONTACT.email}">✉️ Correo <small>${esc(CONTACT.email)}</small></a>
        <a href="${CONTACT.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp <small>+57 301 377 2740</small></a>
        <a href="${CONTACT.linkedin}" target="_blank" rel="noopener">in LinkedIn <small>omar-cardona33</small></a>
        <a href="${CONTACT.github}" target="_blank" rel="noopener">⌥ GitHub <small>Omarjr33</small></a>
        <a href="assets/cv/Omar-Cardona-CV.pdf" download>⬇ Descargar CV <small>PDF</small></a>
      </div>`;
    return WM.create({ id: 'contact', title: 'Contacto', icon: 'mail', body: d, w: 560, h: 460 });
  }

  fillIcons();

  /* ---- menú inicio ---- */
  const startBtn = $('#start-btn'), startMenu = $('#start-menu');
  function closeStart() { startMenu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  startBtn.addEventListener('click', e => { e.stopPropagation(); const open = startMenu.hidden; startMenu.hidden = !open; startBtn.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', e => { if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStart(); });

  /* ---- teclado global ---- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!help.hidden) { help.hidden = true; return; }
      if (!panel.hidden) { closePanel(); return; }
      if (!startMenu.hidden) { closeStart(); return; }
      if (osOpen) { const t = WM.top(); if (t) WM.close(t.dataset.id); }
    }
  });

  /* ---- entrada directa por URL (#os, #os/domiva) ---- */
  const h = location.hash.replace('#', '');
  if (h === 'os') enterOS(undefined, { instant: true });
  else if (h.startsWith('os/')) { const id = h.slice(3); enterOS(undefined, { instant: true }); setTimeout(() => appProject(id), 1600); }
})();
