'use strict';

/* ============================================================
   Retrato: Lo que sé / Lo que dicen los estudios / Lo que creo.
   Solo se citan estudios verificados (véase CITAS al final).
   ============================================================ */

const PORTRAIT_GATES = [5, 20, 50];

const STUDY_CITES = {
  simon1971: {
    short: 'Simon, 1971',
    full: 'William E. Simon (1971). Number and Color Responses of Some College Students: Preliminary Evidence for a “Blue Seven Phenomenon”. Perceptual and Motor Skills, 33(2), 373-374.',
    url: 'https://doi.org/10.2466/pms.1971.33.2.373',
    porQue: 'Simon pidió a 490 estudiantes universitarios un dígito del 0 al 9: el 7 salió en el 32,86% de las respuestas. El 0, el 1 y el 9 casi no se eligieron. Lo llamó el fenómeno «blue-seven».'
  },
  kubovy1976: {
    short: 'Kubovy y Psotka, 1976',
    full: 'Michael Kubovy y Joseph Psotka (1976). The predominance of seven and the apparent spontaneity of numerical choices. Journal of Experimental Psychology: Human Perception and Performance, 2(2), 291-294.',
    url: 'https://doi.org/10.1037/0096-1523.2.2.291',
    porQue: 'Kubovy y Psotka vieron que, al pedir el primer número que viniera a la mente, el 7 predominaba (un 28,4%). El efecto bajaba si se sugería el 7 como ejemplo o se cambiaba el rango: argumentaron que se elige porque parece el más espontáneo, no por un automatismo ciego.'
  },
  wagenaar1972: {
    short: 'Wagenaar, 1972',
    full: 'Willem A. Wagenaar (1972). Generation of random sequences by human subjects: A critical survey of literature. Psychological Bulletin, 77(1), 65-72.',
    url: 'https://doi.org/10.1037/h0032060',
    porQue: 'En su revisión de 15 experimentos, Wagenaar concluyó que, al intentar producir secuencias «aleatorias», la mayoría de las personas muestran recencia negativa: evitan repetir la respuesta anterior y alternan más de lo que haría el azar.'
  },
  falk1997: {
    short: 'Falk y Konold, 1997',
    full: 'Ruma Falk y Clifford Konold (1997). Making sense of randomness: Implicit encoding as a basis for judgment. Psychological Review, 104(2), 301-318.',
    url: 'https://doi.org/10.1037/0033-295X.104.2.301',
    porQue: 'Falk y Konold observaron que la gente genera más alternancias de las que cabría esperar y juzga más aleatorias las secuencias que alternan en exceso. Según ellos, una secuencia «se siente» aleatoria cuando cuesta de memorizar o comprimir mentalmente, y las repeticiones se comprimen demasiado fácil.'
  },
  christenfeld1995: {
    short: 'Christenfeld, 1995',
    full: 'Nicholas Christenfeld (1995). Choices from Identical Options. Psychological Science, 6(1), 50-55.',
    url: 'https://doi.org/10.1111/j.1467-9280.1995.tb00304.x',
    porQue: 'Christenfeld estudió elecciones entre opciones idénticas (por ejemplo, filas de un mismo producto en el supermercado): la gente evitaba los extremos y prefería el centro (en un recuento, el 71% de las tomas venían de las filas centrales y solo el 29% de la primera o la última).'
  },
  valenzuela2009: {
    short: 'Valenzuela y Raghubir, 2009',
    full: 'Ana Valenzuela y Priya Raghubir (2009). Position-based beliefs: The center-stage effect. Journal of Consumer Psychology, 19(2), 185-196.',
    url: 'https://doi.org/10.1016/j.jcps.2009.02.011',
    porQue: 'Valenzuela y Raghubir describieron el efecto «center-stage»: al ver varias opciones a la vez, se elige más la del centro, no tanto porque atraiga la mirada, sino porque se intuye que es la más popular.'
  },
  kitayama1997: {
    short: 'Kitayama y Karasawa, 1997',
    full: 'Shinobu Kitayama y Mayumi Karasawa (1997). Implicit Self-Esteem in Japan: Name Letters and Birthday Numbers. Personality and Social Psychology Bulletin, 23(7), 736-742.',
    url: 'https://doi.org/10.1177/0146167297237006',
    porQue: 'Kitayama y Karasawa documentaron el efecto del número de cumpleaños: la gente suele preferir, sin darse cuenta, los números que forman parte de su fecha de nacimiento (y las letras de su nombre).'
  },
  jones2002: {
    short: 'Jones, Pelham, Mirenberg y Hetts, 2002',
    full: 'John T. Jones, Brett W. Pelham, Matthew C. Mirenberg y John J. Hetts (2002). Name Letter Preferences Are Not Merely Mere Exposure: Implicit Egotism as Self-Regulation. Journal of Experimental Social Psychology, 38(2), 170-177.',
    url: 'https://doi.org/10.1006/jesp.2001.1497',
    porQue: 'Jones y colegas vincularon esa preferencia por letras del propio nombre y números del cumpleaños al «egotismo implícito»: nos atrae lo que está asociado al yo, sobre todo si la autoestima se siente amenazada. No es solo haber visto esos símbolos más veces.'
  },
  leone2017: {
    short: 'Leone, Fernandez Slezak, Golombek y Sigman, 2017',
    full: 'María Juliana Leone, Diego Fernandez Slezak, Diego Golombek y Mariano Sigman (2017). Time to decide: Diurnal variations on the speed and quality of human decisions. Cognition, 158, 44-55.',
    url: 'https://doi.org/10.1016/j.cognition.2016.10.007',
    porQue: 'Con millones de jugadas de ajedrez en línea, Leone y colegas vieron un ritmo diurno: por la mañana las decisiones eran más lentas y más precisas (un sesgo de prevención); por la tarde-noche, más rápidas y menos precisas (un sesgo de promoción), sin que el rendimiento global cambiara tanto.'
  },
  lg2016: {
    short: 'Encuesta de LG, 2016',
    full: 'LG Electronics (2016). “Low Battery Anxiety” Gripes 9 Out of Ten People. Encuesta en línea a 2.000 usuarios de smartphone en EE. UU., realizada por Ebiquity (26 feb.–2 mar. 2016). No es un estudio académico revisado por pares.',
    url: 'https://www.lg.com/us/PDF/press-release/LG_Mobile_Low_Battery_Anxiety_Press_Release_FINAL_05_19_2016.pdf',
    porQue: 'En una encuesta comercial de LG (2016), no un paper científico, casi 9 de cada 10 personas decían sentir pánico cuando la batería bajaba al 20% o menos, y muchas cambiaban de hábitos (saltar el gimnasio, dar la vuelta a casa para cargar…). Lo cito como encuesta, no como prueba de laboratorio.'
  }
};

function portraitLevel(n) {
  if (n >= 50) return 50;
  if (n >= 20) return 20;
  if (n >= 5) return 5;
  return 0;
}

