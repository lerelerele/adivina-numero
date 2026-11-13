
'use strict';
const {
  phaseOutcome, attemptThreshold, applyPhaseOutcome,
  uniqueYearDigits, rankCandidates, discretize, positionBucket,
  buildLadder, funChallenge, rangeChallenge, FUN_IDS,
  computeStats, moonPhase, timeBand, speedBand
} = require('./app.js');

let failed = 0;
function eq(name, a, b) {
  const ok = Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
  if (!ok) {
    failed++;
    console.error('FAIL', name, 'got', a, 'expected', b);
  } else {
    console.log('ok  ', name);
  }
}

// thresholds
eq('th 2', attemptThreshold(2), 1);
eq('th 3', attemptThreshold(3), 2);
eq('th 4', attemptThreshold(4), 2);
eq('th 5', attemptThreshold(5), 3);
eq('th 6', attemptThreshold(6), 3);
eq('th 10', attemptThreshold(10), 5);
eq('th 12', attemptThreshold(12), 6);

// t2u rule: only first attempt advances
function act(attempts, n) { return phaseOutcome(attempts, n).action; }
eq('1-2 first', act(1, 2), 'advance');
eq('1-2 second', act(2, 2), 'back'); // 2 > ceil(2/2)=1
eq('1-3 first', act(1, 3), 'advance');
eq('1-3 second', act(2, 3), 'repeat'); // 2 <= 2
eq('1-3 third', act(3, 3), 'back');
eq('1-4 first', act(1, 4), 'advance');
eq('1-4 second', act(2, 4), 'repeat');
eq('1-4 third', act(3, 4), 'back');
eq('1-4 fourth', act(4, 4), 'back');
eq('year digits first', act(1, 3), 'advance');
eq('year digits second', act(2, 3), 'repeat');
eq('year digits third', act(3, 3), 'back');
eq('dice first', act(1, 6), 'advance');
eq('dice at threshold 3', act(3, 6), 'repeat');
eq('dice over 4', act(4, 6), 'back');
eq('messages advance', phaseOutcome(1, 4).message, '\u00A1A la primera! Siguiente fase');
eq('messages repeat', phaseOutcome(2, 4).message, 'Repetimos fase');
eq('messages back', phaseOutcome(3, 4).message, 'Volvemos a la fase anterior');

eq('apply advance', applyPhaseOutcome(2, phaseOutcome(1, 4), 99), 3);
eq('apply repeat', applyPhaseOutcome(2, phaseOutcome(2, 4), 99), 2);
eq('apply back', applyPhaseOutcome(2, phaseOutcome(3, 4), 99), 1);
eq('apply back from 0', applyPhaseOutcome(0, phaseOutcome(2, 2), 99), 0);

eq('year 2026 digits', uniqueYearDigits(2026), [2, 0, 6]);
eq('year 2025 digits', uniqueYearDigits(2025), [2, 0, 5]);

const ladder = buildLadder(FUN_IDS);
eq('ladder starts 1-2', ladder[0].id, 'rango-1-2');
eq('ladder 2 is 1-3', ladder[1].id, 'rango-1-3');
eq('ladder 3 is 1-4', ladder[2].id, 'rango-1-4');
eq('ladder 4 is fun', ladder[3].kind, 'fun');
eq('ladder 5 is range 1-5', ladder[4].id, 'rango-1-5');
eq('fun count 15', FUN_IDS.length, 15);
eq('ladder length', ladder.length, 3 + 15 * 2); // 3 + fun + range after each = 33

const bears = funChallenge('osos');
eq('bears options', bears.options, [1,2,3,4,5]);
eq('bears title has osos', bears.title.includes('osos'), true);
eq('year options include 0', funChallenge('year').options.includes(0) || !String(new Date().getFullYear()).includes('0'), true);

const primes = funChallenge('primes');
eq('primes', primes.options, [2,3,5,7]);

eq('time bands', [timeBand(3), timeBand(9), timeBand(13), timeBand(17), timeBand(22)],
  ['madrugada','mañana','mediodía','tarde','noche']);
eq('speed still', speedBand(0.1), 'quieto');
eq('speed walk', speedBand(1.4), 'andando');

const moon = moonPhase(new Date('2026-11-13T14:00:00Z'));
eq('moon has name', typeof moon.name, 'string');

// model ranks all options, no duplicates, includes 0
const ch = funChallenge('year');
const store = { history: [], lastAnswer: null };
const ranked = rankCandidates(ch, { weekdayName: 'viernes', timeBand: 'tarde' }, store, []);
eq('rank length', ranked.length, ch.options.length);
eq('rank unique', new Set(ranked.map(r => r.opt)).size, ch.options.length);

// After many answers preferring first option, first should rank high
const histStore = {
  lastAnswer: 2,
  history: Array.from({ length: 12 }, (_, i) => ({
    challengeId: 'rango-1-4',
    options: [1,2,3,4],
    answer: 1,
    attempts: 1,
    context: { weekdayName: 'viernes', timeBand: 'tarde', country: 'España' }
  }))
};
const r4 = rangeChallenge(4);
// temporarily reduce noise by many samples — still some noise, run a few times
let firstWins = 0;
for (let i = 0; i < 20; i++) {
  const r = rankCandidates(r4, { weekdayName: 'viernes', timeBand: 'tarde', country: 'España' }, histStore, []);
  if (r[0].opt === 1) firstWins++;
}
if (firstWins < 12) {
  failed++;
  console.error('FAIL model prefers learned first, wins', firstWins);
} else {
  console.log('ok   model prefers learned first (' + firstWins + '/20)');
}

const stats = computeStats({
  history: [
    { attempts: 1, options: [1,2], answer: 1, outcome: 'advance', context: {} },
    { attempts: 2, options: [1,2,3], answer: 3, outcome: 'repeat', context: {} },
    { attempts: 3, options: [1,2,3,4], answer: 4, outcome: 'back', context: {} }
  ]
});
eq('stats n', stats.n, 3);
eq('stats firstHits', stats.firstHits, 1);
eq('stats advances', stats.advances, 1);
eq('stats backs', stats.backs, 1);

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nAll tests passed');
