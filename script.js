/* ============================================================
   la casa matusita - script.js
   escape the haunted house: solve 3 puzzles in every room
   before the timer runs out (and before your sanity does)
   ------------------------------------------------------------
    1. settings                 9. timer
    2. rooms and objects       10. hallway (video + jumpscares)
    3. helpers                 11. scoring and room progress
    4. saved data              12. game over and scoreboard
    5. sound                   13. puzzle popup
    6. game state              14. puzzles (candles, cards, riddle, lock)
    7. room scene (fisheye)    15. layout editor (?edit)
    8. sanity system           16. effects and buttons
   ============================================================ */


/* ============================================================
   1. settings (change file names and game rules here)
   ============================================================ */

/* folders (next to index.html) - names must match your folders exactly */
const DIR_ROOMS     = 'rooms/';
const DIR_OBJECTS   = 'objects/';
const DIR_MUSIC     = 'music files/';
const DIR_SCARES    = 'jumpscare pictures/';

/* files inside those folders */
const MUSIC_FILE    = encodeURI(DIR_MUSIC + 'bg-music.mp3');
const CLICK_FILE    = encodeURI(DIR_MUSIC + 'click-sound.mp3');
const JUMPSCARE_SND = encodeURI(DIR_MUSIC + 'jumpscare-sound.mp3');
const JUMPSCARE_IMG = encodeURI(DIR_SCARES + 'jumpscare-face.jpg');          // when the timer runs out
const JUMPSCARE_ROOM = DIR_SCARES + 'jumpscare-room-';                         // + room number + .jpg (hallway scares)

/* game rules */
const TOTAL_ROOMS = 7;
const TIME_FIRST  = 130;      // seconds in room 1
const TIME_DROP   = 12;       // seconds lost in every next room
const TIME_MIN    = 60;       // never less than this
const PENALTY     = 5;        // seconds lost for a wrong answer
const TIME_BONUS  = 5;        // points for every second left
const JUMPSCARE_MS = 2200;    // how long the jumpscare lasts
/* sanity system */
const SANITY_MAX = 100;
const SANITY_WRONG_LOSS = 7;       // wrong answers and hints
const SANITY_HALL_LOSS = 7;        // hallway jumpscares
const SANITY_HAUNT_LOSS = 5;       // random ghost encounter inside a room
const SANITY_ROOM_RECOVERY = 10;   // regain sanity after clearing a room
const SANITY_WARY = 75;
const SANITY_UNSETTLED = 50;
const SANITY_CRITICAL = 25;

/* hallway between the rooms */
const HALLWAY        = true;    // false = go straight from room to room
const HALL_MIN_CLICKS = 3;     // fewest clicks between two doors
const HALL_MAX_CLICKS = 4;     // most clicks between two doors
const HALL_STEP      = 1.6;    // how far one click walks
const HALL_ARRIVE    = 2.5;    // how far before the door you stop
const HALL_WALK_MS   = 850;    // how long one step takes
const POINTS = { sequence: 500, match: 500, riddle: 400, code: 600 };

/* hallway video: the first file that exists is used (if none is found, the drawn hallway is used) */
const HALL_VIDEO = ['hallway.mp4', 'video/hallway.mp4', 'videos/hallway.mp4', 'music files/hallway.mp4'];
const HALL_FIT   = 'cover';   // 'cover' = fills the whole screen (crops a bit), 'contain' = shows the whole picture

/* look and feel (true / false) */
const CUT_FACES  = true;      // false = jumpscare pictures are shown as they are (no background removal)
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


/* ============================================================
   2. rooms and objects
   ------------------------------------------------------------
   room picture   = rooms/<file>.jpg
   object picture = objects/<object-name>.jpg
   puzzle         = sequence | match | riddle | code
   x, y           = place on the room picture (percent)
   s              = size of the object (percent of picture width)
   ============================================================ */
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


/* ============================================================
   3. helpers
   ============================================================ */
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


/* ============================================================
   4. saved data (localStorage)
   ============================================================ */
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value)    { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};

/* object positions in use (LAYOUT, plus what you dragged in edit mode) */
let pos = { ...LAYOUT, ...(EDIT ? store.get(KEY_EDIT, {}) : {}) };
const where = p => pos[p.name] || [p.x, p.y, p.s];


/* ============================================================
   5. sound
   ============================================================ */
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


/* ============================================================
   6. game state
   ============================================================ */
let S = {}, tick = null, lastSec = -1;

function newGame() {
  goFull();
  startMusic();
  S = {
    room: 1, score: 0,
    time: 0, max: 0,
    sanity: SANITY_MAX,
    elapsed: 0, hauntAt: 0, haunted: false, nextGlitchAt: 0,
    paused: EDIT, busy: false, done: false,
    solved: [], cur: 0,
    used: { riddle: new Set(), code: new Set(), seq: new Set() }      // remembers puzzles already shown
  };
  clearInterval(tick);
  document.body.classList.remove('sanity-wary', 'sanity-unsettled', 'sanity-critical', 'haunted');
  $('#stage').classList.remove('sanity-glitch');
  $('#sanityNotice').classList.remove('show');
  updateSanityUI();
  $('#hBest').textContent = store.get(KEY_HIGH, 0);
  S.hall = hallPlan();
  if (HALLWAY && !EDIT) enterHall();          // walk the hallway first
  else { show('game'); startRoom(); }
}