function posBucketSimple(idx, n) {
  if (n <= 1) return 'unico';
  if (idx === 0) return 'primero';
  if (idx === n - 1) return 'ultimo';
  const rel = idx / (n - 1);
  if (rel > 0.33 && rel < 0.67) return 'medio';
  if (rel <= 0.33) return 'cerca-primero';
  return 'cerca-ultimo';
}

function isMiddle(idx, n) { return posBucketSimple(idx, n) === 'medio'; }
function isFirst(idx, n) { return posBucketSimple(idx, n) === 'primero'; }
function isLast(idx, n) { return posBucketSimple(idx, n) === 'ultimo'; }
function isEdge(idx, n) { return isFirst(idx, n) || isLast(idx, n); }

function mean(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function confLabel(n, lift) {
  const dev = Math.abs(Math.log(Math.max(lift, 0.05)));
  if (n >= 30 && dev > 0.35) return 'alta';
  if (n >= 12 && dev > 0.2) return 'media';
  if (n >= 5) return 'baja';
  return 'muy baja';
}

function fmtPct(x) { return Math.round(x * 100) + '%'; }
function fmtN(n, uno, muchos) { return n + ' ' + (n === 1 ? uno : muchos); }
function fmtSec(ms) {
  if (ms == null || !isFinite(ms)) return '—';
  const s = ms / 1000;
  return (s < 10 ? s.toFixed(1) : Math.round(s)) + ' s';
}

function expectedRate(history, pred) {
  let exp = 0, obs = 0, n = 0;
  for (const h of history) {
    const opts = h.options || [];
    if (!opts.length) continue;
    n++;
    let match = 0;
    for (let i = 0; i < opts.length; i++) if (pred(i, opts.length, opts[i], h)) match++;
    exp += match / opts.length;
    const idx = opts.indexOf(h.answer);
    if (idx >= 0 && pred(idx, opts.length, h.answer, h)) obs++;
  }
  return { obs, n, exp, expCount: exp, rate: n ? obs / n : 0, expRate: n ? exp / n : 0 };
}

function collectFacts(history, store) {
  const n = history.length;
  const facts = [];
  if (!n) return facts;

  // Favorite numbers
  const fav = new Map();
  for (const h of history) fav.set(h.answer, (fav.get(h.answer) || 0) + 1);
  const top = [...fav.entries()].sort((a, b) => b[1] - a[1]);
  const favText = top.slice(0, 5).map(([num, c]) => elNúmero(num) + ' (' + c + ' ' + (c === 1 ? 'vez' : 'veces') + ', ' + fmtPct(c / n) + ')').join(', ');
  facts.push({
    id: 'favoritos',
    minRounds: 5,
    title: 'Números que más eliges',
    text: 'En ' + fmtN(n, 'prueba', 'pruebas') + ': ' + favText + '.'
  });

  // Position
  const pos = { primero: 0, ultimo: 0, medio: 0, 'cerca-primero': 0, 'cerca-ultimo': 0, unico: 0 };
  let posN = 0;
  const expPos = { primero: 0, ultimo: 0, medio: 0 };
  for (const h of history) {
    const opts = h.options || [];
    if (!opts.length) continue;
    const idx = opts.indexOf(h.answer);
    if (idx < 0) continue;
    posN++;
    pos[posBucketSimple(idx, opts.length)] = (pos[posBucketSimple(idx, opts.length)] || 0) + 1;
    for (let i = 0; i < opts.length; i++) {
      const b = posBucketSimple(i, opts.length);
      if (expPos[b] != null) expPos[b] += 1 / opts.length;
    }
  }
  if (posN) {
    facts.push({
      id: 'posicion',
      minRounds: 5,
      title: 'Sitio en la lista',
      text: 'El primero: ' + pos.primero + ' de ' + posN +
        ' (se esperaría unos ' + expPos.primero.toFixed(1) + ' por azar). ' +
        'El del medio: ' + pos.medio + ' (esperado ' + expPos.medio.toFixed(1) + '). ' +
        'El último: ' + pos.ultimo + ' (esperado ' + expPos.ultimo.toFixed(1) + ').'
    });
  }

  // Repeat / avoid
  let repeats = 0, pairs = 0, expRep = 0, possible = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].answer;
    const opts = history[i].options || [];
    if (!opts.length) continue;
    pairs++;
    if (opts.indexOf(prev) >= 0) {
      possible++;
      expRep += 1 / opts.length;
    }
    if (history[i].answer === prev) repeats++;
  }
  if (pairs >= 4) {
    facts.push({
      id: 'repeticion',
      minRounds: 5,
      title: '¿Repites el número anterior?',
      text: 'Has repetido el número de la ronda previa en ' + repeats + ' de ' + pairs +
        ' transiciones (' + fmtPct(repeats / pairs) + '). ' +
        'Si el anterior seguía estando disponible, el azar habría repetido unas ' + expRep.toFixed(1) + ' veces.'
    });
  }

  // Even / odd
  let odd = 0, even = 0, zero = 0;
  for (const h of history) {
    if (h.answer === 0) zero++;
    else if (Math.abs(h.answer) % 2 === 1) odd++;
    else even++;
  }
  facts.push({
    id: 'paridad',
    minRounds: 5,
    title: 'Pares e impares',
    text: 'Impares: ' + odd + ' de ' + n + ' (' + fmtPct(odd / n) + '). Pares: ' + even +
      ' (' + fmtPct(even / n) + ').' + (zero ? ' Ceros: ' + zero + '.' : '')
  });

  // Seven availability
  let sevenAvail = 0, sevenPick = 0;
  for (const h of history) {
    if ((h.options || []).indexOf(7) >= 0) {
      sevenAvail++;
      if (h.answer === 7) sevenPick++;
    }
  }
  if (sevenAvail) {
    facts.push({
      id: 'siete',
      minRounds: 5,
      title: 'El número 7',
      text: 'El 7 estaba entre las opciones en ' + sevenAvail + ' pruebas y lo elegiste ' +
        sevenPick + ' veces (' + (sevenAvail ? fmtPct(sevenPick / sevenAvail) : '0%') + ').'
    });
  }

  // Answer time overall and by band
  const times = history.filter((h) => h.answerMs > 0);
  if (times.length >= 3) {
    const byBand = {};
    for (const h of times) {
      const b = (h.context && h.context.timeBand) || 'sin hora';
      if (!byBand[b]) byBand[b] = [];
      byBand[b].push(h.answerMs);
    }
    let extra = Object.keys(byBand).map((b) => {
      return b + ': ' + fmtSec(mean(byBand[b])) + ' (n=' + byBand[b].length + ')';
    }).join('; ');
    facts.push({
      id: 'tiempo',
      minRounds: 5,
      title: 'Tiempo en confirmar',
      text: 'Desde que dices «ya lo tengo» hasta el «sí», tarda de media ' +
        fmtSec(mean(times.map((h) => h.answerMs))) +
        ' (mediana ' + fmtSec(median(times.map((h) => h.answerMs))) +
        ', en ' + times.length + ' rondas). Por franja: ' + extra + '.'
    });
  }

  // When they play
  const bands = countMap(history.map((h) => (h.context && h.context.timeBand) || null));
  const days = countMap(history.map((h) => (h.context && h.context.weekdayName) || null));
  if (Object.keys(bands).length) {
    facts.push({
      id: 'cuando',
      minRounds: 5,
      title: 'Cuándo juegas',
      text: 'Franjas: ' + fmtCounts(bands, n) + '. Días: ' + fmtCounts(days, n) + '.'
    });
  }

  // Location
  const cities = countMap(history.map((h) => (h.context && (h.context.city || h.context.country)) || null));
  const places = countMap(history.map((h) => (h.context && h.context.placeType) || null));
  const cityN = Object.values(cities).reduce((a, b) => a + b, 0);
  if (cityN >= 3) {
    facts.push({
      id: 'lugar',
      minRounds: 5,
      title: 'Dónde juegas',
      text: 'Con ubicación: ' + fmtCounts(cities, cityN) + '.' +
        (Object.keys(places).length ? ' Lugares cercanos: ' + fmtCounts(places, Object.values(places).reduce((a, b) => a + b, 0)) + '.' : '')
    });
  }

  // Battery
  const bats = history.filter((h) => h.context && h.context.battery != null);
  if (bats.length >= 3) {
    const low = bats.filter((h) => h.context.battery < 20);
    const mid = bats.filter((h) => h.context.battery >= 20 && h.context.battery < 50);
    const high = bats.filter((h) => h.context.battery >= 50);
    const chg = bats.filter((h) => h.context.charging).length;
    facts.push({
      id: 'bateria',
      minRounds: 5,
      title: 'Batería',
      text: 'Hay lectura en ' + bats.length + ' pruebas (cargando: ' + chg + '). ' +
        'Por debajo del 20%: ' + low.length +
        (low.length ? ' (números: ' + listNums(low) + ')' : '') +
        '. Del 20% al 49%: ' + mid.length +
        '. Al 50% o más: ' + high.length +
        (high.length ? ' (números: ' + listNums(high) + ')' : '') + '.'
    });
  }

  // Orientation, speed, motion
  const orients = countMap(history.map((h) => (h.context && h.context.orientation) || null));
  const orN = Object.values(orients).reduce((a, b) => a + b, 0);
  if (orN >= 3) {
    facts.push({
      id: 'orientacion',
      minRounds: 5,
      title: 'Posición del móvil',
      text: fmtCounts(orients, orN) + '.'
    });
  }
  const speeds = countMap(history.map((h) => (h.context && h.context.speedBand) || null));
  const spN = Object.values(speeds).reduce((a, b) => a + b, 0);
  if (spN >= 3) {
    facts.push({
      id: 'velocidad',
      minRounds: 5,
      title: 'Velocidad',
      text: fmtCounts(speeds, spN) + '.'
    });
  }

  // Phase outcomes
  const adv = history.filter((h) => h.outcome === 'advance').length;
  const rep = history.filter((h) => h.outcome === 'repeat').length;
  const back = history.filter((h) => h.outcome === 'back').length;
  const firstHits = history.filter((h) => h.attempts === 1).length;
  facts.push({
    id: 'fases',
    minRounds: 5,
    title: 'Cómo te va en las fases',
    text: 'Aciertos a la primera: ' + firstHits + ' de ' + n + ' (' + fmtPct(firstHits / n) + '). ' +
      'Subidas de fase: ' + adv + '. Fases repetidas: ' + rep + '. Bajadas: ' + back +
      '. Fase actual: ' + ((store && store.phase != null) ? store.phase + 1 : '—') + '.'
  });

  // Range of answers
  const nums = history.map((h) => h.answer).filter((x) => typeof x === 'number');
  if (nums.length) {
    facts.push({
      id: 'rango',
      minRounds: 5,
      title: 'Rango de tus números',
      text: 'Has pensado en números entre ' + Math.min.apply(null, nums) + ' y ' +
        Math.max.apply(null, nums) + '. Distintos números usados: ' + new Set(nums).size + '.'
    });
  }

  // More detailed comparisons unlock at 20
  // Battery split of favorites
  if (bats.length >= 8) {
    const low = bats.filter((h) => h.context.battery < 20);
    const rest = bats.filter((h) => h.context.battery >= 20);
    if (low.length >= 3 && rest.length >= 3) {
      facts.push({
        id: 'bateria-detalle',
        minRounds: 20,
        title: 'Números según la batería',
        text: 'Con batería baja (<20%, ' + low.length + ' pruebas) lo más frecuente es ' +
          modeNums(low) + '. Con batería más alta (' + rest.length + '): ' + modeNums(rest) +
          '. Tiempo medio en confirmar, baja: ' + fmtSec(mean(low.map((h) => h.answerMs).filter(Boolean))) +
          '; alta: ' + fmtSec(mean(rest.map((h) => h.answerMs).filter(Boolean))) + '.'
      });
    }
  }

  // Place split
  if (cityN >= 10) {
    facts.push({
      id: 'lugar-detalle',
      minRounds: 20,
      title: 'Números según el sitio',
      text: 'Desglose por lugar: ' + splitBy(history, (h) => (h.context && (h.context.placeType || h.context.city)) || null) + '.'
    });
  }

  // Night vs morning times at 20
  const morning = times.filter((h) => h.context && (h.context.timeBand === 'mañana' || h.context.timeBand === 'madrugada'));
  const evening = times.filter((h) => h.context && (h.context.timeBand === 'noche' || h.context.timeBand === 'tarde'));
  if (morning.length >= 4 && evening.length >= 4) {
    facts.push({
      id: 'ritmo',
      minRounds: 20,
      title: 'Ritmo mañana / noche',
      text: 'Por la mañana-madrugada confirmas en ' + fmtSec(mean(morning.map((h) => h.answerMs))) +
        ' de media (' + morning.length + ' pruebas). Por la tarde-noche, en ' +
        fmtSec(mean(evening.map((h) => h.answerMs))) + ' (' + evening.length + ').'
    });
  }

  // 50-round long-term stability
  if (n >= 50) {
    const first = history.slice(0, Math.floor(n / 2));
    const second = history.slice(Math.floor(n / 2));
    facts.push({
      id: 'estabilidad',
      minRounds: 50,
      title: '¿Has cambiado con el tiempo?',
      text: 'En la primera mitad de las partidas, lo más elegido fue ' + modeNums(first) +
        ' y el primero de la lista salió ' + countFirst(first) + ' veces. En la segunda mitad: ' +
        modeNums(second) + ', primero de la lista ' + countFirst(second) + ' veces.'
    });
  }

  return facts;
}

