/* 
   la casa matusita
   escape the haunted house: solve 3 puzzles in every room
   before the timer runs out
   ------------------------------------------------------------
    1. settings                 8. timer
    2. rooms and objects        9. scoring and room progress
    3. helpers                 10. game over and scoreboard
    4. saved data              11. puzzle popup
    5. sound                   12. puzzles (candles, cards, riddle, lock)
    6. game state              13. layout editor (?edit)
    7. room scene              14. effects and buttons
    */


/* 
   1. settings (change file names and game rules here)
    */

/* files and folders (next to index.html) */
const DIR_ROOMS     = 'rooms/';
const DIR_OBJECTS   = 'objects/';
const MUSIC_FILE    = 'music files/bg-music.mp3';
const CLICK_FILE    = 'music files/click-sound.mp3';
const JUMPSCARE_IMG = 'jumpscare-face.jpg';
const JUMPSCARE_SND = 'music files/jumpscare-sound.mp3';

/* game rules */
const TOTAL_ROOMS = 7;
const TIME_FIRST  = 130;      // seconds in room 1
const TIME_DROP   = 12;       // seconds lost in every next room
const TIME_MIN    = 60;       // never less than this
const PENALTY     = 5;        // seconds lost for a wrong answer
const TIME_BONUS  = 5;        // points for every second left
const JUMPSCARE_MS = 2200;    // how long the jumpscare lasts
const POINTS = { sequence: 500, match: 500, riddle: 400, code: 600 };

/* look and feel (true / false) */
const SHOW_ICONS = true;      // false = hide object pictures, keep only the glow
const FLASHLIGHT = true;      // false = room is fully lit
const STATIC_FX  = true;      // false = no static / creepy filter
const CUT_LEVEL  = 22;        // 0-255, most it will treat as black background around an object (it adapts to each picture)
const FISHEYE    = .3;        // curve of the cctv lens (0 = flat, .45 = very curved)
const CCTV       = true;      // false = hide the camera text (REC, camera name, time)

/* edit mode: open index.html?edit to drag objects into place */
const EDIT = location.search.includes('edit');

/* names used for saving in the browser */
const KEY_HIGH = 'matusita_high', KEY_BOARD = 'matusita_board', KEY_EDIT = 'matusita_edit';


/* 
   2. rooms and objects
   ------------------------------------------------------------
   room picture   = rooms/<file>.jpg
   object picture = objects/<object-name>.jpg
   puzzle         = sequence | match | riddle | code
   x, y           = place on the room picture (percent)
   s              = size of the object (percent of picture width)
    */
const ROOMS = [
  { name: 'Foyer', hue: 0, file: 'foyer', spots: [
    { icon: '🕯️', name: 'Candelabra',        x: 52, y: 88, s: 6,   puzzle: 'sequence' },   // on the floor
    { icon: '🕰️', name: 'Grandfather clock', x: 39, y: 58, s: 7,   puzzle: 'riddle'   },   // by the side wall
    { icon: '🪞', name: 'Cracked mirror',    x: 9,  y: 38, s: 7,   puzzle: 'match'    } ] },// on the wall

  { name: 'Dining Room', hue: 350, file: 'dining-room', spots: [
    { icon: '🍷', name: 'Wine glass',   x: 58, y: 80, s: 4.5, puzzle: 'riddle' },           // on the table
    { icon: '🍽️', name: 'Dinner plate', x: 40, y: 84, s: 8,   puzzle: 'match'  },           // on the table
    { icon: '📦', name: 'Locked chest', x: 88, y: 68, s: 9,   puzzle: 'code'   } ] },        // lower far right of the door

  { name: 'Kitchen', hue: 30, file: 'kitchen', spots: [
    { icon: '🧊', name: 'Fridge',            x: 80, y: 56, s: 11, puzzle: 'code'     },     // at the fridge
    { icon: '🍲', name: 'Bubbling cauldron', x: 42, y: 84, s: 8,  puzzle: 'sequence' },     // on the floor
    { icon: '🔪', name: 'Knife block',       x: 44, y: 43, s: 5,  puzzle: 'riddle'   } ] }, // at the sink

  { name: 'Nursery', hue: 320, file: 'nursery', spots: [
    { icon: '🎼', name: 'Music box',     x: 30, y: 90, s: 7, puzzle: 'code'     },          // on the bed
    { icon: '🧸', name: 'Teddy bear',    x: 56, y: 86, s: 7, puzzle: 'match'    },          // on the floor
    { icon: '🎠', name: 'Rocking horse', x: 88, y: 86, s: 9, puzzle: 'sequence' } ] },      // right side of the room

  { name: 'Library', hue: 45, file: 'library', spots: [
    { icon: '🕯️', name: 'Reading candle', x: 62, y: 84, s: 4, puzzle: 'sequence' },        // on the floor
    { icon: '📖', name: 'Open book',      x: 50, y: 87, s: 7, puzzle: 'riddle'   },        // on the floor
    { icon: '🗝️', name: 'Brass key',      x: 64, y: 60, s: 4, puzzle: 'code'     } ] },    // on top of the chair

  { name: 'Cellar', hue: 190, file: 'cellar', spots: [
    { icon: '🕷️', name: 'Giant web', x: 42, y: 68, s: 9,  puzzle: 'match'  },               // bottom of the door
    { icon: '💀', name: 'Skull',     x: 22, y: 84, s: 5,  puzzle: 'riddle' },               // left of the floor
    { icon: '⚰️', name: 'Coffin',    x: 86, y: 85, s: 14, puzzle: 'code'   } ] },            // far right of the floor

  { name: 'Attic', hue: 270, file: 'attic', spots: [
    { icon: '📻', name: 'Old radio',       x: 24, y: 82, s: 9,  puzzle: 'sequence' },       // bottom left
    { icon: '🎎', name: 'Porcelain dolls', x: 86, y: 64, s: 6,  puzzle: 'match'    },       // top right of the floor
    { icon: '🪜', name: 'Attic hatch',     x: 52, y: 74, s: 11, puzzle: 'code'     } ] }    // middle of the floor
];

