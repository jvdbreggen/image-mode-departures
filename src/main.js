/**
 * main.js — Departure Board kiosk
 *
 * Pure vanilla JS port of the React DepartureBoard + SplitFlapChar components.
 * Animation approach copied verbatim from github.com/danakun/split-flap-tutorial.
 *
 * Layout
 * ──────
 *   #root
 *     table.board-table
 *       thead > tr > th × 4
 *       tbody > tr.board-row × PAGE_SIZE
 *         td > span.flap-string > div.flap-char × N
 *           div.flap-top  > span.char-text
 *           div.flap-bottom > span.char-text
 *           div.flap-flip > span.char-text
 */

// ── Constants ────────────────────────────────────────────────────────────────

const TIME_WIDTH    = 5;   // characters for "HH:MM"
const STATION_WIDTH = 12;  // characters for city names (truncated)
const PAGE_SIZE     = 6;   // rows visible at once
const PAGE_INTERVAL = 30;  // seconds before flipping to next page
const FETCH_INTERVAL = 60; // seconds between timetable refreshes

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Pad/truncate a string to exactly `width` uppercase characters. */
// function fixedWidth(str, width) {
//   const s = (str || '').toUpperCase();
//   if (s.length >= width) return s.slice(0, width);
//   return s + ' '.repeat(width - s.length);
// }

/** Current wall-clock time as "HH:MM". */
// function nowHHMM() {
//   const d  = new Date();
//   const hh = String(d.getHours()).padStart(2, '0');
//   const mm = String(d.getMinutes()).padStart(2, '0');
//   return `${hh}:${mm}`;
// }

/**
 * Build the full ordered display queue from the timetable.
 * Today's remaining trains come first (nextDay=false), then
 * all trains repeated as tomorrow's schedule (nextDay=true).
 */
// function buildQueue(trains) {
//   if (!trains || trains.length === 0) return [];
//   const now    = nowHHMM();
//   const sorted = [...trains].sort((a, b) =>
//     a.departure_time.localeCompare(b.departure_time)
//   );
//   const today    = sorted.filter(t => t.departure_time > now)
//                          .map(t => ({ ...t, nextDay: false }));
//   const tomorrow = sorted.map(t => ({ ...t, nextDay: true }));
//   return [...today, ...tomorrow];
// }

/** Return a display character — spaces become non-breaking so tiles have width. */
const disp = c => (c === ' ' || c === '') ? '\u00a0' : c;

// ── Split-flap tile ───────────────────────────────────────────────────────────
//
// Mirrors createFlap / animateFlap from split-flap-tutorial/src/split-flap.js
// exactly, with no framework wrapping.

/** Create a single .flap-char tile showing `char`. Returns the outer div. */
// function createFlapChar(char) {
//   const tile = document.createElement('div');
//   tile.className = 'flap-char';

//   const top    = document.createElement('div');  top.className = 'flap-top';
//   const bot    = document.createElement('div');  bot.className = 'flap-bottom';
//   const flip   = document.createElement('div');  flip.className = 'flap-flip';

//   const topSpan  = document.createElement('span');  topSpan.className  = 'char-text';
//   const botSpan  = document.createElement('span');  botSpan.className  = 'char-text';
//   const flipSpan = document.createElement('span');  flipSpan.className = 'char-text';

//   const c = disp(char);
//   topSpan.textContent = c;
//   botSpan.textContent = c;
//   flipSpan.textContent = c;

//   top.appendChild(topSpan);
//   bot.appendChild(botSpan);
//   flip.appendChild(flipSpan);
//   tile.appendChild(top);
//   tile.appendChild(bot);
//   tile.appendChild(flip);

//   // Store refs directly on the element for easy access in animateFlapChar.
//   tile._topSpan  = topSpan;
//   tile._botSpan  = botSpan;
//   tile._flipSpan = flipSpan;
//   tile._flipDiv  = flip;
//   tile._current  = char;
//   tile._t1 = null;
//   tile._t2 = null;

//   return tile;
// }

/**
 * Animate a tile to a new character.
 * Mirrors the "final flip" path of animateFlap in split-flap-tutorial exactly:
 *   1. Show old char on flip overlay.
 *   2. Remove+reflow+add .flipping — guarantees a fresh animation start.
 *   3. At 300 ms (midpoint) swap top/bottom to new char (hidden under overlay).
 *   4. At 600 ms remove .flipping, reset transform, sync overlay text.
 */
// function animateFlapChar(tile, newChar) {
//   if (newChar === tile._current) return;

//   // Cancel any in-flight timers from a rapid update.
//   if (tile._t1) { clearTimeout(tile._t1); tile._t1 = null; }
//   if (tile._t2) { clearTimeout(tile._t2); tile._t2 = null; }

//   const { _flipDiv: flipDiv, _flipSpan: flipSpan,
//           _topSpan: topSpan, _botSpan: botSpan } = tile;

//   // 1. Put the old char on the overlay.
//   flipSpan.textContent = disp(tile._current);

//   // 2. Force-reset the animation (reflow between remove and add).
//   flipDiv.classList.remove('flipping');
//   void flipDiv.offsetHeight; // reflow
//   flipDiv.classList.add('flipping');

//   // 3. Mid-point: swap static halves to new char (hidden under overlay).
//   tile._t1 = setTimeout(() => {
//     topSpan.textContent = disp(newChar);
//     botSpan.textContent = disp(newChar);
//     tile._t1 = null;
//   }, 300);

//   // 4. End: clean up — matches tutorial's classList.remove + style.transform = ''.
//   tile._t2 = setTimeout(() => {
//     flipDiv.classList.remove('flipping');
//     flipDiv.style.transform = '';
//     flipSpan.textContent = disp(newChar);
//     tile._current = newChar;
//     tile._t2 = null;
//   }, 600);
// }

// ── Board DOM ─────────────────────────────────────────────────────────────────

/**
 * Build the board's static skeleton (table + empty rows) once.
 * Returns { tbody, rows } where rows is an array of row descriptors
 * each holding the tile elements for fast in-place updates.
 */
function buildBoardSkeleton(root) {
  root.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'board-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['DEPARTS', 'FROM', 'TO', 'ARRIVES']) {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  table.appendChild(tbody);
  root.appendChild(table);
  return rows;
}

// ── Application ───────────────────────────────────────────────────────────────

let queue     = [];
let page      = 0;
let pageTimer = null;

// const root = document.getElementById('root');
const rows = buildBoardSkeleton(root);

/** Advance to the next page and animate the board. */
function showPage(p) {
  page = p;
  const totalPages = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
  const safePage   = page % totalPages;
  const pageRows   = queue.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  // updateBoard(rows, pageRows);
}

/** Reset the 30-second page-cycling timer. */
// function startPageTimer() {
//   if (pageTimer) clearInterval(pageTimer);
//   pageTimer = setInterval(() => {
//     const totalPages = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
//     showPage((page + 1) % totalPages);
//   }, PAGE_INTERVAL * 1000);
// }

/** Fetch timetable, rebuild queue, show page 0. */
async function fetchAndRefresh() {
  try {
    // const res  = await fetch('/api/timetable');
    // const data = await res.json();
    // queue = buildQueue(data);
    showPage(0);
    // startPageTimer();
  } catch (err) {
    console.error('DepartureBoard: fetch failed', err);
  }
}

// Boot
fetchAndRefresh();
setInterval(fetchAndRefresh, FETCH_INTERVAL * 1000);