function startRoom() {
  const R = ROOMS[S.room - 1];
  S.max    = Math.max(TIME_MIN, TIME_FIRST - (S.room - 1) * TIME_DROP);   // harder: less time every room
  S.time   = S.max;
  S.busy   = false;
  S.solved = [false, false, false];
  S.elapsed = 0;                                                   // seconds spent in this room
  S.haunted = false;
  S.hauntAt = rnd(16, Math.max(22, Math.floor(S.max * .65)));      // when the ghost shows up in this room
  S.nextGlitchAt = rnd(8, 12);
  lastSec = -1;
  updateSanityUI();

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


/* ============================================================
   7. room scene (picture, fisheye lens, glowing objects)
   ============================================================ */
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


/* ============================================================
   8. sanity system
   wrong answers, hints and scares drain it, clearing a room gives a little back.
   the lower it is, the more the camera distorts. at zero the house takes your mind.
   ============================================================ */
let sanityNoticeTimer = null;

function updateSanityUI() {
  if (!S || typeof S.sanity !== 'number') return;

  const value = Math.max(0, Math.min(SANITY_MAX, S.sanity));
  const percent = Math.ceil(value);
  const fill = $('#sanityFill'), text = $('#sanityText'), hud = $('#sanityHud');

  if (fill) fill.style.width = percent + '%';
  if (text) text.textContent = percent + '%';
  if (hud) hud.setAttribute('aria-label', `Sanity: ${percent}%`);

  document.body.classList.toggle('sanity-wary', value <= SANITY_WARY && value > SANITY_UNSETTLED);
  document.body.classList.toggle('sanity-unsettled', value <= SANITY_UNSETTLED && value > SANITY_CRITICAL);
  document.body.classList.toggle('sanity-critical', value <= SANITY_CRITICAL);

  const hallSanity = $('#hallSanity');                               // the sanity number in the hallway bar
  if (hallSanity) hallSanity.textContent = percent + '%';
}

/* small message at the bottom of the screen */
function showSanityNotice(message) {
  const notice = $('#sanityNotice');
  if (!notice || !message) return;
  notice.textContent = message;
  notice.classList.add('show');
  clearTimeout(sanityNoticeTimer);
  sanityNoticeTimer = setTimeout(() => notice.classList.remove('show'), 2600);
}

/* changes sanity. gives back false when it reached zero (the game is over) */
function changeSanity(amount, message = '') {
  if (!S || S.done || typeof S.sanity !== 'number') return false;

  const before = S.sanity;
  S.sanity = Math.max(0, Math.min(SANITY_MAX, S.sanity + amount));
  updateSanityUI();

  if (message) showSanityNotice(message);
  if (amount < 0 && S.sanity < before) tone(S.sanity <= SANITY_CRITICAL ? 58 : 85, .22, 'sine', .13);

  if (S.sanity <= 0) { lose('sanity'); return false; }
  return true;
}

/* short cctv distortion, more often when sanity is low */
function triggerCameraGlitch() {
  if (S.done || !$('#game').classList.contains('active')) return;
  stage.classList.remove('sanity-glitch');
  void stage.offsetWidth;
  stage.classList.add('sanity-glitch');
  setTimeout(() => stage.classList.remove('sanity-glitch'), 520);
}

/* one ghost encounter in every room: it hurts sanity but does not end the run by itself */
function triggerRoomHaunting() {
  if (S.done || S.haunted || EDIT) return;
  S.haunted = true;

  triggerCameraGlitch();
  tone(48, .8, 'sawtooth', .1);
  if (!changeSanity(-SANITY_HAUNT_LOSS, 'A shadow moves behind you. Your sanity weakens.')) return;

  document.body.classList.add('haunted');
  setTimeout(() => document.body.classList.remove('haunted'), 850);
}


/* ============================================================
   9. timer
   ============================================================ */
function loop() {
  if (S.paused || S.done) return;

  S.time = Math.max(0, S.time - .1);
  $('#barFill').style.width  = (S.time / S.max * 100) + '%';
  $('#timeText').textContent = Math.ceil(S.time) + 's';
  S.elapsed += .1;
  updateCamera();

  /* one unsettling encounter at a random moment in every room */
  if (!S.haunted && S.elapsed >= S.hauntAt) triggerRoomHaunting();

  /* the lower the sanity, the more often the camera glitches */
  if (S.sanity <= SANITY_UNSETTLED && S.elapsed >= S.nextGlitchAt) {
    triggerCameraGlitch();
    S.nextGlitchAt = S.elapsed + (S.sanity <= SANITY_CRITICAL ? rnd(5, 9) : rnd(11, 17));
  }

  /* last 10 seconds: red screen and heartbeat */
  const sec = Math.ceil(S.time);
  document.body.classList.toggle('danger', S.time <= 10);
  if (S.time <= 10 && sec !== lastSec) { lastSec = sec; tone(70, .25, 'sine', .25); }

  if (S.time <= 0) lose();
}


/* ============================================================
   10. hallway (one long dark hallway with the 7 doors in order)
   walk forward by tapping, 3-4 taps between doors,
   one jumpscare on the way to every room
   ============================================================ */
const hallCanvas = $('#hallCanvas'), hg = hallCanvas.getContext('2d');
let H = null;                                       // hallway state, made again for every walk (see enterHall)

/* --- the 7 jumpscares: picture jumpscare-room-N.jpg, a different effect for every room --- */
const HALL_SCARES = [
  { type: 'flash',  ms: 320  },    // room 1: one quick white flash
  { type: 'strobe', ms: 1000 },    // room 2: shows up, vanishes, shows up again
  { type: 'lights', ms: 1500 },    // room 3: the lights die, then it appears
  { type: 'rush',   ms: 1300 },    // room 4: runs at you from the end of the hallway
  { type: 'glitch', ms: 1100 },    // room 5: broken camera glitch
  { type: 'peek',   ms: 900  },    // room 6: slides in from the side and leaves
  { type: 'long',   ms: 2000 }     // room 7: the big one
];

/* picture files of a hallway jumpscare: a ready-made cut-out jumpscare-room-N.png is used first, then the .jpg */
const jumpscareFiles = n => [`${JUMPSCARE_ROOM}${n}.png`, `${JUMPSCARE_ROOM}${n}.jpg`].map(encodeURI);

/* --- the hallway video: tries every path in HALL_VIDEO, 'failed' = use the drawn hallway instead --- */
const hallVideo = $('#hallVideo'), hallBox = $('#hallFrame'), hallDoor = $('#hallDoor');
let hallVideoState = 'loading';                     // loading | ok | failed
(function loadHallVideo(i) {
  if (i >= HALL_VIDEO.length) { hallVideoState = 'failed'; return; }
  hallVideo.onerror = () => loadHallVideo(i + 1);
  hallVideo.onloadeddata = () => { hallVideoState = 'ok'; };
  hallVideo.src = encodeURI(HALL_VIDEO[i]);
  hallVideo.load();
})(0);

/* --- the jumpscare faces: the background is removed so only the face shows --- */
const hallPics = {}, hallSrc = {}, hallCut = {};    // room number -> loaded?, picture to show, background removed?
for (let n = 1; n <= TOTAL_ROOMS; n++) {
  loadFace(jumpscareFiles(n)).then(r => { hallPics[n] = true; hallSrc[n] = r.src; hallCut[n] = r.cut; }).catch(() => {});
}

/* loads the first picture that exists and (if CUT_FACES) removes its background. gives { src, cut }
   a .png is used as it is (it is already a cut-out) */
function loadFace(files, i = 0) {
  files = [].concat(files);
  return new Promise((resolve, reject) => {
    if (i >= files.length) return reject('missing');
    const im = new Image();
    im.onerror = () => loadFace(files, i + 1).then(resolve, reject);       // not there: try the next file
    im.onload = () => {
      if (/\.png$/i.test(files[i])) return resolve({ src: files[i], cut: true });
      let result = { src: files[i], cut: false };
      if (CUT_FACES) { try { result = { src: cutFace(im), cut: true }; } catch {} }      // blocked or failed: show the picture as it is
      resolve(result);
    };
    im.src = files[i];
  });
}

/* background removal for a face picture:
   1. the background color is read from the picture border
   2. everything of that color that touches the border is removed (floods inwards, stops at the face)
   3. only the biggest shape is kept (the face), the edge is softened and the picture is cropped to the face
   if no plain background is found, the edges are just faded out in an oval */
function cutFace(im) {
  const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
  const w = Math.max(2, Math.round(im.naturalWidth * k)), h = Math.max(2, Math.round(im.naturalHeight * k)), n = w * h;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.drawImage(im, 0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;       // throws if the browser blocks it

  /* 1. background color from the border (average and how much it varies) */
  const ring = Math.max(2, Math.round(Math.min(w, h) * .01)), edge = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < ring || y < ring || x >= w - ring || y >= h - ring) edge.push(y * w + x);
  let mr = 0, mg = 0, mb = 0;
  edge.forEach(i => { mr += d[i * 4]; mg += d[i * 4 + 1]; mb += d[i * 4 + 2]; });
  mr /= edge.length; mg /= edge.length; mb /= edge.length;
  let sd = 0;
  edge.forEach(i => { sd += (d[i * 4] - mr) ** 2 + (d[i * 4 + 1] - mg) ** 2 + (d[i * 4 + 2] - mb) ** 2; });
  sd = Math.sqrt(sd / edge.length / 3);
  const plainBg = sd <= 38;                                   // a busy background can not be removed this way
  const tol = Math.max(28, Math.min(80, 2 * sd + 18));
  const near = i => Math.hypot(d[i * 4] - mr, d[i * 4 + 1] - mg, d[i * 4 + 2] - mb) / 1.732 < tol;

  /* 2. flood the background inwards from the border */
  const bg = new Uint8Array(n), todo = [];
  const add = i => { if (!bg[i] && near(i)) { bg[i] = 1; todo.push(i); } };
  if (plainBg) edge.forEach(add);
  while (todo.length) {
    const i = todo.pop(), x = i % w;
    if (x > 0) add(i - 1);
    if (x < w - 1) add(i + 1);
    if (i >= w) add(i - w);
    if (i < n - w) add(i + w);
  }
  let bgCount = 0; for (let i = 0; i < n; i++) bgCount += bg[i];

  const alpha = new Float32Array(n);
  const oval = () => {                                         // safe backup: fade the edges out in an oval
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const rho = Math.hypot((x / w - .5) / .5, (y / h - .5) / .5), t = Math.min(1, Math.max(0, (rho - .62) / .38));
      alpha[y * w + x] = 1 - t * t * (3 - 2 * t);
    }
  };
  if (bgCount < n * .04 || bgCount > n * .97) {
    oval();                                                    // no plain background found
  } else {
    /* 3. keep only the biggest shape that is not background (the face) */
    const label = new Int32Array(n); const sizes = [0]; let next = 0;
    for (let s = 0; s < n; s++) {
      if (bg[s] || label[s]) continue;
      next++; sizes[next] = 0; label[s] = next; const stack = [s];
      while (stack.length) {
        const i = stack.pop(), x = i % w; sizes[next]++;
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < n - w ? i + w : -1];
        for (const j of nb) if (j >= 0 && !bg[j] && !label[j]) { label[j] = next; stack.push(j); }
      }
    }
    const biggest = Math.max(...sizes);
    let kept = 0;
    for (let i = 0; i < n; i++) { alpha[i] = label[i] && sizes[label[i]] >= biggest * .05 ? 1 : 0; kept += alpha[i]; }
    if (kept < n * .12) oval();                                // the "face" came out too small: it was not a plain background after all
    else {

    /* shave 1 pixel off the edge (no halo of old background), then soften the edge */
    const copy = alpha.slice();
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (copy[i] && (!copy[i - 1] || !copy[i + 1] || !copy[i - w] || !copy[i + w])) alpha[i] = 0;
    }
    const tmp = new Float32Array(n), R = 2;
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let o = -R; o <= R; o++) { const xx = x + o; if (xx >= 0 && xx < w) { s += alpha[y * w + xx]; c++; } } tmp[y * w + x] = s / c; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let o = -R; o <= R; o++) { const yy = y + o; if (yy >= 0 && yy < h) { s += tmp[yy * w + x]; c++; } } alpha[y * w + x] = s / c; }
    }
    }
  }

  /* write the transparency and crop the picture to the face */
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = alpha[y * w + x]; d[(y * w + x) * 4 + 3] = Math.round(a * 255);
    if (a > .08) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0 || y1 <= y0) throw 'empty';
  g.putImageData(img, 0, 0);
  const pad = Math.round(Math.max(w, h) * .02);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

