import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, MAIN, FOODS, makeDeck, createGame, chooseCard, drinkWater, continueGame, nextDay, isBalanced, draw, startDay } from '../dist/engine.js';

function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
const playFood = (game, name) => {
  game.hand = [{ ...FOODS.find(f => f.name === name), id: name }];
  chooseCard(game, name);
};
test('physical deck matches all 84 cards and both category tables', () => {
  const deck = makeDeck('real', seeded(1));
  assert.equal(deck.length, 84);
  assert.equal(new Set(deck.map(c => c.id)).size, 84);
  const totals = size => Object.fromEntries(Object.keys(GROUPS).map(k => [k, deck.filter(c => c.groups.length === size).flatMap(c => c.groups).filter(g => g === k).length]));
  assert.equal(deck.filter(c => c.groups.length === 1).length, 56);
  assert.equal(deck.filter(c => c.groups.length === 2).length, 28);
  assert.deepEqual(totals(1), { grain: 12, veg: 14, dairy: 7, fat: 6, protein: 11, snack: 6 });
  assert.deepEqual(totals(2), { grain: 14, veg: 7, dairy: 7, fat: 9, protein: 14, snack: 5 });
});
test('tutorial has 27 distinct single cards and is shuffled on restart', () => {
  const a = makeDeck('tutorial', seeded(1));
  const b = makeDeck('tutorial', seeded(2));
  assert.equal(a.length, 27);
  assert.equal(new Set(a.map(c => c.name)).size, 27);
  assert.ok(a.every(c => c.groups.length === 1));
  assert.notDeepEqual(a.map(c => c.id), b.map(c => c.id));
});
test('first snack card is free, subsequent choices consume one life', () => {
  const game = createGame('tutorial');
  playFood(game, 'Šokolaad');
  assert.equal(game.lives, 3);
  assert.equal(game.counts.snack, 1);
  continueGame(game);
  playFood(game, 'Küpsis');
  assert.equal(game.lives, 2);
  assert.equal(game.counts.snack, 2);
});
test('water is only available below three lives and discards the whole hand', () => {
  const game = createGame('tutorial');
  assert.throws(() => drinkWater(game));
  game.lives = 1;
  const offered = game.hand.map(c => c.id);
  drinkWater(game);
  assert.equal(game.lives, 2);
  assert.equal(game.round, 1);
  continueGame(game);
  assert.equal(game.deck.length, 21);
  assert.ok(game.hand.every(c => !offered.includes(c.id)));
});
test('double cards award both points, including two points within a group', () => {
  const game = createGame('real');
  playFood(game, 'Sushi');
  assert.equal(game.counts.grain, 1);
  assert.equal(game.counts.protein, 1);
  continueGame(game);
  playFood(game, 'Puuviljasalat');
  assert.equal(game.counts.veg, 2);
});
test('each overflowing point loses one life, and weekly excess remains visible', () => {
  const game = createGame('real');
  game.counts.grain = 9;
  game.counts.protein = 6;
  playFood(game, 'Sushi');
  assert.equal(game.lives, 1);
  assert.equal(game.counts.grain, 10);
  assert.equal(game.counts.protein, 7);
  assert.equal(isBalanced(game), false);
});
test('same-category double card can overflow once or twice', () => {
  for (const [before, expectedLives] of [[7, 2], [8, 1]]) {
    const game = createGame('real');
    game.counts.veg = before;
    playFood(game, 'Puuviljasalat');
    assert.equal(game.lives, expectedLives);
    assert.equal(game.counts.veg, before + 2);
  }
});
test('first crisps card is free; repeat costs one, two excess points cost two', () => {
  const game = createGame('real');
  playFood(game, 'Kartulikrõpsud');
  assert.equal(game.lives, 3);
  assert.equal(game.counts.snack, 2);
  continueGame(game);
  playFood(game, 'Kartulikrõpsud');
  assert.equal(game.lives, 2);
  continueGame(game);
  playFood(game, 'Kartulikrõpsud');
  assert.equal(game.lives, 0);
  assert.equal(game.status, 'finished');
});
test('a real day offers 12 distinct foods and never returns discarded cards', () => {
  const game = createGame('real', seeded(10));
  const originalIds = [...game.hand, ...game.dayDeck].map(c => c.id);
  assert.equal(new Set([...game.hand, ...game.dayDeck].map(c => c.name)).size, 12);
  assert.equal(game.deck.length, 72);
  for (let meal = 0; meal < 4; meal++) {
    chooseCard(game, game.hand.find(c => !c.groups.includes('snack'))?.id || game.hand[0].id);
    if (meal < 3) continueGame(game);
  }
  assert.equal(game.status, 'day-end');
  nextDay(game, seeded(20));
  assert.equal(game.day, 2);
  assert.equal(game.meal, 0);
  assert.equal(game.deck.length + game.dayDeck.length + game.hand.length, 72);
  assert.ok([...game.deck, ...game.dayDeck, ...game.hand].every(c => !originalIds.includes(c.id)));
});
test('all seven random day decks remain distinct without exhausting food variety', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = seeded(seed);
    const game = { deck: makeDeck('real', rng), dayDeck: [], day: 1, status: 'playing' };
    const used = new Set();
    for (let day = 1; day <= 7; day++) {
      game.day = day;
      startDay(game, rng);
      assert.equal(game.status, 'playing');
      assert.equal(game.dayDeck.length, 12);
      assert.equal(new Set(game.dayDeck.map(c => c.name)).size, 12);
      for (const card of game.dayDeck) { assert.ok(!used.has(card.id)); used.add(card.id); }
    }
    assert.equal(used.size, 84);
    assert.equal(game.deck.length, 0);
  }
});
test('exact teaching targets win early; deck exhaustion and zero lives lose', () => {
  const win = createGame('tutorial');
  win.counts = { grain: 2, veg: 2, dairy: 1, fat: 1, protein: 0, snack: 0 };
  playFood(win, 'Muna');
  assert.equal(win.won, true);
  assert.equal(win.reason, 'balanced');
  const empty = createGame('tutorial');
  empty.deck = [];
  playFood(empty, 'Muna');
  assert.equal(empty.status, 'finished');
  assert.equal(empty.reason, 'cards');
  const water = createGame('tutorial');
  water.counts.protein = 1;
  water.lives = 1;
  playFood(water, 'Muna');
  assert.equal(water.reason, 'water');
});
test('week does not win early; all minimums and maximums apply at day seven', () => {
  const game = createGame('real');
  MAIN.forEach(k => { game.counts[k] = GROUPS[k].real[0]; });
  assert.equal(isBalanced(game), true);
  playFood(game, 'Piim');
  assert.equal(game.status, 'playing');
  game.day = 7; game.meal = 3; game.feedback = null;
  playFood(game, 'Muna');
  assert.equal(game.status, 'finished');
  assert.equal(game.won, true);
  game.counts.snack = 4;
  assert.equal(isBalanced(game), false);
});
test('late tutorial draw boosts still-unseen groups when available', () => {
  const game = createGame('tutorial');
  game.round = 6;
  game.counts = { grain: 2, veg: 2, dairy: 1, fat: 1, protein: 0, snack: 0 };
  game.deck = ['Piim', 'Keefir', 'Juust', 'Muna'].map(name => ({ ...FOODS.find(f => f.name === name), id: name }));
  draw(game, () => 0);
  assert.ok(game.hand.some(c => c.groups.includes('protein')));
});
test('cannot choose stale cards, double-play, or skip an unfinished day', () => {
  const game = createGame('real');
  assert.throws(() => chooseCard(game, 'missing'));
  assert.throws(() => nextDay(game));
  const id = game.hand[0].id;
  chooseCard(game, id);
  assert.throws(() => chooseCard(game, id));
});
test('at least one complete tutorial and week can be won with actual random hands', () => {
  for (const mode of ['tutorial', 'real']) {
    let winner = null;
    for (let seed = 1; seed <= 1000 && !winner; seed++) {
      const rng = seeded(seed);
      const game = createGame(mode, rng);
      let guard = 0;
      while (game.status !== 'finished' && guard++ < 60) {
        if (game.status === 'day-end') { nextDay(game, rng); continue; }
        if (game.feedback) { continueGame(game, rng); continue; }
        const score = card => {
          const counts = { ...game.counts };
          return card.groups.reduce((score, k) => {
            if (k === 'snack') return score - 9;
            const [min, max] = GROUPS[k][mode];
            const value = counts[k] < min ? 3 + (min - counts[k]) / min : counts[k] < max ? .1 : -20;
            counts[k]++;
            return score + value;
          }, 0);
        };
        const card = [...game.hand].sort((a, b) => score(b) - score(a))[0];
        if (score(card) < 0 && game.lives < 3) drinkWater(game);
        else chooseCard(game, card.id);
      }
      if (game.won) winner = game;
    }
    assert.ok(winner, `${mode} has a winnable complete path`);
    if (mode === 'real') assert.equal(winner.round, 28);
  }
});
