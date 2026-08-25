import './style.css';
import { buildBoard, updateBoard, COL_WIDTHS, COL_NAMES } from './board.js';
import { fetchTimetable, getWindow } from './timetable.js';

// Flap tile dimensions (must match flap.css)
const FLAP_WIDTH = 32;   // px
const FLAP_GAP = 2;      // px — matches --flap-gap in style.css
const COL_GAP = 16;      // px — matches --col-gap in style.css
const CONNECTING_MSG = 'CONNECTING';

let entries = [];
let windowIndex = 0;
let intervalId = null;

/**
 * Calculates the pixel width of a single column group (n flaps + (n-1) gaps).
 */
function colPixelWidth(numChars) {
  return numChars * FLAP_WIDTH + (numChars - 1) * FLAP_GAP;
}

/**
 * Builds the header row DOM element with column labels sized to match the board columns.
 */
function buildHeader() {
  const header = document.createElement('div');
  header.className = 'board-header';

  COL_WIDTHS.forEach((width, i) => {
    if (i > 0) {
      // Gap spacer matching .col-gap
      const gap = document.createElement('div');
      gap.className = 'header-gap';
      gap.style.width = `${COL_GAP}px`;
      header.appendChild(gap);
    }

    const label = document.createElement('span');
    label.className = 'col-header';
    label.textContent = COL_NAMES[i];
    label.style.width = `${colPixelWidth(width)}px`;
    header.appendChild(label);
  });

  return header;
}

/**
 * Shows "CONNECTING..." across all rows when the API is unavailable.
 */
function showConnecting() {
  const connectingRows = Array.from({ length: 6 }, (_, i) => ({
    depart: i === 0 ? CONNECTING_MSG.padEnd(5, ' ').substring(0, 5) : '     ',
    from:   '               ',
    to:     '               ',
    arrive: '     ',
    tomorrow: false,
  }));
  updateBoard(connectingRows, false);
}

/**
 * Loads (or reloads) the timetable from the API.
 * On failure, fills the board with the connecting message.
 */
async function loadTimetable() {
  try {
    entries = await fetchTimetable();
  } catch (err) {
    console.error('Failed to fetch timetable:', err);
    entries = [];
    showConnecting();
  }
}

/**
 * Renders the current window onto the board.
 * @param {boolean} animate
 */
function renderWindow(animate) {
  const rows = getWindow(entries, windowIndex);
  updateBoard(rows, animate);
}

/**
 * Advances to the next window and re-fetches the timetable on every full cycle.
 */
async function tick() {
  windowIndex = windowIndex === 0 ? 1 : 0;

  // Re-fetch on the start of every full cycle (windowIndex back to 0)
  if (windowIndex === 0) {
    await loadTimetable();
    if (entries.length === 0) return; // showConnecting already called
  }

  renderWindow(true);
}

/**
 * Entry point — runs on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('root');

  // Build the wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'board-wrapper';

  // Header row
  wrapper.appendChild(buildHeader());

  // Board body
  const boardBody = document.createElement('div');
  boardBody.className = 'board-body';
  wrapper.appendChild(boardBody);

  root.appendChild(wrapper);

  // Build the flap tile grid
  buildBoard(boardBody);

  // Initial data load
  await loadTimetable();

  // Cold render — no animation on first display
  if (entries.length > 0) {
    renderWindow(false);
  }

  // Start the 30-second rotation
  intervalId = setInterval(tick, 30_000);
});