function elNúmero(n) { return 'el ' + n; }

function median(arr) {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function countMap(vals) {
  const m = {};
  for (const v of vals) {
    if (v == null || v === '') continue;
    m[v] = (m[v] || 0) + 1;
  }
  return m;
}

function fmtCounts(map, total) {
  const items = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!items.length) return 'sin datos';
  return items.slice(0, 6).map(([k, c]) => k + ' ' + c + (total ? ' (' + fmtPct(c / total) + ')' : '')).join(', ');
}

function listNums(hist) {
  const m = countMap(hist.map((h) => h.answer));
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, c]) => k + '×' + c).join(', ');
}

function modeNums(hist) {
  const m = countMap(hist.map((h) => h.answer));
  const items = Object.entries(m).sort((a, b) => b[1] - a[1]);
  if (!items.length) return '—';
  return items[0][0] + ' (' + items[0][1] + ' veces)';
}

function countFirst(hist) {
  let c = 0;
  for (const h of hist) {
    const opts = h.options || [];
    if (opts.indexOf(h.answer) === 0) c++;
  }
  return c;
}

function splitBy(history, keyFn) {
  const groups = {};
  for (const h of history) {
    const k = keyFn(h);
    if (!k) continue;
    if (!groups[k]) groups[k] = [];
    groups[k].push(h);
  }
  return Object.entries(groups)
    .filter((e) => e[1].length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([k, arr]) => k + ' (n=' + arr.length + '): ' + modeNums(arr))
    .join('; ') || 'aún no hay grupos con suficientes partidas';
}