/* final object positions: [x, y, size]. leave empty or paste from ?edit
   example:  'Candelabra': [52, 88, 6], */
const LAYOUT = {
};


/* 
   3. helpers
    */
const $ = s => document.querySelector(s);
const stage = $('#stage');
const spots = $('#spots');

const rnd  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;     // random whole number a..b
const pick = list => list[rnd(0, list.length - 1)];                      // random item
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');     // "Wine glass" -> "wine-glass"

const shuffle = list => {
  list = [...list];
  for (let i = list.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const show = id => document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
const say  = text => { $('#msg').textContent = text; };                  // message inside the popup
const head = (title, hint) => { $('#pTitle').textContent = title; $('#pHint').textContent = hint; };

/* makes a value that was not used yet in this game (so puzzles never repeat) */
function unique(kind, make) {
  let value, tries = 0;
  do { value = make(); } while (S.used[kind].has(value) && ++tries < 60);
  S.used[kind].add(value);
  return value;
}


/* 
   4. saved data (localStorage)
    */
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value)    { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};

/* object positions in use (LAYOUT, plus what you dragged in edit mode) */
let pos = { ...LAYOUT, ...(EDIT ? store.get(KEY_EDIT, {}) : {}) };
const where = p => pos[p.name] || [p.x, p.y, p.s];


/* 
   5. sound
    */
let muted = false, ctx = null;
const AudioCtx = window.AudioContext || window.webkitAudioContext;

const bgm      = new Audio(MUSIC_FILE);     bgm.loop = true; bgm.volume = .35;
const clickSnd = new Audio(CLICK_FILE);     clickSnd.volume = .7;
const jumpSnd  = new Audio(JUMPSCARE_SND);  jumpSnd.volume = 1;

function startMusic() { if (!muted) bgm.play().catch(() => {}); }

function playClick() {
  if (muted) return;
  try { clickSnd.currentTime = 0; clickSnd.play().catch(() => {}); } catch {}
}

/* jumpscare sound (uses the made-with-code screech if the file is missing) */
function playJumpscare() {
  if (muted) return;
  try { jumpSnd.currentTime = 0; jumpSnd.play().catch(screech); } catch { screech(); }
}

/* short beep made with code */
function tone(freq, length = .15, type = 'sine', volume = .08) {
  if (muted) return;
  try {
    ctx = ctx || new AudioCtx();
    const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime;
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(.0001, t + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + length);
  } catch {}
}

/* backup scream made with code */
function screech() {
  if (muted) return;
  try {
    ctx = ctx || new AudioCtx();
    const t = ctx.currentTime;
    [90, 180, 1200, 1750].forEach(freq => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.8, t + 1.2);
      gain.gain.setValueAtTime(.25, t);
      gain.gain.exponentialRampToValueAtTime(.001, t + 1.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 1.4);
    });
  } catch {}
}


/* 
   6. game state
    */
let S = {}, tick = null, lastSec = -1;

function newGame() {
  goFull();
  startMusic();
  S = {
    room: 1, score: 0,
    time: 0, max: 0,
    paused: EDIT, busy: false, done: false,
    solved: [], cur: 0,
    used: { riddle: new Set(), code: new Set(), seq: new Set() }      // remembers puzzles already shown
  };
  $('#hBest').textContent = store.get(KEY_HIGH, 0);
  show('game');
  startRoom();
}

