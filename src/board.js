import { createFlap, animateFlap } from './splitFlap.js';

// Column widths in characters: DEPART, FROM, TO, ARRIVE
export const COL_WIDTHS = [5, 15, 15, 5];
export const COL_NAMES = ['Depart', 'From', 'To', 'Arrive'];

const TOTAL_ROWS = 6;

// Module-level store: array of 6 arrays, each containing the flap elements for that row
// flapRows[rowIndex] = flat array of HTMLElement (character-flap), in left-to-right column order
const flapRows = [];

/**
 * Builds the 6-row split-flap board inside the given container element.
 * Each row has 4 column groups separated by .col-gap spacers.
 * A .tomorrow-label span is included in every row (hidden by default via CSS).
 *
 * @param {HTMLElement} container - The .board-body element to build into.
 */
export function buildBoard(container) {
  flapRows.length = 0;
  container.innerHTML = '';

  for (let r = 0; r < TOTAL_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'split-flap-row';
    row.dataset.tomorrow = 'false';

    // Tomorrow label (hidden by default via CSS)
    const tomorrowLabel = document.createElement('span');
    tomorrowLabel.className = 'tomorrow-label';
    tomorrowLabel.textContent = 'Tomorrow';
    row.appendChild(tomorrowLabel);

    const rowFlaps = [];

    COL_WIDTHS.forEach((width, colIndex) => {
      // Add column gap before every column except the first
      if (colIndex > 0) {
        const gap = document.createElement('div');
        gap.className = 'col-gap';
        row.appendChild(gap);
      }

      for (let c = 0; c < width; c++) {
        const flap = createFlap(' ');
        row.appendChild(flap);
        rowFlaps.push(flap);
      }
    });

    flapRows.push(rowFlaps);
    container.appendChild(row);
  }
}

/**
 * Updates all 6 rows of the board with new data.
 *
 * @param {Array<{depart:string, from:string, to:string, arrive:string, tomorrow:boolean}>} rows
 *   Exactly 6 row objects. Missing entries default to blank.
 * @param {boolean} animate - If true, use the flip animation for changed characters.
 *   If false, set characters instantly (used for the initial cold render).
 */
export function updateBoard(rows, animate) {
  const rowEls = document.querySelectorAll('.split-flap-row');

  for (let r = 0; r < TOTAL_ROWS; r++) {
    const rowData = rows[r] || { depart: '     ', from: '               ', to: '               ', arrive: '     ', tomorrow: false };
    const rowFlaps = flapRows[r];
    const rowEl = rowEls[r];

    // Update the tomorrow indicator
    if (rowEl) {
      rowEl.dataset.tomorrow = rowData.tomorrow ? 'true' : 'false';
    }

    // Build the flat character string for this row: depart + from + to + arrive
    const chars = (rowData.depart + rowData.from + rowData.to + rowData.arrive).toUpperCase();

    const centerIndex = Math.floor(rowFlaps.length / 2);

    rowFlaps.forEach((flap, i) => {
      const targetChar = chars[i] !== undefined ? chars[i] : ' ';
      flap.dataset.targetChar = targetChar;

      if (!animate) {
        // Instant set — update all three text nodes directly
        const topText = flap.querySelector('.flap-top .char-text');
        const bottomText = flap.querySelector('.flap-bottom .char-text');
        const flipText = flap.querySelector('.flap-flip .char-text');
        if (topText) topText.textContent = targetChar;
        if (bottomText) bottomText.textContent = targetChar;
        if (flipText) flipText.textContent = targetChar;
      } else {
        // Only animate if the character has changed
        const currentChar = flap.querySelector('.flap-top .char-text')?.textContent;
        if (currentChar !== targetChar) {
          // Stagger: centre-out within the row
          const distanceFromCenter = Math.abs(i - centerIndex);
          const delay = distanceFromCenter * 60; // 60ms per step from centre
          setTimeout(() => animateFlap(flap, targetChar), delay);
        }
      }
    });
  }
}
