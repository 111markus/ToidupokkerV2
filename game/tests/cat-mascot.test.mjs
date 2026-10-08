import test from 'node:test';
import assert from 'node:assert/strict';
import { CAT_LINES } from '../dist/cat-lines.js';
import { selectCatReaction, renderCatMascot, catArtwork } from '../dist/cat-mascot.js';
import { FOODS } from '../dist/engine.js';

const feedback = (groups, extra = {}) => ({ card: { name: 'Testkaart', groups }, lost: 0, overflows: [], gains: groups, water: false, ...extra });
const ordinary = .9; // Avoid optional easter eggs when checking normal priority.

test('category reactions, two-point picks, snacks, and water use the matching exact pools', () => {
  for (const group of Object.keys(CAT_LINES.goodPick)) {
    const result = selectCatReaction(feedback([group]), '', () => ordinary);
    assert.ok(CAT_LINES.goodPick[group].includes(result.line));
    assert.equal(result.expression, 'happy');
  }
  const double = selectCatReaction(feedback(['veg', 'veg']), '', () => ordinary);
  assert.ok(CAT_LINES.twoPoint.includes(double.line));
  assert.equal(double.expression, 'happy');
  const snack = selectCatReaction(feedback(['snack', 'fat']), '', () => ordinary);
  assert.ok(CAT_LINES.snack.includes(snack.line));
  assert.equal(snack.expression, 'cheeky');
  const water = selectCatReaction({water:true}, '', () => ordinary);
  assert.ok(CAT_LINES.water.includes(water.line));
  assert.equal(water.expression, 'neutral');
});

test('overflow has priority over snack, double points, and optional food dialogue', () => {
  for (const group of Object.keys(CAT_LINES.goodPick)) {
    const result = selectCatReaction(feedback([group, 'snack'], {lost:1, overflows:[group]}), '', () => 0);
    assert.equal(result.line, CAT_LINES.penalty[group][0]);
    assert.equal(result.expression, 'angry');
  }
  const double = selectCatReaction(feedback(['grain', 'protein'], {lost:2, overflows:['grain', 'protein']}));
  assert.equal(double.line, CAT_LINES.penalty.multiple[0]);
  const sameGroup = selectCatReaction(feedback(['veg', 'veg'], {lost:2, overflows:['veg', 'veg']}));
  assert.equal(sameGroup.line, CAT_LINES.penalty.veg[0]);
  const chipsOverflow = selectCatReaction(feedback(['snack', 'snack'], {lost:2, overflows:['snack']}));
  assert.ok(CAT_LINES.penalty.snack.includes(chipsOverflow.line));
  assert.equal(chipsOverflow.expression, 'angry');
});

test('repeat snacks use penalty dialogue while keeping the snack expression', () => {
  const result = selectCatReaction(feedback(['snack'], {lost:1}), '', () => ordinary);
  assert.ok(CAT_LINES.penalty.snack.includes(result.line));
  assert.equal(result.expression, 'cheeky');
});

test('multi-line pools never repeat consecutively, including repeated random values', () => {
  const moves = [
    ...Object.keys(CAT_LINES.goodPick).map(k => feedback([k])),
    feedback(['grain', 'protein']), feedback(['snack']), feedback(['snack'], {lost:1}),
    {water:true},
  ];
  for (const move of moves) {
    let previous = '';
    for (let i = 0; i < 20; i++) {
      const result = selectCatReaction(move, previous, () => ordinary);
      assert.notEqual(result.line, previous);
      previous = result.line;
    }
  }
});

test('easter eggs only apply to existing named foods without life loss', () => {
  for (const [name, lines] of Object.entries(CAT_LINES.easterEggs)) {
    const card = FOODS.find(card => card.name === name);
    assert.ok(card, name);
    const move = feedback(card.groups, {card});
    const egg = selectCatReaction(move, '', () => 0);
    assert.ok(lines.includes(egg.line), name);
    assert.notEqual(selectCatReaction(move, egg.line, () => 0).line, egg.line);
    const penalty = selectCatReaction({...move, lost:1, overflows:[card.groups[0]]}, '', () => 0);
    assert.ok(!lines.includes(penalty.line), name);
  }
});

test('selecting dialogue does not mutate game feedback or consume shuffle randomness', () => {
  const move = feedback(['grain']);
  const snapshot = structuredClone(move);
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('Consumed game randomness'); };
  try {
    assert.ok(selectCatReaction(move).line);
    assert.deepEqual(move, snapshot);
  } finally { Math.random = originalRandom; }
});

test('artwork has all four expressions and message markup escapes editable text', () => {
  for (const expression of ['neutral', 'happy', 'angry', 'cheeky']) {
    assert.match(catArtwork(expression), /<svg/);
    assert.match(catArtwork(expression), /#1f1f2b/);
    assert.match(catArtwork(expression), /#c0c1cd/);
  }
  assert.match(renderCatMascot(null), /cat-hidden/);
  assert.match(renderCatMascot(null), /aria-hidden="true"/);
  const html = renderCatMascot({expression:'happy', line:'<b>test</b>'}, true);
  assert.match(html, /&lt;b&gt;test&lt;\/b&gt;/);
  assert.match(html, /aria-live="polite"/);
});
