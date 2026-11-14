/* =====================================================
   la casa matusita - script.js
   ===================================================== */

/* ===== settings (change file names / folders here) ===== */
const TOTAL_ROOMS = 7;
const DIR_ROOMS = 'rooms/', DIR_OBJECTS = 'objects/';        // folders next to index.html
const MUSIC_FILE = 'bg-music.mp3', CLICK_FILE = 'click-sound.mp3';
const SHOW_ICONS = true;           // false = hide object pictures, keep only the glow
const FLASHLIGHT = true;           // false = room is fully lit (no dark circle around your finger / mouse)
const JUMPSCARE_IMG = 'jumpscare-face.jpg';   // put this file next to index.html
const STATIC_FX = true;            // false = turn off the static / creepy filter
const CUT_LEVEL = 34;              // 0-255, how dark counts as "background" around an object (raise it if a black edge shows)
const EDIT = location.search.includes('edit');               // open index.html?edit to drag objects into place
const KEY_HIGH = 'matusita_high', KEY_BOARD = 'matusita_board', KEY_EDIT = 'matusita_edit';

/* ===== rooms and objects =====
   room picture = rooms/<file>.jpg, object picture = objects/<object-name>.jpg
   puzzle = sequence | match | riddle | code
   x, y = position on the room picture (percent), s = size of the object (percent of picture width)
   objects only sit on floors, tables, walls and furniture, never on the roof */
const ROOMS = [
  { name: 'Foyer', hue: 0, file: 'foyer', spots: [
    { icon: '🕯️', name: 'Candelabra',        x: 52, y: 88, s: 6,  puzzle: 'sequence' },   // on the floor
    { icon: '🕰️', name: 'Grandfather clock', x: 39, y: 58, s: 7,  puzzle: 'riddle' },     // by the side wall
    { icon: '🪞', name: 'Cracked mirror',    x: 9,  y: 38, s: 7,  puzzle: 'match' } ] },  // on the wall
  { name: 'Dining Room', hue: 350, file: 'dining-room', spots: [
    { icon: '🍷', name: 'Wine glass',   x: 58, y: 80, s: 4.5, puzzle: 'riddle' },         // on the table
    { icon: '🍽️', name: 'Dinner plate', x: 40, y: 84, s: 8,   puzzle: 'match' },          // on the table
    { icon: '📦', name: 'Locked chest', x: 88, y: 68, s: 9,   puzzle: 'code' } ] },       // lower far right of the door
  { name: 'Kitchen', hue: 30, file: 'kitchen', spots: [
    { icon: '🧊', name: 'Fridge',            x: 80, y: 56, s: 11, puzzle: 'code' },       // at the fridge
    { icon: '🍲', name: 'Bubbling cauldron', x: 42, y: 84, s: 8,  puzzle: 'sequence' },   // on the floor
    { icon: '🔪', name: 'Knife block',       x: 44, y: 43, s: 5,  puzzle: 'riddle' } ] },  // at the sink
  { name: 'Nursery', hue: 320, file: 'nursery', spots: [
    { icon: '🎼', name: 'Music box',     x: 30, y: 90, s: 7, puzzle: 'code' },            // on the bed
    { icon: '🧸', name: 'Teddy bear',    x: 56, y: 86, s: 7, puzzle: 'match' },           // on the floor
    { icon: '🎠', name: 'Rocking horse', x: 88, y: 86, s: 9, puzzle: 'sequence' } ] },    // right side of the room
  { name: 'Library', hue: 45, file: 'library', spots: [
    { icon: '🕯️', name: 'Reading candle', x: 62, y: 84, s: 4, puzzle: 'sequence' },      // on the floor
    { icon: '📖', name: 'Open book',      x: 50, y: 87, s: 7, puzzle: 'riddle' },        // on the floor
    { icon: '🗝️', name: 'Brass key',      x: 64, y: 60, s: 4, puzzle: 'code' } ] },      // on top of the chair
  { name: 'Cellar', hue: 190, file: 'cellar', spots: [
    { icon: '🕷️', name: 'Giant web', x: 42, y: 68, s: 9,  puzzle: 'match' },              // bottom of the door
    { icon: '💀', name: 'Skull',     x: 22, y: 84, s: 5,  puzzle: 'riddle' },             // left of the floor
    { icon: '⚰️', name: 'Coffin',    x: 86, y: 85, s: 14, puzzle: 'code' } ] },           // far right of the floor
  { name: 'Attic', hue: 270, file: 'attic', spots: [
    { icon: '📻', name: 'Old radio',       x: 24, y: 82, s: 9,  puzzle: 'sequence' },    // bottom left
    { icon: '🎎', name: 'Porcelain dolls', x: 86, y: 64, s: 6,  puzzle: 'match' },       // top right of the floor
    { icon: '🪜', name: 'Attic hatch',     x: 52, y: 74, s: 11, puzzle: 'code' } ] }      // middle of the floor
];

