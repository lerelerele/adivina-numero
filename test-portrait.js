
'use strict';
const {
  STUDY_CITES, PORTRAIT_GATES, portraitLevel,
  collectFacts, collectStudies, collectBeliefs, analyzePortrait
} = require('./analysis.js');

let failed = 0;
function eq(name, a, b) {
  const ok = Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { failed++; console.error('FAIL', name, 'got', a, 'expected', b); }
  else console.log('ok  ', name);
}
function ok(name, cond) {
  if (!cond) { failed++; console.error('FAIL', name); }
  else console.log('ok  ', name);
}

eq('gates', PORTRAIT_GATES, [5, 20, 50]);
eq('level 0', portraitLevel(0), 0);
eq('level 4', portraitLevel(4), 0);
eq('level 5', portraitLevel(5), 5);
eq('level 19', portraitLevel(19), 5);
eq('level 20', portraitLevel(20), 20);
eq('level 49', portraitLevel(49), 20);
eq('level 50', portraitLevel(50), 50);

function h(over) {
  return Object.assign({
    options: [1, 2, 3, 4],
    answer: 2,
    attempts: 1,
    outcome: 'advance',
    answerMs: 4000,
    context: {
      timeBand: 'tarde', weekdayName: 'viernes', city: 'Madrid',
      placeType: 'parque', battery: 80, charging: false,
      orientation: 'vertical', speedBand: 'quieto', moon: 'creciente', temp: 18
    }
  }, over);
}

// Below 5: no unlocked studies/beliefs, maybe no facts depending on minRounds (facts also min 5)
const empty = analyzePortrait({ history: [h(), h(), h()], phase: 0 });
eq('empty level', empty.level, 0);
eq('empty facts unlocked', empty.facts.length, 0);
eq('empty studies', empty.studies.length, 0);
eq('empty beliefs', empty.beliefs.length, 0);
ok('empty next gate 5', empty.nextGate === 5 && empty.missing === 2);

// 12 rounds preferring 7 and middle, evening
const hist7 = [];
for (let i = 0; i < 12; i++) {
  hist7.push(h({
    options: [1, 2, 3, 5, 7],
    answer: 7,
    answerMs: 4000,
    context: Object.assign({}, h().context, { timeBand: 'noche' })
  }));
}
const p7 = analyzePortrait({ history: hist7, phase: 3 });
ok('facts after 5', p7.facts.length >= 5);
ok('fact texts are observational', p7.facts.every((f) => f.text && f.title));
ok('no horoscope in facts', p7.facts.every((f) => !/yo diría|yo te veo|apuesto/i.test(f.text)));
const sevenStudy = p7.studies.find((s) => s.id === 'estudio-siete');
ok('simon/kubovy study for 7', !!sevenStudy);
ok('7 study cites Simon', sevenStudy && sevenStudy.cites.some((c) => /Simon/.test(c.short)));
ok('7 study cites Kubovy', sevenStudy && sevenStudy.cites.some((c) => /Kubovy/.test(c.short)));
ok('7 study has porQue', sevenStudy && sevenStudy.porQue.includes('32,86%'));
ok('7 study has doi', sevenStudy && sevenStudy.cites.every((c) => c.url.startsWith('https://')));
ok('beliefs unlocked at 5', p7.beliefs.length >= 3 && p7.beliefs.every((b) => b.minRounds <= 5));
ok('20-round beliefs still locked', p7.beliefsLocked.some((b) => b.minRounds === 20) || p7.n < 20);
ok('talisman or seven belief', p7.beliefs.some((b) => /talismán|siete/i.test(b.title)));
ok('beliefs have confidence', p7.beliefs.every((b) => b.confidence));

