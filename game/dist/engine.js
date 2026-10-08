export const GROUPS = {
  grain: { name: 'Teravili ja kartul', short: 'Teravili', icon: '🌾', color: '#d8b775', tutorial: [2, 2], real: [8, 9] },
  veg: { name: 'Köögiviljad, puuviljad ja marjad', short: 'Köögi- ja puuviljad', icon: '🥕', color: '#98af78', tutorial: [2, 2], real: [7, 8] },
  dairy: { name: 'Piimatooted', short: 'Piimatooted', icon: '🥛', color: '#a5c1d0', tutorial: [1, 1], real: [5, 6] },
  fat: { name: 'Rasvad, pähklid ja seemned', short: 'Rasvad ja pähklid', icon: '🥑', color: '#c0c991', tutorial: [1, 1], real: [5, 6] },
  protein: { name: 'Liha, kala, muna ja taimsed alternatiivid', short: 'Valk', icon: '🥚', color: '#d4a088', tutorial: [1, 1], real: [5, 6] },
  snack: { name: 'Magusad ja soolased snäkid', short: 'Snäkid', icon: '🍪', color: '#c3a9c2', tutorial: [0, 1], real: [0, 3] },
};
export const MAIN = ['grain', 'veg', 'dairy', 'fat', 'protein'];
const single = [
  ['Kaerahelbepuder', '🥣', 'grain', 2], ['Täisteraleib', '🍞', 'grain', 2], ['Rukkileib', '🍞', 'grain', 2],
  ['Riis', '🍚', 'grain', 2], ['Tatar', '🥣', 'grain', 2], ['Kartul', '🥔', 'grain', 2],
  ['Porgand', '🥕', 'veg', 2], ['Kurk', '🥒', 'veg', 2], ['Tomat', '🍅', 'veg', 2], ['Brokoli', '🥦', 'veg', 2],
  ['Õun', '🍎', 'veg', 2], ['Banaan', '🍌', 'veg', 1], ['Apelsin', '🍊', 'veg', 1], ['Mustikad', '🫐', 'veg', 1], ['Maasikad', '🍓', 'veg', 1],
  ['Piim', '🥛', 'dairy', 2], ['Keefir', '🥛', 'dairy', 2], ['Kodujuust', '🥣', 'dairy', 1], ['Juust', '🧀', 'dairy', 2],
  ['Oliiviõli', '🫒', 'fat', 2], ['Mandlid', '🌰', 'fat', 2], ['Seemnesegu', '🌻', 'fat', 1], ['Avokaado', '🥑', 'fat', 1],
  ['Kanakints', '🍗', 'protein', 3], ['Veiseliha', '🥩', 'protein', 1], ['Lõhe', '🐟', 'protein', 3], ['Muna', '🥚', 'protein', 1],
  ['Oad', '🫘', 'protein', 1], ['Läätsed', '🥣', 'protein', 1], ['Tofu', '🧊', 'protein', 1],
  ['Šokolaad', '🍫', 'snack', 2], ['Küpsis', '🍪', 'snack', 2], ['Jäätis', '🍦', 'snack', 1], ['Energiajook', '🥤', 'snack', 1],
];
const double = [
  ['Sushi', '🍣', 'grain', 'protein', 3], ['Kanawrap', '🌯', 'grain', 'protein', 3],
  ['Caesari salat', '🥗', 'veg', 'protein', 3], ['Juustuburger', '🍔', 'fat', 'protein', 3],
  ['Jogurt müsliga', '🥣', 'grain', 'dairy', 2], ['Juustuvõileib', '🥪', 'grain', 'dairy', 2],
  ['Avokaadoröstsai', '🥑', 'grain', 'fat', 2], ['Lõhe kartuliga', '🐟', 'grain', 'protein', 2],
  ['Puuviljasalat', '🍊', 'veg', 'veg', 2], ['Pähkli-jogurtikauss', '🥣', 'dairy', 'fat', 2],
  ['Snickers', '🍫', 'snack', 'fat', 2], ['Karamelli macchiato', '☕', 'dairy', 'snack', 1],
  ['Kartulikrõpsud', '🥔', 'snack', 'snack', 1],
];
export const FOODS = [
  ...single.map(([name, icon, group, quantity]) => ({ name, icon, groups: [group], quantity })),
  ...double.map(([name, icon, a, b, quantity]) => ({ name, icon, groups: [a, b], quantity })),
];
export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function makeDeck(mode, rng = Math.random) {
  if (mode === 'tutorial') {
    // The brief specifies 27 teaching cards but lists 56 physical single cards.
    // Use 27 distinct foods, sampled within these balanced teaching quotas.
    const quotas = { grain: 6, veg: 7, dairy: 4, fat: 3, protein: 5, snack: 2 };
    return shuffle(Object.entries(quotas).flatMap(([group, quota]) =>
      shuffle(FOODS.filter(f => f.groups.length === 1 && f.groups[0] === group), rng)
        .slice(0, quota).map(f => ({ ...f, id: `tutorial-${f.name}` }))), rng);
  }
  return shuffle(FOODS.flatMap((food, index) =>
    Array.from({ length: food.quantity }, (_, copy) => ({ ...food, id: `${index}-${copy}` }))), rng);
}
export function createGame(mode, rng = Math.random) {
  if (!['tutorial', 'real'].includes(mode)) throw new Error('Tundmatu mängurežiim.');
  const game = {
    mode, lives: 3, counts: Object.fromEntries(Object.keys(GROUPS).map(k => [k, 0])),
    deck: makeDeck(mode, rng), dayDeck: [], hand: [], day: 1, meal: 0, round: 0,
    status: 'playing', won: false, reason: '', history: [], feedback: null,
  };
  if (mode === 'real') startDay(game, rng);
  draw(game, rng);
  return game;
}
export function startDay(game, rng = Math.random) {
  const shuffled = shuffle(game.deck, rng);
  const daysRemaining = 8 - game.day;
  const frequencies = new Map();
  for (const card of shuffled) frequencies.set(card.name, (frequencies.get(card.name) || 0) + 1);
  // Spread duplicate copies across remaining days so the final 12 cards can
  // still be distinct foods. Selection is random within this feasibility rule.
  const mandatory = new Set([...frequencies].filter(([, n]) => n >= daysRemaining).map(([name]) => name));
  const seen = new Set();
  game.dayDeck = [];
  game.deck = [];
  for (const card of shuffled) {
    if (mandatory.has(card.name) && !seen.has(card.name)) {
      seen.add(card.name);
      game.dayDeck.push(card);
    }
  }
  const selected = new Set(game.dayDeck.map(card => card.id));
  for (const card of shuffled) {
    if (selected.has(card.id)) continue;
    if (game.dayDeck.length < 12 && !seen.has(card.name)) {
      seen.add(card.name);
      game.dayDeck.push(card);
    } else game.deck.push(card);
  }
  game.dayDeck = shuffle(game.dayDeck, rng);
  if (game.dayDeck.length < 12) finish(game, false, 'cards');
}
export function draw(game, rng = Math.random) {
  if (game.status !== 'playing') return;
  const source = game.mode === 'tutorial' ? game.deck : game.dayDeck;
  // After round 6, independently raise the draw chance of each untouched group.
  if (game.mode === 'tutorial' && game.round >= 6) {
    const missing = shuffle(MAIN.filter(k => game.counts[k] === 0), rng);
    let slot = 0;
    for (const group of missing) {
      if (slot === 3) break;
      const index = source.findIndex(card => card.groups.includes(group));
      if (index >= 0 && rng() < .8) {
        [source[slot], source[index]] = [source[index], source[slot]];
        slot++;
      }
    }
  }
  game.hand = source.splice(0, 3);
  if (game.hand.length < 3) finish(game, false, 'cards');
}
export function isBalanced(game) {
  return MAIN.every(k => {
    const [min, max] = GROUPS[k][game.mode];
    return game.counts[k] >= min && game.counts[k] <= max;
  }) && (game.mode === 'tutorial' || game.counts.snack <= 3);
}
function finish(game, won, reason) {
  game.status = 'finished'; game.won = won; game.reason = reason;
}
export function chooseCard(game, id) {
  if (game.status !== 'playing' || game.feedback) throw new Error('Praegu ei saa kaarti valida.');
  const card = game.hand.find(card => card.id === id);
  if (!card) throw new Error('Seda kaarti ei ole käes.');
  const gains = [];
  const overflows = [];
  let lost = 0;
  const previousSnacks = game.counts.snack;
  let snackOverflow = 0;
  for (const group of card.groups) {
    if (group === 'snack') {
      game.counts.snack++;
      if (game.mode === 'real' && game.counts.snack > 3) snackOverflow++;
    } else {
      const max = GROUPS[group][game.mode][1];
      if (game.counts[group] >= max) {
        lost++;
        overflows.push(group);
        // Teaching points stop at their target; real-week excess remains visible.
        if (game.mode === 'real') game.counts[group]++;
      } else {
        game.counts[group]++;
        gains.push(group);
      }
    }
  }
  if (card.groups.includes('snack')) {
    // Avoid double charging the repeat-snack and snack-overflow penalties.
    lost += Math.max(previousSnacks > 0 ? 1 : 0, snackOverflow);
    if (snackOverflow) overflows.push('snack');
  }
  game.lives = Math.max(0, game.lives - lost);
  game.history.push({ ...card, day: game.day, meal: game.meal, lost });
  game.feedback = { card, gains, overflows, lost, water: false };
  game.round++;
  game.meal++;
  if (game.lives === 0) finish(game, false, 'water');
  else if (game.mode === 'tutorial' && isBalanced(game)) finish(game, true, 'balanced');
  else if (game.mode === 'tutorial' && game.deck.length === 0) finish(game, false, 'cards');
  else if (game.mode === 'real' && game.meal === 4) {
    if (game.day === 7) finish(game, isBalanced(game), isBalanced(game) ? 'balanced' : 'unbalanced');
    else game.status = 'day-end';
  }
  return game.feedback;
}
export function drinkWater(game) {
  if (game.status !== 'playing' || game.feedback || game.lives >= 3) throw new Error('Vett on piisavalt või voor on lõppenud.');
  game.lives++;
  game.history.push({ water: true, day: game.day, meal: game.meal });
  game.feedback = { water: true, lost: 0, gains: [], overflows: [] };
  game.round++;
  game.meal++;
  if (game.mode === 'tutorial' && game.deck.length === 0) finish(game, false, 'cards');
  else if (game.mode === 'real' && game.meal === 4) {
    if (game.day === 7) finish(game, isBalanced(game), isBalanced(game) ? 'balanced' : 'unbalanced');
    else game.status = 'day-end';
  }
}
export function continueGame(game, rng = Math.random) {
  if (game.status !== 'playing' || !game.feedback) throw new Error('Järgmist vooru ei saa veel alustada.');
  game.feedback = null;
  draw(game, rng);
}
export function nextDay(game, rng = Math.random) {
  if (game.status !== 'day-end') throw new Error('Päev ei ole veel lõppenud.');
  // Any unused daily cards return; all offered hands stay permanently discarded.
  game.deck.push(...game.dayDeck);
  game.dayDeck = [];
  game.day++;
  game.meal = 0;
  game.feedback = null;
  game.status = 'playing';
  startDay(game, rng);
  draw(game, rng);
}