/* ===== layout: final object positions (percent of the room picture) =====
   empty on purpose. open index.html?edit, drag the objects, press "Copy layout",
   then paste the result between the braces below. example:  'Candelabra': [52, 88, 6],   (x, y, size) */
const LAYOUT = {
};

/* ===== helpers ===== */
const $ = s => document.querySelector(s);
const stage = $('#stage');
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[rnd(0, a.length - 1)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const show = id => document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
const say = t => $('#msg').textContent = t;
const head = (t, h) => { $('#pTitle').textContent = t; $('#pHint').textContent = h; };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/* ===== saved data (localStorage) ===== */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let pos = { ...LAYOUT, ...(EDIT ? store.get(KEY_EDIT, {}) : {}) };   // object positions in use
const where = p => pos[p.name] || [p.x, p.y, p.s];

/* ===== sound: music file, click file, and made-with-code effects ===== */
let ctx = null, muted = false;
const bgm = new Audio(MUSIC_FILE); bgm.loop = true; bgm.volume = .35;
const clickSfx = new Audio(CLICK_FILE); clickSfx.volume = .7;
const AC = window.AudioContext || window.webkitAudioContext;

function startMusic() { if (!muted) bgm.play().catch(() => {}); }
function playClick() { if (muted) return; try { clickSfx.currentTime = 0; clickSfx.play().catch(() => {}); } catch {} }
function tone(f, d = .15, type = 'sine', v = .08) {
  if (muted) return;
  try {
    ctx = ctx || new AC();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d);
  } catch {}
}
function screech() {
  if (muted) return;
  try {
    ctx = ctx || new AC();
    const t = ctx.currentTime;
    [90, 180, 1200, 1750].forEach(f => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.8, t + 1.2);
      g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.4);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.4);
    });
  } catch {}
}

/* ===== game state ===== */
let S = {}, tick = null, lastSec = -1;

function newGame() {
  goFull(); startMusic();
  S = { room: 1, score: 0, time: 0, max: 0, paused: EDIT, busy: false, done: false, solved: [], cur: 0 };
  $('#hBest').textContent = store.get(KEY_HIGH, 0);
  show('game');
  startRoom();
}

/* ===== rooms: start a room and draw its picture ===== */
function startRoom() {
  const R = ROOMS[S.room - 1];
  S.max = Math.max(60, 130 - (S.room - 1) * 12);          // harder: less time every room
  S.time = S.max; S.busy = false; S.solved = [false, false, false];
  document.body.style.setProperty('--h', R.hue);
  $('#hRoom').textContent = S.room; $('#hName').textContent = R.name; $('#hScore').textContent = S.score;
  $('#barFill').style.width = '100%'; $('#timeText').textContent = EDIT ? 'edit mode' : S.max + 's';
  closeModal(); drawScene();
  clearInterval(tick); tick = setInterval(loop, 100);
}

