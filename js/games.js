/* Minijuegos: Triqui (con trazos animados) y Snake.
   window.Games.triqui(contenedor, { theme: 'paper' | 'dark' })
   window.Games.snake(contenedor) */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const wobble = () => (Math.random() - .5) * 6;

  /* ======================= TRIQUI ======================= */
  function triqui(root, { theme = 'paper' } = {}) {
    root.innerHTML = '';
    root.classList.add('triqui', 'triqui-' + theme);
    const S = 300, C = S / 3;
    const ink = theme === 'paper' ? '#1f4e9c' : '#7dd3fc';
    const ink2 = theme === 'paper' ? '#c0392b' : '#ffd166';

    const head = document.createElement('div'); head.className = 'tq-head';
    head.innerHTML = `<span class="tq-title">Triqui</span><span class="tq-score"><b id="tq-you">0</b> tú · <b id="tq-cpu">0</b> compu · <b id="tq-draw">0</b> empates</span>`;
    const svg = svgEl('svg', { viewBox: `0 0 ${S} ${S}`, class: 'tq-board', role: 'grid', 'aria-label': 'Tablero de triqui' });
    const msg = document.createElement('div'); msg.className = 'tq-msg'; msg.textContent = 'Tú eres X. Toca una casilla.';
    const foot = document.createElement('div'); foot.className = 'tq-foot';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tq-btn'; btn.textContent = 'Nueva partida';
    foot.appendChild(btn);
    root.append(head, svg, msg, foot);

    let board, turn, over, score = { you: 0, cpu: 0, draw: 0 };
    const youEl = head.querySelector('#tq-you'), cpuEl = head.querySelector('#tq-cpu'), drawEl = head.querySelector('#tq-draw');

    function line(x1, y1, x2, y2, color, delay = 0, width = 5) {
      const p = svgEl('path', { d: `M${x1} ${y1} Q${(x1 + x2) / 2 + wobble()} ${(y1 + y2) / 2 + wobble()} ${x2} ${y2}`, stroke: color, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', class: 'tq-stroke' });
      svg.appendChild(p);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      p.style.transition = `stroke-dashoffset .35s ease ${delay}s`;
      requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = 0; }));
      return p;
    }
    function drawGrid() {
      svg.innerHTML = '';
      [1, 2].forEach((i, k) => {
        line(C * i, 14, C * i, S - 14, ink, k * 0.08, 4);
        line(14, C * i, S - 14, C * i, ink, 0.16 + k * 0.08, 4);
      });
      for (let i = 0; i < 9; i++) {
        const r = svgEl('rect', { x: (i % 3) * C, y: Math.floor(i / 3) * C, width: C, height: C, fill: 'transparent', class: 'tq-cell', role: 'gridcell', tabindex: 0, 'data-i': i });
        r.addEventListener('click', () => play(i));
        r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(i); } });
        svg.appendChild(r);
      }
    }
    function drawX(i) {
      const x = (i % 3) * C, y = Math.floor(i / 3) * C, m = 26;
      line(x + m, y + m, x + C - m, y + C - m, ink2, 0, 7);
      line(x + C - m, y + m, x + m, y + C - m, ink2, 0.18, 7);
    }
    function drawO(i) {
      const x = (i % 3) * C + C / 2, y = Math.floor(i / 3) * C + C / 2, r = C / 2 - 26;
      const c = svgEl('path', { d: `M${x + r} ${y} A${r} ${r} 0 1 1 ${x + r - .01} ${y - .5}`, stroke: ink, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', class: 'tq-stroke' });
      svg.appendChild(c);
      const len = c.getTotalLength(); c.style.strokeDasharray = len; c.style.strokeDashoffset = len; c.style.transition = 'stroke-dashoffset .45s ease';
      requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = 0; }));
    }
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const winner = b => { for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return { p: b[a], l: [a, c, d] }; return b.every(Boolean) ? { p: 'draw' } : null; };
    function minimax(b, player) {
      const w = winner(b);
      if (w) return { s: w.p === 'O' ? 1 : w.p === 'X' ? -1 : 0 };
      let best = null;
      for (let i = 0; i < 9; i++) if (!b[i]) {
        b[i] = player; const r = minimax(b, player === 'O' ? 'X' : 'O'); b[i] = null;
        if (!best || (player === 'O' ? r.s > best.s : r.s < best.s)) best = { s: r.s, i };
      }
      return best;
    }
    function play(i) {
      if (over || board[i] || turn !== 'X') return;
      board[i] = 'X'; drawX(i); turn = 'O';
      if (check()) return;
      msg.textContent = 'La compu piensa…';
      setTimeout(() => {
        // a veces la compu se equivoca a propósito para que se pueda ganar
        const free = board.map((v, k) => v ? null : k).filter(v => v !== null);
        const move = Math.random() < 0.2 ? free[Math.floor(Math.random() * free.length)] : minimax(board.slice(), 'O').i;
        board[move] = 'O'; drawO(move); turn = 'X';
        if (!check()) msg.textContent = 'Tu turno.';
      }, 520);
    }
    function check() {
      const w = winner(board); if (!w) return false;
      over = true;
      if (w.p === 'draw') { score.draw++; msg.textContent = 'Empate. ¿Otra?'; }
      else {
        const [a, , d] = w.l;
        const cx = k => (k % 3) * C + C / 2, cy = k => Math.floor(k / 3) * C + C / 2;
        setTimeout(() => line(cx(a), cy(a), cx(d), cy(d), w.p === 'X' ? ink2 : ink, 0, 8), 380);
        if (w.p === 'X') { score.you++; msg.textContent = '¡Ganaste! 🎉'; } else { score.cpu++; msg.textContent = 'Ganó la compu. Revancha…'; }
      }
      youEl.textContent = score.you; cpuEl.textContent = score.cpu; drawEl.textContent = score.draw;
      return true;
    }
    function reset() { board = Array(9).fill(null); turn = 'X'; over = false; drawGrid(); msg.textContent = 'Tú eres X. Toca una casilla.'; }
    btn.addEventListener('click', reset);
    reset();
    return { reset };
  }

  /* ======================= SNAKE ======================= */
  function snake(root) {
    root.innerHTML = '';
    root.classList.add('snake');
    const N = 20, CELL = 16, S = N * CELL;
    root.innerHTML = `
      <div class="sn-head"><span class="sn-title">Snake</span><span class="sn-score">Puntos <b id="sn-score">0</b> · Mejor <b id="sn-best">0</b></span></div>
      <div class="sn-stage"><canvas width="${S}" height="${S}" aria-label="Juego Snake"></canvas><div class="sn-overlay" id="sn-overlay"><strong>Snake</strong><span>Flechas o WASD para moverte.<br>Toca para empezar.</span></div></div>
      <div class="sn-pad" aria-hidden="true"><button data-d="0,-1">▲</button><div><button data-d="-1,0">◀</button><button data-d="1,0">▶</button></div><button data-d="0,1">▼</button></div>`;
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    const scoreEl = root.querySelector('#sn-score'), bestEl = root.querySelector('#sn-best'), overlay = root.querySelector('#sn-overlay');
    let best = 0; try { best = Number(localStorage.getItem('snake-best') || 0); } catch (_) {}
    bestEl.textContent = best;
    let snakeArr, dir, nextDir, food, score, timer = null, alive = false, speed;

    function spawnFood() {
      do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
      while (snakeArr.some(s => s.x === food.x && s.y === food.y));
    }
    function start() {
      snakeArr = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dir = { x: 1, y: 0 }; nextDir = dir; score = 0; speed = 130; alive = true;
      scoreEl.textContent = 0; spawnFood(); overlay.hidden = true;
      clearInterval(timer); timer = setInterval(tick, speed);
    }
    function gameOver() {
      alive = false; clearInterval(timer);
      if (score > best) { best = score; bestEl.textContent = best; try { localStorage.setItem('snake-best', String(best)); } catch (_) {} }
      overlay.innerHTML = `<strong>Fin del juego</strong><span>${score} puntos. Toca para jugar otra vez.</span>`; overlay.hidden = false;
    }
    function tick() {
      dir = nextDir;
      const h = { x: snakeArr[0].x + dir.x, y: snakeArr[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snakeArr.some(s => s.x === h.x && s.y === h.y)) return gameOver();
      snakeArr.unshift(h);
      if (h.x === food.x && h.y === food.y) {
        score += 10; scoreEl.textContent = score; spawnFood();
        if (speed > 60) { speed -= 4; clearInterval(timer); timer = setInterval(tick, speed); }
      } else snakeArr.pop();
      draw();
    }
    function draw() {
      ctx.fillStyle = '#0f1219'; ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = 'rgba(255,255,255,.04)';
      for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(S, i * CELL); ctx.stroke(); }
      ctx.fillStyle = '#ff5f57'; rr(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, 5);
      snakeArr.forEach((s, i) => { ctx.fillStyle = i === 0 ? '#bdf5d3' : `hsl(150 60% ${45 - i * .8}%)`; rr(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, 4); });
    }
    function rr(x, y, s, r) { ctx.beginPath(); ctx.roundRect(x, y, s, s, r); ctx.fill(); }
    function setDir(x, y) { if (!alive) return; if (x === -dir.x && y === -dir.y) return; nextDir = { x, y }; }
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener('keydown', onKey); clearInterval(timer); return; }
      const k = KEYS[e.key]; if (!k) return;
      if (root.closest('.win') && !root.closest('.win').classList.contains('is-active')) return;
      e.preventDefault(); if (!alive) start(); else setDir(k[0], k[1]);
    }
    document.addEventListener('keydown', onKey);
    root.querySelectorAll('.sn-pad button').forEach(b => b.addEventListener('click', () => { const [x, y] = b.dataset.d.split(',').map(Number); if (!alive) start(); setDir(x, y); }));
    overlay.addEventListener('click', start);
    let tx = 0, ty = 0;
    cv.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    cv.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; if (!alive) start(); Math.abs(dx) > Math.abs(dy) ? setDir(Math.sign(dx), 0) : setDir(0, Math.sign(dy)); });
    snakeArr = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; food = { x: 15, y: 10 }; draw();
    return { start, stop: () => clearInterval(timer) };
  }

  window.Games = { triqui, snake };
})();