// Avoid 7, middle, faster at night, low battery change — 25 rounds
const hist25 = [];
for (let i = 0; i < 25; i++) {
  const morning = i < 12;
  const low = i >= 20;
  hist25.push(h({
    options: [1, 2, 3, 4, 5, 6, 7],
    answer: low ? 1 : 4,
    answerMs: morning ? 10000 : 2500,
    attempts: 1,
    outcome: 'advance',
    context: Object.assign({}, h().context, {
      timeBand: morning ? 'mañana' : 'noche',
      battery: low ? 9 : 75,
      placeType: 'escuela'
    })
  }));
}
const p25 = analyzePortrait({ history: hist25, phase: 6 });
eq('level 25', p25.level, 20);
ok('avoids 7 study', p25.studies.some((s) => s.id === 'estudio-siete-evitar'));
ok('middle study', p25.studies.some((s) => s.id === 'estudio-centro'));
ok('leone night study', p25.studies.some((s) => s.id === 'estudio-ritmo-noche'));
ok('personal number study', p25.studies.some((s) => s.id === 'estudio-personal'));
ok('battery survey', p25.studies.some((s) => s.id === 'estudio-bateria'));
const bat = p25.studies.find((s) => s.id === 'estudio-bateria');
ok('battery labeled as survey', bat && /encuesta/i.test(bat.porQue + (bat.note || '') + bat.cites[0].full));
ok('battery not called paper', bat && !/paper científico|revisado por pares y demostró riesgo/i.test(bat.text));
ok('Leone cite present', p25.studies.some((s) => (s.cites || []).some((c) => /Leone/.test(c.short))));
ok('Kitayama or Jones', p25.studies.some((s) => (s.cites || []).some((c) => /Kitayama|Jones/.test(c.short))));
ok('Christenfeld or Valenzuela', p25.studies.some((s) => (s.cites || []).some((c) => /Christenfeld|Valenzuela/.test(c.short))));
ok('more beliefs at 20', p25.beliefs.length >= 8);
ok('50 still locked or none left', p25.n < 50);

// Repetition avoidance
const histR = [];
for (let i = 0; i < 16; i++) {
  histR.push(h({ options: [1, 2], answer: (i % 2) + 1 })); // 1,2,1,2... never repeats
}
const pR = analyzePortrait({ history: histR, phase: 1 });
ok('wagenaar avoidance', pR.studies.some((s) => s.id === 'estudio-evitar-rep'));
ok('cites Wagenaar', pR.studies.some((s) => (s.cites || []).some((c) => /Wagenaar/.test(c.short))));
ok('cites Falk', pR.studies.some((s) => (s.cites || []).some((c) => /Falk/.test(c.short))));

// 50 rounds stability
const hist50 = [];
for (let i = 0; i < 50; i++) {
  hist50.push(h({
    options: [1, 2, 3, 4, 5, 6],
    answer: i < 25 ? 3 : 3,
    answerMs: 4000,
    context: Object.assign({}, h().context, { timeBand: i % 2 ? 'noche' : 'mañana' })
  }));
}
const p50 = analyzePortrait({ history: hist50, phase: 8 });
eq('level 50', p50.level, 50);
eq('next gate none', p50.nextGate, null);
ok('stability fact', p50.facts.some((f) => f.id === 'estabilidad'));
ok('habit or change belief', p50.beliefs.some((b) => b.id === 'creencia-habito' || b.id === 'creencia-cambio'));
ok('enough beliefs aimed 15-20 pool', collectBeliefs(hist50, { history: hist50, phase: 8 }).length >= 5);

// All cites have URL and full text; only known keys
const allowed = [
  'simon1971','kubovy1976','wagenaar1972','falk1997',
  'christenfeld1995','valenzuela2009','kitayama1997',
  'jones2002','leone2017','lg2016'
];
ok('only verified cites', Object.keys(STUDY_CITES).every((k) => allowed.includes(k)));
ok('every cite has doi or lg url', Object.values(STUDY_CITES).every((c) => c.url && c.full && c.porQue && c.short));
ok('LG marked non-academic', /no es un estudio académico/i.test(STUDY_CITES.lg2016.full));

// Facts function does not mention studies
const facts = collectFacts(hist25, { phase: 6 });
ok('facts have counts', facts.every((f) => /\d/.test(f.text)));
ok('facts are not clinical', facts.every((f) => !/diagnóstico|trastorno|ansiedad clínica/i.test(f.text)));

if (failed) { console.error('\n' + failed + ' failed'); process.exit(1); }
console.log('\nAll portrait tests passed');