function drawScene() {
  const R = ROOMS[S.room - 1], url = DIR_ROOMS + R.file + '.jpg';
  stage.dataset.room = R.name;
  stage.classList.toggle('nolight', !FLASHLIGHT || EDIT);
  stage.style.backgroundImage = `url("${url}"), radial-gradient(ellipse at 50% 35%, hsl(${R.hue} 35% 20%), hsl(${R.hue} 30% 4%))`;
  stage.classList.remove('has-img');
  stage.style.setProperty('--ar', 1.7778);
  const probe = new Image();
  probe.onload = () => { stage.style.setProperty('--ar', probe.naturalWidth / probe.naturalHeight); stage.classList.add('has-img'); };   // fits the box to the picture so nothing is stretched
  probe.src = url;
  stage.innerHTML = R.spots.map((p, i) => {
    const done = S.solved[i], [x, y, sz = p.s] = where(p);
    const pic = SHOW_ICONS ? `<img alt="" draggable="false" data-src="${DIR_OBJECTS + slug(p.name)}.jpg">` : '';
    return `<button class="spot${done ? ' done' : ''}" data-i="${i}" data-name="${p.name}" style="left:${x}%;top:${y}%;--s:${sz}" aria-label="${p.name}" title="${p.name}"${done ? ' disabled' : ''}>${pic}</button>`;
  }).join('');
  $('#hSolved').textContent = S.solved.filter(Boolean).length;
  stage.querySelectorAll('.spot img').forEach(im => {          // remove the black around each object so only the object glows
    cutout(im.dataset.src).then(u => { im.src = u; }).catch(err => {
      if (err === 'missing') im.replaceWith(document.createTextNode(R.spots[+im.closest('.spot').dataset.i].icon));
      else { im.src = im.dataset.src; im.classList.add('raw'); }
    });
  });
  if (EDIT) showLayout();
}

/* ===== cut-out: turns the black background of an object picture transparent ===== */
const cutCache = new Map();
function cutout(src) {
  if (cutCache.has(src)) return cutCache.get(src);
  const job = new Promise((res, rej) => {
    const im = new Image();
    im.onerror = () => rej('missing');
    im.onload = () => {
      try {
        const k = Math.min(1, 300 / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h), a = d.data, gone = new Uint8Array(w * h), q = [];
        const add = i => { if (!gone[i] && (a[i * 4] + a[i * 4 + 1] + a[i * 4 + 2]) / 3 < CUT_LEVEL) { gone[i] = 1; q.push(i); } };
        for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }          // start from the picture border
        for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
        while (q.length) {                                                    // spread through dark pixels that touch the border
          const i = q.pop(), x = i % w;
          if (x > 0) add(i - 1); if (x < w - 1) add(i + 1); if (i >= w) add(i - w); if (i < w * (h - 1)) add(i + w);
        }
        for (let i = 0; i < w * h; i++) {
          if (gone[i]) { a[i * 4 + 3] = 0; continue; }
          const x = i % w;                                                    // soften the edge of the object
          if ((x > 0 && gone[i - 1]) || (x < w - 1 && gone[i + 1]) || (i >= w && gone[i - w]) || (i < w * (h - 1) && gone[i + w])) a[i * 4 + 3] = 120;
        }
        g.putImageData(d, 0, 0); res(c.toDataURL('image/png'));
      } catch { rej('blocked'); }
    };
    im.src = src;
  });
  cutCache.set(src, job); return job;
}

/* ===== timer ===== */
function loop() {
  if (S.paused || S.done) return;
  S.time = Math.max(0, S.time - .1);
  $('#barFill').style.width = (S.time / S.max * 100) + '%';
  $('#timeText').textContent = Math.ceil(S.time) + 's';
  const sec = Math.ceil(S.time);
  document.body.classList.toggle('danger', S.time <= 10);
  if (S.time <= 10 && sec !== lastSec) { lastSec = sec; tone(70, .25, 'sine', .25); }   // heartbeat
  if (S.time <= 0) lose();
}

/* ===== scoring: wrong answer, solved puzzle ===== */
function penalty() {
  S.time = Math.max(.1, S.time - 5);
  tone(110, .3, 'square', .12);
  const g = $('#game'); g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit');
}

function solve(base) {
  if (S.busy) return;
  S.busy = true; S.paused = true;
  const bonus = Math.ceil(S.time) * 5;
  S.score += base + bonus;
  $('#hScore').textContent = S.score;
  say(`Unlocked! +${base} puzzle, +${bonus} time bonus`);
  tone(520, .12); setTimeout(() => tone(780, .2), 120);
  setTimeout(() => {
    S.solved[S.cur] = true; closeModal(); drawScene();
    if (S.solved.every(Boolean)) roomCleared(); else S.busy = false;
  }, 1200);
}

function roomCleared() {
  S.paused = true; S.busy = true;
  tone(300, .4, 'triangle', .12);
  setTimeout(() => { if (S.room >= TOTAL_ROOMS) end(true); else { S.room++; startRoom(); } }, 1400);
}