function startRoom() {
  const R = ROOMS[S.room - 1];
  S.max    = Math.max(TIME_MIN, TIME_FIRST - (S.room - 1) * TIME_DROP);   // harder: less time every room
  S.time   = S.max;
  S.busy   = false;
  S.solved = [false, false, false];

  document.body.style.setProperty('--h', R.hue);
  $('#hRoom').textContent  = S.room;
  $('#hName').textContent  = R.name;
  $('#hScore').textContent = S.score;
  $('#barFill').style.width = '100%';
  $('#timeText').textContent = EDIT ? 'edit mode' : S.max + 's';

  closeModal();
  drawScene();
  updateCamera();
  stage.classList.remove('switch'); void stage.offsetWidth; stage.classList.add('switch');     // static burst, like changing camera
  clearInterval(tick);
  tick = setInterval(loop, 100);
}


/* 
   7. room scene (picture, fisheye lens, glowing objects)
    */
const fishCache = new Map();       // room file -> curved picture (made once per room)
const fishOn    = {};              // room file -> true when its picture is curved

/* moves a position (percent) the same way the lens moves the picture */
function fishPoint(x, y) {
  const k = FISHEYE, zoom = 1 + k, sx = x / 50 - 1, sy = y / 50 - 1;
  let ox = sx, oy = sy;
  for (let n = 0; n < 12; n++) {                                   // finds where the spot lands after the bend
    const f = zoom / (1 + k * (ox * ox + oy * oy));
    ox = sx * f; oy = sy * f;
  }
  return [(ox + 1) * 50, (oy + 1) * 50];
}

/* makes a fisheye copy of a picture: middle bigger, edges squeezed, small color split at the edges */
function fisheye(img) {
  const k = FISHEYE, zoom = 1 + k;
  const w = Math.min(img.naturalWidth, 1100), h = Math.round(img.naturalHeight * w / img.naturalWidth);

  const from = document.createElement('canvas'); from.width = w; from.height = h;
  const g = from.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h).data;                     // throws if the browser blocks it

  const to = document.createElement('canvas'); to.width = w; to.height = h;
  const g2 = to.getContext('2d'), out = g2.createImageData(w, h), dst = out.data;
  const split = [1.012, 1, .988];                                  // red, green, blue bend a little differently

  /* smooth pixel value at a decimal position (black when far outside the picture) */
  const sample = (px, py, c) => {
    if (px < -2 || py < -2 || px > w + 1 || py > h + 1) return 0;
    px = Math.min(w - 1, Math.max(0, px)); py = Math.min(h - 1, Math.max(0, py));
    const x0 = px | 0, y0 = py | 0, x1 = x0 + 1 < w ? x0 + 1 : x0, y1 = y0 + 1 < h ? y0 + 1 : y0, fx = px - x0, fy = py - y0;
    const a = src[(y0 * w + x0) * 4 + c], b = src[(y0 * w + x1) * 4 + c], d = src[(y1 * w + x0) * 4 + c], e = src[(y1 * w + x1) * 4 + c];
    return (a + (b - a) * fx) * (1 - fy) + (d + (e - d) * fx) * fy;
  };

  for (let y = 0; y < h; y++) {
    const ny = (y + .5) / h * 2 - 1;
    for (let x = 0; x < w; x++) {
      const nx = (x + .5) / w * 2 - 1, f = (1 + k * (nx * nx + ny * ny)) / zoom, i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const s = f * split[c];
        dst[i + c] = sample(((nx * s + 1) / 2) * w - .5, ((ny * s + 1) / 2) * h - .5, c);
      }
      dst[i + 3] = 255;
    }
  }
  g2.putImageData(out, 0, 0);
  return to.toDataURL('image/jpeg', .9);
}

/* shows a picture (flat or curved) as the room background */
function setPicture(R, src) {
  stage.style.backgroundImage = `url("${src}"), radial-gradient(ellipse at 50% 35%, hsl(${R.hue} 35% 20%), hsl(${R.hue} 30% 4%))`;
}

/* where an object sits on the screen (moved by the lens when the picture is curved) */
function spotAt(R, p) {
  const [x, y, size = p.s] = where(p);
  const [px, py] = fishOn[R.file] && !EDIT ? fishPoint(x, y) : [x, y];
  return { px, py, size };
}

function placeSpots() {
  const R = ROOMS[S.room - 1];
  spots.querySelectorAll('.spot').forEach(el => {
    const { px, py } = spotAt(R, R.spots[+el.dataset.i]);
    el.style.left = px + '%'; el.style.top = py + '%';
  });
}