function lift(obsRate, expRate) {
  if (!expRate) return obsRate > 0 ? 3 : 1;
  return obsRate / expRate;
}

function collectStudies(history) {
  const n = history.length;
  const out = [];
  if (n < 5) return out;

  // --- 7 preference (Simon 1971, Kubovy 1976) ---
  let sevenAvail = 0, sevenPick = 0, sevenExp = 0;
  let avoidEndsAvail = 0, avoid01or9 = 0;
  for (const h of history) {
    const opts = h.options || [];
    if (opts.indexOf(7) >= 0) {
      sevenAvail++;
      sevenExp += 1 / opts.length;
      if (h.answer === 7) sevenPick++;
    }
    const extremes = [0, 1, 9].filter((x) => opts.indexOf(x) >= 0);
    if (extremes.length) {
      avoidEndsAvail++;
      if (extremes.indexOf(h.answer) < 0) avoid01or9++;
    }
  }
  if (sevenAvail >= 5) {
    const rate = sevenPick / sevenAvail;
    const exp = sevenExp / sevenAvail;
    const L = lift(rate, exp);
    if (rate >= exp * 1.4 && sevenPick >= 2) {
      out.push({
        id: 'estudio-siete',
        minRounds: 5,
        title: 'Te atrae el 7, como a mucha gente',
        text: 'Cuando el 7 estaba disponible, lo elegiste en ' + sevenPick + ' de ' + sevenAvail +
          ' veces (' + fmtPct(rate) + '; el azar habría dado unos ' + fmtPct(exp) + '). Encaja con el clásico sesgo hacia el 7.',
        porQue: STUDY_CITES.simon1971.porQue + ' ' + STUDY_CITES.kubovy1976.porQue,
        cites: [STUDY_CITES.simon1971, STUDY_CITES.kubovy1976],
        confidence: confLabel(sevenAvail, L)
      });
    } else if (rate <= exp * 0.6 && sevenAvail >= 8) {
      out.push({
        id: 'estudio-siete-evitar',
        minRounds: 20,
        title: 'Pasas del 7, a diferencia de lo habitual',
        text: 'El 7 estaba en ' + sevenAvail + ' pruebas y solo lo elegiste ' + sevenPick +
          ' veces (' + fmtPct(rate) + ', frente a un ' + fmtPct(exp) + ' esperado). En los estudios clásicos el 7 suele dispararse; tú te sales de esa moda.',
        porQue: STUDY_CITES.simon1971.porQue + ' ' + STUDY_CITES.kubovy1976.porQue,
        cites: [STUDY_CITES.simon1971, STUDY_CITES.kubovy1976],
        confidence: confLabel(sevenAvail, L || 0.5)
      });
    }
  }

  // --- Middle bias (Christenfeld 1995, Valenzuela 2009) ---
  const mid = expectedRate(history, (i, len) => isMiddle(i, len));
  const edge = expectedRate(history, (i, len) => isEdge(i, len));
  const first = expectedRate(history, (i, len) => isFirst(i, len));
  const last = expectedRate(history, (i, len) => isLast(i, len));
  if (mid.n >= 5) {
    const Lm = lift(mid.rate, mid.expRate);
    if (mid.rate >= mid.expRate * 1.25 && mid.obs >= 3) {
      out.push({
        id: 'estudio-centro',
        minRounds: 5,
        title: 'Prefieres el centro de la lista',
        text: 'Elegiste un número del medio en ' + mid.obs + ' de ' + mid.n +
          ' pruebas (' + fmtPct(mid.rate) + '; se esperaba unos ' + fmtPct(mid.expRate) + '). Es el mismo tipo de sesgo de centro que aparece cuando la gente elige entre opciones parecidas.',
        porQue: STUDY_CITES.christenfeld1995.porQue + ' ' + STUDY_CITES.valenzuela2009.porQue,
        cites: [STUDY_CITES.christenfeld1995, STUDY_CITES.valenzuela2009],
        confidence: confLabel(mid.n, Lm)
      });
    } else if (edge.rate >= edge.expRate * 1.25 && edge.obs >= 3) {
      out.push({
        id: 'estudio-extremos',
        minRounds: 5,
        title: 'Te vas a los extremos, al contrario del sesgo habitual',
        text: 'Primero o último de la lista: ' + edge.obs + ' de ' + edge.n +
          ' (' + fmtPct(edge.rate) + '; esperado ' + fmtPct(edge.expRate) +
          '). En muchos estudios la gente evita los bordes; tú los buscas más de lo normal.',
        porQue: STUDY_CITES.christenfeld1995.porQue + ' ' + STUDY_CITES.valenzuela2009.porQue,
        cites: [STUDY_CITES.christenfeld1995, STUDY_CITES.valenzuela2009],
        confidence: confLabel(edge.n, lift(edge.rate, edge.expRate))
      });
    }
  }

  // --- Repetition avoidance (Wagenaar 1972, Falk & Konold 1997) ---
  let repeats = 0, pairs = 0, expRep = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].answer;
    const opts = history[i].options || [];
    if (!opts.length) continue;
    pairs++;
    if (opts.indexOf(prev) >= 0) expRep += 1 / opts.length;
    if (history[i].answer === prev) repeats++;
  }
  if (pairs >= 5) {
    const rate = repeats / pairs;
    const exp = pairs ? expRep / pairs : 0;
    const L = lift(rate, exp || 0.2);
    if (rate < exp * 0.75 || (exp > 0 && repeats + 0.5 < expRep * 0.75)) {
      out.push({
        id: 'estudio-evitar-rep',
        minRounds: 5,
        title: 'Evitas repetir, como quien intenta ser aleatorio',
        text: 'Repetiste el número anterior en ' + repeats + ' de ' + pairs +
          ' transiciones (' + fmtPct(rate) + '). El azar habría repetido unas ' + expRep.toFixed(1) +
          ' veces. Esa huida de la repetición es justo lo que se ve cuando la gente trata de «inventar» el azar.',
        porQue: STUDY_CITES.wagenaar1972.porQue + ' ' + STUDY_CITES.falk1997.porQue,
        cites: [STUDY_CITES.wagenaar1972, STUDY_CITES.falk1997],
        confidence: confLabel(pairs, L)
      });
    } else if (rate > exp * 1.4 && repeats >= 3) {
      out.push({
        id: 'estudio-repetir',
        minRounds: 5,
        title: 'Repites más de lo que suele hacer quien busca el azar',
        text: 'Repetiste el número anterior ' + repeats + ' de ' + pairs +
          ' veces (' + fmtPct(rate) + '; esperado alrededor de ' + expRep.toFixed(1) +
          '). En los estudios de aleatoriedad subjetiva lo típico es evitar la repetición; tú no sigues esa regla.',
        porQue: STUDY_CITES.wagenaar1972.porQue + ' ' + STUDY_CITES.falk1997.porQue,
        cites: [STUDY_CITES.wagenaar1972, STUDY_CITES.falk1997],
        confidence: confLabel(pairs, L)
      });
    }
  }

  // --- Favorite as possible birthday/name number (Kitayama 1997, Jones 2002) ---
  const fav = new Map();
  for (const h of history) fav.set(h.answer, (fav.get(h.answer) || 0) + 1);
  const top = [...fav.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && n >= 8) {
    // expected if uniform over each option set
    let expTop = 0;
    for (const h of history) {
      const opts = h.options || [];
      if (opts.indexOf(top[0]) >= 0) expTop += 1 / opts.length;
    }
    if (top[1] >= 3 && top[1] >= expTop * 1.5) {
      out.push({
        id: 'estudio-personal',
        minRounds: 20,
        title: 'Tienes un número favorito: podría ser personal',
        text: 'El ' + top[0] + ' sale ' + top[1] + ' de ' + n + ' veces (' + fmtPct(top[1] / n) +
          '; el azar, cuando estaba disponible, habría dado unos ' + expTop.toFixed(1) +
          '). Los estudios de «número de cumpleaños» y de letras del nombre dicen que nos atraen los números ligados al yo. No sé tu fecha: es una hipótesis, no un hecho.',
        porQue: STUDY_CITES.kitayama1997.porQue + ' ' + STUDY_CITES.jones2002.porQue,
        cites: [STUDY_CITES.kitayama1997, STUDY_CITES.jones2002],
        confidence: confLabel(n, lift(top[1], expTop))
      });
    }
  }

  // --- Circadian decision speed (Leone et al. 2017) ---
  const timed = history.filter((h) => h.answerMs > 0 && h.context && h.context.timeBand);
  const morning = timed.filter((h) => h.context.timeBand === 'mañana' || h.context.timeBand === 'madrugada');
  const evening = timed.filter((h) => h.context.timeBand === 'noche' || h.context.timeBand === 'tarde');
  if (morning.length >= 4 && evening.length >= 4) {
    const tm = mean(morning.map((h) => h.answerMs));
    const te = mean(evening.map((h) => h.answerMs));
    const ratio = tm / Math.max(te, 1);
    if (te < tm * 0.85) {
      out.push({
        id: 'estudio-ritmo-noche',
        minRounds: 20,
        title: 'Por la tarde-noche confirmas más rápido',
        text: 'Por la mañana-madrugada tardas de media ' + fmtSec(tm) +
          ' (' + morning.length + ' pruebas); por la tarde-noche, ' + fmtSec(te) +
          ' (' + evening.length + '). Va en la misma dirección que el estudio de decisiones de ajedrez: más prevención por la mañana, más rapidez después.',
        porQue: STUDY_CITES.leone2017.porQue,
        cites: [STUDY_CITES.leone2017],
        confidence: confLabel(morning.length + evening.length, ratio)
      });
    } else if (tm < te * 0.85) {
      out.push({
        id: 'estudio-ritmo-manana',
        minRounds: 20,
        title: 'Tú, al contrario, vas más rápido por la mañana',
        text: 'Por la mañana-madrugada confirmas en ' + fmtSec(tm) +
          ' de media, y por la tarde-noche en ' + fmtSec(te) +
          '. En el estudio del ajedrez lo habitual era lo inverso (más lento por la mañana). Tu reloj puede ser distinto —el propio paper habla de alondras y búhos—.',
        porQue: STUDY_CITES.leone2017.porQue,
        cites: [STUDY_CITES.leone2017],
        confidence: confLabel(morning.length + evening.length, te / Math.max(tm, 1))
      });
    }
  }

  // --- Low battery (LG 2016 survey, clearly labeled as non-academic) ---
  const bats = history.filter((h) => h.context && h.context.battery != null);
  const low = bats.filter((h) => h.context.battery < 20);
  const rest = bats.filter((h) => h.context.battery >= 20);
  if (low.length >= 3 && rest.length >= 5) {
    const tLow = mean(low.map((h) => h.answerMs).filter((x) => x > 0));
    const tRest = mean(rest.map((h) => h.answerMs).filter((x) => x > 0));
    const favLow = modeNums(low);
    const favRest = modeNums(rest);
    const changedFav = favLow.split(' ')[0] !== favRest.split(' ')[0];
    const changedTime = tLow && tRest && Math.abs(tLow - tRest) / Math.max(tRest, 1) > 0.2;
    if (changedFav || changedTime) {
      out.push({
        id: 'estudio-bateria',
        minRounds: 20,
        title: 'Con la batería baja, tus números cambian',
        text: 'Por debajo del 20% (' + low.length + ' pruebas) lo más frecuente es ' + favLow +
          (tLow ? ', y confirmas en ' + fmtSec(tLow) : '') +
          '. Con más batería (' + rest.length + '): ' + favRest +
          (tRest ? ', en ' + fmtSec(tRest) : '') +
          '. Hay un cambio en tus datos. Una encuesta comercial de LG describió «ansiedad por batería baja» y cambios de hábitos; no es un experimento de laboratorio, así que lo tomo solo como contexto.',
        porQue: STUDY_CITES.lg2016.porQue,
        cites: [STUDY_CITES.lg2016],
        confidence: confLabel(low.length, 1.3),
        note: 'Encuesta comercial, no estudio académico.'
      });
    }
  }

  // Simon also: 0, 1, 9 infrequent — if those are available and user avoids or seeks them
  let eAvail = 0, ePick = 0, eExp = 0;
  for (const h of history) {
    const opts = h.options || [];
    const extremes = [0, 1, 9].filter((x) => opts.indexOf(x) >= 0);
    if (!extremes.length) continue;
    eAvail++;
    eExp += extremes.length / opts.length;
    if (extremes.indexOf(h.answer) >= 0) ePick++;
  }
  if (eAvail >= 8) {
    const rate = ePick / eAvail;
    const exp = eExp / eAvail;
    if (rate <= exp * 0.6) {
      out.push({
        id: 'estudio-evitar-019',
        minRounds: 20,
        title: 'También evitas el 0, el 1 o el 9',
        text: 'Cuando había un 0, un 1 o un 9, los elegiste en ' + ePick + ' de ' + eAvail +
          ' (' + fmtPct(rate) + '; esperado ' + fmtPct(exp) + '). Simon ya vio que esos dígitos se escribían muy poco.',
        porQue: STUDY_CITES.simon1971.porQue,
        cites: [STUDY_CITES.simon1971],
        confidence: confLabel(eAvail, lift(rate, exp))
      });
    }
  }

  return out;
}