/* ===== game over: lose (jumpscare) and end screen ===== */
function lose() {
  S.done = true; clearInterval(tick);
  document.body.classList.remove('danger');
  closeModal(); bgm.pause();
  const sc = $('#scare'); sc.classList.add('on'); screech();
  setTimeout(() => { sc.classList.remove('on'); end(false); }, 1800);
}

function end(won) {
  S.done = true; clearInterval(tick);
  document.body.classList.remove('danger');
  document.body.style.setProperty('--h', 18);
  startMusic();
  const hi = store.get(KEY_HIGH, 0), isNew = S.score > hi;
  if (isNew) store.set(KEY_HIGH, S.score);
  $('#oTitle').textContent = won ? 'You escaped' : 'The house keeps you';
  $('#oText').textContent = won ? 'The front door finally opens. Do not look back.' : `The lights go out. The ${ROOMS[S.room - 1].name} is yours forever.`;
  $('#oScore').textContent = S.score;
  $('#oRoom').textContent = won ? TOTAL_ROOMS : S.room - 1;
  $('#oBest').textContent = isNew ? 'New high score!' : 'High score: ' + hi;
  $('#saveBox').style.display = S.score > 0 ? 'block' : 'none';
  $('#initials').value = '';
  renderBoard(); show('over');
}

/* ===== scoreboard (top 5 with initials) ===== */
function renderBoard() {
  const b = store.get(KEY_BOARD, []);
  $('#board').innerHTML = b.length ? b.map(e => `<li>${e.n} : ${e.s}</li>`).join('') : '<li>No scores yet.</li>';
}
function saveScore() {
  const n = $('#initials').value.toUpperCase().replace(/[^A-Z0-9]/g, '') || '???';
  const b = store.get(KEY_BOARD, []); b.push({ n, s: S.score });
  b.sort((x, y) => y.s - x.s);
  store.set(KEY_BOARD, b.slice(0, 5));
  $('#saveBox').style.display = 'none'; renderBoard();
}

/* ===== puzzle popup: open and close ===== */
function openSpot(i) {
  if (EDIT || S.busy || S.done || S.solved[i]) return;
  S.cur = i;
  const p = ROOMS[S.room - 1].spots[i];
  $('#modal').hidden = false; say('');
  PUZ[p.puzzle]();
  $('#pTitle').textContent = p.name;     // popup title = object name
}
function closeModal() { $('#modal').hidden = true; $('#puzzle').innerHTML = ''; S.paused = EDIT; }