function drawScene() {
  const R = ROOMS[S.room - 1], url = DIR_ROOMS + R.file + '.jpg';
  const curved = FISHEYE && !EDIT && fishCache.get(R.file);
  fishOn[R.file] = !!curved;

  /* room picture (the box takes the shape of the picture) */
  stage.dataset.room = R.name;
  stage.classList.toggle('nolight', !FLASHLIGHT || EDIT);
  stage.classList.remove('has-img');
  stage.style.setProperty('--ar', 1.7778);
  setPicture(R, curved || url);

  const probe = new Image();
  probe.onload = () => {
    stage.style.setProperty('--ar', probe.naturalWidth / probe.naturalHeight);
    stage.classList.add('has-img');
    if (!FISHEYE || EDIT || fishCache.has(R.file)) return;
    try { fishCache.set(R.file, fisheye(probe)); } catch { return; }      // blocked: keep the flat picture
    if (ROOMS[S.room - 1] === R) { fishOn[R.file] = true; setPicture(R, fishCache.get(R.file)); placeSpots(); }
  };
  probe.src = url;

  /* the 3 glowing objects */
  spots.innerHTML = R.spots.map((p, i) => {
    const done = S.solved[i], { px, py, size } = spotAt(R, p);
    const pic  = SHOW_ICONS ? `<img alt="" draggable="false" data-src="${DIR_OBJECTS + slug(p.name)}.jpg">` : '';
    return `<button class="spot${done ? ' done' : ''}" data-i="${i}" data-name="${p.name}"
              style="left:${px}%;top:${py}%;--s:${size}" aria-label="${p.name}" title="${p.name}"${done ? ' disabled' : ''}>${pic}</button>`;
  }).join('');

  /* remove the black around each object so only the object glows */
  spots.querySelectorAll('.spot img').forEach(img => {
    cutout(img.dataset.src)
      .then(result => { img.src = result; })
      .catch(err => {
        if (err === 'missing') img.replaceWith(document.createTextNode(R.spots[+img.closest('.spot').dataset.i].icon));   // no picture: use the emoji
        else { img.src = img.dataset.src; img.classList.add('raw'); }                                                    // blocked: soft edges instead
      });
  });

  $('#hSolved').textContent = S.solved.filter(Boolean).length;
  if (EDIT) showLayout();
}

/* turns the black background of an object picture transparent.
   it reads how dark the picture border is, so dark objects (chest, plate) keep their shape */
const cutCache = new Map();

