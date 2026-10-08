import { CAT_LINES } from './cat-lines.js';

function randomNumber() {
  // Dialogue randomness must not consume the game's shuffle randomness.
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 4294967296;
  }
  return Math.random();
}

export function selectCatReaction(feedback, previousLine = '', random = randomNumber) {
  if (!feedback) return null;
  let pool;
  let expression;
  if (feedback.water) {
    pool = CAT_LINES.water;
    expression = 'neutral';
  } else {
    const overflow = [...new Set(feedback.overflows)];
    const card = feedback.card;
    if (feedback.lost && overflow.length) {
      pool = overflow.length > 1 ? CAT_LINES.penalty.multiple : CAT_LINES.penalty[overflow[0]];
      expression = 'angry';
    } else if (card.groups.includes('snack')) {
      pool = feedback.lost ? CAT_LINES.penalty.snack : CAT_LINES.snack;
      expression = 'cheeky';
    } else if (card.groups.length === 2) {
      pool = CAT_LINES.twoPoint;
      expression = 'happy';
    } else {
      pool = CAT_LINES.goodPick[card.groups[0]];
      expression = 'happy';
    }
    const egg = CAT_LINES.easterEggs[card.name]?.filter(line => line !== previousLine);
    if (!feedback.lost && egg?.length && random() < .2) pool = egg;
  }
  const alternatives = pool.filter(line => line !== previousLine);
  // Exact single-line penalties necessarily repeat if the same penalty recurs.
  const choices = alternatives.length ? alternatives : pool;
  return { expression, line: choices[Math.floor(random() * choices.length)] };
}

// Replace this function's markup to swap the artwork for your own image later.
export function catArtwork(expression = 'neutral') {
  const angry = expression === 'angry';
  const head = angry
    ? 'M23 37 10 19 35 23Q56 14 77 23L102 19 89 37Q96 52 85 65Q73 76 56 74Q38 76 27 65Q16 53 23 37Z'
    : 'M24 37 20 9Q20 4 26 9L43 22Q56 16 69 22L86 9Q92 4 90 12L88 37Q96 52 85 65Q73 76 56 74Q38 76 27 65Q16 53 24 37Z';
  const eyes = expression === 'happy'
    ? '<path d="M31 49Q41 33 51 49M62 49Q72 33 82 49" fill="none" stroke="#d1eb65" stroke-width="6" stroke-linecap="round"/>'
    : angry
      ? '<path d="m31 42 20 7-4 8-14-3Zm31 7 20-7-2 12-14 3Z" fill="#d1eb65"/><path d="M42 48v6M72 48v6" stroke="#11111a" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="49" r="2" fill="#fff"/><circle cx="77" cy="49" r="2" fill="#fff"/><path d="m30 36 20 7m13 0 20-7" stroke="#a8a9b8" stroke-width="2.5" stroke-linecap="round"/>'
      : `<ellipse cx="41" cy="46" rx="11" ry="12" fill="#d1eb65"/><ellipse cx="72" cy="46" rx="11" ry="${expression === 'cheeky' ? 8 : 12}" fill="#d1eb65"/><ellipse cx="42" cy="46" rx="2.5" ry="9" fill="#11111a"/><ellipse cx="72" cy="46" rx="2.5" ry="${expression === 'cheeky' ? 6 : 9}" fill="#11111a"/><circle cx="36" cy="41" r="3" fill="#fff"/><circle cx="67" cy="42" r="2.6" fill="#fff"/>${expression === 'cheeky' ? '<path d="M63 30q10-8 20 0" stroke="#b6b7c5" stroke-width="2.5" fill="none" stroke-linecap="round"/>' : ''}`;
  return `<svg class="cat-art" viewBox="0 0 112 112" aria-hidden="true" focusable="false"><g stroke="#c0c1cd" stroke-width="2.5" stroke-linejoin="round"><path d="M79 98q26-4 24-23-1-13-10-11-7 2-3 10 8 18-13 16" fill="#1f1f2b"/><path d="${angry ? 'M32 59 20 66 25 73 15 80 25 81Q17 102 36 105H77Q96 102 86 81L97 80 88 73 93 66 79 59Z' : 'M35 60Q21 72 25 95Q27 105 38 105H75Q88 104 88 94Q90 72 77 60Z'}" fill="#1f1f2b"/><path d="${head}" fill="#1f1f2b"/></g><path d="${angry ? 'm18 24 12 4-6 6m70-10-12 4 6 6' : 'm26 16 4 17 9-8m47-9-4 17-9-8'}" fill="#e5a7b9"/><path d="${angry ? 'M23 28l9 4m49 0 9-4' : 'm24 15 2 14m60-14-2 14'}" fill="none" stroke="#797b8c" stroke-width="2.5" stroke-linecap="round"/><path d="M35 30q5-4 10-4" fill="none" stroke="#606273" stroke-width="3" stroke-linecap="round"/><g class="cat-eyes">${eyes}</g><ellipse cx="49" cy="62" rx="8" ry="5" fill="#777987"/><ellipse cx="63" cy="62" rx="8" ry="5" fill="#777987"/><path d="M51 56q5-3 10 0l-5 6Z" fill="#efb0c1"/><path d="${expression === 'cheeky' ? 'M56 62v4q8 4 13-3' : angry ? 'M56 62v3m-6 5q6-6 12 0' : 'M56 62v3q-5 5-9 0m9 0q5 5 9 0'}" fill="none" stroke="#272733" stroke-width="1.8" stroke-linecap="round"/><path d="m17 57 17 3m-18 5 18-1m44-4 17-3m-17 7 18 1" stroke="#c0c1cd" stroke-width="1.8" stroke-linecap="round"/><path d="M49 78q7 5 14 0l-3 16h-8Z" fill="#eeeef0"/><path d="M32 97q6-3 13 0m23 0q6-3 13 0" fill="none" stroke="#646676" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}

const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderCatMascot(reaction, animate = false) {
  const expression = reaction?.expression || 'neutral';
  return `<div class="cat-mascot ${reaction ? '' : 'cat-hidden'} ${animate ? 'cat-change' : ''}" data-expression="${expression}" ${reaction ? '' : 'aria-hidden="true"'}>${catArtwork(expression)}<div class="cat-bubble" role="status" aria-live="polite" aria-atomic="true"><p class="cat-bubble-text">${escape(reaction?.line || '')}</p></div></div>`;
}