/* ===== puzzles (all of them get harder with S.room) ===== */
const PUZ = {

  /* --- candle sequence: watch the flames, repeat the order --- */
  sequence() {
    const n = S.room + 2, speed = Math.max(280, 650 - S.room * 50);
    const seq = Array.from({ length: n }, () => rnd(0, 3));
    let pos = 0, input = false;
    head('The four candles', 'Watch the flames, then light them in the same order.');
    $('#puzzle').innerHTML = '<div class="candles">' + [0, 1, 2, 3].map(i => `<button class="candle c${i}" data-i="${i}" aria-label="Candle ${i + 1}"><span></span></button>`).join('') + '</div>';
    const cs = [...document.querySelectorAll('.candle')];
    const flash = i => { cs[i].classList.add('lit'); tone(220 + i * 110, .2, 'triangle', .1); setTimeout(() => cs[i].classList.remove('lit'), speed * .6); };
    const play = () => {
      input = false; pos = 0; S.paused = true; say('Watch...');
      seq.forEach((v, k) => setTimeout(() => flash(v), 600 + k * speed));
      setTimeout(() => { input = true; S.paused = false; say('Your turn.'); }, 600 + n * speed);
    };
    cs.forEach(c => c.onclick = () => {
      if (!input || S.busy) return;
      const i = +c.dataset.i; flash(i);
      if (i === seq[pos]) { if (++pos === n) solve(500); }
      else { penalty(); play(); }
    });
    play();
  },

  /* --- memory match: flip cards, find every pair --- */
  match() {
    const pairs = 2 + Math.ceil(S.room / 2);
    const sy = shuffle(['🕯️', '💀', '🗝️', '🪞', '🕷️', '🦇', '👁️', '🪦', '🔪']).slice(0, pairs);
    head('Memory match', 'Flip the cards and find every matching pair.');
    $('#puzzle').innerHTML = '<div class="cards">' + shuffle([...sy, ...sy]).map(s => `<button class="card" aria-label="Hidden card"><b>${s}</b></button>`).join('') + '</div>';
    let open = [], found = 0, lock = false;
    document.querySelectorAll('.card').forEach(c => c.onclick = () => {
      if (lock || S.busy || c.classList.contains('up')) return;
      c.classList.add('up'); open.push(c);
      if (open.length === 2) {
        const [a, b] = open;
        if (a.textContent === b.textContent) { open = []; tone(600, .1); if (++found === pairs) solve(500); }
        else { lock = true; setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; lock = false; }, 650); }
      }
    });
    S.paused = false;
  },

  /* --- riddle: type the answer (hint costs 5 seconds) --- */
  riddle() {
    const R = [
      [['I have hands but cannot clap. What am I?', ['clock', 'a clock', 'watch']],
       ['What has keys but opens no doors?', ['piano', 'keyboard', 'a piano']],
       ['The more you take, the more you leave behind. What am I?', ['footsteps', 'steps', 'footstep']]],
      [['I speak without a mouth and hear without ears. What am I?', ['echo', 'an echo']],
       ['What fills a room but takes up no space?', ['light']],
       ['The more of me there is, the less you see. What am I?', ['darkness', 'dark', 'fog']]],
      [['I follow you in the dark and vanish when the light is gone. What am I?', ['shadow', 'a shadow', 'shadows']],
       ['Forward I am heavy, backward I am not. What am I?', ['ton']],
       ['I am always coming but never arrive. What am I?', ['tomorrow', 'the future', 'future']]]
    ];
    const [q, ans] = pick(R[S.room <= 2 ? 0 : S.room <= 5 ? 1 : 2]);
    head('The whispering wall', 'Type the answer and press Enter.');
    $('#puzzle').innerHTML = `<p class="riddle">“${q}”</p><div class="row"><input id="ans" autocomplete="off" aria-label="Answer"><button class="btn" id="go">Answer</button></div><button class="btn ghost" id="hint">Hint (-5s)</button>`;
    const inp = $('#ans');
    const check = () => {
      if (S.busy) return;
      const v = inp.value.trim().toLowerCase(); if (!v) return;
      if (ans.includes(v)) solve(400); else { penalty(); inp.value = ''; say('Wrong. The wall laughs.'); }
    };
    $('#go').onclick = check;
    inp.onkeydown = e => { if (e.key === 'Enter') check(); };
    $('#hint').onclick = () => { if (S.busy) return; penalty(); say(`It starts with "${ans[0][0].toUpperCase()}".`); };
    S.paused = false; inp.focus();
  },

  /* --- number lock: read the notes, set the digits --- */
  code() {
    const n = S.room < 4 ? 3 : 4, d = [rnd(1, 5)];
    for (let i = 1; i < n; i++) {
      const p = d[i - 1], opts = [];
      for (let k = -4; k <= 4; k++) if (k && p + k >= 0 && p + k <= 9) opts.push(k);
      d.push(p + pick(opts));
    }
    let clues = d.map((v, i) => {
      if (!i) return 'Digit 1 is ' + v + '.';
      const k = v - d[i - 1];
      return `Digit ${i + 1} is digit ${i} ${k > 0 ? 'plus' : 'minus'} ${Math.abs(k)}.`;
    });
    if (S.room >= 5) clues = shuffle(clues);                                        // harder: scrambled notes
    if (S.room >= 6) clues.push('All digits add up to ' + d.reduce((a, b) => a + b, 0) + '.');
    head('The locked door', 'Read the scratched notes. Tap a digit to change it.');
    $('#puzzle').innerHTML = `<ul class="notes">${clues.map(c => `<li>${c}</li>`).join('')}</ul><div class="lock">${d.map(() => '<button class="dig" aria-label="Digit">0</button>').join('')}</div><button class="btn" id="open">Open</button>`;
    const ds = [...document.querySelectorAll('.dig')];
    ds.forEach(b => b.onclick = () => { b.textContent = (+b.textContent + 1) % 10; });
    $('#open').onclick = () => {
      if (S.busy) return;
      if (ds.every((b, i) => +b.textContent === d[i])) solve(600);
      else { penalty(); say('Locked. The handle rattles.'); }
    };
    S.paused = false;
  }
};