/* --- the plan: how many clicks between doors, and which part of the video each click plays --- */
function hallPlan() {
  const clicks = [], stops = [];
  let z = 0;
  for (let k = 0; k < TOTAL_ROOMS; k++) {
    const c = rnd(HALL_MIN_CLICKS, HALL_MAX_CLICKS);        // 3 or 4 clicks to the next door
    z += c * HALL_STEP;
    clicks.push(c);
    stops.push(z);                                          // where you stand in front of door k (drawn hallway)
  }
  /* video: the whole walk is shared between all the clicks of the game, so every click is the same length */
  const length = isFinite(hallVideo.duration) && hallVideo.duration > 5 ? hallVideo.duration - 1.5 : 33;
  const total = clicks.reduce((a, b) => a + b, 0);
  let sum = 0;
  const times = clicks.map(c => (sum += c) / total * length);    // video time at door k
  return { clicks, stops, times };
}

/* --- start walking toward the door of the current room --- */
function enterHall() {
  const k = S.room - 1, video = hallVideoState === 'ok';
  clearInterval(tick);
  document.body.classList.remove('danger');
  H = {
    alive: true, k, mode: video ? 'video' : 'canvas',
    clicks: S.hall.clicks[k], step: 0,
    cam: k ? S.hall.stops[k - 1] : 0,                       // drawn hallway: you start where the last door was
    moving: false, from: 0, to: 0, t0: 0, walkP: 0, foot: 0,
    scareAt: rnd(1, S.hall.clicks[k]), scared: false, scaring: false, dark: false,
    open: 0, opening: false, leaving: false
  };
  const hall = $('#hall');
  hall.classList.toggle('video', video);
  hall.classList.remove('dark');
  $('#hhud').innerHTML = `<span>Hallway</span><span>Next: room <b>${S.room}</b>/${TOTAL_ROOMS}</span><span>Score <b>${S.score}</b></span><span>Mind <b id="hallSanity">${Math.ceil(S.sanity)}%</b></span>`;
  show('hall');
  sizeHall();
  hideDoor();
  hallBox.classList.remove('enter');

  if (video) {                                              // put the video where this walk starts
    H.tStart = k ? S.hall.times[k - 1] : 0;
    H.tEnd = S.hall.times[k];
    H.stepMs = (H.tEnd - H.tStart) / H.clicks * 1000;
    hallVideo.pause(); hallVideo.muted = muted; hallVideo.volume = 1;
    if (Math.abs(hallVideo.currentTime - H.tStart) > .05) hallVideo.currentTime = H.tStart;
  }
  hallHint();
  requestAnimationFrame(hallFrame);
}

