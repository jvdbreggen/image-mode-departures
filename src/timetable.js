const DEPART_WIDTH = 5;
const CITY_WIDTH = 15;

/**
 * Returns the current local time as an "HH:MM" string.
 * @returns {string}
 */
export function getCurrentTimeHHMM() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Normalises a raw timetable entry from the API into a board row object.
 *
 * @param {Object} entry - Raw API object.
 * @param {boolean} [tomorrow=false] - Whether this entry is from the next day.
 * @returns {{ depart: string, from: string, to: string, arrive: string, tomorrow: boolean }}
 */
function normalise(entry, tomorrow = false) {
  const depart = (entry.departure_time || '').padEnd(DEPART_WIDTH, ' ').substring(0, DEPART_WIDTH);
  const arrive = (entry.arrival_time || '').padEnd(DEPART_WIDTH, ' ').substring(0, DEPART_WIDTH);
  const from = (entry.source_station || '')
    .toUpperCase()
    .substring(0, CITY_WIDTH)
    .padEnd(CITY_WIDTH, ' ');
  const to = (entry.destination_station || '')
    .toUpperCase()
    .substring(0, CITY_WIDTH)
    .padEnd(CITY_WIDTH, ' ');
  return { depart, from, to, arrive, tomorrow };
}

/**
 * A blank/padding row used when there are fewer than 6 entries to display.
 */
function blankRow() {
  return {
    depart: ' '.repeat(DEPART_WIDTH),
    from: ' '.repeat(CITY_WIDTH),
    to: ' '.repeat(CITY_WIDTH),
    arrive: ' '.repeat(DEPART_WIDTH),
    tomorrow: false,
  };
}

/**
 * Fetches the full timetable from the backend and returns normalised entries
 * sorted by departure_time ascending.
 *
 * @returns {Promise<Array<{depart:string, from:string, to:string, arrive:string, tomorrow:boolean}>>}
 */
export async function fetchTimetable() {
  const response = await fetch('/api/timetable');
  if (!response.ok) {
    throw new Error(`Timetable fetch failed: ${response.status}`);
  }
  const data = await response.json();
  // Sort by departure_time string comparison (HH:MM lexicographic order is correct)
  data.sort((a, b) => (a.departure_time > b.departure_time ? 1 : -1));
  return data.map((entry) => normalise(entry, false));
}

/**
 * Returns exactly 6 row objects for the given window index.
 *
 * windowIndex 0 → next 6 departures from now
 * windowIndex 1 → the 6 after that
 *
 * Wrapping: when the slice extends past end-of-day (past the last entry in the
 * sorted list), entries are taken from the start of the list and marked tomorrow:true.
 *
 * @param {Array} entries - Full normalised timetable (from fetchTimetable).
 * @param {number} windowIndex - 0 or 1.
 * @returns {Array} Array of exactly 6 row objects.
 */
export function getWindow(entries, windowIndex) {
  if (!entries || entries.length === 0) {
    return Array.from({ length: 6 }, blankRow);
  }

  const now = getCurrentTimeHHMM();

  // Find the index of the first departure >= now
  let startIndex = entries.findIndex((e) => e.depart >= now);
  if (startIndex === -1) {
    // All departures are in the past — wrap to start of day (tomorrow)
    startIndex = entries.length; // will immediately wrap
  }

  // Offset by windowIndex × 6
  const windowStart = startIndex + windowIndex * 6;

  const result = [];
  for (let i = 0; i < 6; i++) {
    const absIndex = windowStart + i;
    if (absIndex < entries.length) {
      // Still within today's list
      result.push(entries[absIndex]);
    } else if (entries.length > 0) {
      // Wrap around — this is tomorrow's departure
      const wrappedIndex = absIndex % entries.length;
      const entry = entries[wrappedIndex];
      result.push({ ...entry, tomorrow: true });
    } else {
      result.push(blankRow());
    }
  }

  // Pad with blank rows if we somehow ended up short
  while (result.length < 6) {
    result.push(blankRow());
  }

  return result;
}