/* ===== layout editor (?edit): drag objects, copy the result ===== */
function showLayout() {
  $('#eRoom').textContent = `Room ${S.room}: ${ROOMS[S.room - 1].name}`;
  $('#eOut').value = ROOMS.flatMap(r => r.spots).map(p => { const [x, y, sz = p.s] = where(p); return `  '${p.name}': [${x}, ${y}, ${sz}],`; }).join('\n');
}
if (EDIT) {
  document.body.classList.add('edit'); $('#editbar').hidden = false;
  let drag = null;
  const sizeOf = el => +el.style.getPropertyValue('--s') || 10;
  const go = d => { S.room = (S.room - 1 + d + TOTAL_ROOMS) % TOTAL_ROOMS + 1; startRoom(); };
  $('#ePrev').onclick = () => go(-1);
  $('#eNext').onclick = () => go(1);
  $('#eCopy').onclick = () => { const o = $('#eOut'); o.select(); try { navigator.clipboard.writeText(o.value); } catch { document.execCommand('copy'); } };
  stage.addEventListener('pointerdown', e => { drag = e.target.closest('.spot'); if (drag) { drag.setPointerCapture(e.pointerId); e.preventDefault(); } });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const r = stage.getBoundingClientRect(), c = v => Math.min(100, Math.max(0, +v.toFixed(1)));
    const x = c((e.clientX - r.left) / r.width * 100), y = c((e.clientY - r.top) / r.height * 100);
    drag.style.left = x + '%'; drag.style.top = y + '%'; pos[drag.dataset.name] = [x, y, sizeOf(drag)];
  });
  stage.addEventListener('wheel', e => {                  // mouse wheel on an object = resize
    const b = e.target.closest('.spot'); if (!b) return;
    e.preventDefault();
    const sz = Math.min(30, Math.max(2, sizeOf(b) + (e.deltaY < 0 ? .5 : -.5)));
    b.style.setProperty('--s', sz);
    const [x, y] = where(ROOMS[S.room - 1].spots[+b.dataset.i]);
    pos[b.dataset.name] = [x, y, sz]; store.set(KEY_EDIT, pos); showLayout();
  }, { passive: false });
  stage.addEventListener('pointerup', () => { if (drag) { drag = null; store.set(KEY_EDIT, pos); showLayout(); } });
}

/* ===== fullscreen ===== */
function goFull() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) { try { el.requestFullscreen()?.catch(() => {}); } catch {} }
}
function toggleFull() {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch {}
}
if (!document.documentElement.requestFullscreen) $('#full').hidden = true;   // iphone safari has no fullscreen api

/* ===== jumpscare picture (loads early so it shows instantly) ===== */
const scareImg = $('#scareImg');
scareImg.onload = () => $('#scare').classList.add('pic');
scareImg.src = JUMPSCARE_IMG;

/* ===== flashlight: the dark circle follows your finger / mouse ===== */
['pointermove', 'pointerdown'].forEach(ev => stage.addEventListener(ev, e => {
  const r = stage.getBoundingClientRect();
  stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
  stage.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
}));

/* ===== buttons and events ===== */
$('#static').hidden = !STATIC_FX;
$('#bestStart').textContent = store.get(KEY_HIGH, 0);
$('#btnStart').onclick = newGame;
$('#btnGo').onclick = newGame;
$('#btnHow').onclick = () => show('how');
$('#btnBack').onclick = () => show('start');
$('#btnRestart').onclick = newGame;
$('#btnSave').onclick = saveScore;
$('#initials').onkeydown = e => { if (e.key === 'Enter') saveScore(); };
$('#full').onclick = toggleFull;
$('#close').onclick = closeModal;
$('#mute').onclick = e => {
  muted = !muted; e.target.textContent = muted ? '🔇' : '🔊';
  muted ? bgm.pause() : startMusic();
};
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
document.addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'mute') playClick(); });   // click sound on every button
stage.addEventListener('click', e => { const b = e.target.closest('.spot'); if (b) openSpot(+b.dataset.i); });