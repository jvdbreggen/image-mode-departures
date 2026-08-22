// ===== CHARSET =====
const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :';

// ===== COLUMN WIDTHS (in characters) =====
const COL_DEPARTS = 5;
const COL_FROM    = 14;
const COL_TO      = 14;
const COL_ARRIVES = 5;

// ===== TIMETABLE STATE =====
let timetable = [];

// ===== FLAP ENGINE (inlined from split-flap/src/split-flap.js) =====

function getRandomChar() {
  return charset[Math.floor(Math.random() * charset.length)];
}

function createFlap(char) {
  const flap = document.createElement('div');
  flap.className = 'character-flap';
  flap.dataset.targetChar = char;

  // Top half - shows upper portion of character
  const topHalf = document.createElement('div');
  topHalf.className = 'flap-top';
  const topText = document.createElement('span');
  topText.className = 'char-text';
  topText.textContent = getRandomChar();
  topHalf.appendChild(topText);

  // Bottom half - shows lower portion of SAME character
  const bottomHalf = document.createElement('div');
  bottomHalf.className = 'flap-bottom';
  const bottomText = document.createElement('span');
  bottomText.className = 'char-text';
  bottomText.textContent = topText.textContent;
  bottomHalf.appendChild(bottomText);

  // Flip element - animates the transition
  const flipHalf = document.createElement('div');
  flipHalf.className = 'flap-flip';
  const flipText = document.createElement('span');
  flipText.className = 'char-text';
  flipText.textContent = topText.textContent;
  flipHalf.appendChild(flipText);

  flap.appendChild(topHalf);
  flap.appendChild(bottomHalf);
  flap.appendChild(flipHalf);

  return flap;
}

function animateFlap(flap, targetChar) {
  const topText = flap.querySelector('.flap-top .char-text');
  const bottomText = flap.querySelector('.flap-bottom .char-text');
  const flipText = flap.querySelector('.flap-flip .char-text');
  const flipContainer = flap.querySelector('.flap-flip');

  let shuffleCount = 0;
  const maxShuffles = 3 + Math.floor(Math.random() * 4); // 3-6 shuffles

  function shuffle() {
    if (shuffleCount >= maxShuffles) {
      // Final flip to target character
      flipText.textContent = topText.textContent;
      flipContainer.classList.add('flipping');

      setTimeout(() => {
        topText.textContent = targetChar;
        bottomText.textContent = targetChar;
        flipText.textContent = targetChar;

        flipContainer.classList.remove('flipping');
        flipContainer.style.transform = '';
      }, 300);

      return;
    }

    // Shuffle to random character
    const nextChar = shuffleCount === maxShuffles - 1 ? targetChar : getRandomChar();

    flipText.textContent = topText.textContent;
    flipContainer.classList.add('flipping');

    setTimeout(() => {
      topText.textContent = nextChar;
      bottomText.textContent = nextChar;

      flipContainer.classList.remove('flipping');
      flipContainer.style.transform = '';
      shuffleCount++;

      setTimeout(shuffle, 150);
    }, 300);
  }

  shuffle();
}

// ===== FIELD HELPERS =====

function padField(str, width) {
  const upper = String(str).toUpperCase();
  if (upper.length >= width) return upper.slice(0, width);
  return upper.padEnd(width, ' ');
}

// ===== TIMETABLE FETCH =====

async function fetchTimetable() {
  const res = await fetch('/api/timetable');
  timetable = await res.json();
  // API already returns sorted by departure_time, but ensure it
  timetable.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
}

// ===== WINDOW CALCULATION =====

function getWindow(entries, now) {
  if (entries.length === 0) return [];

  const windowSize = 6;
  let startIndex = entries.findIndex(e => e.departure_time >= now);

  // If none found after now, wrap to start of day
  if (startIndex === -1) startIndex = 0;

  const result = [];
  for (let i = 0; i < windowSize; i++) {
    result.push(entries[(startIndex + i) % entries.length]);
  }
  return result;
}

// ===== DOM BUILDERS =====

function buildHeaderRow() {
  const header = document.createElement('div');
  header.className = 'board-header';

  const cols = [
    { label: 'DEPARTS', cls: 'col-departs' },
    { label: 'FROM',    cls: 'col-from' },
    { label: 'TO',      cls: 'col-to' },
    { label: 'ARRIVES', cls: 'col-arrives' },
  ];

  for (const col of cols) {
    const span = document.createElement('span');
    span.className = col.cls;
    span.textContent = col.label;
    header.appendChild(span);
  }

  return header;
}

function buildSplitFlapRow(text, width) {
  const row = document.createElement('div');
  row.className = 'split-flap-row';

  const padded = padField(text, width);
  for (const char of padded) {
    row.appendChild(createFlap(char));
  }
  return row;
}

function buildRow(entry) {
  const row = document.createElement('div');
  row.className = 'board-row';

  row.appendChild(buildSplitFlapRow(entry.departure_time,   COL_DEPARTS));
  row.appendChild(buildSplitFlapRow(entry.source_station,   COL_FROM));
  row.appendChild(buildSplitFlapRow(entry.destination_station, COL_TO));
  row.appendChild(buildSplitFlapRow(entry.arrival_time,     COL_ARRIVES));

  return row;
}

// ===== ANIMATION =====

function animateAllRows(entries, now) {
  const board = document.getElementById('board');

  // Remove all existing data rows (keep header)
  const header = board.querySelector('.board-header');
  board.innerHTML = '';
  if (header) board.appendChild(header);

  const window6 = getWindow(entries, now);

  window6.forEach((entry, rowIndex) => {
    const rowEl = buildRow(entry);
    board.appendChild(rowEl);

    // Stagger: 200ms between rows, then center-out within each row
    const rowDelay = rowIndex * 200;

    const flaps = rowEl.querySelectorAll('.character-flap');
    flaps.forEach((flap, flapIndex) => {
      const centerIndex = Math.floor(flaps.length / 2);
      const distFromCenter = Math.abs(flapIndex - centerIndex);
      const flapDelay = rowDelay + distFromCenter * 100;

      setTimeout(() => {
        animateFlap(flap, flap.dataset.targetChar);
      }, flapDelay);
    });
  });
}

// ===== CLOCK =====

function getCurrentTime() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ===== TICK =====

function tick() {
  if (timetable.length === 0) return;
  animateAllRows(timetable, getCurrentTime());
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', async () => {
  // Build board skeleton with just the header
  const board = document.getElementById('board');
  board.appendChild(buildHeaderRow());

  await fetchTimetable();
  tick();
  setInterval(tick, 30000);
});