function collectBeliefs(history, store) {
  const n = history.length;
  const out = [];
  if (n < 5) return out;

  const fav = new Map();
  for (const h of history) fav.set(h.answer, (fav.get(h.answer) || 0) + 1);
  const topArr = [...fav.entries()].sort((a, b) => b[1] - a[1]);
  const top = topArr[0] || [null, 0];

  let repeats = 0, pairs = 0, expRep = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].answer;
    const opts = history[i].options || [];
    if (!opts.length) continue;
    pairs++;
    if (opts.indexOf(prev) >= 0) expRep += 1 / opts.length;
    if (history[i].answer === prev) repeats++;
  }
  const mid = expectedRate(history, (i, len) => isMiddle(i, len));
  const edge = expectedRate(history, (i, len) => isEdge(i, len));
  const first = expectedRate(history, (i, len) => isFirst(i, len));
  const last = expectedRate(history, (i, len) => isLast(i, len));

  const times = history.filter((h) => h.answerMs > 0);
  const avgT = mean(times.map((h) => h.answerMs));
  const morning = times.filter((h) => h.context && (h.context.timeBand === 'mañana' || h.context.timeBand === 'madrugada'));
  const evening = times.filter((h) => h.context && (h.context.timeBand === 'noche' || h.context.timeBand === 'tarde'));
  const bands = countMap(history.map((h) => (h.context && h.context.timeBand) || null));
  const topBand = Object.entries(bands).sort((a, b) => b[1] - a[1])[0];

  let odd = 0, even = 0;
  for (const h of history) {
    if (h.answer !== 0 && Math.abs(h.answer) % 2 === 1) odd++;
    else if (h.answer !== 0) even++;
  }

  let sevenAvail = 0, sevenPick = 0;
  for (const h of history) {
    if ((h.options || []).indexOf(7) >= 0) {
      sevenAvail++;
      if (h.answer === 7) sevenPick++;
    }
  }

  const bats = history.filter((h) => h.context && h.context.battery != null);
  const low = bats.filter((h) => h.context.battery < 20);
  const restBat = bats.filter((h) => h.context.battery >= 20);
  const cities = countMap(history.map((h) => (h.context && h.context.city) || null));
  const cityEntries = Object.entries(cities).sort((a, b) => b[1] - a[1]);
  const places = countMap(history.map((h) => (h.context && h.context.placeType) || null));
  const placeTop = Object.entries(places).sort((a, b) => b[1] - a[1])[0];
  const speeds = countMap(history.map((h) => (h.context && h.context.speedBand) || null));
  const still = speeds.quieto || 0;
  const speedN = Object.values(speeds).reduce((a, b) => a + b, 0);
  const adv = history.filter((h) => h.outcome === 'advance').length;
  const back = history.filter((h) => h.outcome === 'back').length;
  const moons = countMap(history.map((h) => (h.context && h.context.moon) || null));
  const moonTop = Object.entries(moons).sort((a, b) => b[1] - a[1])[0];
  const temps = history.filter((h) => h.context && h.context.temp != null);

  function add(id, minRounds, title, text, conf, inspired) {
    out.push({ id, minRounds, title, text, confidence: conf, inspired: inspired || '' });
  }

  // 1. Ritual / talisman
  if (top[1] >= 3 && top[1] / n >= 0.28) {
    add('creencia-talisman', 5, 'Tienes un número talismán',
      'El ' + top[0] + ' vuelve a ti una y otra vez (' + top[1] + ' veces). Yo diría que lo llevas como un amuleto: no es casualidad, es un sitio seguro al que tu cabeza regresa.',
      confLabel(n, (top[1] / n) / 0.2), 'Tu número más repetido.');
  }

  // 2. Unpredictable (avoids repeats and maybe 7)
  if (pairs >= 5 && repeats + 0.5 < expRep * 0.75) {
    add('creencia-impredecible', 5, 'Te gusta sentirte difícil de adivinar',
      'Evitas el eco de lo que acabas de pensar. Hay algo de zorro en eso: no es solo un número, es no parecer predecible, ni siquiera para ti.',
      confLabel(pairs, lift(repeats / pairs, (expRep / pairs) || 0.2)), 'Evitas repetir el número anterior.');
  }

  // 3. Loyal repeater
  if (pairs >= 5 && repeats > expRep * 1.4 && repeats >= 3) {
    add('creencia-leal', 5, 'Repites sin miedo a parecer obvio',
      'Volver al mismo número no te da reparo. Eso, en un juego de adivinación, es casi un acto de confianza: «este es el mío, y punto».',
      confLabel(pairs, lift(repeats / pairs, (expRep / pairs) || 0.2)), 'Repites el número anterior más de lo esperado.');
  }

  // 4. Middle soul
  if (mid.n >= 5 && mid.rate >= mid.expRate * 1.25) {
    add('creencia-centro', 5, 'Alma de centro',
      'Ni el primero ni el último: te quedas en el equilibrio. En una terraza pedirías la silla del medio. En una carta, el plato que no está ni arriba ni abajo. El centro te parece el lugar razonable —y un poco el más elegante.',
      confLabel(mid.n, lift(mid.rate, mid.expRate)), 'Prefieres el medio de la lista.');
  }

  // 5. Edge soul
  if (edge.n >= 5 && edge.rate >= edge.expRate * 1.25) {
    add('creencia-borde', 5, 'Te atrae el borde',
      'Hay un gesto teatral en irse a un extremo. Elegir el primero o el último es una forma de no diluirte. Yo diría que te aburre lo tibio.',
      confLabel(edge.n, lift(edge.rate, edge.expRate)), 'Eliges más los extremos de la lista.');
  }

  // 6. First of the line
  if (first.n >= 5 && first.rate >= first.expRate * 1.35 && first.obs >= 3) {
    add('creencia-primero', 5, 'Vas a lo directo',
      'El primer número de la lista te convence más de la cuenta. Eres de decidir y punto: menos deliberación, más instinto de «este».',
      confLabel(first.n, lift(first.rate, first.expRate)), 'Eliges el primero con frecuencia.');
  }

  // 7. Last word
  if (last.n >= 5 && last.rate >= last.expRate * 1.35 && last.obs >= 3) {
    add('creencia-ultimo', 5, 'Te convence el cierre',
      'Dejas que la lista termine y entonces eliges. El último tiene para ti un sabor a conclusión, a «este es el bueno». Una mente que quiere ver el final antes de comprometerse.',
      confLabel(last.n, lift(last.rate, last.expRate)), 'Eliges el último con frecuencia.');
  }

  // 8. Night owl
  if (topBand && (topBand[0] === 'noche' || topBand[0] === 'madrugada') && topBand[1] / n >= 0.4) {
    add('creencia-noctambulo', 5, 'Criatura de partidas nocturnas',
      'Juegas cuando el día ya se ha ido. Yo apuesto a que es entonces cuando tu cabeza está más suelta, más tuya, menos de agenda.',
      confLabel(n, (topBand[1] / n) / 0.25), 'La mayoría de tus partidas son de noche o de madrugada.');
  }

  // 9. Morning person
  if (topBand && topBand[0] === 'mañana' && topBand[1] / n >= 0.4) {
    add('creencia-madrugador', 5, 'Te sienta bien el arranque del día',
      'Tus números aparecen por la mañana. Hay algo de café y de lista de tareas en cómo juegas: una mente que entra en calor pronto.',
      confLabel(n, (topBand[1] / n) / 0.25), 'Juegas sobre todo por la mañana.');
  }

  // 10. Slow thinker
  if (avgT && avgT > 8000 && times.length >= 5) {
    add('creencia-lento', 5, 'Le das una vuelta a todo, incluso a un número',
      'Tardas de media ' + fmtSec(avgT) + ' en confirmar. No es indecisión: es que no sueltas una respuesta hasta que te encaja. Una mente que mastica.',
      avgT > 15000 ? 'media' : 'baja', 'Tiempo medio de confirmación alto.');
  }

  // 11. Lightning
  if (avgT && avgT < 3500 && times.length >= 5) {
    add('creencia-relampago', 5, 'Confirmas en un suspiro',
      'De media, ' + fmtSec(avgT) + '. No te enredas. El número ya estaba ahí, y tú solo lo señalas. Impaciencia con estilo, o una intuición que no necesita justificación.',
      'baja', 'Confirmas muy rápido.');
  }

  // 12. Double rhythm
  if (morning.length >= 4 && evening.length >= 4) {
    const tm = mean(morning.map((h) => h.answerMs));
    const te = mean(evening.map((h) => h.answerMs));
    if (te < tm * 0.85) {
      add('creencia-doble-ritmo', 20, 'De día calculas; de noche te lanzas',
        'Por la mañana tardas ' + fmtSec(tm) + '; por la tarde-noche, ' + fmtSec(te) +
        '. Yo te veo con dos marchas: una prudente a la luz, otra más suelta cuando cae el día.',
        confLabel(morning.length + evening.length, tm / Math.max(te, 1)), 'Más rápido al confirmar por la tarde-noche.');
    } else if (tm < te * 0.85) {
      add('creencia-doble-inverso', 20, 'Por la mañana ya vienes en marcha',
        'Confirmas más rápido al empezar el día (' + fmtSec(tm) + ' frente a ' + fmtSec(te) +
        ' después). Quizá eres de los que despiertan enteros, y por la noche eliges con más cuidado.',
        confLabel(morning.length + evening.length, te / Math.max(tm, 1)), 'Más rápido por la mañana.');
    }
  }

  // 13. Odd mystic
  if (n >= 8 && odd >= even * 1.4 && odd >= 5) {
    add('creencia-impares', 20, 'Los impares te suenan más vivos',
      'Impares en ' + odd + ' de ' + n + ' pruebas. Lo par puede parecerte demasiado cuadrado, demasiado «resuelto». Un impar deja una punta suelta, y eso te gusta.',
      confLabel(n, odd / Math.max(even, 1)), 'Mayoría de impares.');
  }

  // 14. Even order
  if (n >= 8 && even >= odd * 1.4 && even >= 5) {
    add('creencia-pares', 20, 'Te sienta bien lo simétrico',
      'Pares en ' + even + ' de ' + n + '. Hay un gusto por lo que cierra, por lo que se puede partir en dos. Una mente a la que le va el orden, aunque sea jugando.',
      confLabel(n, even / Math.max(odd, 1)), 'Mayoría de pares.');
  }

  // 15. Child of seven
  if (sevenAvail >= 5 && sevenPick / sevenAvail >= 0.3) {
    add('creencia-hijo-siete', 5, 'El siete te llama',
      'Lo elegiste ' + sevenPick + ' de ' + sevenAvail + ' veces que estaba. El 7 tiene aura de número «con misterio». Yo creo que te gusta esa fama: no es un número cualquiera, es el de las historias.',
      confLabel(sevenAvail, (sevenPick / sevenAvail) / 0.2), 'Eliges el 7 a menudo.');
  }

  // 16. Contrarian seven
  if (sevenAvail >= 8 && sevenPick / sevenAvail <= 0.1) {
    add('creencia-contra-siete', 20, 'Pasas de la moda del 7',
      'El número que «elige todo el mundo» no te pilla. Hay un contrarianismo simpático en eso: si es el clásico, tú ya buscas otra esquina.',
      confLabel(sevenAvail, 0.5), 'Casi nunca eliges el 7 cuando está.');
  }

  // 17. Battery mood
  if (low.length >= 3 && restBat.length >= 5) {
    const changed = modeNums(low).split(' ')[0] !== modeNums(restBat).split(' ')[0];
    const tLow = mean(low.map((h) => h.answerMs).filter((x) => x > 0));
    const tRest = mean(restBat.map((h) => h.answerMs).filter((x) => x > 0));
    const tCh = tLow && tRest && Math.abs(tLow - tRest) / Math.max(tRest, 1) > 0.2;
    if (changed || tCh) {
      add('creencia-bateria', 20, 'Cuando el móvil pide socorro, tú también cambias el paso',
        'Con la batería por los suelos tus números (o tu prisa) no son los de siempre. Yo diría que el aviso rojo del teléfono te estrecha un poco el mundo: menos floritura, más atajo.',
        'baja', 'Patrón distinto con batería baja.');
    }
  }

  // 18. Home animal
  if (speedN >= 5 && still / speedN >= 0.7) {
    const cityTxt = cityEntries.length ? ' y sueles estar en ' + cityEntries[0][0] : '';
    add('creencia-casa', 20, 'Juegas en tu territorio',
      'Casi siempre quieto' + cityTxt + '. Te veo pensando mejor en zapatillas, en un sitio que ya es tuyo, no en marcha. Un animal de sofá oracular.',
      confLabel(speedN, (still / speedN) / 0.5), 'La mayoría de las lecturas te dan por quieto.');
  }

  // 19. Nomad
  if (speedN >= 8 && still / speedN <= 0.4) {
    add('creencia-nomada', 20, 'Tus números viajan contigo',
      'A menudo no estás quieto cuando juegas. Yo apuesto a que piensas bien en movimiento: un autobús, una acera, el rato entre un sitio y otro.',
      confLabel(speedN, 1.3), 'Juegas muchas veces en movimiento.');
  }

  // 20. Place influence
  if (placeTop && placeTop[1] >= 4) {
    add('creencia-lugar', 20, 'El sitio se te pega',
      'Varias partidas cerca de un ' + placeTop[0] + ' (' + placeTop[1] + ' veces). No digo que el ' + placeTop[0] +
      ' te dicte el número, pero el decorado te cambia el ánimo, y el ánimo te cambia el número. Eres más permeable al entorno de lo que crees.',
      'baja', 'Repites un tipo de lugar.');
  }

  // 21. Ambitious phase
  if (n >= 8 && adv >= back * 1.3 && adv >= 3 && store && store.phase >= 3) {
    add('creencia-ambicioso', 20, 'Eres competitivo con el oráculo',
      'Has subido de fase ' + adv + ' veces y estás en la ' + (store.phase + 1) +
      '. Hay un orgullo quieto en acertar a la primera —o en hacer que yo acierte a la primera—. Te gusta avanzar.',
      'baja', 'Varias subidas de fase y fase relativamente alta.');
  }

  // 22. Unhurried about going back
  if (n >= 8 && back >= adv && back >= 3) {
    add('creencia-cauteloso', 20, 'No te importa volver atrás',
      'Has bajado de fase ' + back + ' veces. Yo no lo leo como fracaso: te tomas el juego sin prisa, sin esa ansiedad de «hay que subir». Una calma poco frecuente.',
      'baja', 'Varias bajadas de fase.');
  }

  // 23. Weather / cold
  const cold = temps.filter((h) => h.context.temp < 12);
  const warm = temps.filter((h) => h.context.temp >= 22);
  if (cold.length >= 4 && warm.length >= 4) {
    if (modeNums(cold).split(' ')[0] !== modeNums(warm).split(' ')[0]) {
      add('creencia-clima', 50, 'El clima se te cuela en los números',
        'Con frío lo más frecuente es ' + modeNums(cold) + '; con calor, ' + modeNums(warm) +
        '. Quizá es casualidad. O quizá, como un horóscopo honesto admitiría, el cuerpo cambia y el número va detrás.',
        'muy baja', 'Números distintos en frío y en calor.');
    }
  }

  // 24. Moon (pure horoscope, very playful, only at 50, only if a moon phase dominates)
  if (moonTop && moonTop[1] / n >= 0.35 && n >= 20) {
    add('creencia-luna', 50, 'Una luna te pilla más a menudo',
      'Juegas bastante en luna ' + moonTop[0] + ' (' + moonTop[1] + ' de ' + n +
      '). No voy a decirte que la luna te gobierna —esto es un juego—, pero si un horóscopo tuviera que bordar una frase, diría que esa fase te encuentra más dispuesto a pensar un número.',
      'muy baja', 'Una fase lunar concentra tus partidas.');
  }

  // 25. Habit regression - if second half resembles first half favorites
  if (n >= 50) {
    const half = Math.floor(n / 2);
    const m1 = modeNums(history.slice(0, half)).split(' ')[0];
    const m2 = modeNums(history.slice(half)).split(' ')[0];
    if (m1 === m2) {
      add('creencia-habito', 50, 'Vuelves a tu costumbre',
        'En la primera y en la segunda mitad de tus partidas, el número que más sale es el ' + m1 +
        '. Puedes explorar, puedes ponérmelo difícil, y al final regresas al hábito. Eso, en una persona, es carácter.',
        'media', 'El favorito se mantiene a lo largo del tiempo.');
    } else {
      add('creencia-cambio', 50, 'Tus números se han ido moviendo',
        'Al principio mandaba el ' + m1 + '; ahora, el ' + m2 +
        '. No eres un estatua. Yo diría que te aburres de tu propia trampa y cambias el truco.',
        'baja', 'El favorito ha cambiado entre mitades.');
    }
  }

  // 26. Generic after 5 if we need a "reading" opener — only if few other beliefs
  // We'll add a closing "portrait sentence" always at 5+
  const firstHit = history.filter((h) => h.attempts === 1).length;
  if (n >= 5) {
    let phrase;
    if (firstHit / n >= 0.55) {
      phrase = 'Eres más regular de lo que crees: yo te pillo a la primera más de la mitad de las veces. Hay un patrón, aunque tú sientas que improvisas.';
    } else if (firstHit / n <= 0.3) {
      phrase = 'Me lo pones difícil. Improvisas de verdad, o al menos lo bastante como para que este oráculo sudoroso tenga que trabajar.';
    } else {
      phrase = 'A veces se te ve venir, a veces no. Esa mezcla —un hábito y una escapada— es exactamente lo que hace interesante leerte.';
    }
    add('creencia-retrato', 5, 'Si tuviera que decirte una frase',
      phrase, firstHit / n >= 0.55 || firstHit / n <= 0.3 ? 'baja' : 'muy baja',
      'Aciertos a la primera del oráculo: ' + firstHit + ' de ' + n + '.');
  }

  return out;
}