/* the video is a square: size it so it fills the screen (or fits inside it) */
function sizeHall() {
  const w = $('#hall').clientWidth, h = $('#hall').clientHeight;
  hallBox.style.setProperty('--S', (HALL_FIT === 'cover' ? Math.max(w, h) : Math.min(w, h)) + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  hallCanvas.width  = Math.max(2, Math.round(hallCanvas.clientWidth * dpr));
  hallCanvas.height = Math.max(2, Math.round(hallCanvas.clientHeight * dpr));
}

function hallHint() {
  let text = '';
  if (H && !H.moving && !H.scaring && !H.opening) text = H.step < H.clicks ? 'Tap to walk forward' : 'Tap the glowing door';
  $('#hhint').textContent = text;
}

/* --- the glowing door on top of the video: a door on the left or right wall, drawn in the same perspective --- */
function doorShape(side) {
  const vw = $('#hall').clientWidth, vh = $('#hall').clientHeight, S = HALL_FIT === 'cover' ? Math.max(vw, vh) : Math.min(vw, vh);
  const xmin = Math.max(0, 50 - 50 * vw / S) + 3, ymin = Math.max(0, 50 - 50 * vh / S) + 4, ymax = Math.min(100, 50 + 50 * vh / S) - 6;
  const d1 = Math.max(1, 48 / (50 - xmin), 40 / (47 - ymin), 45 / (ymax - 47)), d2 = d1 * 2.1;     // how near / far the door is
  const X = d => 50 - 48 / d, T = d => 47 - 40 / d, B = d => 47 + 45 / d;                         // wall lines run to the middle of the picture
  const pts = [[X(d1), T(d1)], [X(d2), T(d2)], [X(d2), B(d2)], [X(d1), B(d1)]].map(([x, y]) => [side < 0 ? x : 100 - x, y]);
  return pts;
}

function showDoor() {
  const q = doorShape(H.k % 2 ? 1 : -1), str = p => p.map(v => v.toFixed(2)).join(',');
  const points = q.map(str).join(' '), cx = (q[0][0] + q[1][0]) / 2, cy = (q[0][1] + q[1][1]) / 2 + 3.5;
  hallDoor.innerHTML =
    `<polygon class="door-body" points="${points}"/>
     <polygon class="door-glow" points="${points}"/>
     <line class="door-light" x1="${str(q[3]).split(',')[0]}" y1="${str(q[3]).split(',')[1]}" x2="${str(q[2]).split(',')[0]}" y2="${str(q[2]).split(',')[1]}"/>
     <rect class="plate" x="${(cx - 2.6).toFixed(2)}" y="${(cy - 2).toFixed(2)}" width="5.2" height="4" rx=".6"/>
     <text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}">${H.k + 1}</text>`;
  hallDoor.removeAttribute('hidden');                      // (svg has no .hidden property)
  H.doorAt = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
}
function hideDoor() { hallDoor.setAttribute('hidden', ''); hallDoor.innerHTML = ''; }

/* --- one tap: walk one step, or open the door when you are at it --- */
function hallTap() {
  if (!H || !H.alive || H.moving || H.scaring || H.opening) return;
  if (H.step < H.clicks) {
    if (H.mode === 'video') {                               // play the next piece of the video
      H.tTarget = H.tStart + (H.tEnd - H.tStart) * (H.step + 1) / H.clicks;
      H.moving = true; H.foot = 0; H.t0 = performance.now();
      hideDoor();
      hallVideo.play().catch(() => { hallVideo.currentTime = H.tTarget; });
    } else {
      H.moving = true; H.from = H.cam; H.to = H.cam + HALL_STEP; H.t0 = performance.now(); H.foot = 0;
    }
  } else {
    H.opening = true; H.o0 = performance.now(); H.camOpen = H.cam;
    tone(150, .7, 'sawtooth', .05);                         // creaky door
    if (H.mode === 'video') {                               // zoom into the door, then fade into the room
      hallBox.style.transformOrigin = H.doorAt ? `${H.doorAt[0]}% ${H.doorAt[1]}%` : '50% 50%';
      hallBox.classList.add('enter');
      setTimeout(() => {
        if (!H || !H.alive || H.leaving) return;
        H.leaving = true;
        fadeTo(() => { H.alive = false; show('game'); startRoom(); hallBox.classList.remove('enter'); });
      }, 750);
    }
  }
  hallHint();
}

/* --- called after every step: maybe the jumpscare happens now --- */
function afterStep() {
  if (H.step === H.scareAt && !H.scared) {
    H.scared = true; H.scaring = true;
    hallHint();
    setTimeout(hallScare, rnd(350, 1100));                  // a moment of silence first
  } else hallHint();
}

/* lights out / lights on in the hallway */
function setDark(on) { if (H) H.dark = on; $('#hall').classList.toggle('dark', on); }

/* --- the jumpscare of this room (face picture + effect) --- */
function hallScare() {
  if (!H || !H.alive) return;
  const n = S.room, cfg = HALL_SCARES[n - 1], hs = $('#hscare');
  const pic = !!hallPics[n];
  $('#hscareImg').src = pic ? hallSrc[n] : '';
  const showIt = () => { hs.className = 'on ' + cfg.type + (pic ? ' pic' : '') + (pic && hallCut[n] ? ' cut' : ''); };

  if (!changeSanity(-SANITY_HALL_LOSS, 'The apparition shakes you. You lose some sanity.')) return;     // sanity gone: game over

  playJumpscare();
  if (cfg.type === 'lights') {                              // lights out first, then it appears
    setDark(true); tone(45, .9, 'sawtooth', .18);
    setTimeout(() => { setDark(false); showIt(); }, 1000);
  } else showIt();

  setTimeout(() => {
    hs.className = ''; jumpSnd.pause();
    setDark(false);
    if (H) { H.scaring = false; hallHint(); }
  }, cfg.ms);
}

/* stop walking (game over, or the game ends) */
function stopHall() {
  if (H) H.alive = false;
  hallVideo.pause();
}

/* --- every frame: move the camera, then draw --- */
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

function hallFrame(now) {
  if (!H || !H.alive) return;

  /* video walk: the video plays by itself, we only stop it at the end of the step */
  if (H.mode === 'video') {
    if (H.moving) {
      const p = (performance.now() - H.t0) / H.stepMs;
      if (p > .22 && H.foot === 0) { H.foot = 1; tone(55, .14, 'sine', .22); }          // footsteps
      if (p > .72 && H.foot === 1) { H.foot = 2; tone(50, .14, 'sine', .22); }
      if (hallVideo.currentTime >= H.tTarget - .03 || hallVideo.ended || performance.now() - H.t0 > H.stepMs + 1500) {
        hallVideo.pause(); H.moving = false; H.step++;
        if (H.step >= H.clicks) showDoor();                 // you arrived: the door glows
        afterStep();
      }
    }
    requestAnimationFrame(hallFrame);
    return;
  }

  /* drawn hallway (backup) */
  if (H.moving) {                                           // walking one step
    const p = Math.min(1, (now - H.t0) / HALL_WALK_MS);
    H.walkP = p; H.cam = H.from + (H.to - H.from) * ease(p);
    if (p > .22 && H.foot === 0) { H.foot = 1; tone(55, .14, 'sine', .3); }       // footsteps
    if (p > .72 && H.foot === 1) { H.foot = 2; tone(50, .14, 'sine', .3); }
    if (p >= 1) { H.moving = false; H.cam = H.to; H.step++; afterStep(); }
  }

  if (H.opening) {                                          // door swings open, then fade into the room
    H.open = Math.min(1, (now - H.o0) / 900);
    H.cam = H.camOpen + .7 * H.open;
    if (H.open >= 1 && !H.leaving) {
      H.leaving = true;
      fadeTo(() => { H.alive = false; show('game'); startRoom(); });
    }
  }

  drawHall(now / 1000);
  requestAnimationFrame(hallFrame);
}

/* black fade, do something in the dark, fade back */
function fadeTo(then) {
  const f = $('#fade');
  f.classList.add('on');
  setTimeout(() => { then(); f.classList.remove('on'); }, 550);
}

/* --- drawing the hallway (simple 3d: floor, ceiling, walls, lamps, doors) --- */
const LAMP_GAP = 5, LAMP_OFF = 2.5, HALL_FAR = 15, FRAME_GAP = 3.1;

const rgb = (c, m) => { m = Math.max(0, Math.min(1.3, m)); return `rgb(${c[0] * m | 0},${c[1] * m | 0},${c[2] * m | 0})`; };

/* some lamps flicker, all die during the lights-out scare */
function lampFlick(k, t) {
  if (H.dark) return 0;
  return k % 3 === 1 && Math.sin(t * 41 + k * 3) * Math.sin(t * 13 + k) > .5 ? .2 : 1;
}

/* how bright it is at depth z: your flashlight near you + pools of light under the lamps */
function lightAt(z, cam, t) {
  let v = .04 + .42 * Math.max(0, 1 - (z - cam) / 7);          // darker = scarier (raise .42 to see more)
  const k0 = Math.round((z - LAMP_OFF) / LAMP_GAP);
  for (let k = k0 - 1; k <= k0 + 1; k++) {
    const d = z - (LAMP_OFF + k * LAMP_GAP);
    v += .55 * lampFlick(k, t) * Math.exp(-d * d / 1.6);
  }
  return H.dark ? v * .05 : v;
}

function drawHall(t) {
  const w = hallCanvas.width, h = hallCanvas.height, cam = H.cam, p = H.moving ? H.walkP : 0;
  const bob  = H.moving ? Math.sin(p * Math.PI * 4) * .03 : Math.sin(t * 1.4) * .006;     // walking bounce
  const sway = H.moving ? Math.sin(p * Math.PI * 2) * .012 * w : 0;
  const F = Math.min(w * .62, h * .95), eye = -.25 + bob, cx = w / 2 + sway, cy = h * .5, near = .12;
  const end = S.hall.stops[TOTAL_ROOMS - 1] + HALL_ARRIVE + 8;

  /* 3d point -> screen point */
  const P = (x, y, z) => { const d = Math.max(z - cam, near); return [cx + x * F / d, cy - (y - eye) * F / d]; };
  const path = pts => { hg.beginPath(); pts.forEach((q, i) => { const s = P(q[0], q[1], q[2]); i ? hg.lineTo(s[0], s[1]) : hg.moveTo(s[0], s[1]); }); hg.closePath(); };
  const quad = (pts, color) => { path(pts); hg.fillStyle = color; hg.fill(); hg.strokeStyle = color; hg.lineWidth = 1; hg.stroke(); };
  const wall = (x, za, zb, y0, y1, color) => quad([[x, y0, za], [x, y0, zb], [x, y1, zb], [x, y1, za]], color);
  const shade = (c, L, d) => rgb(c, L * Math.max(0, 1 - Math.pow(d / HALL_FAR, 1.4)));

  hg.fillStyle = '#000'; hg.fillRect(0, 0, w, h);

  /* floor, ceiling and walls, far to near, in slices */
  const dz = .35, first = Math.floor((cam + near) / dz), last = Math.min(Math.floor((cam + HALL_FAR) / dz), Math.floor(end / dz));
  for (let i = last; i >= first; i--) {
    const za = Math.max(i * dz, cam + near), zb = (i + 1) * dz + .02;
    if (zb <= za) continue;
    const zm = (za + zb) / 2, d = zm - cam, L = lightAt(zm, cam, t);

    quad([[-1, -1, za], [1, -1, za], [1, -1, zb], [-1, -1, zb]], shade(i % 2 ? [52, 12, 14] : [60, 14, 16], L, d));      // carpet
    quad([[-.5, -1, za], [.5, -1, za], [.5, -1, zb], [-.5, -1, zb]], shade(i % 2 ? [100, 14, 20] : [112, 16, 22], L, d)); // runner
    quad([[-.56, -1, za], [-.5, -1, za], [-.5, -1, zb], [-.56, -1, zb]], shade([130, 98, 42], L, d));                    // gold trim
    quad([[.5, -1, za], [.56, -1, za], [.56, -1, zb], [.5, -1, zb]], shade([130, 98, 42], L, d));
    quad([[-1, 1, za], [1, 1, za], [1, 1, zb], [-1, 1, zb]], shade([34, 31, 28], L, d));                                 // ceiling

    for (const x of [-1, 1]) {                                                                                           // both walls
      wall(x, za, zb, -1, -.88, shade([20, 12, 8], L, d));                                                               //   baseboard
      wall(x, za, zb, -.88, -.35, shade([46, 27, 17], L, d));                                                            //   wood panel
      wall(x, za, zb, -.35, -.28, shade([96, 70, 40], L, d));                                                            //   rail
      wall(x, za, zb, -.28, 1, shade(i % 4 === 0 ? [66, 52, 40] : [90, 74, 58], L, d));                                  //   wallpaper stripes
    }
  }

  /* ceiling lamps with a glow */
  const k0 = Math.ceil((cam + near - LAMP_OFF) / LAMP_GAP), k1 = Math.floor((Math.min(cam + HALL_FAR, end) - LAMP_OFF) / LAMP_GAP);
  for (let k = k1; k >= k0; k--) {
    const zl = LAMP_OFF + k * LAMP_GAP, d = zl - cam, fl = lampFlick(k, t);
    quad([[-.22, 1, zl - .22], [.22, 1, zl - .22], [.22, 1, zl + .22], [-.22, 1, zl + .22]], rgb([255, 226, 160], fl * Math.max(0, 1 - d / HALL_FAR)));
    const [lx, ly] = P(0, .98, zl), r = Math.min(1.1 / d * F, w);
    const gr = hg.createRadialGradient(lx, ly, 0, lx, ly, r);
    gr.addColorStop(0, `rgba(255,214,140,${.5 * fl})`); gr.addColorStop(1, 'rgba(255,214,140,0)');
    hg.globalCompositeOperation = 'lighter'; hg.fillStyle = gr; hg.fillRect(lx - r, ly - r, r * 2, r * 2); hg.globalCompositeOperation = 'source-over';
  }

  /* the doors (one for every room, left and right in turn) */
  const doors = S.hall.stops.map((s, k) => ({ k, z: s + HALL_ARRIVE, side: k % 2 ? 1 : -1 }));

  /* old pictures on the walls (not where a door is) */
  for (let z = Math.ceil((cam + near) / FRAME_GAP) * FRAME_GAP; z < Math.min(cam + HALL_FAR, end); z += FRAME_GAP) {
    const side = Math.round(z / FRAME_GAP) % 2 ? -1 : 1, d = z - cam, L = lightAt(z, cam, t);
    if (doors.some(o => o.side === side && Math.abs(o.z - z) < 1.3)) continue;
    wall(side, z - .35, z + .35, -.05, .6, shade([34, 24, 14], L, d));
    wall(side, z - .28, z + .28, .02, .53, shade([14, 16, 18], L * .8, d));
  }

  doors.filter(o => o.z + .7 > cam + near && o.z - cam < HALL_FAR).sort((a, b) => b.z - a.z).forEach(o => {
    const x = o.side, d = o.z - cam, L = lightAt(o.z, cam, t), z0 = o.z - .5, z1 = o.z + .5;
    const isNext = o.k === H.k, open = isNext ? H.open : 0;

    wall(x, z0 - .1, z1 + .1, -1, .9, shade([28, 18, 12], L, d));                                   // frame
    if (open > 0) wall(x, z0, z1, -1, .78, rgb([255, 200, 130], .45 * open));                       // light from inside
    const lz = z0 + (z1 - z0) * (1 - .86 * open);                                                    // door swings open
    wall(x, z0, lz, -1, .78, shade(o.k >= H.k ? [70, 40, 24] : [38, 30, 26], L, d));                // door
    if (lz - z0 > .35) {
      wall(x, z0 + .1, lz - .1, -.9, -.1, shade([50, 28, 16], L, d));                                // panels
      wall(x, z0 + .1, lz - .1, .05, .68, shade([50, 28, 16], L, d));
    }
    const [kx, ky] = P(x, -.22, z0 + (lz - z0) * .88);                                               // door knob
    hg.beginPath(); hg.arc(kx, ky, Math.max(1.5, .05 / d * F), 0, 7); hg.fillStyle = shade([210, 180, 100], L + .3, d); hg.fill();

    wall(x, o.z - .14, o.z + .14, .6, .72, shade([190, 160, 90], L + .2, d));                         // number plate
    const [tx, ty] = P(x, .66, o.z);
    hg.fillStyle = '#2a1a08'; hg.font = `${Math.max(6, .075 / d * F)}px 'Special Elite', serif`; hg.textAlign = 'center'; hg.textBaseline = 'middle';
    hg.fillText(o.k + 1, tx, ty);

    /* the door you are walking to glows */
    if (isNext && !open) {
      const pulse = .6 + .4 * Math.sin(t * 3);
      hg.save();
      hg.shadowColor = '#9fe3c0'; hg.shadowBlur = (18 + 18 * pulse) * (w / 1000 + .4);
      path([[x, -1, z0 - .1], [x, -1, z1 + .1], [x, .9, z1 + .1], [x, .9, z0 - .1]]);
      hg.fillStyle = `rgba(159,227,192,${.03 + .04 * pulse})`; hg.fill();
      hg.strokeStyle = `rgba(159,227,192,${.55 * pulse + .35})`; hg.lineWidth = 2.5; hg.stroke();
      hg.restore();
      hg.globalCompositeOperation = 'lighter';
      wall(x, z0, z1, -1, -.94, 'rgb(159,227,192)');                                                // light under the door
      hg.globalCompositeOperation = 'source-over';
    }
  });

  /* dark edges */
  const g = hg.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.88)');
  hg.fillStyle = g; hg.fillRect(0, 0, w, h);
}