function cutout(src) {
  if (cutCache.has(src)) return cutCache.get(src);

  const job = new Promise((resolve, reject) => {
    const im = new Image();
    im.onerror = () => reject('missing');
    im.onload = () => {
      try {
        /* draw the picture on a canvas */
        const k = Math.min(1, 400 / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const g = canvas.getContext('2d'); g.drawImage(im, 0, 0, w, h);
        const data = g.getImageData(0, 0, w, h), a = data.data;
        const lum = i => (a[i * 4] + a[i * 4 + 1] + a[i * 4 + 2]) / 3;

        /* how dark is the background? look at the border of the picture */
        const border = [];
        for (let x = 0; x < w; x++) border.push(lum(x), lum((h - 1) * w + x));
        for (let y = 0; y < h; y++) border.push(lum(y * w), lum(y * w + w - 1));
        border.sort((p, q) => p - q);
        const bg = border[Math.floor(border.length * .9)];

        /* spread through the dark pixels that touch the border (stops at anything brighter than "level") */
        const spread = level => {
          const gone = new Uint8Array(w * h), todo = []; let count = 0;
          const add = i => { if (!gone[i] && lum(i) < level) { gone[i] = 1; count++; todo.push(i); } };
          for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
          for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
          while (todo.length) {
            const i = todo.pop(), x = i % w;
            if (x > 0) add(i - 1);
            if (x < w - 1) add(i + 1);
            if (i >= w) add(i - w);
            if (i < w * (h - 1)) add(i + w);
          }
          return { gone, count };
        };

        const level = Math.min(CUT_LEVEL, bg + 6), res = spread(level);
        if (res.count < w * h * .02) throw 'blocked';              // no black background found: keep the picture as it is
        const gone = res.gone;

        /* make the background transparent and fade the dark fringe on the object edge */
        for (let i = 0; i < w * h; i++) {
          if (gone[i]) { a[i * 4 + 3] = 0; continue; }
          const x = i % w;
          if ((x > 0 && gone[i - 1]) || (x < w - 1 && gone[i + 1]) || (i >= w && gone[i - w]) || (i < w * (h - 1) && gone[i + w])) {
            a[i * 4 + 3] = Math.max(0, Math.min(255, (lum(i) - level) * 8));
          }
        }
        g.putImageData(data, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { reject('blocked'); }
    };
    im.src = src;
  });

  cutCache.set(src, job);
  return job;
}

/* camera text: room name and a night clock (12 AM in room 1 ... 6 AM in room 7) */
const HOURS = ['12', '1', '2', '3', '4', '5', '6'];

function updateCamera() {
  const minutes = EDIT ? 0 : Math.min(59, Math.floor((1 - S.time / S.max) * 60));
  $('#camName').textContent = `CAM ${String(S.room).padStart(2, '0')} - ${ROOMS[S.room - 1].name}`;
  $('#camTime').textContent = `${HOURS[S.room - 1]}:${String(minutes).padStart(2, '0')} AM`;
}


/* 
   8. timer
    */
function loop() {
  if (S.paused || S.done) return;

  S.time = Math.max(0, S.time - .1);
  $('#barFill').style.width  = (S.time / S.max * 100) + '%';
  $('#timeText').textContent = Math.ceil(S.time) + 's';
  updateCamera();

  /* last 10 seconds: red screen and heartbeat */
  const sec = Math.ceil(S.time);
  document.body.classList.toggle('danger', S.time <= 10);
  if (S.time <= 10 && sec !== lastSec) { lastSec = sec; tone(70, .25, 'sine', .25); }

  if (S.time <= 0) lose();
}


/* 
   9. scoring and room progress
    */

/* wrong answer: lose time and shake the screen */
function penalty() {
  S.time = Math.max(.1, S.time - PENALTY);
  tone(110, .3, 'square', .12);
  const g = $('#game');
  g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit');
}

/* puzzle solved: add points, mark the object, open the next room when all 3 are done */
function solve(type) {
  if (S.busy) return;
  S.busy = true; S.paused = true;

  const base = POINTS[type], bonus = Math.ceil(S.time) * TIME_BONUS;
  S.score += base + bonus;
  $('#hScore').textContent = S.score;
  say(`Unlocked! +${base} puzzle, +${bonus} time bonus`);
  tone(520, .12); setTimeout(() => tone(780, .2), 120);

  setTimeout(() => {
    S.solved[S.cur] = true;
    closeModal();
    drawScene();
    if (S.solved.every(Boolean)) roomCleared(); else S.busy = false;
  }, 1200);
}

function roomCleared() {
  S.paused = true; S.busy = true;
  tone(300, .4, 'triangle', .12);
  setTimeout(() => {
    if (S.room >= TOTAL_ROOMS) end(true);      // last room done: you win
    else { S.room++; startRoom(); }
  }, 1400);
}


/* 
   10. game over and scoreboard
    */

/* time ran out: jumpscare, then the game over screen */
function lose() {
  S.done = true;
  clearInterval(tick);
  document.body.classList.remove('danger');
  closeModal();
  bgm.pause();

  $('#scare').classList.add('on');
  playJumpscare();
  setTimeout(() => {
    $('#scare').classList.remove('on');
    jumpSnd.pause();
    end(false);
  }, JUMPSCARE_MS);
}

function end(won) {
  S.done = true;
  clearInterval(tick);
  document.body.classList.remove('danger');
  document.body.style.setProperty('--h', 18);
  startMusic();

  const best = store.get(KEY_HIGH, 0), isNew = S.score > best;
  if (isNew) store.set(KEY_HIGH, S.score);

  $('#oTitle').textContent = won ? 'You escaped' : 'The house keeps you';
  $('#oText').textContent  = won ? 'The front door finally opens. Do not look back.'
                                 : `The lights go out. The ${ROOMS[S.room - 1].name} is yours forever.`;
  $('#oScore').textContent = S.score;
  $('#oRoom').textContent  = won ? TOTAL_ROOMS : S.room - 1;
  $('#oBest').textContent  = isNew ? 'New high score!' : 'High score: ' + best;
  $('#saveBox').style.display = S.score > 0 ? 'block' : 'none';
  $('#initials').value = '';

  renderBoard();
  show('over');
}

/* top 5 scores with initials */
function renderBoard() {
  const board = store.get(KEY_BOARD, []);
  $('#board').innerHTML = board.length ? board.map(e => `<li>${e.n} : ${e.s}</li>`).join('') : '<li>No scores yet.</li>';
}

function saveScore() {
  const initials = $('#initials').value.toUpperCase().replace(/[^A-Z0-9]/g, '') || '???';
  const board = store.get(KEY_BOARD, []);
  board.push({ n: initials, s: S.score });
  board.sort((a, b) => b.s - a.s);
  store.set(KEY_BOARD, board.slice(0, 5));
  $('#saveBox').style.display = 'none';
  renderBoard();
}


/* 
   11. puzzle popup
    */
function openSpot(i) {
  if (EDIT || S.busy || S.done || S.solved[i]) return;
  S.cur = i;
  const spot = ROOMS[S.room - 1].spots[i];
  $('#modal').hidden = false;
  say('');
  PUZ[spot.puzzle]();                        // builds the puzzle inside the popup
  $('#pTitle').textContent = spot.name;      // popup title = object name
}

function closeModal() {
  $('#modal').hidden = true;
  $('#puzzle').innerHTML = '';
  S.paused = EDIT;
}


/* 
   12. puzzles
   every puzzle gets harder with the room number,
   and nothing repeats inside one game
    */

/* --- riddles: 5 easy (rooms 1-2), 6 medium (rooms 3-5), 5 hard (rooms 6-7) --- */
const RIDDLES = [
  [ { q: 'I have hands but cannot clap. What am I?',                          a: ['clock', 'watch'] },
    { q: 'What has keys but opens no doors?',                                 a: ['piano', 'keyboard'] },
    { q: 'The more you take, the more you leave behind. What am I?',          a: ['footsteps', 'steps', 'footstep'] },
    { q: 'What gets wetter the more it dries?',                               a: ['towel'] },
    { q: 'I have a neck and a cap, but no head. What am I?',                  a: ['bottle'] } ],

  [ { q: 'I speak without a mouth and hear without ears. What am I?',         a: ['echo'] },
    { q: 'What fills a room but takes up no space?',                          a: ['light'] },
    { q: 'The more of me there is, the less you see. What am I?',             a: ['darkness', 'dark'] },
    { q: 'What has teeth but cannot bite?',                                   a: ['comb'] },
    { q: 'I have cities but no houses, and water but no fish. What am I?',    a: ['map'] },
    { q: 'What can you catch but never throw?',                               a: ['cold', 'a cold'] } ],

  [ { q: 'I follow you in the dark and vanish when the light is gone. What am I?', a: ['shadow', 'shadows'] },
    { q: 'Forward I am heavy, backward I am not. What am I?',                 a: ['ton'] },
    { q: 'I am always coming but never arrive. What am I?',                   a: ['tomorrow', 'future'] },
    { q: 'I am not alive, but I grow. I need air, but I have no lungs. What am I?', a: ['fire'] },
    { q: 'What comes once in a minute, twice in a moment, never in a thousand years?', a: ['m', 'letter m'] } ]
];

/* --- card faces: older emoji that every phone and PC can draw --- */
const SYMBOLS = ['💀', '👻', '🕷️', '🦇', '🔪', '🗝️', '🕯️', '⚰️', '👁️', '🎃', '🔮', '🕸️'];
const CARD_COLUMNS = [3, 4, 5, 4, 7, 4, 6];        // cards per row for rooms 1 to 7

const PUZ = {

  /* ----- candle sequence: watch the flames, repeat the order ----- */
  sequence() {
    const candles = S.room < 3 ? 4 : S.room < 5 ? 5 : 6;           // more candles in later rooms
    const length  = S.room + 2;                                    // flashes to remember
    const speed   = Math.max(280, 650 - S.room * 50);              // faster in later rooms
    const order   = unique('seq', () => Array.from({ length }, () => rnd(0, candles - 1)).join('')).split('').map(Number);
    let step = 0, listening = false;

    head('The candles', 'Watch the flames, then light them in the same order.');
    $('#puzzle').innerHTML =
      `<div class="candles" style="--n:${candles === 6 ? 3 : candles}">` +
      Array.from({ length: candles }, (_, i) => `<button class="candle c${i}" data-i="${i}" aria-label="Candle ${i + 1}"><span></span></button>`).join('') +
      '</div>';
    const buttons = [...document.querySelectorAll('.candle')];

    const flash = i => {
      buttons[i].classList.add('lit');
      tone(220 + i * 90, .2, 'triangle', .1);
      setTimeout(() => buttons[i].classList.remove('lit'), speed * .6);
    };

    /* the demo: timer stops while the candles light up */
    const demo = () => {
      listening = false; step = 0; S.paused = true; say('Watch...');
      order.forEach((c, k) => setTimeout(() => flash(c), 600 + k * speed));
      setTimeout(() => { listening = true; S.paused = false; say('Your turn.'); }, 600 + length * speed);
    };

    /* the player's turn */
    buttons.forEach(b => b.onclick = () => {
      if (!listening || S.busy) return;
      const i = +b.dataset.i;
      flash(i);
      if (i === order[step]) { if (++step === length) solve('sequence'); }
      else { penalty(); demo(); }                                  // wrong candle: lose time, watch again
    });

    demo();
  },


  /* ----- memory match: room 1 has 6 cards, every room adds 2 more ----- */
  match() {
    const pairs = 2 + S.room;                                      // 3 pairs (6 cards) ... 9 pairs (18 cards)
    const faces = shuffle(SYMBOLS).slice(0, pairs);
    let open = [], found = 0, locked = false;

    head('Memory match', `Find all ${pairs} matching pairs (${pairs * 2} cards).`);
    $('#puzzle').innerHTML =
      `<div class="cards" style="--cols:${CARD_COLUMNS[S.room - 1]}">` +
      shuffle([...faces, ...faces]).map(f => `<button class="card" data-s="${f}" aria-label="Hidden card"><b>${f}</b></button>`).join('') +
      '</div>';

    document.querySelectorAll('.card').forEach(card => card.onclick = () => {
      if (locked || S.busy || card.classList.contains('up')) return;
      card.classList.add('up');
      open.push(card);
      if (open.length < 2) return;

      const [a, b] = open;
      if (a.dataset.s === b.dataset.s) {                           // a pair
        open = []; tone(600, .1);
        if (++found === pairs) solve('match');
      } else {                                                     // not a pair: flip back
        locked = true;
        setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; locked = false; }, 650);
      }
    });

    S.paused = false;
  },


  /* ----- riddle: a different riddle every time (hint costs 5 seconds) ----- */
  riddle() {
    const tier = S.room <= 2 ? 0 : S.room <= 5 ? 1 : 2;
    const fresh = list => list.filter(r => !S.used.riddle.has(r.q));
    let pool = fresh(RIDDLES[tier]);
    if (!pool.length) pool = fresh(RIDDLES.flat());                // this level ran out: borrow from another
    if (!pool.length) { S.used.riddle.clear(); pool = RIDDLES[tier]; }
    const riddle = pick(pool);
    S.used.riddle.add(riddle.q);

    const clean = text => text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/^(a|an|the) /, '');

    head('The whispering wall', 'Type the answer and press Enter.');
    $('#puzzle').innerHTML =
      `<p class="riddle">“${riddle.q}”</p>
       <div class="row"><input id="ans" autocomplete="off" aria-label="Answer"><button class="btn" id="go">Answer</button></div>
       <button class="btn ghost" id="hint">Hint (-${PENALTY}s)</button>`;
    const input = $('#ans');

    const check = () => {
      if (S.busy || !input.value.trim()) return;
      if (riddle.a.some(ans => clean(ans) === clean(input.value))) solve('riddle');
      else { penalty(); input.value = ''; say('Wrong. The wall laughs.'); }
    };

    $('#go').onclick = check;
    input.onkeydown = e => { if (e.key === 'Enter') check(); };
    $('#hint').onclick = () => { if (S.busy) return; penalty(); say(`It starts with "${riddle.a[0][0].toUpperCase()}".`); };

    S.paused = false;
    input.focus();
  },


  /* ----- number lock: tap the arrows, it opens by itself when the code is right ----- */
  code() {
    const length  = S.room < 4 ? 3 : 4;                            // 3 digits, then 4 digits
    const ordinal = ['1st', '2nd', '3rd', '4th'];

    /* a new secret code every time: each digit is 1 to 4 away from the one before it */
    const secret = unique('code', () => {
      const d = [rnd(1, 5)];
      for (let i = 1; i < length; i++) {
        const prev = d[i - 1], steps = [];
        for (let k = -4; k <= 4; k++) if (k && prev + k >= 1 && prev + k <= 9) steps.push(k);     // digits 1-9, so a fresh lock (all 0) never opens by accident
        d.push(prev + pick(steps));
      }
      return d.join('');
    });
    const digits = secret.split('').map(Number);

    /* the scratched notes */
    let notes = digits.map((v, i) => {
      if (i === 0) return `The 1st digit is ${v}.`;
      const diff = v - digits[i - 1];
      return `The ${ordinal[i]} digit is the ${ordinal[i - 1]} digit ${diff > 0 ? 'plus' : 'minus'} ${Math.abs(diff)}.`;
    });
    if (S.room >= 5) notes = shuffle(notes);                                       // harder: mixed up notes
    if (S.room >= 6) notes.push(`All the digits add up to ${digits.reduce((a, b) => a + b, 0)}.`);

    head('The locked door', 'Read the scratched notes. Tap the arrows to set the code.');
    $('#puzzle').innerHTML =
      `<ul class="notes">${notes.map(n => `<li>${n}</li>`).join('')}</ul>
       <div class="lock">${digits.map((_, i) =>
         `<div class="wheel">
            <button data-i="${i}" data-d="1" aria-label="Digit ${i + 1} up">▲</button>
            <output>0</output>
            <button data-i="${i}" data-d="-1" aria-label="Digit ${i + 1} down">▼</button>
          </div>`).join('')}
       </div>
       <button class="btn" id="open">Open</button>`;

    const entered = digits.map(() => 0);
    const screens = [...document.querySelectorAll('.wheel output')];

    /* every tap changes one digit, and opens the lock when the whole code matches */
    document.querySelector('.lock').onclick = e => {
      const b = e.target.closest('button');
      if (!b || S.busy) return;
      const i = +b.dataset.i;
      entered[i] = (entered[i] + +b.dataset.d + 10) % 10;
      screens[i].textContent = entered[i];
      tone(200, .05, 'square', .05);
      if (entered.join('') === secret) solve('code');
    };

    /* the open button: wrong code costs time */
    $('#open').onclick = () => {
      if (S.busy) return;
      if (entered.join('') === secret) solve('code');
      else { penalty(); say('Locked. The handle rattles.'); }
    };

    S.paused = false;
  }
};


