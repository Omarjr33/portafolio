(() => {
  const root = document.documentElement;

  /* ---------- Tema ---------- */
  const themeBtn = document.getElementById('theme-toggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#09090c' : '#f3f3f6');
    try { localStorage.setItem('theme', theme); } catch (_) {}
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (_) {}
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    }
  })();

  themeBtn?.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  }, { passive: true });

  menuBtn?.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Reveal al hacer scroll ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ---------- Contadores ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateCount(el) {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const start = performance.now();
    const dur = 1200;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

  /* ---------- Vitrina del hero ---------- */
  const showcase = document.getElementById('showcase');
  if (showcase) {
    const shots = [...showcase.querySelectorAll('.shot')];
    const tabs = [...showcase.querySelectorAll('.stab')];
    const urlEl = document.getElementById('showcase-url');
    const liveEl = document.getElementById('showcase-live');
    const DUR = 4500;
    let current = 0;
    let timer = null;

    function show(i) {
      current = (i + shots.length) % shots.length;
      shots.forEach((s, k) => s.classList.toggle('is-active', k === current));
      tabs.forEach((t, k) => {
        const on = k === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      const shot = shots[current];
      if (urlEl) urlEl.textContent = shot.dataset.url || '';
      liveEl?.classList.toggle('is-on', shot.dataset.live === '1');
    }
    function play() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), DUR);
    }
    function pause() { clearInterval(timer); timer = null; }

    showcase.style.setProperty('--dur', DUR + 'ms');
    tabs.forEach(t => t.addEventListener('click', () => { show(Number(t.dataset.i)); play(); }));
    showcase.querySelector('.browser')?.addEventListener('click', () => {
      const target = shots[current].dataset.target;
      if (target) document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    showcase.addEventListener('mouseenter', () => { showcase.classList.add('is-paused'); pause(); });
    showcase.addEventListener('mouseleave', () => { showcase.classList.remove('is-paused'); play(); });
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
    show(0);
    play();
  }

  /* ---------- Filtros de proyectos ---------- */
  const filterBtns = [...document.querySelectorAll('.filter')];
  const projects = [...document.querySelectorAll('.project')];
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    projects.forEach(p => {
      const show = f === 'all' || p.dataset.cat === f;
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-visible');
    });
  }));

  /* ---------- Visor de proyectos ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbFrame = document.getElementById('lightbox-frame');
  const lbTitle = document.getElementById('lightbox-title');
  const lbOpen = document.getElementById('lightbox-open');
  const lbTabs = [...(lb?.querySelectorAll('.lightbox-tab') || [])];
  let lbLive = '';
  let lastFocus = null;

  function setMode(mode) {
    lbTabs.forEach(t => t.classList.toggle('is-active', t.dataset.mode === mode));
    const live = mode === 'live' && lbLive;
    lbImg.hidden = !!live;
    lbFrame.hidden = !live;
    lbFrame.src = live ? lbLive : 'about:blank';
  }

  function openLightbox(btn) {
    lastFocus = btn;
    lbLive = btn.dataset.live || '';
    lbTitle.textContent = btn.dataset.title || '';
    lbImg.src = btn.dataset.preview;
    lbImg.alt = btn.querySelector('img')?.alt || '';
    lbTabs.forEach(t => { if (t.dataset.mode === 'live') t.hidden = !lbLive; });
    lbOpen.hidden = !lbLive;
    if (lbLive) lbOpen.href = lbLive;
    setMode(lbLive ? 'live' : 'image');
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    lb.querySelector('.lightbox-close')?.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    lbFrame.src = 'about:blank';
    document.body.classList.remove('no-scroll');
    lastFocus?.focus();
  }

  document.querySelectorAll('.cover-btn').forEach(btn => btn.addEventListener('click', () => openLightbox(btn)));
  lb?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeLightbox));
  lbTabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb && !lb.hidden) closeLightbox(); });

  /* ---------- Repos de GitHub ---------- */
  const repoList = document.getElementById('repo-list');
  const featuredRepos = new Set(['inventario', 'projectf1', 'Betplay-json', 'movie', 'CampusCar', 'webhamburgesa']);
  const ignored = new Set(['Omarjr33', 'prueba', 'ejercicios', 'biblioteca_campus', 'invapp', 'HDV', 'projectcvOmarCadona']);

  async function loadRepos() {
    if (!repoList) return;
    try {
      const res = await fetch('https://api.github.com/users/Omarjr33/repos?per_page=100&sort=updated');
      if (!res.ok) throw new Error(res.status);
      const repos = await res.json();
      const statRepos = document.getElementById('stat-repos');
      if (statRepos) statRepos.textContent = String(repos.filter(r => !r.fork).length);

      const pick = repos
        .filter(r => !r.fork && r.description && !featuredRepos.has(r.name) && !ignored.has(r.name))
        .slice(0, 6);
      if (!pick.length) throw new Error('empty');

      repoList.innerHTML = pick.map(r => `
        <li>
          <a href="${r.html_url}" target="_blank" rel="noopener">
            <strong>${escapeHtml(r.name)}</strong>
            <span>${escapeHtml(r.description)}</span>
            ${r.language ? `<em class="lang">${escapeHtml(r.language)}</em>` : ''}
          </a>
        </li>`).join('');
    } catch (_) {
      repoList.innerHTML = '<li class="repo-empty">Explora todos los repositorios en GitHub.</li>';
    }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  loadRepos();

  /* ---------- Año ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
