const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :-';

function getRandomChar() {
  return charset[Math.floor(Math.random() * charset.length)];
}

/**
 * Creates a single split-flap character tile DOM element.
 * @param {string} char - The initial character to display.
 * @returns {HTMLElement}
 */
export function createFlap(char) {
  const flap = document.createElement('div');
  flap.className = 'character-flap';
  flap.dataset.targetChar = char;

  // Top half — shows upper portion of character
  const topHalf = document.createElement('div');
  topHalf.className = 'flap-top';
  const topText = document.createElement('span');
  topText.className = 'char-text';
  topText.textContent = getRandomChar();
  topHalf.appendChild(topText);

  // Bottom half — shows lower portion of same character
  const bottomHalf = document.createElement('div');
  bottomHalf.className = 'flap-bottom';
  const bottomText = document.createElement('span');
  bottomText.className = 'char-text';
  bottomText.textContent = topText.textContent;
  bottomHalf.appendChild(bottomText);

  // Flip element — animates the transition
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

/**
 * Animates a single flap tile to display targetChar using the split-flap shuffle effect.
 * @param {HTMLElement} flap
 * @param {string} targetChar
 */
export function animateFlap(flap, targetChar) {
  const topText = flap.querySelector('.flap-top .char-text');
  const bottomText = flap.querySelector('.flap-bottom .char-text');
  const flipText = flap.querySelector('.flap-flip .char-text');
  const flipContainer = flap.querySelector('.flap-flip');

  let shuffleCount = 0;
  const maxShuffles = 3 + Math.floor(Math.random() * 4); // 3–6 shuffles

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

    // Shuffle to a random (or penultimate → target) character
    const currentChar = topText.textContent;
    const nextChar = shuffleCount === maxShuffles - 1 ? targetChar : getRandomChar();

    flipText.textContent = currentChar;
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