/* 
   13. layout editor (open index.html?edit)
   drag = move an object, mouse wheel = resize it
    */
function showLayout() {
  $('#eRoom').textContent = `Room ${S.room}: ${ROOMS[S.room - 1].name}`;
  $('#eOut').value = ROOMS.flatMap(r => r.spots).map(p => {
    const [x, y, size = p.s] = where(p);
    return `  '${p.name}': [${x}, ${y}, ${size}],`;
  }).join('\n');
}

if (EDIT) {
  document.body.classList.add('edit');
  $('#editbar').hidden = false;

  let dragging = null;
  const sizeOf = el => +el.style.getPropertyValue('--s') || 10;
  const nextRoom = step => { S.room = (S.room - 1 + step + TOTAL_ROOMS) % TOTAL_ROOMS + 1; startRoom(); };

  $('#ePrev').onclick = () => nextRoom(-1);
  $('#eNext').onclick = () => nextRoom(1);
  $('#eCopy').onclick = () => {
    const out = $('#eOut'); out.select();
    try { navigator.clipboard.writeText(out.value); } catch { document.execCommand('copy'); }
  };

  stage.addEventListener('pointerdown', e => {
    dragging = e.target.closest('.spot');
    if (dragging) { dragging.setPointerCapture(e.pointerId); e.preventDefault(); }
  });

  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const r = stage.getBoundingClientRect(), clamp = v => Math.min(100, Math.max(0, +v.toFixed(1)));
    const x = clamp((e.clientX - r.left) / r.width * 100), y = clamp((e.clientY - r.top) / r.height * 100);
    dragging.style.left = x + '%'; dragging.style.top = y + '%';
    pos[dragging.dataset.name] = [x, y, sizeOf(dragging)];
  });

  stage.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = null; store.set(KEY_EDIT, pos); showLayout();
  });

  stage.addEventListener('wheel', e => {
    const b = e.target.closest('.spot'); if (!b) return;
    e.preventDefault();
    const size = Math.min(30, Math.max(2, sizeOf(b) + (e.deltaY < 0 ? .5 : -.5)));
    b.style.setProperty('--s', size);
    const [x, y] = where(ROOMS[S.room - 1].spots[+b.dataset.i]);
    pos[b.dataset.name] = [x, y, size];
    store.set(KEY_EDIT, pos); showLayout();
  }, { passive: false });
}