/* ============================================================
   11. scoring and room progress
   ============================================================ */

/* wrong answer: lose time and shake the screen */
function penalty() {
  S.time = Math.max(.1, S.time - PENALTY);
  changeSanity(-SANITY_WRONG_LOSS, 'The house whispers inside your head. Your sanity drops.');
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
  changeSanity(SANITY_ROOM_RECOVERY, 'You take a breath. Your sanity recovers slightly.');
  tone(300, .4, 'triangle', .12);
  setTimeout(() => {
    if (S.room >= TOTAL_ROOMS) end(true);      // last room done: you win
    else {
      S.room++;
      if (HALLWAY && !EDIT) fadeTo(enterHall);   // back to the hallway
      else startRoom();
    }
  }, 1400);
}


/* ============================================================
   12. game over and scoreboard
   ============================================================ */

/* time ran out (or sanity reached zero): jumpscare, then the game over screen */
function lose(reason = 'time') {
  if (S.done) return;
  S.done = true;
  stopHall();
  clearInterval(tick);
  document.body.classList.remove('danger');
  closeModal();
  bgm.pause();

  $('#scare').classList.add('on');
  playJumpscare();
  setTimeout(() => {
    $('#scare').classList.remove('on');
    jumpSnd.pause();
    end(false, reason);
  }, JUMPSCARE_MS);
}

