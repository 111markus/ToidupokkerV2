import { GROUPS, MAIN, createGame, chooseCard, drinkWater, continueGame, nextDay } from './engine.js';
import { selectCatReaction, renderCatMascot } from './cat-mascot.js';

const app = document.querySelector('#app');
let game = null;
let view = 'home';
let lastFocus = null;
let recentFeedback = null;
let feedbackTimer = null;
let catReaction = null;
let animateCat = false;
const meals = ['Hommikusöök', 'Lõunasöök', 'Vahepala', 'Õhtusöök'];
const situations = [
  ['Uus nädal, uus algus.', 'Pane alus mitmekesisele nädalale.'],
  ['Pikk koolipäev.', 'Mida valid enne järgmist tundi?'],
  ['Pärast trenni.', 'Vaata, millised toidugrupid vajavad veel täiendust.'],
  ['Sõpradega sööma.', 'Üks valik on osa kogu nädala tasakaalust.'],
  ['Reede on käes!', 'Mõtle ka sellele, mida oled juba söönud.'],
  ['Rahulik nädalavahetus.', 'Sul on aega oma püramiidi täiendada.'],
  ['Nädala viimane päev.', 'Viimased neli valikut — leia oma tasakaal.'],
];
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const drop = (empty = false) => `<svg class="drop ${empty ? 'empty' : ''}" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 2C11 8 2 16 2 23a13 13 0 0 0 26 0C28 16 19 8 15 2Z"/><path class="shine" d="M8 23c0 4 2 6 6 6"/></svg>`;
function logo() { return '<span class="brand-cards" aria-hidden="true"><span>T</span><span>P</span></span><span class="brand-name">toidupokker</span>'; }
function header(home = false) {
  return `<header class="header"><button class="brand" data-action="home" aria-label="Toidupokkeri avaleht">${logo()}</button><div class="header-right">${home ? '<span class="header-note">Natuke õnne. Palju tasakaalu.</span>' : `<span class="mode-label">${game.mode === 'tutorial' ? 'Õpetus' : 'Päriselu'}</span>`}<button class="help-button" data-action="help"><span class="help-symbol">?</span><span class="help-text">Kuidas mängida?</span></button>${home ? '' : '<button class="icon-button" data-action="exit" aria-label="Lõpeta mäng">×</button>'}</div></header>`;
}
function home() {
  return `${header(true)}<main class="home-page"><div class="home-art"><div class="art-card"><img src="./food-art.png" alt="Paberikollaaž rukkileivast, tomatist, brokolist, apelsinist, piimast, lõhest ja mandlitest" width="1122" height="1402"/><div class="art-caption"><span>Hea enesetunne algab</span><strong>tasakaalust.</strong><span class="caption-spark" aria-hidden="true">✳</span></div></div><span class="art-sticker">Iga kaart<br/>loeb!</span><span class="art-undertext">Sinu valikud. Sinu püramiid.</span></div><section class="home-content"><span class="eyebrow"><span class="small-line"></span> TOITUMINE ON KAARDIL</span><h1 class="wordmark"><span>TOIDU</span><span>POKKER<span class="wordmark-dot">.</span></span></h1><p class="home-lead">Mängi oma toidulaud tasakaalu.</p><p class="home-description">Kolm kaarti. Üks valik. Täida toidupüramiid ja avasta, kuidas väikesed valikud loovad suure pildi.</p><div class="home-actions"><button class="button primary" data-action="start-tutorial">Alusta õpetusest <span class="button-card-icon" aria-hidden="true">▱</span></button><button class="text-button" data-action="start-real">Oskad juba? Astu pärisellu</button></div><div class="mode-info"><div><span class="info-number">01</span><div><strong>Õpi mängides</strong><span>27 kaarti · kuni 9 vooru</span></div></div><div><span class="info-number">02</span><div><strong>Proovi päriselus</strong><span>7 päeva · 28 söögikorda</span></div></div></div><p class="educational-note">See on õppemäng. Mängu punktid ja veed ei ole toitumis- ega joogiveesoovitused.</p></section></main>${footer()}`;
}
function footer() { return `<footer class="footer"><span>Loodud uudishimulikele sööjatele.</span><a href="https://toitumine.ee/kuidas-tervislikult-toituda/toidusoovitused" target="_blank" rel="noopener noreferrer">Püramiidi allikas: toitumine.ee <span aria-hidden="true">↗</span></a></footer>`; }
function counter(k) {
  const [min, max] = GROUPS[k][game.mode];
  return `${game.counts[k]}<span> / ${game.mode === 'real' && min !== max && k !== 'snack' ? `${min}–${max}` : max}</span>`;
}
function pyramid() {
  const cells = {
    snack: { p: '220,14 194,57 246,57', x: 220, y: 48 },
    protein: { p: '194,57 246,57 294,139 146,139', x: 220, y: 100 },
    dairy: { p: '146,139 220,139 220,237 88,237', x: 171, y: 182 },
    fat: { p: '220,139 294,139 352,237 220,237', x: 269, y: 182 },
    grain: { p: '88,237 220,237 220,364 14,364', x: 140, y: 292 },
    veg: { p: '220,237 352,237 426,364 220,364', x: 300, y: 292 },
  };
  return `<svg class="pyramid" viewBox="0 0 440 385" role="img" aria-label="Sinu toidupüramiid: ${Object.keys(GROUPS).map(k => `${GROUPS[k].short} ${game.counts[k]}`).join(', ')}"><defs>${Object.entries(cells).map(([k, c]) => `<clipPath id="clip-${k}"><polygon points="${c.p}"/></clipPath>`).join('')}</defs>${Object.entries(cells).map(([k, c]) => {
    const count = game.counts[k];
    const max = GROUPS[k][game.mode][1];
    const overflow = count > max;
    const ratio = Math.min(count / max, 1);
    const baseY = k === 'snack' ? 57 : k === 'protein' ? 139 : ['dairy', 'fat'].includes(k) ? 237 : 364;
    const height = k === 'snack' ? 43 : k === 'protein' ? 82 : ['dairy', 'fat'].includes(k) ? 98 : 127;
    return `<g><polygon points="${c.p}" fill="#fcf8ed"/><rect x="0" y="${baseY - height * ratio}" width="440" height="${height * ratio}" fill="${overflow ? '#dfad99' : GROUPS[k].color}" opacity=".68" clip-path="url(#clip-${k})"/><polygon points="${c.p}" fill="none" stroke="#3b352f" stroke-width="2" stroke-linejoin="round"/>${k === 'snack' ? `<text x="280" y="44" class="pyramid-label">Snäkid ${count}</text>` : `<text x="${c.x}" y="${c.y}" text-anchor="middle" class="pyramid-count">${count}<tspan class="pyramid-target"> / ${game.mode === 'real' ? GROUPS[k].real.join('–') : max}</tspan></text><text x="${c.x}" y="${c.y + 27}" text-anchor="middle" class="pyramid-label">${k === 'grain' ? 'Teravili' : k === 'veg' ? 'Köögi- ja' : k === 'fat' ? 'Rasvad' : GROUPS[k].short}</text>${['grain', 'veg', 'fat'].includes(k) ? `<text x="${c.x}" y="${c.y + 44}" text-anchor="middle" class="pyramid-label">${k === 'grain' ? 'ja kartul' : k === 'fat' ? 'ja pähklid' : 'puuviljad, marjad'}</text>` : ''}`}</g>`;
  }).join('')}</svg>`;
}
function balance() {
  return `<aside class="balance-panel"><div class="panel-heading"><h2>Sinu tasakaal</h2><span>${game.mode === 'tutorial' ? 'EESMÄRK: 7' : 'NÄDALA EESMÄRK'}</span></div><div class="balance-groups">${Object.entries(GROUPS).map(([k, group]) => {
    const [min, max] = group[game.mode];
    const count = game.counts[k];
    const state = count > max ? 'over' : count >= min && (k !== 'snack' || count === 0) ? 'complete' : '';
    return `<div class="balance-row ${state}"><span class="group-icon" aria-hidden="true" style="--group-color:${group.color}">${group.icon}</span><div class="group-detail"><div><span>${group.short}</span><strong>${counter(k)}</strong></div><div class="progress-track"><span style="width:${Math.min(count / max * 100, 100)}%;background:${group.color}"></span></div></div></div>`;
  }).join('')}</div><div class="balance-note"><span aria-hidden="true">✳</span><p>${game.mode === 'tutorial' ? 'Täida viis põhigruppi. Snäkke ei pea koguma.' : 'Tasakaal sünnib kogu nädala jooksul, mitte ühest toidukorrast.'}</p></div></aside>`;
}
function lives() { return `<div class="lives" aria-label="${game.lives} vett kolmest">${[0, 1, 2].map(i => drop(i >= game.lives)).join('')}<span>${game.lives}/3 vett</span></div>`; }
function foodCard(card, index) {
  return `<button class="food-card" data-action="choose" data-id="${escape(card.id)}" style="--card-index:${index}" aria-label="Vali ${escape(card.name)}"><div class="card-top"><span class="card-point">${card.groups.length === 2 ? '<strong>2</strong> PUNKTI' : card.groups[0] === 'snack' ? 'SNÄKK' : '<strong>1</strong> PUNKT'}</span><span class="card-corner" aria-hidden="true">✳</span></div><span class="food-illustration" aria-hidden="true">${card.icon}</span><strong class="food-name">${escape(card.name)}</strong><span class="card-select">Vali kaart</span></button>`;
}
function feedback() {
  const f = recentFeedback;
  if (!f) return `<div class="choice-hint"><span aria-hidden="true">✳</span> Vali üks kaart. Ülejäänud kaks lähevad maha.</div>`;
  let title, detail;
  if (f.water) { title = 'Lonks vett — üks elu tagasi!'; detail = 'Need kolm kaarti lähevad maha. Järgmises voorus on uus võimalus.'; }
  else if (f.lost) {
    title = f.overflows.length ? `${[...new Set(f.overflows)].map(k => GROUPS[k].short).join(' ja ')}: piir on täis.` : 'Snäkitad liiga palju.';
    detail = `Kaotasid ${f.lost} ${f.lost === 1 ? 'vee' : 'vett'}.${f.gains.length ? ' ' + f.gains.map(k => `+1 ${GROUPS[k].short.toLowerCase()}`).join(', ') + '.' : ''} Vaata enne järgmist valikut oma tasakaalu.`;
  } else if (f.card.groups.includes('snack')) { title = 'Esimene snäkk on tasuta.'; detail = 'Snäkk ei täida põhigruppe. Iga järgmine snäkivalik kulutab ühe vee.'; }
  else { title = 'Hea täiendus sinu püramiidile!'; detail = f.gains.map(k => `+1 ${GROUPS[k].short.toLowerCase()}`).join(' · '); }
  return `<div class="feedback ${f.lost ? 'feedback-warning' : ''}" role="status"><div><strong>${title}</strong><p>${detail}</p></div></div>`;
}
function play() {
  const tutorial = game.mode === 'tutorial';
  return `${header()}<main class="play-page"><div class="play-heading"><div><span class="eyebrow">${tutorial ? 'ÕPIME TASAKAALU' : `PÄEV ${game.day} / 7`}</span><h1>${tutorial ? 'Iga kaart loeb.' : situations[game.day - 1][0]}</h1><p>${tutorial ? 'Täida püramiid, üks valik korraga.' : situations[game.day - 1][1]}</p></div></div><div class="game-layout"><section class="play-table" aria-label="Mängulaud"><div class="round-bar"><span>${tutorial ? `VOOR ${Math.min(game.feedback ? game.round : game.round + 1, 9)} / 9` : `${meals[Math.min(game.feedback ? game.meal - 1 : game.meal, 3)].toUpperCase()}`}</span><div class="round-dots" aria-hidden="true">${Array.from({ length: tutorial ? 9 : 4 }, (_, i) => `<span class="${i < (tutorial ? game.round : game.meal) ? 'done' : i === (tutorial ? game.round : game.meal) ? 'current' : ''}"></span>`).join('')}</div><div class="round-status"><span>${tutorial ? 'ÕPETUS' : `${Math.min(game.feedback ? game.meal : game.meal + 1, 4)} / 4`}</span>${lives()}</div></div><div class="pyramid-wrap">${pyramid()}<span class="pyramid-side-note">Vähem üleval.<br/>Rohkem all.</span></div>${renderCatMascot(catReaction, animateCat)}<div class="hand">${game.hand.map(foodCard).join('')}</div>${feedback()}<div class="table-bottom"><div class="deck-label"><span class="mini-deck" aria-hidden="true">✳</span><div><strong>${tutorial ? game.deck.length : game.deck.length + game.dayDeck.length} kaarti</strong><span>pakis alles</span></div></div><button class="water-button" data-action="water" ${game.lives === 3 || game.feedback ? 'disabled' : ''}>${drop()}<span><strong>${game.lives === 3 ? 'Vett on piisavalt' : 'Lonks vett'}</strong><small>${game.lives === 3 ? 'Sul on kõik kolm elu' : '+1 elu · see voor jääb vahele'}</small></span><span aria-hidden="true">+</span></button><span class="discard-info">${game.round * 3} kaarti<br/>maha läinud</span></div></section></div><div class="game-note"><span aria-hidden="true">✳</span>${tutorial ? 'Vihje: vajad 2 teravilja, 2 köögi- ja puuvilja ning 1 piima-, rasva- ja valgupunkti.' : 'Kahepunktiline kaart võib täiendada kahte gruppi. Mõlemad punktid lähevad arvesse.'}</div></main>${footer()}`;
}
function summary(day = false) {
  const title = day ? `${game.day}. päev tehtud!` : game.won ? 'Said tehtud!' : game.reason === 'water' ? 'Vesi sai otsa.' : game.reason === 'cards' ? 'Kaardid said otsa.' : 'Tasakaal vajab veel harjutamist.';
  const description = day ? 'Vaata oma nädala senist tasakaalu. Homme saad teha neli uut valikut.' : game.won ? game.mode === 'tutorial' ? 'Põhigrupid on täidetud. Oled valmis päriseluks!' : 'Kõik viis põhigruppi on soovitud vahemikus. Mõtlesid terve nädala peale!' : 'Üks mäng ei pea ideaalselt välja tulema. Vaata, mida järgmine kord teisiti valida.';
  const missing = MAIN.filter(k => game.counts[k] < GROUPS[k][game.mode][0]);
  const over = Object.keys(GROUPS).filter(k => game.counts[k] > GROUPS[k][game.mode][1]);
  return `${header()}<main class="summary-page"><div class="summary-heading"><span class="eyebrow">${day ? 'PÄEVA KOKKUVÕTE' : game.mode === 'tutorial' ? 'ÕPETUSE TULEMUS' : 'NÄDALA TULEMUS'}</span><h1>${title}</h1><p>${description}</p></div>${recentFeedback ? feedback() : ""}<div class="summary-grid ${day ? "summary-grid-day" : ""}"><div class="summary-pyramid">${pyramid()}${renderCatMascot(catReaction, animateCat)}${lives()}<div class="summary-stats"><div><strong>${game.history.filter(h => !h.water).length}</strong><span>valitud kaarti</span></div><div><strong>${MAIN.reduce((sum, k) => sum + game.counts[k], 0)}</strong><span>põhigrupi punkti</span></div><div><strong>${game.counts.snack}</strong><span>snäkipunkti</span></div></div></div>${day ? "" : balance()}</div>${missing.length || over.length ? `<div class="result-advice">${missing.length ? `<p><strong>Lisa veel:</strong> ${missing.map(k => `${GROUPS[k].short.toLowerCase()} (${GROUPS[k][game.mode][0] - game.counts[k]} p)`).join(', ')}.</p>` : ''}${over.length ? `<p><strong>Piir on ületatud:</strong> ${over.map(k => GROUPS[k].short.toLowerCase()).join(', ')}.</p>` : ''}${!day ? '<p>Tasakaal sõltub tervikust. Proovi järgmises mängus täita esmalt puuduvad grupid.</p>' : ''}</div>` : ''}<section class="history-section"><h2>${day ? 'Tänased valikud' : 'Sinu valitud kaardid'}</h2><div class="history-cards">${game.history.filter(h => !day || h.day === game.day).map(h => `<div class="history-card" style="--group-color:${h.water ? '#a5c1d0' : GROUPS[h.groups[0]].color}"><span aria-hidden="true">${h.water ? '💧' : h.icon}</span><strong>${h.water ? 'Lonks vett' : escape(h.name)}</strong><small>${h.water ? 'Söögikord jäi vahele' : h.groups.map(k => GROUPS[k].short).join(' + ')}</small></div>`).join('')}</div></section><div class="summary-actions">${day ? `<button class="button primary" data-action="next-day">Alusta ${game.day + 1}. päeva</button>` : `<button class="button outline" data-action="restart">Proovi uuesti</button>${game.mode === 'tutorial' ? '<button class="button primary" data-action="start-real">Astu pärisellu</button>' : '<button class="button primary" data-action="home">Tagasi algusesse</button>'}`}</div><p class="summary-learning">Mängu veed on elud ja punktid on õppimise tööriist. Päriselus on oluline mitmekesisus ja kogu toidulaud.</p></main>${footer()}`;
}
function render(focus = false) {
  app.innerHTML = view === 'home' ? home() : view === 'play' ? play() : summary(view === 'day-summary');
  animateCat = false;
  if (focus) {
    const target = view === 'play' ? app.querySelector('.food-card') : app.querySelector('h1');
    if (target) { if (target.tagName !== 'BUTTON') target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }
}
function clearFeedback() {
  clearTimeout(feedbackTimer);
  feedbackTimer = null;
  recentFeedback = null;
}
function resetCat() { catReaction = null; animateCat = false; }
function start(mode) { clearFeedback(); resetCat(); game = createGame(mode); view = 'play'; render(true); window.scrollTo({ top: 0 }); }
function advanceAfterTurn() {
  clearFeedback();
  recentFeedback = game.feedback;
  catReaction = selectCatReaction(recentFeedback, catReaction?.line);
  animateCat = true;
  if (game.status === 'playing') {
    continueGame(game);
    feedbackTimer = setTimeout(() => {
      recentFeedback = null;
      feedbackTimer = null;
      if (view === 'play') app.querySelector('.feedback')?.replaceWith(
        document.createRange().createContextualFragment(feedback()),
      );
    }, 4500);
  } else {
    view = game.status === 'day-end' ? 'day-summary' : 'result';
    window.scrollTo({ top: 0 });
  }
  render(true);
}
function playCard(id) { chooseCard(game, id); advanceAfterTurn(); }
function takeWater() { drinkWater(game); advanceAfterTurn(); }
function advanceDay() {
  nextDay(game);
  clearFeedback();
  view = game.status === 'finished' ? 'result' : 'play';
  render(true);
  window.scrollTo({ top: 0 });
}
function showHelp() {
  lastFocus = document.activeElement;
  const dialog = document.querySelector('#help');
  dialog.innerHTML = `<div class="dialog-heading"><span class="eyebrow">VÄIKE SPIKKER</span><button class="icon-button" data-action="close-help" aria-label="Sulge juhend">×</button></div><h2 id="help-title">Kolm kaarti. Üks valik.</h2><p>Vali käest üks toit. Selle punktid täidavad püramiidi, teised kaks kaarti lähevad maha.</p><ol class="help-steps"><li><strong>Jälgi tasakaalu.</strong><span>Õpetuses vajad teravilja 2, köögi- ja puuvilju 2, piimatooteid 1, rasvu 1 ja valku 1.</span></li><li><strong>Hoia oma kolme vett.</strong><span>Täis grupi eest kaotad ühe elu iga üleliigse punkti kohta. Kahepunktiline kaart võib kulutada kuni kaks elu.</span></li><li><strong>Snäkke pole vaja koguda.</strong><span>Esimene snäkivalik on tasuta. Iga järgmine kulutab ühe vee. Päriselus on võiduks lubatud kuni 3 snäkipunkti. Ülempiiri ületav kahepunktiline kaart võib kulutada kaks vett.</span></li><li><strong>Vajad pausi? Võta lonks vett.</strong><span>Saad ühe elu tagasi, aga kõik kolm kaarti lähevad maha. Seda saab teha ainult siis, kui elud ei ole täis.</span></li></ol><div class="help-real"><strong>Päriselu: 7 päeva × 4 söögikorda</strong><p>Iga päev saad 12 erinevat kaarti. Kaardid annavad 1 või 2 punkti. Nädala eesmärgid: teravili 8–9, köögi- ja puuviljad 7–8 ning piimatooted, rasvad ja valk igaüks 5–6.</p></div><p class="help-disclaimer">See on lihtsustatud õppemäng, mitte toitumisjuhis. Punktid ei tähista portsjoneid. Veed on mängu elud.</p><a class="source-link" href="https://toitumine.ee/kuidas-tervislikult-toituda/toidusoovitused" target="_blank" rel="noopener noreferrer">Tutvu toidupüramiidiga toitumine.ee lehel ↗</a><button class="button primary dialog-cta" data-action="${view === 'home' ? 'begin-tutorial' : 'close-help'}">${view === 'home' ? 'Alusta' : 'Tagasi mängu'}</button>`;
  dialog.showModal();
}
function showExit() {
  lastFocus = document.activeElement;
  const dialog = document.querySelector('#exit');
  dialog.innerHTML = `<h2 id="exit-title">Lähed tagasi algusesse?</h2><p>Praegune mäng lõpeb. Võid igal ajal alustada uut mängu.</p><div class="dialog-actions"><button class="button outline" data-action="close-exit" autofocus>Jätka mängu</button><button class="button primary" data-action="confirm-exit">Tagasi algusesse</button></div>`;
  dialog.showModal();
}
function closeDialog(id) { document.querySelector(id).close(); lastFocus?.focus(); }
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  switch (button.dataset.action) {
    case 'start-tutorial': showHelp(); break;
    case 'begin-tutorial': closeDialog('#help'); lastFocus = null; start('tutorial'); break;
    case 'start-real': start('real'); break;
    case 'choose': playCard(button.dataset.id); break;
    case 'water': takeWater(); break;
    case 'next-day': advanceDay(); break;
    case 'restart': start(game.mode); break;
    case 'help': showHelp(); break;
    case 'close-help': closeDialog('#help'); break;
    case 'exit': showExit(); break;
    case 'close-exit': closeDialog('#exit'); break;
    case 'confirm-exit': closeDialog('#exit'); clearFeedback(); resetCat(); game = null; view = 'home'; render(true); break;
    case 'home': if (view === 'play') showExit(); else { clearFeedback(); resetCat(); game = null; view = 'home'; render(true); } break;
  }
});
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => lastFocus?.focus());
}
// Agent actions use exactly the same game engine and state as the visible controls.
if (document.modelContext?.registerTool) {
  const state = () => game ? ({ mode: game.mode, status: game.status, day: game.day, round: game.round, lives: game.lives, counts: game.counts, hand: game.hand.map(({ id, name, groups }) => ({ id, name, groups })), needsContinue: game.status === 'day-end' }) : ({ view: 'home' });
  const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {}); } catch {} };
  register({ name: 'read_game_state', description: 'Read Toidupokker game state and offered cards.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: state });
  register({ name: 'start_game', description: 'Start a new tutorial or real-life game, replacing the current game.', inputSchema: { type: 'object', properties: { mode: { enum: ['tutorial', 'real'] } }, required: ['mode'], additionalProperties: false }, execute: input => { if (!input || !['tutorial', 'real'].includes(input.mode)) throw new Error('Invalid mode'); start(input.mode); return state(); } });
  register({ name: 'choose_food_card', description: 'Play an offered food card, show feedback, and immediately advance to the next round or summary.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false }, execute: input => { if (!game || typeof input?.id !== 'string') throw new Error('Start a game and supply a card ID'); playCard(input.id); return state(); } });
  register({ name: 'drink_water', description: 'Recover one life and discard this meal when lives are below three.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: () => { if (!game) throw new Error('Start a game'); takeWater(); return state(); } });
  register({ name: 'continue_game', description: 'Start the next day from a completed day summary.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, execute: () => { if (!game) throw new Error('Start a game'); advanceDay(); return state(); } });
}
render();