/* 
   14. effects and buttons
    */

/* --- fullscreen --- */
function goFull() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) { try { el.requestFullscreen()?.catch(() => {}); } catch {} }
}
function toggleFull() {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch {}
}
if (!document.documentElement.requestFullscreen) $('#full').hidden = true;     // iphone safari has no fullscreen

/* --- jumpscare picture (loads early so it shows instantly) --- */
$('#scareImg').onload = () => $('#scare').classList.add('pic');
$('#scareImg').src = JUMPSCARE_IMG;

/* --- flashlight follows your finger / mouse --- */
['pointermove', 'pointerdown'].forEach(name => stage.addEventListener(name, e => {
  const r = stage.getBoundingClientRect();
  stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
  stage.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
}));

/* --- camera text on / off --- */
$('#cctv').hidden = !CCTV;

/* --- static filter on / off --- */
$('#static').hidden = !STATIC_FX;

/* --- buttons --- */
$('#bestStart').textContent = store.get(KEY_HIGH, 0);
$('#btnStart').onclick   = newGame;
$('#btnGo').onclick      = newGame;
$('#btnRestart').onclick = newGame;
$('#btnHow').onclick     = () => show('how');
$('#btnBack').onclick    = () => show('start');
$('#btnSave').onclick    = saveScore;
$('#full').onclick       = toggleFull;
$('#close').onclick      = closeModal;
$('#initials').onkeydown = e => { if (e.key === 'Enter') saveScore(); };
$('#mute').onclick = e => {
  muted = !muted;
  e.target.textContent = muted ? '🔇' : '🔊';
  muted ? bgm.pause() : startMusic();
};

/* --- tap on an object, escape closes the popup, click sound on every button --- */
stage.addEventListener('click', e => { const b = e.target.closest('.spot'); if (b) openSpot(+b.dataset.i); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
document.addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'mute') playClick(); });