function end(won, reason = 'time') {
  S.done = true;
  stopHall();
  clearInterval(tick);
  document.body.classList.remove('danger', 'sanity-wary', 'sanity-unsettled', 'sanity-critical', 'haunted');
  stage.classList.remove('sanity-glitch');
  $('#sanityNotice').classList.remove('show');
  $('#hall').classList.remove('dark');
  document.body.style.setProperty('--h', 18);
  startMusic();

  const best = store.get(KEY_HIGH, 0), isNew = S.score > best;
  if (isNew) store.set(KEY_HIGH, S.score);

  $('#oTitle').textContent = won ? 'You escaped' : 'The house keeps you';
  $('#oText').textContent  = won ? 'The front door finally opens. Do not look back.'
    : reason === 'sanity' ? `Your mind slips away in the dark. The ${ROOMS[S.room - 1].name} keeps what is left of you.`
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


/* ============================================================
   13. puzzle popup
   ============================================================ */
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


/* ============================================================
   14. puzzles
   every puzzle gets harder with the room number,
   and nothing repeats inside one game
   ============================================================ */

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


/* ============================================================
   15. layout editor (open index.html?edit)
   drag = move an object, mouse wheel = resize it
   ============================================================ */
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


/* ============================================================
   16. effects and buttons
   ============================================================ */

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
loadFace([JUMPSCARE_IMG.replace(/\.jpg$/, '.png'), JUMPSCARE_IMG]).then(r => {
  $('#scareImg').src = r.src;
  $('#scare').classList.add('pic');
  if (r.cut) $('#scare').classList.add('cut');
}).catch(() => {});

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

/* --- hallway: tap / click / keys to walk, resize --- */
$('#hall').addEventListener('pointerdown', hallTap);
window.addEventListener('resize', () => { if (H && H.alive) sizeHall(); });
document.addEventListener('keydown', e => {
  if (['ArrowUp', 'w', 'W', ' ', 'Enter'].includes(e.key) && $('#hall').classList.contains('active')) { e.preventDefault(); hallTap(); }
});

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
  hallVideo.muted = muted;
  muted ? bgm.pause() : startMusic();
};

/* --- tap on an object, escape closes the popup, click sound on every button --- */
stage.addEventListener('click', e => { const b = e.target.closest('.spot'); if (b) openSpot(+b.dataset.i); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
document.addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'mute') playClick(); });