function analyzePortrait(store) {
  const history = (store && store.history) || [];
  const n = history.length;
  const level = portraitLevel(n);
  const factsAll = collectFacts(history, store);
  const studiesAll = collectStudies(history);
  const beliefsAll = collectBeliefs(history, store);

  function split(items) {
    const unlocked = items.filter((x) => n >= (x.minRounds || 0));
    const locked = items.filter((x) => n < (x.minRounds || 0));
    return { unlocked, locked };
  }

  const facts = split(factsAll);
  const studies = split(studiesAll);
  const beliefs = split(beliefsAll);

  const nextGate = PORTRAIT_GATES.find((g) => n < g) || null;
  const missing = nextGate ? nextGate - n : 0;

  return {
    n,
    level,
    nextGate,
    missing,
    facts: facts.unlocked,
    factsLocked: facts.locked,
    studies: studies.unlocked,
    studiesLocked: studies.locked,
    beliefs: beliefs.unlocked,
    beliefsLocked: beliefs.locked,
    citesUsed: uniqueCites(studies.unlocked)
  };
}

function uniqueCites(studies) {
  const seen = new Set();
  const out = [];
  for (const s of studies) {
    for (const c of (s.cites || [])) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      out.push(c);
    }
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STUDY_CITES,
    PORTRAIT_GATES,
    portraitLevel,
    collectFacts,
    collectStudies,
    collectBeliefs,
    analyzePortrait,
    expectedRate,
    posBucketSimple,
    confLabel
  };
}
